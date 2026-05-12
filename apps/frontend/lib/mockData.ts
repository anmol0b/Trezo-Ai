import type { AiCardItem } from "../app/(dashboard)/dashboard/ui/aiCard";
import type { DashboardCardData } from "../app/(dashboard)/dashboard/ui/cardComponent";
import type { DepartmentCardItem } from "../app/(dashboard)/dashboard/ui/departmentCard";
import type { LiveActivityItem } from "../app/(dashboard)/dashboard/ui/liveCard";
import type { GovernanceRule } from "../app/(dashboard)/department/ui/cashCard";
import type { SpendingCardData } from "../app/(dashboard)/department/ui/spendingCard";
import type { SpendingVelocityPoint } from "../app/(dashboard)/department/ui/spendingGraph";
import type { SettingsApiPayload } from "../app/(dashboard)/settings/ui/types";
import type { YieldApiPayload } from "../app/(dashboard)/yield/ui/types";
import type { AuditApiPayload } from "../app/(dashboard)/audit/ui/types";

export type DashboardApiPayload = {
  summaryCards: DashboardCardData[];
  departments: DepartmentCardItem[];
  insights: AiCardItem[];
  liveActivities: LiveActivityItem[];
  proposal: ProposalApiPayload;
  audit: AuditApiPayload;
  settings?: SettingsApiPayload;
};

export type DepartmentApiPayload = {
  breadcrumbs: {
    parent: string;
    current: string;
  };
  title: string;
  spendingCard: SpendingCardData;
  governanceRules: GovernanceRule[];
  spendingVelocity: SpendingVelocityPoint[];
};

export const yieldMockData: YieldApiPayload = {
  summaryCards: [
    {
      id: "yield-total",
      title: "Total In Yield",
      value: "$14,290,442.82",
      subtext: "+2.4% vs last month",
      accent: "success",
    },
    {
      id: "yield-blended-apy",
      title: "Blended APY",
      value: "8.12%",
      subtext: "Targeting 8.50%",
      accent: "neutral",
    },
    {
      id: "yield-earned-today",
      title: "Earned Today",
      value: "+$3,184.12",
      subtext: "Est $95k monthly",
      accent: "success",
    },
  ],
  positions: [
    {
      id: "position-engineering",
      team: "Engineering",
      provider: "Kamino Finance",
      market: "SOL-USDC LP",
      amount: 4200000,
      apy: 7.42,
      active: true,
      autoReinvest: true,
      manageHref: "#",
      iconText: "E",
    },
    {
      id: "position-marketing",
      team: "Marketing",
      provider: "MarginFi",
      market: "USDC Lend",
      amount: 1850221.4,
      apy: 9.15,
      active: true,
      autoReinvest: false,
      manageHref: "#",
      iconText: "M",
    },
    {
      id: "position-operations",
      team: "Operations",
      provider: "No active yield strategies",
      market: "Potential Yield",
      amount: 0,
      apy: 5.4,
      active: false,
      autoReinvest: false,
      manageHref: "#",
      iconText: "O",
    },
  ],
  marketRates: [
    { id: "rate-jito", label: "JITO (SOL)", apy: 7.82, iconText: "J" },
    { id: "rate-meteora", label: "METEORA", apy: 12.44, iconText: "M" },
    { id: "rate-orca", label: "ORCA LP", apy: 6.2, iconText: "O" },
  ],
  auditLog: [
    {
      id: "audit-1",
      type: "Harvest",
      message: "Engineering position harvested",
      valueHighlight: "0.42 SOL",
      timeAgo: "12m ago",
      tone: "info",
    },
    {
      id: "audit-2",
      type: "Rebalance",
      message: "Marketing moved 50k USDC to MarginFi",
      timeAgo: "2h ago",
      tone: "success",
    },
    {
      id: "audit-3",
      type: "Config",
      message: "Auto-reinvest enabled for Engineering vault",
      timeAgo: "5h ago",
      tone: "neutral",
    },
  ],
};

export type ProposalFilter = {
  id: string;
  label: string;
  active?: boolean;
};

export type ProposalStatus = "ready" | "pending" | "executed" | "flagged" | "cancelled";

