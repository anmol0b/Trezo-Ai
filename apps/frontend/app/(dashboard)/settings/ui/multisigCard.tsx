import type { MultisigConfig, MultisigMember } from "./types";
import { useState } from "react";
import CustomSelect from "../../../../components/ui/customSelect";

type MultisigCardProps = {
  data: MultisigConfig;
  className?: string;
  isLoading?: boolean;
};

const cardShell =
  "theme-surface theme-border rounded-2xl border p-5 shadow-sm transition-colors sm:p-6";

function RolePill({ role }: { role: MultisigMember["role"] }) {
  const isAdmin = role === "Administrator";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
        isAdmin
          ? "border-slate-400 bg-slate-200 text-slate-800 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
          : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
      }`}
    >
      {role}
    </span>
  );
}

function MultisigSkeleton() {
  return (
    <article className={cardShell}>
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-56 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-40 rounded-xl bg-slate-100 dark:bg-slate-900" />
        <div className="h-28 rounded-xl bg-slate-100 dark:bg-slate-900" />
        <div className="h-20 rounded-xl bg-slate-100 dark:bg-slate-900" />
      </div>
    </article>
  );
}

export default function MultisigCard({ data, className = "", isLoading = false }: MultisigCardProps) {
  const [selectedRole, setSelectedRole] = useState(data.defaultRole);
  if (isLoading) return <MultisigSkeleton />;

  const isReadOnly = Boolean(data.readOnlyNotice);

  return (
    <article className={`${cardShell} ${className}`}>
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{data.title}</h2>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-800/70">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 bg-slate-50/80 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:bg-slate-900/60 dark:text-slate-500">
          <span>Member Wallet Address</span>
          <span className="text-right">Role</span>
          <span className="text-right">Actions</span>
        </div>

        <div className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
          {data.members.map((member) => (
            <div key={member.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-3">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{member.address}</p>
              <div className="flex justify-end">
                <RolePill role={member.role} />
              </div>
              <div className="flex justify-end">
                {isReadOnly ? (
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                    Read only
                  </span>
                ) : (
                  <button
                    type="button"
                    className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                  >
                    {data.removeLabel}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isReadOnly ? (
        <div className="mt-5 rounded-xl border border-slate-200/70 bg-slate-50/70 p-4 text-sm text-slate-600 dark:border-slate-800/70 dark:bg-slate-900/50 dark:text-slate-300">
          {data.readOnlyNotice}
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800/70 dark:bg-slate-900/50">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">{data.addMemberLabel}</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input
              placeholder={data.addressPlaceholder}
              className="h-11 w-full rounded-xl border border-slate-300 bg-slate-100 px-4 text-sm text-slate-900 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:placeholder:text-slate-500"
            />
            <CustomSelect
              value={selectedRole}
              onChange={(next) => setSelectedRole(next as MultisigMember["role"])}
              options={data.roleOptions.map((role) => ({ value: role, label: role }))}
              placeholder="Select role"
            />
            <button
              type="button"
              className="h-11 rounded-xl bg-slate-800 px-6 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-sm transition hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-100"
            >
              {data.addLabel}
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{data.quorum.label}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{data.quorum.helperText}</p>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <div className="flex items-center gap-2">
            <div className="h-11 w-14 rounded-xl border border-slate-200 bg-white text-center text-base font-semibold leading-[2.6rem] text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
              {data.quorum.value}
            </div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              / {data.quorum.totalSigners} Total Signers
            </p>
          </div>
          <button
            type="button"
            disabled={isReadOnly}
            className="h-11 rounded-xl border border-slate-200 bg-slate-100 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {data.quorum.updateLabel}
          </button>
        </div>
      </div>
    </article>
  );
}
