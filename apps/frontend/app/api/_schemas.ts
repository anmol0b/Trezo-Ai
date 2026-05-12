import { z } from "zod";

export const HealthResponseSchema = z.object({
  status: z.string(),
  service: z.string(),
  version: z.string(),
  timestamp: z.string(),
  env: z.string(),
});

export const TreasuryResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      pubkey: z.string().optional(),
      companyId: z.string().optional(),
      admin: z.string().optional(),
      agentPubkey: z.string().optional(),
      departmentCount: z.coerce.number().optional(),
      proposalCount: z.coerce.number().optional(),
      isPaused: z.boolean().optional(),
      multisigThreshold: z.coerce.number().optional(),
      members: z.array(z.string()).optional(),
    })
    .passthrough()
    .optional(),
});


export const DepartmentSchema = z.object({
  pubkey: z.string(),
  treasuryConfig: z.string(),
  deptId: z.string(),
  name: z.string(),
  deptVaultAta: z.string(),
  idleThreshold: z.coerce.number(),
  idleThresholdUsdc: z.coerce.number(),
  isActive: z.boolean(),
  createdAt: z.string(),           
  bump: z.number().optional(),
});

export const DepartmentsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(DepartmentSchema).default([]),
});


export const ProposalsResponseSchema = z.object({
  success: z.boolean(),
  count: z.coerce.number().optional(),
  data: z
    .array(
      z.object({
        pubkey: z.string(),
        deptAccount: z.string().optional(),
        status: z.string(),
        amountLamports: z.union([z.coerce.number(), z.string()]).optional(),
        approvalsCount: z.coerce.number().optional(),
        createdAt: z.union([z.coerce.number(), z.string()]).optional(),
        updatedAt: z.union([z.coerce.number(), z.string()]).optional(),
        metadataUri: z.string().optional(),
      }),
    )
    .default([]),
});


export const AuditEventsResponseSchema = z.object({
  success: z.boolean(),
  count: z.coerce.number().optional(),
  data: z
    .array(
      z.object({
        signature: z.string(),
        timestamp: z.coerce.number(),
        ephemeralPubkey: z.string().optional(),
        encryptedNote: z.string().optional(),
        amount: z.coerce.number(),
        slot: z.coerce.number().optional(),
      })
    )
    .default([]),
});

export const YieldSummarySchema = z.object({
  totalDeposited: z.number(),
  totalCurrentBalance: z.number(),
  totalEstimatedYield: z.number(),
  estimatedApy: z.number(),
  estimatedApyPercent: z.string(),
  usdcPrice: z.number(),
  kamino: z.object({
    supplyApy: z.number(),
    borrowApy: z.number(),
    utilizationRate: z.number(),
    source: z.string(),
  }),
  kaminoStatus: z.string(),
});

export const YieldPositionSchema = z.object({
  pubkey: z.string(),
  deptPda: z.string(),
  // Add more fields here later if needed
}).passthrough();

export const YieldDataSchema = z.object({
  companyId: z.string(),
  summary: YieldSummarySchema,
  positions: z.array(YieldPositionSchema),
});

export const YieldEndpointSchema = z.object({
  success: z.boolean(),
  data: YieldDataSchema,
});

export const KaminoMarketSchema = z.object({
  usdcSupplyApy: z.number(),
  usdcSupplyApyPercent: z.string(),
  usdcBorrowApy: z.number(),
  totalDeposits: z.number(),
  availableLiquidity: z.number(),
  utilizationRate: z.number(),
  source: z.string(),
});

export const KaminoVaultSchema = z.object({
  address: z.string(),
  apy: z.number(),
  apyPercent: z.string(),
  exchangeRate: z.number(),
  source: z.string(),
});

export const KaminoStatsDataSchema = z.object({
  market: KaminoMarketSchema,
  vault: KaminoVaultSchema,
  updatedAt: z.string(),
});

export const KaminoStatsSchema = z.object({
  success: z.boolean(),
  data: KaminoStatsDataSchema,
});

export const BackendInvoiceSchema = z.object({
  id: z.string(),
  vendor: z.string(),
  amount: z.coerce.number(),
  currency: z.string(),
  amount_usdc: z.coerce.number(),
  due_date: z.string().nullable(),
  category: z.string().nullable(),
  description: z.string().nullable(),
  invoice_number: z.string().nullable(),
  metadata_uri: z.string().nullable().optional(),
  confidence: z.string().nullable().optional(),
  flags: z.array(z.string()).nullable().default([]),
  created_at: z.string(),
  proposal_pda: z.string().nullable().optional(),
});

export const BackendInvoicesResponseSchema = z.object({
  success: z.boolean(),
  count: z.number().optional(),
  data: z.array(BackendInvoiceSchema).default([]),
});

export const VendorHistorySchema = z.object({
  vendor: z.string(),
  invoiceCount: z.coerce.number(),
  averageAmount: z.coerce.number(),
  lastSeenDate: z.string(),
  categories: z.array(z.string()).default([]),
}).nullable();

export const SimilarInvoiceSchema = z.object({
  vendor: z.string(),
  amount: z.coerce.number(),
  date: z.string(),
  category: z.string(),
  similarity: z.coerce.number(),
});

export const ParseInvoiceBackendResponseSchema = z.object({
  success: z.boolean(),
  summary: z
    .object({
      vendor: z.string().optional(),
      amountUsdc: z.coerce.number().optional(),
      currency: z.string().optional(),
      category: z.string().optional(),
      description: z.string().optional(),
      dueDate: z.string().optional(),
      invoiceNumber: z.string().optional(),
      confidence: z.coerce.number().optional(),
      anomalyFlags: z.array(z.string()).optional(),
      suggestedDepartment: z.string().optional(),
      metadataUri: z.string().optional(),
      expiryTimestamp: z.coerce.number().optional(),
    })
    .optional(),
  vendorHistory: VendorHistorySchema.optional(),
  similarInvoices: z.array(SimilarInvoiceSchema).optional(),
});

export const ConfirmInvoiceResponseSchema = z.object({
  success: z.boolean(),
  signature: z.string().optional(),
  proposalPda: z.string().optional(),
  error: z.string().optional(),
});

export const FiatStatusSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string(),
    status: z.string(),
    amountUsdc: z.coerce.number(),
    targetCurrency: z.string(),
    exchangeRate: z.coerce.number(),
    targetAmount: z.coerce.number(),
    reference: z.string(),
    createdAt: z.string(),
  }),
});

export type BackendInvoice = z.infer<typeof BackendInvoiceSchema>;
export type Department = z.infer<typeof DepartmentSchema>;
export type YieldEndpointPayload = z.infer<typeof YieldEndpointSchema>;
export type KaminoStatsPayload = z.infer<typeof KaminoStatsSchema>;