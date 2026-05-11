import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import type { InvoicesApiPayload } from "../../../lib/mockData";
import { z } from "zod";
import { createErrorId, errorResponse, fetchWithTimeoutAndRetry, logApiError, parseWithSchema } from "../_backend";

const BACKEND_BASE_URL = process.env.BACKEND_API_URL ?? "http://localhost:4000";
const COMPANY_ID = process.env.COMPANY_ID ?? "trezo-demo";
const TREASURY_PDA = process.env.NEXT_PUBLIC_TREASURY_PDA ?? "treasury-pda";
const DEPT_PDA = process.env.NEXT_PUBLIC_DEPT_PDA ?? "engineering-dept-pda";
const RECIPIENT_WALLET = process.env.NEXT_PUBLIC_RECIPIENT_WALLET ?? "recipient-wallet";

const BackendInvoiceSchema = z.object({
  id: z.string(),
  vendor: z.string(),
  amount: z.coerce.number(),
  currency: z.string(),
  amount_usdc: z.coerce.number(),
  due_date: z.string().nullable(),
  category: z.string().nullable(),
  description: z.string().nullable(),
  invoice_number: z.string().nullable(),
  flags: z.array(z.string()).nullable(),
  created_at: z.string(),
});

const BackendInvoicesResponseSchema = z.object({
  success: z.boolean(),
  count: z.number().optional(),
  data: z.array(BackendInvoiceSchema).optional(),
});

const ParseInvoiceResponseSchema = z.object({
  success: z.boolean(),
  summary: z
    .object({
      vendor: z.string().optional(),
      amountUsdc: z.coerce.number().optional(),
      currency: z.string().optional(),
      category: z.string().optional(),
      description: z.string().optional(),
      dueDate: z.string().optional(),
      invoiceNumber: z.string().optional(),
      confidence: z.coerce.number().optional(),
      anomalyFlags: z.array(z.string()).optional(),
      suggestedDepartment: z.string().optional(),
      metadataUri: z.string().optional(),
      expiryTimestamp: z.coerce.number().optional(),
    })
    .optional(),
  ragResult: z.unknown().optional(),
});

const ConfirmInvoiceResponseSchema = z.object({
  success: z.boolean(),
  signature: z.string().optional(),
  proposalPda: z.string().optional(),
  error: z.string().optional(),
});

type BackendInvoice = z.infer<typeof BackendInvoiceSchema>;

function toHistoryStatus(flags: string[] | null | undefined): "processed" | "flagged" {
  return (flags?.length ?? 0) > 0 ? "flagged" : "processed";
}

