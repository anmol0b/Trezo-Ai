import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { invoicesMockData, type InvoicesApiPayload } from "../../../lib/mockData";
import {
  BACKEND_BASE_URL,
  COMPANY_ID,
  createErrorId,
  errorResponse,
  fetchBackendAndParse,
  fetchWithTimeoutAndRetry,
  lamportsToUsdc,
  logApiError,
  parseWithSchema,
} from "../_backend";
import {
  BackendInvoicesResponseSchema,
  ConfirmInvoiceResponseSchema,
  DepartmentsResponseSchema,
  HealthResponseSchema,
  ParseInvoiceBackendResponseSchema,
  TreasuryResponseSchema,
  type BackendInvoice,
} from "../_schemas";

const TREASURY_PDA = process.env.NEXT_PUBLIC_TREASURY_PDA ?? invoicesMockData.context.treasuryPda;
const RECIPIENT_WALLET = process.env.NEXT_PUBLIC_RECIPIENT_WALLET ?? invoicesMockData.context.recipientWallet;

function toHistoryStatus(flags: string[] | null | undefined): "processed" | "flagged" {
  return (flags?.length ?? 0) > 0 ? "flagged" : "processed";
}

function toRiskLabel(confidence?: number, hasAnomaly?: boolean): string {
  if (hasAnomaly) return "High (anomaly detected)";
  if (typeof confidence !== "number") return "Needs review";
  if (confidence >= 0.9) return "Low";
  if (confidence >= 0.75) return "Moderate";
  return "High";
}