export type ProposalRow = {
  id: string;
  index: string;
  vendor: string;
  hash: string;
  department: string;
  amount: number;
  currency: string;
  category: string;
  aiScore: number;
  approvals: {
    signed: number;
    required: number;
    reviewers: string[];
  };
  status: ProposalStatus;
  date: string;
};

export type GovernanceMetric = {
  id: string;
  label: string;
  value: string;
  helperText: string;
  helperTone?: "positive" | "neutral" | "critical";
};

export type AuditFeedItem = {
  id: string;
  title: string;
  timeAgo: string;
  tone?: "positive" | "neutral" | "critical";
};

export type ProposalApiPayload = {
  title: string;
  subtitle: string;
  totalActive: number;
  filters: ProposalFilter[];
  proposals: ProposalRow[];
  governanceMetrics: GovernanceMetric[];
  auditFeed: AuditFeedItem[];
};

export type InvoiceStatus = "processed" | "flagged" | "pending";

export type InvoiceHistoryItem = {
  id: string;
  fileName: string;
  date: string;
  invoiceId: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
};

export type InvoiceProcessingStepStatus = "done" | "active" | "pending";

export type InvoiceProcessingStep = {
  id: string;
  title: string;
  description: string;
  status: InvoiceProcessingStepStatus;
};

export type InvoiceInsight = {
  id: string;
  tone: "warning" | "info" | "critical";
  title: string;
  message: string;
};

export type InvoiceVendorHistory = {
  vendor: string;
  invoiceCount: number;
  averageAmount: number;
  lastSeenDate: string;
  categories: string[];
};

export type InvoiceSimilarInvoice = {
  vendor: string;
  amount: number;
  date: string;
  category: string;
  similarity: number;
};

export type InvoiceAnalysis = {
  engineStatusLabel: string;
  steps: InvoiceProcessingStep[];
  insight?: InvoiceInsight;
  vendorName: string;
  totalAmount: number;
  currency: string;
  category: string;
  department: string;
  taxId?: string;
  paymentTerms?: string;
  riskScoreLabel: string;
  invoiceNumber?: string;
  confidence?: number;
  description?: string;
  dueDate?: string;
  vendorHistory?: InvoiceVendorHistory;
  similarInvoices?: InvoiceSimilarInvoice[];
};

export type InvoiceContextDepartment = {
  deptId: string;
  name: string;
  pubkey: string;
  idleThresholdUsdc: number;
  isActive: boolean;
};

export type InvoiceRequestContext = {
  companyId: string;
  treasuryPda: string;
  recipientWallet: string;
  defaultDeptId: string;
  defaultDeptPda: string;
  departments: InvoiceContextDepartment[];
};

export type InvoicesApiPayload = {
  title: string;
  subtitle: string;
  upload: {
    title: string;
    helperText: string;
    supportedLabel: string;
  };
  historyTitle: string;
  history: InvoiceHistoryItem[];
  analysis: InvoiceAnalysis;
  context: InvoiceRequestContext;
  meta?: {
    backendHealthy: boolean;
    message: string;
  };
};

