import { vi } from 'vitest';

export const mockStealthEvents = [
  {
    signature: 'test-sig-1',
    timestamp: Date.now() - 60000,
    ephemeralPubkey: 'ephemeral-pubkey-1',
    encryptedNote: 'encrypted-note-1',
    amount: 500,
    slot: 12345,
  },
  {
    signature: 'test-sig-2',
    timestamp: Date.now() - 120000,
    ephemeralPubkey: 'ephemeral-pubkey-2',
    encryptedNote: 'encrypted-note-2',
    amount: 1000,
    slot: 12340,
  },
];

vi.mock('../../src/services/helius', () => ({
  getAccountBalance: vi.fn().mockResolvedValue(5000),
  getRecentTransactions: vi.fn().mockResolvedValue([]),
  getCachedStealthEvents: vi.fn().mockReturnValue(mockStealthEvents),
  startStealthEventIndexer: vi.fn(),
  stopStealthEventIndexer: vi.fn(),
}));
