import { PublicKey } from '@solana/web3.js';
import { ParsedInvoice } from './invoice-parser';
import { RAGResult } from './rag';
import { usdcToLamports, toPubkey } from '../utils';
import BN from 'bn.js';

export interface ProposalInstructionData {
  treasuryPda: PublicKey;
  deptPda: PublicKey;
  recipientAta: PublicKey;
  amountLamports: BN;
  category: number;
  metadataUri: string;
  expiryTimestamp: number;
}

export interface BuildProposalInput {
  invoice: ParsedInvoice;
  ragResult: RAGResult;
  treasuryPda: string;
  deptPda: string;
  recipientWallet: string;
  metadataUri: string;
}

export interface ProposalSummary {
  vendor: string;
  amountUsdc: number;
  currency: string;
  category: string;
  description: string;
  dueDate: string;
  invoiceNumber: string | null;
  confidence: number;
  anomalyFlags: string[];
  suggestedDepartment: string | null;
  metadataUri: string;
  expiryTimestamp: number;
}

// Must match your Rust CategoryMask enum exactly
const CATEGORY_MASK: Record<string, number> = {
  software:       0b00000001,
  infrastructure: 0b00000010,
  marketing:      0b00000100,
  legal:          0b00001000,
  hr:             0b00010000,
  operations:     0b00100000,
  travel:         0b01000000,
  other:          0b10000000,
};

export function buildProposalData(input: BuildProposalInput): ProposalInstructionData {
  const { invoice, treasuryPda, deptPda, recipientWallet, metadataUri } = input;

  const treasury = toPubkey(treasuryPda);
  const dept = toPubkey(deptPda);
  const recipient = toPubkey(recipientWallet);
  const categoryMask = CATEGORY_MASK[invoice.category] ?? CATEGORY_MASK['other']!;
  const expiryTimestamp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

  return {
    treasuryPda: treasury,
    deptPda: dept,
    recipientAta: recipient,
    amountLamports: new BN(usdcToLamports(invoice.amountUsdc)),
    category: categoryMask,
    metadataUri,
    expiryTimestamp,
  };
}

export function buildProposalSummary(
  invoice: ParsedInvoice,
  ragResult: RAGResult,
  metadataUri: string
): ProposalSummary {
  return {
    vendor: invoice.vendor,
    amountUsdc: invoice.amountUsdc,
    currency: invoice.currency,
    category: invoice.category,
    description: invoice.description,
    dueDate: invoice.dueDate,
    invoiceNumber: invoice.invoiceNumber ?? null,
    confidence: invoice.confidence,
    anomalyFlags: ragResult.anomalyFlags,
    suggestedDepartment: ragResult.suggestedDepartment,
    metadataUri,
    expiryTimestamp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  };
}