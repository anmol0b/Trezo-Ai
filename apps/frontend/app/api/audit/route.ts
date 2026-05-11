import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import {
  createErrorId,
  errorResponse,
  fetchBackendAndParse,
  formatRelativeFromUnix,
  formatUnixDate,
  logApiError,
  shortId,
} from "../_backend";
import { AuditEventsResponseSchema, HealthResponseSchema } from "../_schemas";

function toSolscanTx(signature: string) {
  return `https://solscan.io/tx/${signature}?cluster=devnet`;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return errorResponse(401, "Unauthorized");
    }

    const [eventsResponse, healthResponse] = await Promise.all([
      fetchBackendAndParse("/api/audit/events", AuditEventsResponseSchema),
      fetchBackendAndParse("/health", HealthResponseSchema),
    ]);

    if (eventsResponse.invalid || healthResponse.invalid) {
      return errorResponse(502, "Invalid backend response shape");
    }

    const events = eventsResponse.data?.success ? eventsResponse.data.data : [];
    const count = eventsResponse.data?.count ?? events.length;
    const totalVolume = events.reduce((sum, event) => sum + event.amount, 0);
    const latestTimestamp = events.length ? Math.max(...events.map((event) => event.timestamp)) : null;
    const earliestTimestamp = events.length ? Math.min(...events.map((event) => event.timestamp)) : null;
    const encryptedNotes = events.filter((event) => event.encryptedNote).length;
    const slotCoverage = events.filter((event) => typeof event.slot === "number").length;
    const nodeLabel = healthResponse.data
      ? `${healthResponse.data.service}@${healthResponse.data.version}`
      : "backend unavailable";

    const payload = {
      title: "Audit Event Stream",
      subtitle: eventsResponse.ok
        ? `Live backend feed · ${count} indexed event${count === 1 ? "" : "s"}`
        : "Backend unavailable · showing empty state",
      exportLabel: "Export CSV",
      summary: [
        {
          id: "events",
          label: "Indexed Events",
          value: String(count),
          trend: eventsResponse.ok ? { direction: "up" as const, label: "live" } : undefined,
        },
        {
          id: "volume",
          label: "Transferred Volume",
          value: totalVolume.toLocaleString("en-US", { maximumFractionDigits: 2 }),
          unit: "USDC",
        },
        {
          id: "range",
          label: "Observed Range",
          value:
            earliestTimestamp && latestTimestamp
              ? `${formatUnixDate(earliestTimestamp)} - ${formatUnixDate(latestTimestamp)}`
              : "No events yet",
          caption: latestTimestamp ? `Latest ${formatRelativeFromUnix(latestTimestamp)}` : "Waiting for first event",
        },
      ],
      tableColumns: [
        { key: "date", label: "Date" },
        { key: "vendor", label: "Signature" },
        { key: "department", label: "Note" },
        { key: "amount", label: "Amount" },
        { key: "address", label: "One-Time Address" },
        { key: "signature", label: "Slot" },
        { key: "explorer", label: "Explorer" },
      ],
      transactions: events.map((event) => ({
        id: event.signature,
        date: formatUnixDate(event.timestamp),
        vendor: shortId(event.signature, 6, 6),
        department: event.encryptedNote ? "Encrypted note" : "No note",
        amount: event.amount,
        currency: "USDC",
        addressDisplay: shortId(event.ephemeralPubkey ?? "—", 6, 6),
        signatureDisplay: typeof event.slot === "number" ? String(event.slot) : "—",
        explorerUrl: toSolscanTx(event.signature),
      })),
      compliance: {
        title: "Feed Coverage",
        items: [
          {
            id: "notes",
            label: "Events With Notes",
            valueLabel: count ? `${Math.round((encryptedNotes / count) * 100)}%` : "0%",
            fillPercent: count ? Math.round((encryptedNotes / count) * 100) : 0,
            tone: "emerald" as const,
          },
          {
            id: "slots",
            label: "Events With Slot Data",
            valueLabel: count ? `${Math.round((slotCoverage / count) * 100)}%` : "0%",
            fillPercent: count ? Math.round((slotCoverage / count) * 100) : 0,
            tone: "violet" as const,
          },
        ],
      },
      metadata: {
        title: "Backend Metadata",
        rows: [
          { id: "service", label: "Service", value: healthResponse.data?.service ?? "Unavailable" },
          { id: "version", label: "Version", value: healthResponse.data?.version ?? "Unavailable" },
          { id: "env", label: "Environment", value: healthResponse.data?.env ?? "Unavailable" },
        ],
      },
      footer: {
        message: eventsResponse.ok
          ? "Audit feed is backed by the live backend event indexer. Exported data is read-only."
          : "The audit backend is unavailable. No placeholder events are being injected.",
        nodeLabel: `Node: ${nodeLabel}`,
        latencyLabel: healthResponse.data ? `As of ${new Date(healthResponse.data.timestamp).toLocaleTimeString("en-US")}` : "As of unavailable",
      },
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    const errorId = createErrorId("audit-api");
    logApiError(errorId, "Audit API failed", error);
    return errorResponse(500, "Audit API failed", errorId);
  }
}
