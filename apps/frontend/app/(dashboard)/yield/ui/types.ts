export type YieldSummaryCard = {
  id: string;
  title: string;
  value: string;
  subtext: string;
  accent?: "success" | "neutral";
};

export type YieldPosition = {
  id: string;
  team: string;
  provider: string;
  market: string;
  amount: number;
  apy: number;
  active?: boolean;
  autoReinvest: boolean;
  manageHref?: string;
  iconText?: string;
};

export type YieldMarketRate = {
  id: string;
  label: string;
  apy: number;
  iconText?: string;
};

export type YieldAuditItem = {
  id: string;
  type: string;
  message: string;
  valueHighlight?: string;
  timeAgo: string;
  tone?: "success" | "info" | "neutral";
};

export type YieldApiPayload = {
  title?: string;
  subtitle?: string;
  summaryCards: YieldSummaryCard[];
  positions: YieldPosition[];
  marketRates: YieldMarketRate[];
  auditLog: YieldAuditItem[];
  meta?: {
    companyId: string;
    treasuryPaused: boolean;
    yieldEndpointAvailable: boolean;
    kaminoStatsAvailable: boolean;
    message: string;
  };
};