export const auditMockData: AuditApiPayload = {
  title: "Decrypted Stealth History",
  subtitle: "Audit trail & transaction compliance",
  exportLabel: "Export CSV",
  summary: [
    {
      id: "payouts",
      label: "Total Stealth Payouts",
      value: "1,248",
      trend: { direction: "up", label: "12%" },
    },
    {
      id: "volume",
      label: "Total Volume (Decrypted)",
      value: "$4,129,550.00",
      unit: "USDC",
    },
    {
      id: "range",
      label: "Date Range",
      value: "OCT 01 - OCT 31",
      caption: "Q4 Fiscal Period 2024",
    },
  ],
  tableColumns: [
    { key: "date", label: "Date" },
    { key: "vendor", label: "Vendor" },
    { key: "department", label: "Department" },
    { key: "amount", label: "Amount" },
    { key: "address", label: "One-Time Address" },
    { key: "signature", label: "Tx Signature" },
    { key: "explorer", label: "Explorer" },
  ],
  transactions: [
    {
      id: "tx-1",
      date: "2024-10-28",
      vendor: "AWS Enterprise",
      department: "Infrastructure",
      amount: 12450,
      currency: "USDC",
      addressDisplay: "4fA1...89Xp",
      signatureDisplay: "5YzH...W9sA",
      explorerUrl: "https://solscan.io",
    },
    {
      id: "tx-2",
      date: "2024-10-27",
      vendor: "OpenAI LP",
      department: "Compute",
      amount: 45000,
      currency: "USDC",
      addressDisplay: "7gB2...32Lk",
      signatureDisplay: "2AbC...P99q",
      explorerUrl: "https://solscan.io",
    },
    {
      id: "tx-3",
      date: "2024-10-25",
      vendor: "Chainanalysis Inc",
      department: "Security",
      amount: 8200,
      currency: "USDC",
      addressDisplay: "1xQ8...11Mn",
      signatureDisplay: "8RtY...Z3x0",
      explorerUrl: "https://solscan.io",
    },
    {
      id: "tx-4",
      date: "2024-10-22",
      vendor: "Zendesk Pay",
      department: "Operations",
      amount: 3150,
      currency: "USDC",
      addressDisplay: "9pP4...44Vb",
      signatureDisplay: "0vB3...M1dD",
      explorerUrl: "https://solscan.io",
    },
    {
      id: "tx-5",
      date: "2024-10-20",
      vendor: "Circle Yield",
      department: "Treasury",
      amount: 250000,
      currency: "USDC",
      addressDisplay: "3hN1...22Ww",
      signatureDisplay: "4kL9...P0xZ",
      explorerUrl: "https://solscan.io",
    },
    {
      id: "tx-6",
      date: "2024-10-18",
      vendor: "Contractor_ID: 882",
      department: "Engineering",
      amount: 5500,
      currency: "USDC",
      addressDisplay: "5vR6...99Qq",
      signatureDisplay: "9uI1...T2yS",
      explorerUrl: "https://solscan.io",
    },
  ],
  compliance: {
    title: "Compliance Breakdown",
    items: [
      { id: "kyc", label: "KYC/KYB Verified", valueLabel: "98.2%", fillPercent: 98.2, tone: "emerald" },
      { id: "tax", label: "Tax Jurisdictions", valueLabel: "12 Regions", fillPercent: 62, tone: "violet" },
    ],
  },
  metadata: {
    title: "Key Metadata",
    rows: [
      { id: "key-id", label: "Key ID", value: "STEALTH_AUDIT_PRV_7741_XK" },
      { id: "expiry", label: "Expiry", value: "2025-01-14 (Auto-Rotate)" },
      { id: "perms", label: "Permissions", value: "READ_ONLY | EXPORT" },
    ],
  },
  footer: {
    message:
      "Read-only session: your viewing and export activity is being logged for internal compliance.",
    nodeLabel: "NODE: 7421-PRIME",
    latencyLabel: "LATENCY: 24MS",
  },
};

