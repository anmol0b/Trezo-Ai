import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "../auth/[...nextauth]/options";
import {
  COMPANY_ID,
  createErrorId,
  errorResponse,
  fetchBackendAndParse,
  fetchWithTimeoutAndRetry,
  lamportsToUsdc,
  logApiError,
  parseWithSchema,
  shortId,
  BACKEND_BASE_URL,
} from "../_backend";
import { DepartmentsResponseSchema, HealthResponseSchema, TreasuryResponseSchema } from "../_schemas";

const DEFAULT_RATE_TRIGGER = Number(process.env.NEXT_PUBLIC_DEFAULT_RATE_TRIGGER ?? "1.002");

const UpdateSettingsBodySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("threshold"),
    deptId: z.string().min(1),
    idleThresholdUsdc: z.coerce.number().positive(),
  }),
  z.object({
    type: z.literal("oracle"),
    rateTrigger: z.coerce.number().positive(),
  }),
]);

function readNumberDeep(raw: unknown, pathCandidates: string[][], fallback: number) {
  if (!raw || typeof raw !== "object") return fallback;

  for (const path of pathCandidates) {
    let cursor: unknown = raw;
    let valid = true;

    for (const segment of path) {
      if (!cursor || typeof cursor !== "object" || !(segment in cursor)) {
        valid = false;
        break;
      }
      cursor = (cursor as Record<string, unknown>)[segment];
    }

    if (valid) {
      const numeric = Number(cursor);
      if (Number.isFinite(numeric)) {
        return numeric;
      }
    }
  }

  return fallback;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return errorResponse(401, "Unauthorized");
    }

    const [treasuryResponse, departmentsResponse, healthResponse, settingsResponse, spendingRulesResponse] =
      await Promise.all([
        fetchBackendAndParse(`/api/treasury/${COMPANY_ID}`, TreasuryResponseSchema),
        fetchBackendAndParse(`/api/treasury/${COMPANY_ID}/departments`, DepartmentsResponseSchema),
        fetchBackendAndParse("/health", HealthResponseSchema),
        fetchBackendAndParse(`/api/settings/${COMPANY_ID}`, z.unknown()),
        fetchBackendAndParse(`/api/settings/${COMPANY_ID}/spending-rules`, z.unknown()),
      ]);

    if (
      treasuryResponse.invalid ||
      departmentsResponse.invalid ||
      healthResponse.invalid ||
      settingsResponse.invalid ||
      spendingRulesResponse.invalid
    ) {
      return errorResponse(502, "Invalid backend response shape");
    }

    const treasury = treasuryResponse.data?.success ? treasuryResponse.data.data : undefined;
    const departments = departmentsResponse.data?.success ? departmentsResponse.data.data : [];
    const rateTrigger = readNumberDeep(
      settingsResponse.data,
      [
        ["rateTrigger"],
        ["data", "rateTrigger"],
        ["oracle", "rateTrigger"],
        ["data", "oracle", "rateTrigger"],
      ],
      DEFAULT_RATE_TRIGGER,
    );

    const payload = {
      title: "Treasury Settings",
      subtitleBadge: treasury?.companyId ?? COMPANY_ID,
      companyId: treasury?.companyId ?? COMPANY_ID,
      backend: {
        status: healthResponse.data?.status ?? "unavailable",
        service: healthResponse.data?.service ?? "trezo-backend",
        version: healthResponse.data?.version ?? "unknown",
        env: healthResponse.data?.env ?? "unknown",
        settingsEndpointAvailable: settingsResponse.ok,
        spendingRulesEndpointAvailable: spendingRulesResponse.ok,
      },
      multisig: {
        title: "Treasury Multisig",
        members: (treasury?.members ?? []).map((address, index) => ({
          id: `member-${index + 1}`,
          address,
          role: index === 0 ? ("Administrator" as const) : ("Signer" as const),
        })),
        addMemberLabel: "Signer management",
        addressPlaceholder: "Signer address",
        defaultRole: "Signer" as const,
        roleOptions: ["Signer", "Administrator"] as const,
        quorum: {
          label: "Approval Threshold",
          helperText: "Read from the treasury config on the backend.",
          value: treasury?.multisigThreshold ?? 0,
          totalSigners: treasury?.members?.length ?? 0,
          updateLabel: "Read only",
        },
        removeLabel: "Unsupported",
        addLabel: "Unsupported",
        readOnlyNotice: "Member management is not exposed by the current backend API.",
      },
      oracle: {
        title: "Oracle Trigger",
        feedLabel: "USDC / USD trigger",
        statusLabel: healthResponse.data?.status === "healthy" ? "Active" : "Unavailable",
        price: 1,
        pairLabel: "USDC / USD",
        changeLabel: settingsResponse.ok ? "Synced from backend settings" : "Using frontend fallback",
        triggerLabel: "Rate Trigger Threshold",
        triggerMin: 0.95,
        triggerMax: 1.1,
        triggerValue: rateTrigger,
        cooldownLabel: "Watcher",
        cooldownSeconds: 10,
        commitLabel: settingsResponse.ok ? "Update trigger" : "Backend route unavailable",
        canEdit: settingsResponse.ok,
      },
      departments: {
        title: "Department Idle Thresholds",
        description: spendingRulesResponse.ok
          ? "Update the idle USDC threshold that determines when backend automation can deploy capital."
          : "Settings read path is limited in this repo. Threshold values are still read from treasury departments.",
        updateLabel: settingsResponse.ok ? "Save threshold" : "Backend route unavailable",
        canEdit: settingsResponse.ok,
        items: departments.map((department) => ({
          id: department.deptId,
          deptId: department.deptId,
          name: department.name,
          pubkey: department.pubkey,
          idleThresholdUsdc: lamportsToUsdc(department.idleThreshold),
          isActive: department.isActive,
          summary: department.isActive ? "Active for automation" : "Inactive department",
        })),
      },
      agentAuthority: {
        title: "Automation Runtime",
        pubkeyLabel: "Agent Pubkey",
        pubkey: treasury?.agentPubkey ?? "Unavailable",
        allowedLabel: "Available Context",
        allowed: [
          { id: "backend-service", label: `SERVICE ${healthResponse.data?.service ?? "UNKNOWN"}`, enabled: Boolean(healthResponse.data) },
          { id: "settings-route", label: "SETTINGS ROUTE", enabled: settingsResponse.ok },
          { id: "spending-rules-route", label: "SPENDING RULES ROUTE", enabled: spendingRulesResponse.ok },
          { id: "treasury-read", label: "TREASURY READ", enabled: treasuryResponse.ok },
        ],
        maxTxCapLabel: "Treasury PDA",
        maxTxCapValue: treasury?.pubkey ? shortId(treasury.pubkey, 8, 8) : "Unavailable",
        dailyBurnLabel: "Admin",
        dailyBurnValue: treasury?.admin ? shortId(treasury.admin, 8, 8) : "Unavailable",
        actionLabel: "Read only",
        actionDisabled: true,
      },
      criticalOps: {
        title: treasury?.isPaused ? "Treasury Pause State: Active" : "Treasury Pause State: Inactive",
        body: treasury?.isPaused
          ? "The backend reports the treasury is currently paused."
          : "The backend reports the treasury is currently unpaused.",
        note: "Pause and resume controls are not exposed by the current backend API, so this panel is intentionally read-only.",
        actionLabel: "Read only",
        actionDisabled: true,
      },
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    const errorId = createErrorId("settings-api");
    logApiError(errorId, "Settings API failed", error);
    return errorResponse(500, "Settings API failed", errorId);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return errorResponse(401, "Unauthorized");
    }

    const rawBody = await req.json();
    const parsedBody = parseWithSchema(UpdateSettingsBodySchema, rawBody);

    if (!parsedBody.data) {
      return errorResponse(400, "Invalid settings payload");
    }

    if (parsedBody.data.type === "threshold") {
      const response = await fetchWithTimeoutAndRetry(`${BACKEND_BASE_URL}/api/settings/${COMPANY_ID}/threshold`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deptId: parsedBody.data.deptId,
          idleThresholdUsdc: parsedBody.data.idleThresholdUsdc,
        }),
      });

      if (!response.ok) {
        return errorResponse(response.status, "Threshold update failed");
      }

      const raw = await response.json().catch(() => ({}));
      return NextResponse.json({ success: true, type: "threshold", data: raw }, { status: 200 });
    }

    const response = await fetchWithTimeoutAndRetry(`${BACKEND_BASE_URL}/api/settings/${COMPANY_ID}/oracle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rateTrigger: parsedBody.data.rateTrigger,
      }),
    });

    if (!response.ok) {
      return errorResponse(response.status, "Oracle update failed");
    }

    const raw = await response.json().catch(() => ({}));
    return NextResponse.json({ success: true, type: "oracle", data: raw }, { status: 200 });
  } catch (error) {
    const errorId = createErrorId("settings-patch");
    logApiError(errorId, "Settings PATCH failed", error);
    return errorResponse(500, "Settings update failed", errorId);
  }
}
