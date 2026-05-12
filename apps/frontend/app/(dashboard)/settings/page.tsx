"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AgentAuthorityCard from "./ui/agentAuthorityCard";
import DepartmentThresholdCard from "./ui/departmentThresholdCard";
import KillSwitchCard from "./ui/killSwitchCard";
import MultisigCard from "./ui/multisigCard";
import OracleCard from "./ui/oracleCard";
import type { SettingsApiPayload } from "./ui/types";

const SETTINGS_API_URL = process.env.NEXT_PUBLIC_SETTINGS_API_URL ?? "/api/settings";

const EMPTY_SETTINGS: SettingsApiPayload = {
  title: "Treasury Settings",
  subtitleBadge: "loading",
  companyId: "loading",
  backend: {
    status: "loading",
    service: "trezo-backend",
    version: "unknown",
    env: "unknown",
    settingsEndpointAvailable: false,
    spendingRulesEndpointAvailable: false,
  },
  multisig: {
    title: "Treasury Multisig",
    members: [],
    addMemberLabel: "Signer management",
    addressPlaceholder: "Signer address",
    defaultRole: "Signer",
    roleOptions: ["Signer", "Administrator"],
    quorum: {
      label: "Approval Threshold",
      helperText: "Loading treasury config",
      value: 0,
      totalSigners: 0,
      updateLabel: "Read only",
    },
    removeLabel: "Unsupported",
    addLabel: "Unsupported",
    readOnlyNotice: "Loading backend configuration",
  },
  oracle: {
    title: "Oracle Trigger",
    feedLabel: "USDC / USD trigger",
    statusLabel: "Loading",
    price: 1,
    pairLabel: "USDC / USD",
    changeLabel: "Waiting for backend",
    triggerLabel: "Rate Trigger Threshold",
    triggerMin: 0.95,
    triggerMax: 1.1,
    triggerValue: 1.002,
    cooldownLabel: "Watcher",
    cooldownSeconds: 10,
    commitLabel: "Loading",
    canEdit: false,
  },
  departments: {
    title: "Department Idle Thresholds",
    description: "Loading department thresholds",
    updateLabel: "Save threshold",
    canEdit: false,
    items: [],
  },
  agentAuthority: {
    title: "Automation Runtime",
    pubkeyLabel: "Agent Pubkey",
    pubkey: "Loading",
    allowedLabel: "Available Context",
    allowed: [],
    maxTxCapLabel: "Treasury PDA",
    maxTxCapValue: "Loading",
    dailyBurnLabel: "Admin",
    dailyBurnValue: "Loading",
    actionLabel: "Read only",
    actionDisabled: true,
  },
  criticalOps: {
    title: "Treasury Pause State",
    body: "Loading backend state",
    note: "This panel is read-only in the current frontend build.",
    actionLabel: "Read only",
    actionDisabled: true,
  },
};

type PatchResponse = {
  success?: boolean;
  error?: string;
};

async function fetchSettingsData(): Promise<SettingsApiPayload> {
  const response = await fetch(SETTINGS_API_URL, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Settings fetch failed: ${response.status}`);
  }

  return response.json();
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState<SettingsApiPayload>(EMPTY_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string>("");
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");
  const [oracleDraft, setOracleDraft] = useState<number>(EMPTY_SETTINGS.oracle.triggerValue);
  const [isSavingOracle, setIsSavingOracle] = useState(false);
  const [savingDeptId, setSavingDeptId] = useState<string | null>(null);
  const focusedDeptId = searchParams?.get("deptId") ?? undefined;

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const payload = await fetchSettingsData();
        if (!mounted) return;
        setSettings(payload);
        setOracleDraft(payload.oracle.triggerValue);
        setPageError("");
      } catch (error) {
        if (!mounted) return;
        setPageError(error instanceof Error ? error.message : "Settings request failed");
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const refreshSettings = async () => {
    const payload = await fetchSettingsData();
    setSettings(payload);
    setOracleDraft(payload.oracle.triggerValue);
  };

  const saveOracleTrigger = async () => {
    setIsSavingOracle(true);
    setFeedbackMessage("");

    try {
      const response = await fetch(SETTINGS_API_URL, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "oracle",
          rateTrigger: oracleDraft,
        }),
      });

      const payload = (await response.json()) as PatchResponse;
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? `Oracle update failed: ${response.status}`);
      }

      await refreshSettings();
      setFeedbackMessage("Oracle trigger updated successfully.");
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : "Oracle update failed");
    } finally {
      setIsSavingOracle(false);
    }
  };

  const saveDepartmentThreshold = async (deptId: string, idleThresholdUsdc: number) => {
    setSavingDeptId(deptId);
    setFeedbackMessage("");

    try {
      const response = await fetch(SETTINGS_API_URL, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "threshold",
          deptId,
          idleThresholdUsdc,
        }),
      });

      const payload = (await response.json()) as PatchResponse;
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? `Threshold update failed: ${response.status}`);
      }

      await refreshSettings();
      setFeedbackMessage(`Idle threshold updated for ${deptId}.`);
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : "Threshold update failed");
    } finally {
      setSavingDeptId(null);
    }
  };

  return (
    <div className="theme-bg min-h-full p-4 md:p-6">
      <div className="w-full space-y-6">
        {pageError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100">
            {pageError}
          </div>
        ) : null}

        <section className="space-y-3">
          <div className="h-5" />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
                {settings.title}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {settings.backend.service} {settings.backend.version} · {settings.backend.env}
              </p>
            </div>

            <div />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
          <MultisigCard data={settings.multisig} isLoading={isLoading} />
          <OracleCard
            data={{ ...settings.oracle, triggerValue: oracleDraft }}
            isLoading={isLoading}
            isSaving={isSavingOracle}
            onTriggerChange={setOracleDraft}
            onSubmit={saveOracleTrigger}
          />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
          <div className="space-y-4">
            <DepartmentThresholdCard
              data={settings.departments}
              isLoading={isLoading}
              savingDeptId={savingDeptId}
              feedbackMessage={feedbackMessage}
              focusedDeptId={focusedDeptId}
              onSave={saveDepartmentThreshold}
            />
            <KillSwitchCard data={settings.criticalOps} isLoading={isLoading} />
          </div>
          <AgentAuthorityCard data={settings.agentAuthority} isLoading={isLoading} />
        </section>
      </div>
    </div>
  );
}