export const dashboardMockData: DashboardApiPayload = {
  summaryCards: [
    {
      title: "Treasury Balance",
      value: 284500,
      currency: "USDC",
      description: "+$12,400 this week",
    },
    {
      title: "Active Departments",
      value: 3,
      description: "Engineering · Marketing · Ops",
    },
    {
      title: "Pending Proposals",
      value: 4,
      description: "Awaiting multisig",
    },
    {
      title: "Yield Earned Today",
      value: 47.82,
      currency: "USDC",
      description: "Across 2 positions",
    },
  ],
  departments: [
    {
      id: "engineering",
      name: "Engineering",
      walletAddress: "0xA42D...8E11",
      status: "Stealth On",
      budgetSpent: 38200,
      budgetTotal: 50000,
      currency: "USDC",
      spendingRule: "Spending rule: max $5,000 per payout · Daily cap: $20,000",
      progressPercent: 76,
      detailsHref: "/department",
    },
    {
      id: "marketing",
      name: "Marketing",
      walletAddress: "0xB201...22F4",
      status: "Stealth On",
      budgetSpent: 12600,
      budgetTotal: 30000,
      currency: "USDC",
      spendingRule: "Spending rule: max $2,000 per payout · Daily cap: $5,000",
      progressPercent: 42,
      detailsHref: "/department",
    },
    {
      id: "operations",
      name: "Operations",
      walletAddress: "0xC19A...A902",
      status: "Stealth On",
      budgetSpent: 18000,
      budgetTotal: 100000,
      currency: "USDC",
      spendingRule: "Spending rule: multisig only for >$10k · Daily cap: $50,000",
      progressPercent: 18,
      detailsHref: "/department",
    },
  ],
  insights: [
    {
      id: "insight-1",
      message: "Engineering dept has $11,800 idle USDC which hasn't moved in 14 days. Potential for 4.2% APY.",
      recommendation: "Deposit to Kamino?",
      tone: "warning",
      icon: "📈",
      dismissLabel: "Dismiss",
      actionLabel: "Take Action",
      // Wire the CTA to an actual page; yield page is the closest "do something" surface today.
      dismissHref: "",
      actionHref: "/yield",
    },
    {
      id: "insight-2",
      message: "Liquidity warning: Marketing vault is approaching daily cap. 3 transactions queued for execution.",
      recommendation: "Adjust daily limit?",
      tone: "critical",
      icon: "🛡️",
      dismissLabel: "Dismiss",
      actionLabel: "Take Action",
      // Wire the CTA to settings for now (limits/quorum live there in this UI).
      dismissHref: "",
      actionHref: "/settings",
    },
  ],
  liveActivities: [
    {
      id: "live-1",
      title: "Proposal #041 created",
      vendor: "Stripe Inc",
      amount: 2400,
      currency: "USDC",
      timeAgo: "2m ago",
      tone: "info",
    },
    {
      id: "live-2",
      title: "Payment executed",
      department: "Engineering Dept · AWS Cloud",
      amount: 1892.44,
      currency: "USDC",
      timeAgo: "14m ago",
      tone: "success",
    },
    {
      id: "live-3",
      title: "Liquidity Sweep Initiated",
      department: "Solana Treasury Main",
      amount: 45000,
      currency: "USDC",
      timeAgo: "1h ago",
      tone: "critical",
    },
    {
      id: "live-4",
      title: "Yield Harvested",
      department: "Kamino Finance · Position #12",
      amount: 47.82,
      currency: "USDC",
      timeAgo: "3h ago",
      tone: "success",
    },
  ],
  proposal: {
    title: "Proposals",
    subtitle: "Managing active governance and expenditure requests",
    totalActive: 42,
    filters: [
      { id: "all", label: "All", active: true },
      { id: "pending", label: "Pending" },
      { id: "ready", label: "Ready To Execute" },
      { id: "executed", label: "Executed" },
      { id: "cancelled", label: "Cancelled" },
    ],
    proposals: [
      {
        id: "proposal-1",
        index: "001",
        vendor: "OpenAI API",
        hash: "0x8a...e9b2",
        department: "Engineering",
        amount: 12450,
        currency: "USD",
        category: "Infrastructure",
        aiScore: 98,
        approvals: { signed: 2, required: 2, reviewers: ["AK", "RN"] },
        status: "ready",
        date: "2023.10.24",
      },
      {
        id: "proposal-2",
        index: "002",
        vendor: "Amazon Web Services",
        hash: "0x2c...f1a4",
        department: "Engineering",
        amount: 45000,
        currency: "USD",
        category: "SaaS Subscription",
        aiScore: 84,
        approvals: { signed: 1, required: 3, reviewers: ["AK"] },
        status: "pending",
        date: "2023.10.25",
      },
      {
        id: "proposal-3",
        index: "003",
        vendor: "T-Mobile Business",
        hash: "0x44...00c2",
        department: "Operations",
        amount: 2100,
        currency: "USD",
        category: "Utilities",
        aiScore: 12,
        approvals: { signed: 0, required: 2, reviewers: [] },
        status: "flagged",
        date: "2023.10.26",
      },
      {
        id: "proposal-4",
        index: "004",
        vendor: "Vercel Inc.",
        hash: "0x91...cc43",
        department: "Engineering",
        amount: 800,
        currency: "USD",
        category: "Infrastructure",
        aiScore: 92,
        approvals: { signed: 3, required: 3, reviewers: ["AK", "RN", "PS"] },
        status: "executed",
        date: "2023.10.22",
      },
      {
        id: "proposal-5",
        index: "005",
        vendor: "Coinbase Cloud",
        hash: "0x5f...7721",
        department: "Custody",
        amount: 25000,
        currency: "USD",
        category: "Security",
        aiScore: 99,
        approvals: { signed: 2, required: 2, reviewers: ["MJ", "DP"] },
        status: "ready",
        date: "2023.10.27",
      },
    ],
    governanceMetrics: [
      {
        id: "avg-approval-time",
        label: "Avg Approval Time",
        value: "4.2h",
        helperText: "12% vs last month",
        helperTone: "positive",
      },
      {
        id: "execution-rate",
        label: "Execution Rate",
        value: "92.4%",
        helperText: "Benchmark: 88.0%",
        helperTone: "neutral",
      },
      {
        id: "flagged-tx-ratio",
        label: "Flagged Tx Ratio",
        value: "1.2%",
        helperText: "Within threshold",
        helperTone: "critical",
      },
    ],
    auditFeed: [
      { id: "audit-1", title: "0x8a...e9b2 Executed", timeAgo: "2 min ago", tone: "positive" },
      { id: "audit-2", title: "Admin added 3 reviewers to \"AWS Subscription\"", timeAgo: "14 min ago", tone: "neutral" },
      { id: "audit-3", title: "Proposed \"Vercel Inc.\" reached consensus", timeAgo: "1h ago", tone: "neutral" },
    ],
  },
  audit: auditMockData,
  settings: {
    title: "Treasury Settings",
    subtitleBadge: "trezo-demo",
    companyId: "trezo-demo",
    backend: {
      status: "healthy",
      service: "trezo-backend",
      version: "1.0.0",
      env: "development",
      settingsEndpointAvailable: false,
      spendingRulesEndpointAvailable: false,
    },
    multisig: {
      title: "Treasury Multisig",
      members: [
        { id: "member-1", address: "0x71C...8E2F", role: "Administrator" },
        { id: "member-2", address: "0x4A1...99BC", role: "Signer" },
      ],
      addMemberLabel: "Signer management",
      addressPlaceholder: "Signer address",
      defaultRole: "Signer",
      roleOptions: ["Signer", "Administrator"],
      quorum: {
        label: "Approval Threshold",
        helperText: "Read from the treasury config on the backend.",
        value: 3,
        totalSigners: 5,
        updateLabel: "Read only",
      },
      removeLabel: "Unsupported",
      addLabel: "Unsupported",
      readOnlyNotice: "Member management is not exposed by the current backend API.",
    },
    oracle: {
      title: "Oracle Trigger",
      feedLabel: "USDC / USD trigger",
      statusLabel: "Active",
      price: 1,
      pairLabel: "USDC / USD",
      changeLabel: "Using frontend fallback",
      triggerLabel: "Rate Trigger Threshold",
      triggerMin: 0.95,
      triggerMax: 1.1,
      triggerValue: 1.002,
      cooldownLabel: "Watcher",
      cooldownSeconds: 10,
      commitLabel: "Backend route unavailable",
      canEdit: false,
    },
    departments: {
      title: "Department Idle Thresholds",
      description: "Update the idle USDC threshold for automated yield deployment.",
      updateLabel: "Save threshold",
      canEdit: false,
      items: [
        {
          id: "dept-engineering",
          deptId: "engineering",
          name: "Engineering",
          pubkey: "0x71C...8E2F",
          idleThresholdUsdc: 5000,
          isActive: true,
          summary: "Active for automation",
        },
        {
          id: "dept-marketing",
          deptId: "marketing",
          name: "Marketing",
          pubkey: "0x4A1...99BC",
          idleThresholdUsdc: 2500,
          isActive: true,
          summary: "Active for automation",
        },
      ],
    },
    agentAuthority: {
      title: "Automation Runtime",
      pubkeyLabel: "Agent Pubkey",
      pubkey: "8qLwz4Jp7uN...vRm3t9sY",
      allowedLabel: "Available Context",
      allowed: [
        { id: "backend-service", label: "SERVICE TREZO-BACKEND", enabled: true },
        { id: "settings-route", label: "SETTINGS ROUTE", enabled: false },
        { id: "spending-rules-route", label: "SPENDING RULES ROUTE", enabled: false },
        { id: "treasury-read", label: "TREASURY READ", enabled: true },
      ],
      maxTxCapLabel: "Treasury PDA",
      maxTxCapValue: "7M1A...6FH",
      dailyBurnLabel: "Admin",
      dailyBurnValue: "Admin...Pubkey",
      actionLabel: "Read only",
      actionDisabled: true,
    },
    criticalOps: {
      title: "Treasury Pause State",
      body: "Treasury pause is inactive.",
      note: "",
      actionLabel: "Read only",
      actionDisabled: true,
    },
  },
};

