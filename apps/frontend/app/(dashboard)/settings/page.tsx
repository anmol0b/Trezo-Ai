"use client";

import { useEffect, useState } from "react";
import { dashboardMockData } from "../../../lib/mockData";
import AgentAuthorityCard from "./ui/agentAuthorityCard";
import AuditPrivacyCard from "./ui/auditPrivacyCard";
import KillSwitchCard from "./ui/killSwitchCard";
import MultisigCard from "./ui/multisigCard";
import OracleCard from "./ui/oracleCard";
import type { SettingsApiPayload } from "./ui/types";

const SETTINGS_API_URL = process.env.NEXT_PUBLIC_SETTINGS_API_URL ?? "/api/settings";

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
  const [settings, setSettings] = useState<SettingsApiPayload>(dashboardMockData.settings!);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const payload = await fetchSettingsData();
        if (mounted) setSettings(payload);
      } catch {
        if (mounted) setSettings(dashboardMockData.settings!);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-full bg-slate-50 p-4 dark:bg-slate-950 md:p-6">
      <div className="w-full space-y-6">
        <section className="space-y-3">
          {/* Breadcrumbs placeholder: reserving this space for upcoming navigation component. */}
          <div className="h-5" />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
              {settings.title}
            </h1>
            <span className="inline-flex items-center rounded-full border border-emerald-300/70 bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:border-emerald-600/40 dark:bg-emerald-900/30 dark:text-emerald-300">
              {settings.subtitleBadge}
            </span>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
          <MultisigCard data={settings.multisig} isLoading={isLoading} />
          <OracleCard data={settings.oracle} isLoading={isLoading} />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
          <AgentAuthorityCard data={settings.agentAuthority} isLoading={isLoading} />
          <AuditPrivacyCard data={settings.auditPrivacy} isLoading={isLoading} />
        </section>

        <section>
          <KillSwitchCard data={settings.criticalOps} isLoading={isLoading} />
        </section>
      </div>
    </div>
  );
}