function toInvoicesPayload(rows: BackendInvoice[]): InvoicesApiPayload {
  const latest = rows[0];
  const latestFlags = latest?.flags ?? [];
  const latestHasAnomaly = latestFlags.length > 0;

  return {
    title: "Invoice Processing",
    subtitle: "Financial Intake",
    upload: {
      title: "Upload PDF Invoices",
      helperText: "Drag and drop or click to select files",
      supportedLabel: "SUPPORTED: PDF, JPG, PNG (MAX 10MB)",
    },
    historyTitle: "Recent History",
    history: rows.map((row) => ({
      id: row.id,
      fileName: `${row.vendor.replace(/\s+/g, "_").toUpperCase()}_${row.invoice_number ?? "N_A"}.PDF`,
      date: new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      invoiceId: row.invoice_number ?? "N/A",
      amount: Number(row.amount_usdc ?? row.amount ?? 0),
      currency: row.currency || "USD",
      status: toHistoryStatus(row.flags),
    })),
    analysis: {
      engineStatusLabel: "Active Engine",
      steps: [
        { id: "step-ocr", title: "Extracting Text", description: "OCR extraction complete", status: "done" },
        { id: "step-parse", title: "Parsing Fields", description: "Invoice fields parsed", status: "done" },
        { id: "step-history", title: "Checking History", description: "Vendor pattern checks complete", status: "done" },
      ],
      insight: latestHasAnomaly
        ? {
            id: `insight-${latest?.id ?? "none"}`,
            tone: "warning",
            title: "Anomaly detected",
            message: latestFlags.join(", "),
          }
        : undefined,
      vendorName: latest?.vendor ?? "No invoices yet",
      totalAmount: Number(latest?.amount_usdc ?? latest?.amount ?? 0),
      currency: latest?.currency ?? "USD",
      category: latest?.category ?? "Uncategorized",
      department: "operations",
      paymentTerms: latest?.due_date ? `Due by ${latest.due_date}` : "—",
      taxId: "—",
      riskScoreLabel: latestHasAnomaly ? "High (anomaly detected)" : "Low",
    },
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return errorResponse(401, "Unauthorized");
  }

  try {
    const response = await fetchWithTimeoutAndRetry(`${BACKEND_BASE_URL}/api/invoices/${COMPANY_ID}`, {
      method: "GET",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      return errorResponse(response.status, "Failed to fetch invoices from backend");
    }

    const rawPayload = await response.json();
    const parsedPayload = parseWithSchema(BackendInvoicesResponseSchema, rawPayload);
    if (!parsedPayload.data) {
      const errorId = createErrorId("invoices-get-shape");
      logApiError(errorId, "Invalid invoices response shape from backend", parsedPayload.error);
      return NextResponse.json(
        { error: "Invalid invoices response shape from backend", errorId, status: 502 },
        { status: 502 },
      );
    }
    const backendPayload = parsedPayload.data;

    if (!backendPayload.success) {
      return errorResponse(502, "Backend returned unsuccessful invoices payload");
    }

    const rows = backendPayload.data ?? [];
    return NextResponse.json(toInvoicesPayload(rows), { status: 200 });
  } catch (error) {
    const errorId = createErrorId("invoices-get");
    logApiError(errorId, "Invoices GET failed", error);
    return NextResponse.json(
      { error: "Invoices GET failed", errorId, status: 500 },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return errorResponse(401, "Unauthorized");
    }

    const formData = await req.formData();
    const action = String(formData.get("action") ?? "parse");

    if (action === "parse") {
      const invoice = formData.get("invoice");
      if (!(invoice instanceof File)) {
        return errorResponse(400, "Missing invoice file");
      }

      const backendFormData = new FormData();
      backendFormData.set("invoice", invoice);
      backendFormData.set("treasuryPda", String(formData.get("treasuryPda") ?? TREASURY_PDA));
      backendFormData.set("deptPda", String(formData.get("deptPda") ?? DEPT_PDA));
      backendFormData.set("recipientWallet", String(formData.get("recipientWallet") ?? RECIPIENT_WALLET));
      backendFormData.set("companyId", String(formData.get("companyId") ?? COMPANY_ID));

      const parseRes = await fetchWithTimeoutAndRetry(`${BACKEND_BASE_URL}/api/invoices/parse`, {
        method: "POST",
        body: backendFormData,
      });

      if (!parseRes.ok) {
        return errorResponse(parseRes.status, `Parse failed: ${parseRes.status}`);
      }

      const rawParsePayload = await parseRes.json();
      const parsed = parseWithSchema(ParseInvoiceResponseSchema, rawParsePayload);
      if (!parsed.data) {
        const errorId = createErrorId("invoices-parse-shape");
        logApiError(errorId, "Invalid parse response shape from backend", parsed.error);
        return errorResponse(502, "Invalid parse response from backend", errorId);
      }
      return NextResponse.json(parsed.data, { status: 200 });
    }

    if (action === "confirm") {
      const raw = formData.get("payload");
      if (typeof raw !== "string") {
        return errorResponse(400, "Missing confirm payload");
      }

      let parsed: { invoice: unknown; ragResult: unknown; metadataUri?: string };
      try {
        parsed = JSON.parse(raw) as { invoice: unknown; ragResult: unknown; metadataUri?: string };
      } catch {
        return errorResponse(400, "Invalid confirm payload JSON");
      }

      const confirmRes = await fetchWithTimeoutAndRetry(`${BACKEND_BASE_URL}/api/invoices/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice: parsed.invoice,
          ragResult: parsed.ragResult,
          treasuryPda: String(formData.get("treasuryPda") ?? TREASURY_PDA),
          deptPda: String(formData.get("deptPda") ?? DEPT_PDA),
          recipientWallet: String(formData.get("recipientWallet") ?? RECIPIENT_WALLET),
          metadataUri: parsed.metadataUri ?? "ipfs://pending",
          companyId: String(formData.get("companyId") ?? COMPANY_ID),
        }),
      });

      if (!confirmRes.ok) {
        return errorResponse(confirmRes.status, `Confirm failed: ${confirmRes.status}`);
      }

      const rawConfirmPayload = await confirmRes.json();
      const confirmed = parseWithSchema(ConfirmInvoiceResponseSchema, rawConfirmPayload);
      if (!confirmed.data) {
        const errorId = createErrorId("invoices-confirm-shape");
        logApiError(errorId, "Invalid confirm response shape from backend", confirmed.error);
        return errorResponse(502, "Invalid confirm response from backend", errorId);
      }
      return NextResponse.json(confirmed.data, { status: 200 });
    }

    return errorResponse(400, "Unsupported action");
  } catch (error) {
    const errorId = createErrorId("invoices-post");
    logApiError(errorId, "Invoices POST failed", error);
    return errorResponse(500, "Invoices request failed", errorId);
  }
}

