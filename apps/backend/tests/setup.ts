import { vi } from 'vitest';

// Set test environment variables before config.ts loads
process.env.NODE_ENV = 'test';
process.env.PORT = '4001';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.SOLANA_RPC_URL = 'https://api.devnet.solana.com';
process.env.HELIUS_API_KEY = 'test-helius-key';
process.env.HELIUS_WS_URL = 'wss://devnet.helius-rpc.com';
process.env.PROGRAM_ID = '11111111111111111111111111111111';
process.env.AGENT_KEYPAIR = JSON.stringify(Array.from({ length: 64 }, (_, i) => i + 1));
process.env.GROQ_API_KEY = 'test-groq-key';
process.env.COMPANY_ID = 'trezo-test';

// Suppress console noise in tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