export type DepartmentPageApiPayload = {
  department: DepartmentApiPayload;
  audit: AuditApiPayload;
};

export const departmentMockData: DepartmentApiPayload = {
  breadcrumbs: {
    parent: "Departments",
    current: "Engineering",
  },
  title: "Engineering Department",
  spendingCard: {
    spent: 38200,
    cap: 50000,
    currency: "USDC",
    fiscalPeriod: "MAY 2025",
    heading: "Spending",
    subHeading: "Budget Status",
  },
  governanceRules: [
    {
      id: "max-payout",
      label: "Max per payout",
      value: "$5,000 USDC",
      status: "healthy",
    },
    {
      id: "daily-limit",
      label: "Daily aggregate limit",
      value: "$20,000 USDC",
      status: "healthy",
    },
    {
      id: "privacy-protocol",
      label: "Privacy protocol",
      value: "Stealth mode: Enabled",
      status: "toggle",
      enabled: true,
    },
  ],
  spendingVelocity: [
    { id: "d-01", label: "01 MAY", value: 34, tone: "standard" },
    { id: "d-02", label: "02 MAY", value: 46, tone: "standard" },
    { id: "d-03", label: "03 MAY", value: 29, tone: "standard" },
    { id: "d-04", label: "04 MAY", value: 61, tone: "standard" },
    { id: "d-05", label: "05 MAY", value: 78, tone: "critical" },
    { id: "d-06", label: "06 MAY", value: 39, tone: "standard" },
    { id: "d-07", label: "07 MAY", value: 25, tone: "standard" },
    { id: "d-08", label: "08 MAY", value: 51, tone: "standard" },
    { id: "d-09", label: "09 MAY", value: 69, tone: "standard" },
    { id: "d-10", label: "10 MAY", value: 83, tone: "critical" },
    { id: "d-11", label: "11 MAY", value: 43, tone: "standard" },
    { id: "d-12", label: "12 MAY", value: 34, tone: "standard" },
    { id: "d-13", label: "13 MAY", value: 56, tone: "standard" },
    { id: "d-14", label: "14 MAY", value: 17, tone: "standard" },
    { id: "d-15", label: "15 MAY", value: 65, tone: "standard" },
    { id: "d-16", label: "16 MAY", value: 34, tone: "standard" },
    { id: "d-17", label: "17 MAY", value: 46, tone: "standard" },
    { id: "d-18", label: "18 MAY", value: 29, tone: "standard" },
    { id: "d-19", label: "19 MAY", value: 61, tone: "standard" },
    { id: "d-20", label: "20 MAY", value: 74, tone: "critical" },
    { id: "d-21", label: "21 MAY", value: 39, tone: "standard" },
    { id: "d-22", label: "22 MAY", value: 25, tone: "standard" },
    { id: "d-23", label: "23 MAY", value: 51, tone: "standard" },
    { id: "d-24", label: "24 MAY", value: 69, tone: "standard" },
    { id: "d-25", label: "25 MAY", value: 83, tone: "critical" },
    { id: "d-26", label: "26 MAY", value: 43, tone: "standard" },
    { id: "d-27", label: "27 MAY", value: 34, tone: "standard" },
    { id: "d-28", label: "28 MAY", value: 56, tone: "standard" },
    { id: "d-29", label: "29 MAY", value: 17, tone: "standard" },
    { id: "d-30", label: "30 MAY", value: 65, tone: "standard" },
  ],
};

