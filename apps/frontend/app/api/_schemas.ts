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

export const DepartmentsResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .array(
      z.object({
        pubkey: z.string(),
        deptId: z.string(),
        name: z.string(),
        idleThreshold: z.coerce.number(),
        isActive: z.boolean(),
        createdAt: z.coerce.number().optional(),
      }),
    )
    .default([]),
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
        amountLamports: z.coerce.number().optional(),
        approvalsCount: z.coerce.number().optional(),
        createdAt: z.coerce.number().optional(),
        updatedAt: z.coerce.number().optional(),
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
      }),
    )
    .default([]),
});

export const FlexibleYieldRecordSchema = z
  .object({
    deptId: z.string().optional(),
    department: z.string().optional(),
    name: z.string().optional(),
    provider: z.string().optional(),
    protocol: z.string().optional(),
    market: z.string().optional(),
    amount: z.coerce.number().optional(),
    amountUsdc: z.coerce.number().optional(),
    idleThreshold: z.coerce.number().optional(),
    idleThresholdUsdc: z.coerce.number().optional(),
    apy: z.coerce.number().optional(),
    isActive: z.boolean().optional(),
    autoReinvest: z.boolean().optional(),
    deptPda: z.string().optional(),
    deptVaultAta: z.string().optional(),
  })
  .passthrough();

export const YieldEndpointSchema = z.union([
  z.array(FlexibleYieldRecordSchema),
  z.object({
    success: z.boolean().optional(),
    data: z.array(FlexibleYieldRecordSchema).optional(),
  }),
]);

export const FlexibleRateRecordSchema = z
  .object({
    id: z.string().optional(),
    label: z.string().optional(),
    name: z.string().optional(),
    market: z.string().optional(),
    symbol: z.string().optional(),
    apy: z.coerce.number().optional(),
    apr: z.coerce.number().optional(),
  })
  .passthrough();

export const KaminoStatsSchema = z.union([
  z.array(FlexibleRateRecordSchema),
  z.object({
    success: z.boolean().optional(),
    data: z.array(FlexibleRateRecordSchema).optional(),
  }),
]);

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
  flags: z.array(z.string()).nullable(),
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
});

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
export type FlexibleYieldRecord = z.infer<typeof FlexibleYieldRecordSchema>;
export type KaminoStatsPayload = z.infer<typeof KaminoStatsSchema>;
export type YieldEndpointPayload = z.infer<typeof YieldEndpointSchema>;
