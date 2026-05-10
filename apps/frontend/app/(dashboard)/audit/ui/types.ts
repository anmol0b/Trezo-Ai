export type AuditSummaryItem = {
  id: string;
  label: string;
  value: string;
  /** Shown inline after value (e.g. USDC) */
  unit?: string;
  trend?: {
    direction: "up" | "down";
    label: string;
  };
  /** Small caps line under the main value */
  caption?: string;
};

export type AuditTableColumn = {
  key: string;
  label: string;
};

export type AuditTransactionRow = {
  id: string;
  date: string;
  vendor: string;
  department: string;
  amount: number;
  currency: string;
  addressDisplay: string;
  signatureDisplay: string;
  explorerUrl: string;
};

export type AuditComplianceItem = {
  id: string;
  label: string;
  valueLabel: string;
  /** 0–100 fill for the progress track */
  fillPercent: number;
  tone: "emerald" | "violet";
};

export type AuditMetadataRow = {
  id: string;
  label: string;
  value: string;
};

export type AuditApiPayload = {
  title: string;
  subtitle: string;
  exportLabel: string;
  summary: AuditSummaryItem[];
  tableColumns: AuditTableColumn[];
  transactions: AuditTransactionRow[];
  compliance: {
    title: string;
    items: AuditComplianceItem[];
  };
  metadata: {
    title: string;
    rows: AuditMetadataRow[];
  };
  footer: {
    message: string;
    nodeLabel: string;
    latencyLabel: string;
  };
};
