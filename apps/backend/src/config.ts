import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Server
  PORT: z.string().default('4000'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Solana
  SOLANA_RPC_URL: z.string().min(1, 'SOLANA_RPC_URL is required'),
  AGENT_KEYPAIR: z.string().min(1, 'AGENT_KEYPAIR is required'),
  PROGRAM_ID: z.string().min(1, 'PROGRAM_ID is required'),

  // Helius
  HELIUS_API_KEY: z.string().min(1, 'HELIUS_API_KEY is required'),
  HELIUS_WS_URL: z.string().default('wss://devnet.helius-rpc.com'),

  // AI (optional at start — LLM decided later)
  GROQ_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  // Vector DB
  PINECONE_API_KEY: z.string().optional(),
  PINECONE_INDEX: z.string().default('trezo-invoices'),

  // Pyth
  PYTH_PROGRAM_ID: z
    .string()
    .default('gSbePebfvPy7tRqimPoVecS2UsBvYv46ynrzWocc92s'), // devnet

  // Dodo Payments
  DODO_API_KEY: z.string().optional(),
  DODO_SANDBOX: z.string().default('true'),
  DODO_API_URL: z.string().default('https://test.dodopayments.com'),

  // Jobs config
  YIELD_IDLE_THRESHOLD_USDC: z.string().default('5000'),
  PYTH_RATE_TRIGGER: z.string().default('1.002'),
  YIELD_POLL_INTERVAL_MS: z.string().default('900000'),  // 15 minutes
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  parsed.error.issues.forEach((issue) => {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

export const config = {
  port: parseInt(parsed.data.PORT),
  frontendUrl: parsed.data.FRONTEND_URL,
  nodeEnv: parsed.data.NODE_ENV,
  isDev: parsed.data.NODE_ENV === 'development',

  solana: {
    rpcUrl: parsed.data.SOLANA_RPC_URL,
    agentKeypair: parsed.data.AGENT_KEYPAIR,
    programId: parsed.data.PROGRAM_ID,
  },

  helius: {
    apiKey: parsed.data.HELIUS_API_KEY,
    wsUrl: parsed.data.HELIUS_WS_URL,
  },

  ai: {
    groqApiKey: parsed.data.GROQ_API_KEY,
    openaiApiKey: parsed.data.OPENAI_API_KEY,
    anthropicApiKey: parsed.data.ANTHROPIC_API_KEY,
  },

  pinecone: {
    apiKey: parsed.data.PINECONE_API_KEY,
    index: parsed.data.PINECONE_INDEX,
  },

  pyth: {
    programId: parsed.data.PYTH_PROGRAM_ID,
    rateTrigger: parseFloat(parsed.data.PYTH_RATE_TRIGGER),
  },

  dodo: {
    apiKey: parsed.data.DODO_API_KEY,
    sandbox: parsed.data.DODO_SANDBOX === 'true',
    apiUrl: parsed.data.DODO_API_URL,
  },

  jobs: {
    yieldIdleThresholdUsdc: parseInt(parsed.data.YIELD_IDLE_THRESHOLD_USDC),
    yieldPollIntervalMs: parseInt(parsed.data.YIELD_POLL_INTERVAL_MS),
    pythRateTrigger: parseFloat(parsed.data.PYTH_RATE_TRIGGER),
  },
} as const;

export type Config = typeof config;