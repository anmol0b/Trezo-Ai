export type MultisigMemberRole = "Administrator" | "Signer";

export type MultisigMember = {
  id: string;
  address: string;
  role: MultisigMemberRole;
};

export type MultisigQuorum = {
  label: string;
  helperText: string;
  value: number;
  totalSigners: number;
  updateLabel: string;
};

export type MultisigConfig = {
  title: string;
  members: MultisigMember[];
  addMemberLabel: string;
  addressPlaceholder: string;
  defaultRole: MultisigMemberRole;
  roleOptions: MultisigMemberRole[];
  quorum: MultisigQuorum;
  removeLabel: string;
  addLabel: string;
};

export type OracleConfig = {
  title: string;
  feedLabel: string;
  statusLabel: string;
  price: number;
  pairLabel: string;
  changeLabel: string;
  triggerLabel: string;
  triggerMin: number;
  triggerMax: number;
  triggerValue: number;
  cooldownLabel: string;
  cooldownSeconds: number;
  commitLabel: string;
};

export type AgentInstruction = {
  id: string;
  label: string;
  enabled: boolean;
};

export type AgentAuthorityConfig = {
  title: string;
  pubkeyLabel: string;
  pubkey: string;
  allowedLabel: string;
  allowed: AgentInstruction[];
  maxTxCapLabel: string;
  maxTxCapValue: string;
  dailyBurnLabel: string;
  dailyBurnValue: string;
  actionLabel: string;
};

export type AuditEntry = {
  id: string;
  auditor: string;
  access: string;
  actionLabel: string;
};

export type AuditPrivacyConfig = {
  title: string;
  grantLabel: string;
  columns: [string, string, string];
  entries: AuditEntry[];
  helperText: string;
};

export type CriticalOpsConfig = {
  title: string;
  body: string;
  note: string;
  actionLabel: string;
};

export type SettingsApiPayload = {
  title: string;
  subtitleBadge: string;
  multisig: MultisigConfig;
  oracle: OracleConfig;
  agentAuthority: AgentAuthorityConfig;
  auditPrivacy: AuditPrivacyConfig;
  criticalOps: CriticalOpsConfig;
};

