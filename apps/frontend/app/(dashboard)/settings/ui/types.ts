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
  readOnlyNotice?: string;
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
  canEdit?: boolean;
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
  actionDisabled?: boolean;
};

export type CriticalOpsConfig = {
  title: string;
  body: string;
  note: string;
  actionLabel: string;
  actionDisabled?: boolean;
};

export type SettingsDepartmentThreshold = {
  id: string;
  deptId: string;
  name: string;
  pubkey: string;
  idleThresholdUsdc: number;
  isActive: boolean;
  summary: string;
};

export type DepartmentThresholdsConfig = {
  title: string;
  description: string;
  updateLabel: string;
  canEdit?: boolean;
  items: SettingsDepartmentThreshold[];
};

export type SettingsBackendState = {
  status: string;
  service: string;
  version: string;
  env: string;
  settingsEndpointAvailable: boolean;
  spendingRulesEndpointAvailable: boolean;
};

export type SettingsApiPayload = {
  title: string;
  subtitleBadge: string;
  companyId: string;
  backend: SettingsBackendState;
  multisig: MultisigConfig;
  oracle: OracleConfig;
  departments: DepartmentThresholdsConfig;
  agentAuthority: AgentAuthorityConfig;
  criticalOps: CriticalOpsConfig;
};
