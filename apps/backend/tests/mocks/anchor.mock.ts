import { vi } from 'vitest';
import { PublicKey } from '@solana/web3.js';

export const mockTreasuryData = {
  admin: new PublicKey('11111111111111111111111111111111'),
  members: [new PublicKey('11111111111111111111111111111111')],
  totalBalance: 100_000_000_000,
  companyId: 'trezo-test',
  isPaused: false,
  multisigThreshold: 2,
};

export const mockDepartmentData = {
  name: 'Engineering',
  budgetCap: 50_000_000_000,
  spent: 10_000_000_000,
  isActive: true,
  stealthEnabled: false,
};

export const mockProposalData = {
  amount: 25_000_000,
  recipient: new PublicKey('11111111111111111111111111111111'),
  category: 1,
  metadataUri: 'ipfs://test',
  status: 'pending',
  approvalBitmap: 0,
  expiryTimestamp: Math.floor(Date.now() / 1000) + 604800,
};

// Mock the entire services/anchor module
vi.mock('../../src/services/anchor', () => ({
  getConnection: vi.fn().mockReturnValue({
    getTokenAccountBalance: vi.fn().mockResolvedValue({
      value: { uiAmountString: '5000.00' },
    }),
    getLatestBlockhash: vi.fn().mockResolvedValue({
      blockhash: 'test-blockhash',
    }),
    getSignaturesForAddress: vi.fn().mockResolvedValue([]),
    getParsedTransactions: vi.fn().mockResolvedValue([]),
  }),
  getAgentKeypair: vi.fn().mockReturnValue({
    publicKey: new PublicKey('11111111111111111111111111111111'),
    secretKey: new Uint8Array(64),
  }),
  getProvider: vi.fn().mockReturnValue({}),
  getProgram: vi.fn().mockReturnValue({
    account: {
      treasuryConfig: {
        fetch: vi.fn().mockResolvedValue(mockTreasuryData),
        all: vi.fn().mockResolvedValue([]),
      },
      departmentAccount: {
        fetch: vi.fn().mockResolvedValue(mockDepartmentData),
        all: vi.fn().mockResolvedValue([
          { publicKey: new PublicKey('11111111111111111111111111111111'), account: mockDepartmentData },
        ]),
      },
      payoutProposal: {
        fetch: vi.fn().mockResolvedValue(mockProposalData),
        all: vi.fn().mockResolvedValue([
          { publicKey: new PublicKey('11111111111111111111111111111111'), account: mockProposalData },
        ]),
      },
      yieldPosition: {
        all: vi.fn().mockResolvedValue([]),
      },
      agentAuthority: {
        fetch: vi.fn().mockRejectedValue(new Error('Account not found')),
      },
    },
    methods: {},
  }),
  PDAs: {
    treasury: vi.fn().mockReturnValue([
      new PublicKey('11111111111111111111111111111111'), 255,
    ]),
    department: vi.fn().mockReturnValue([
      new PublicKey('11111111111111111111111111111111'), 255,
    ]),
    proposal: vi.fn().mockReturnValue([
      new PublicKey('11111111111111111111111111111111'), 255,
    ]),
    agentAuthority: vi.fn().mockReturnValue([
      new PublicKey('11111111111111111111111111111111'), 255,
    ]),
    yieldPosition: vi.fn().mockReturnValue([
      new PublicKey('11111111111111111111111111111111'), 255,
    ]),
    oracleConfig: vi.fn().mockReturnValue([
      new PublicKey('11111111111111111111111111111111'), 255,
    ]),
    viewingKey: vi.fn().mockReturnValue([
      new PublicKey('11111111111111111111111111111111'), 255,
    ]),
  },
}));