function toInvoicesPayload(
  rows: BackendInvoice[],
  context: {
    companyId: string;
    treasuryPda: string;
    recipientWallet: string;
    departments: Array<{ deptId: string; name: string; pubkey: string; idleThresholdUsdc: number; isActive: boolean }>;
    backendHealthy: boolean;
  },
): InvoicesApiPayload {
  const latest = rows[0];
  const latestFlags = latest?.flags ?? [];
  const latestHasAnomaly = latestFlags.length > 0;

  return {
    title: "Invoice Operations",
    subtitle: "Parse, review, propose, and optionally convert to fiat",
    upload: {
      title: "Upload a PDF invoice",
      helperText: "Select a PDF, review the parsed fields, then create an onchain proposal.",
      supportedLabel: "SUPPORTED: PDF ONLY (MAX 10MB)",
    },
    historyTitle: "Recent invoices",
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
      engineStatusLabel: context.backendHealthy ? "Ready" : "Backend unavailable",
      steps: latest
        ? [
            { id: "step-ocr", title: "Extracted text", description: "Stored from the last processed invoice", status: "done" },
            { id: "step-parse", title: "Parsed fields", description: "Invoice fields were parsed successfully", status: "done" },
            { id: "step-history", title: "Checked history", description: "Vendor history and anomaly checks completed", status: "done" },
          ]
        : [
            { id: "step-ocr", title: "Extract text", description: "Waiting for a PDF upload", status: "pending" },
            { id: "step-parse", title: "Parse fields", description: "Parsed data will appear here", status: "pending" },
            { id: "step-history", title: "Check history", description: "Historical matches will appear after parsing", status: "pending" },
          ],
      insight: latestHasAnomaly
        ? {
            id: `insight-${latest?.id ?? "none"}`,
            tone: "warning",
            title: "Anomaly detected",
            message: latestFlags.join(", "),
          }
        : undefined,
      vendorName: latest?.vendor ?? "No invoice selected",
      totalAmount: Number(latest?.amount_usdc ?? latest?.amount ?? 0),
      currency: latest?.currency ?? "USD",
      category: latest?.category ?? "Uncategorized",
      department: context.departments[0]?.deptId ?? "unassigned",
      paymentTerms: latest?.due_date ? `Due by ${latest.due_date}` : "Awaiting parse",
      taxId: latest?.proposal_pda ?? "Not proposed yet",
      riskScoreLabel: toRiskLabel(undefined, latestHasAnomaly),
    },
    context: {
      companyId: context.companyId,
      treasuryPda: context.treasuryPda,
      recipientWallet: context.recipientWallet,
      defaultDeptId: context.departments[0]?.deptId ?? "",
      defaultDeptPda: context.departments[0]?.pubkey ?? "",
      departments: context.departments,
    },
    meta: {
      backendHealthy: context.backendHealthy,
      message: context.backendHealthy
        ? "Invoice history is loaded from the backend. Uploads still require the treasury and department context below."
        : "Backend is unavailable. You can still review the form, but uploads will fail until the API recovers.",
    },
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return errorResponse(401, "Unauthorized");
  }

  try {
    const [invoiceResponse, treasuryResponse, departmentsResponse, healthResponse] = await Promise.all([
      fetchBackendAndParse(`/api/invoices/${COMPANY_ID}`, BackendInvoicesResponseSchema),
      fetchBackendAndParse(`/api/treasury/${COMPANY_ID}`, TreasuryResponseSchema),
      fetchBackendAndParse(`/api/treasury/${COMPANY_ID}/departments`, DepartmentsResponseSchema),
      fetchBackendAndParse("/health", HealthResponseSchema),
    ]);

    if (invoiceResponse.invalid || treasuryResponse.invalid || departmentsResponse.invalid || healthResponse.invalid) {
      return errorResponse(502, "Invalid backend response shape");
    }

    const departments = departmentsResponse.data?.success
      ? departmentsResponse.data.data.map((department) => ({
          deptId: department.deptId,
          name: department.name,
          pubkey: department.pubkey,
          idleThresholdUsdc: lamportsToUsdc(department.idleThreshold),
          isActive: department.isActive,
        }))
      : [];
    const backendHealthy = healthResponse.ok && healthResponse.data?.status === "healthy";
    const resolvedDepartments =
      departments.length > 0
        ? departments
        : !backendHealthy
          ? invoicesMockData.context.departments
          : [];

    const payload = toInvoicesPayload(invoiceResponse.data?.success ? invoiceResponse.data.data : [], {
      companyId: treasuryResponse.data?.data?.companyId ?? invoicesMockData.context.companyId ?? COMPANY_ID,
      treasuryPda: treasuryResponse.data?.data?.pubkey ?? TREASURY_PDA,
      recipientWallet: RECIPIENT_WALLET,
      departments: resolvedDepartments,
      backendHealthy,
    });

    if (!backendHealthy && departments.length === 0) {
      payload.meta = {
        backendHealthy: false,
        message:
          "Backend is unavailable. Demo department context is shown for browsing, but PDF parsing stays disabled until the API recovers.",
      };
    }

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    const errorId = createErrorId("invoices-get");
    logApiError(errorId, "Invoices GET failed", error);
    return errorResponse(500, "Invoices GET failed", errorId);
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

      const treasuryPda = String(formData.get("treasuryPda") ?? TREASURY_PDA);
      const deptPda = String(formData.get("deptPda") ?? "");
      const recipientWallet = String(formData.get("recipientWallet") ?? RECIPIENT_WALLET);
      const companyId = String(formData.get("companyId") ?? COMPANY_ID);

      if (!deptPda) {
        return errorResponse(400, "Department account is required");
      }

      const backendFormData = new FormData();
      backendFormData.set("invoice", invoice);
      backendFormData.set("treasuryPda", treasuryPda);
      backendFormData.set("deptPda", deptPda);
      backendFormData.set("recipientWallet", recipientWallet);
      backendFormData.set("companyId", companyId);

      const parseResponse = await fetchWithTimeoutAndRetry(`${BACKEND_BASE_URL}/api/invoices/parse`, {
        method: "POST",
        body: backendFormData,
      });

      if (!parseResponse.ok) {
        return errorResponse(parseResponse.status, `Parse failed: ${parseResponse.status}`);
      }

      const rawPayload = await parseResponse.json();
      const parsedPayload = parseWithSchema(ParseInvoiceBackendResponseSchema, rawPayload);

      if (!parsedPayload.data) {
        const errorId = createErrorId("invoices-parse-shape");
        logApiError(errorId, "Invalid parse response shape from backend", parsedPayload.error);
        return errorResponse(502, "Invalid parse response from backend", errorId);
      }

      return NextResponse.json(
        {
          ...parsedPayload.data,
          ragResult: {
            vendorHistory: parsedPayload.data.vendorHistory,
            similarInvoices: parsedPayload.data.similarInvoices ?? [],
          },
        },
        { status: 200 },
      );
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

      const deptPda = String(formData.get("deptPda") ?? "");
      if (!deptPda) {
        return errorResponse(400, "Department account is required");
      }

      const confirmResponse = await fetchWithTimeoutAndRetry(`${BACKEND_BASE_URL}/api/invoices/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice: parsed.invoice,
          ragResult: parsed.ragResult,
          treasuryPda: String(formData.get("treasuryPda") ?? TREASURY_PDA),
          deptPda,
          recipientWallet: String(formData.get("recipientWallet") ?? RECIPIENT_WALLET),
          metadataUri: parsed.metadataUri ?? "ipfs://pending",
          companyId: String(formData.get("companyId") ?? COMPANY_ID),
        }),
      });

      if (!confirmResponse.ok) {
        return errorResponse(confirmResponse.status, `Confirm failed: ${confirmResponse.status}`);
      }

      const rawPayload = await confirmResponse.json();
      const confirmedPayload = parseWithSchema(ConfirmInvoiceResponseSchema, rawPayload);

      if (!confirmedPayload.data) {
        const errorId = createErrorId("invoices-confirm-shape");
        logApiError(errorId, "Invalid confirm response shape from backend", confirmedPayload.error);
        return errorResponse(502, "Invalid confirm response from backend", errorId);
      }

      return NextResponse.json(confirmedPayload.data, { status: 200 });
    }

    return errorResponse(400, "Unsupported action");
  } catch (error) {
    const errorId = createErrorId("invoices-post");
    logApiError(errorId, "Invoices POST failed", error);
    return errorResponse(500, "Invoices request failed", errorId);
  }
}