export const departmentPageMockData: DepartmentPageApiPayload = {
  department: departmentMockData,
  audit: auditMockData,
};

export const proposalMockData: ProposalApiPayload = {
  ...dashboardMockData.proposal,
};

export const invoicesMockData: InvoicesApiPayload = {
  title: "Invoice Operations",
  subtitle: "Parse, review, propose, and optionally convert to fiat",
  upload: {
    title: "Upload a PDF invoice",
    helperText: "Select a PDF, review the parsed fields, then create an onchain proposal.",
    supportedLabel: "SUPPORTED: PDF ONLY (MAX 10MB)",
  },
  historyTitle: "Recent invoices",
  history: [
    {
      id: "inv-aws-jan",
      fileName: "AWS_INFRA_JAN_24.PDF",
      date: "Jan 12, 2024",
      invoiceId: "49201-X",
      amount: 12450,
      currency: "USD",
      status: "processed",
    },
    {
      id: "inv-hubspot",
      fileName: "HUBSPOT_SUB_2024.PDF",
      date: "Jan 10, 2024",
      invoiceId: "49198-B",
      amount: 800,
      currency: "USD",
      status: "processed",
    },
    {
      id: "inv-office",
      fileName: "OFFICE_SUPPLIES_NY.PDF",
      date: "Jan 08, 2024",
      invoiceId: "49185-K",
      amount: 245.12,
      currency: "USD",
      status: "flagged",
    },
  ],
  analysis: {
    engineStatusLabel: "Ready",
    steps: [
      {
        id: "step-ocr",
        title: "Extracted text",
        description: "OCR layer identification complete",
        status: "done",
      },
      {
        id: "step-parse",
        title: "Parsed fields",
        description: "Entity extraction (Vendor, Amount, Date)",
        status: "done",
      },
      {
        id: "step-history",
        title: "Checked history",
        description: "Cross-referencing treasury logs...",
        status: "active",
      },
    ],
    insight: {
      id: "insight-anomaly",
      tone: "warning",
      title: "Anomaly detected",
      message: "This amount is 42% higher than previous 3‑month average for this vendor.",
    },
    vendorName: "DigitalOcean Inc.",
    totalAmount: 4520.1,
    currency: "USD",
    category: "Cloud Infrastructure",
    department: "Engineering",
    taxId: "Proposal pending",
    paymentTerms: "Net 30",
    riskScoreLabel: "Moderate",
    invoiceNumber: "49201-X",
    confidence: 0.82,
    description: "Infrastructure hosting subscription",
    dueDate: "2024-02-12",
    vendorHistory: {
      vendor: "DigitalOcean Inc.",
      invoiceCount: 4,
      averageAmount: 3890,
      lastSeenDate: "2024-01-02",
      categories: ["Cloud Infrastructure"],
    },
    similarInvoices: [
      {
        vendor: "DigitalOcean Inc.",
        amount: 4210.42,
        date: "2023-12-12",
        category: "Cloud Infrastructure",
        similarity: 0.94,
      },
    ],
  },
  context: {
    companyId: "trezo-demo",
    treasuryPda: "7M1A...6FH",
    recipientWallet: "wallet...1234",
    defaultDeptId: "engineering",
    defaultDeptPda: "FhzK...8iM",
    departments: [
      {
        deptId: "engineering",
        name: "Engineering",
        pubkey: "FhzK...8iM",
        idleThresholdUsdc: 5000,
        isActive: true,
      },
      {
        deptId: "operations",
        name: "Operations",
        pubkey: "Ops...Vault",
        idleThresholdUsdc: 2000,
        isActive: true,
      },
    ],
  },
  meta: {
    backendHealthy: true,
    message: "Invoice history is loaded from the backend. Uploads still require treasury and department context.",
  },
};
