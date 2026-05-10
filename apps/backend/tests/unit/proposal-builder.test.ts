import { describe, it, expect } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import {
  buildProposalData,
  buildProposalSummary,
} from '../../src/agent/proposal-builder';
import { mockParsedInvoice } from '../mocks/agent.mock';

const VALID_PUBKEY = '11111111111111111111111111111111';

const mockRagResult = {
  vendorHistory: null,
  anomalyFlags: [],
  suggestedDepartment: 'engineering',
  similarInvoices: [],
};

const baseInput = {
  invoice: mockParsedInvoice,
  ragResult: mockRagResult,
  treasuryPda: VALID_PUBKEY,
  deptPda: VALID_PUBKEY,
  recipientWallet: VALID_PUBKEY,
  metadataUri: 'ipfs://test-hash',
};

describe('buildProposalData', () => {
  it('builds valid proposal instruction data', () => {
    const result = buildProposalData(baseInput);

    expect(result.treasuryPda).toBeInstanceOf(PublicKey);
    expect(result.deptPda).toBeInstanceOf(PublicKey);
    expect(result.recipientAta).toBeInstanceOf(PublicKey);
    expect(typeof result.amountLamports).toBe('bigint');
    expect(result.amountLamports).toBe(BigInt(25_000_000));
    expect(typeof result.category).toBe('number');
    expect(result.category).toBeGreaterThan(0);
    expect(result.metadataUri).toBe('ipfs://test-hash');
    expect(result.expiryTimestamp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('sets expiry 7 days from now', () => {
    const result = buildProposalData(baseInput);
    const sevenDays = 7 * 24 * 60 * 60;
    const now = Math.floor(Date.now() / 1000);

    expect(result.expiryTimestamp).toBeGreaterThan(now + sevenDays - 10);
    expect(result.expiryTimestamp).toBeLessThan(now + sevenDays + 10);
  });

  it('throws on invalid treasury pubkey', () => {
    expect(() => buildProposalData({
      ...baseInput,
      treasuryPda: 'not-a-pubkey',
    })).toThrow('Invalid public key');
  });

  it('throws on invalid recipient pubkey', () => {
    expect(() => buildProposalData({
      ...baseInput,
      recipientWallet: 'bad',
    })).toThrow('Invalid public key');
  });

  it('maps infrastructure category to correct bitmask', () => {
    const result = buildProposalData(baseInput);
    expect(result.category).toBe(0b00000010);
  });

  it('maps software category to correct bitmask', () => {
    const result = buildProposalData({
      ...baseInput,
      invoice: { ...mockParsedInvoice, category: 'software' as const },
    });
    expect(result.category).toBe(0b00000001);
  });
});

describe('buildProposalSummary', () => {
  it('builds human-readable summary', () => {
    const result = buildProposalSummary(
      mockParsedInvoice,
      mockRagResult,
      'ipfs://test-hash'
    );

    expect(result.vendor).toBe('Vercel Inc.');
    expect(result.amountUsdc).toBe(25);
    expect(result.currency).toBe('USD');
    expect(result.category).toBe('infrastructure');
    expect(result.confidence).toBe(0.95);
    expect(result.anomalyFlags).toEqual([]);
    expect(result.suggestedDepartment).toBe('engineering');
    expect(result.metadataUri).toBe('ipfs://test-hash');
    expect(result.invoiceNumber).toBe('INV-2024-0392');
  });

  it('sets null invoiceNumber when missing', () => {
    const invoiceWithoutNumber = { ...mockParsedInvoice, invoiceNumber: undefined };
    const result = buildProposalSummary(invoiceWithoutNumber, mockRagResult, 'ipfs://x');
    expect(result.invoiceNumber).toBeNull();
  });

  it('includes anomaly flags from RAG', () => {
    const ragWithFlags = {
      ...mockRagResult,
      anomalyFlags: ['Amount 40% above average for Vercel Inc.'],
    };
    const result = buildProposalSummary(mockParsedInvoice, ragWithFlags, 'ipfs://x');
    expect(result.anomalyFlags).toHaveLength(1);
    expect(result.anomalyFlags[0]).toContain('40%');
  });
});
