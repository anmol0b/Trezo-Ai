// ─── Coinflow — USDC → Fiat Conversion ───────────────────────────────────────
// Coinflow withdrawal is frontend-driven via CoinflowWithdraw React component
// Backend handles: session tokens, webhook events, payout status

const COINFLOW_API = process.env.COINFLOW_ENV === 'prod'
  ? 'https://api.coinflow.cash'
  : 'https://api.sandbox.coinflow.cash';

const MERCHANT_ID = process.env.COINFLOW_MERCHANT_ID ?? 'trezo';

export interface CoinflowSession {
  sessionKey: string;
  merchantId: string;
  env: string;
  expiresAt: string;
}

export interface PayoutRequest {
  walletAddress: string;
  amountUsdc: number;
  targetCurrency: string;
  targetIban?: string;
  reference: string;
}

export interface PayoutResult {
  success: boolean;
  sessionKey?: string;
  withdrawUrl?: string;
  error?: string;
}

export interface CoinflowWebhookEvent {
  type: 'withdrawal.completed' | 'withdrawal.failed' | 'withdrawal.pending';
  id: string;
  amount: number;
  currency: string;
  walletAddress: string;
  reference?: string;
  createdAt: string;
}

// Get a session key for the frontend CoinflowWithdraw component
export async function getCoinflowSession(
  userId: string,
  walletAddress: string
): Promise<CoinflowSession | null> {
  try {
    const res = await fetch(`${COINFLOW_API}/merchant/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-coinflow-auth-merchant': MERCHANT_ID,
      },
      body: JSON.stringify({
        'x-coinflow-auth-user-id': userId,
        'x-coinflow-auth-blockchain': 'solana',
        walletAddress,
      }),
    });

    if (!res.ok) {
      console.error('❌ Coinflow session error:', res.status, await res.text());
      return null;
    }

    const data = await res.json() as any;
    console.log(`✅ Coinflow session created for ${walletAddress.slice(0, 8)}...`);

    return {
      sessionKey: data.sessionKey ?? data.token,
      merchantId: MERCHANT_ID,
      env: process.env.COINFLOW_ENV ?? 'sandbox',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  } catch (err) {
    console.error('❌ Coinflow session failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

// Get payout status by ID
export async function getCoinflowPayoutStatus(payoutId: string): Promise<any> {
  try {
    const res = await fetch(`${COINFLOW_API}/merchant/payouts/${payoutId}`, {
      headers: { 'x-coinflow-auth-merchant': MERCHANT_ID },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Verify webhook signature
export function verifyCoinflowWebhook(
  payload: string,
  signature: string
): boolean {
  // TODO: implement HMAC verification with COINFLOW_WEBHOOK_SECRET
  // For now accept all in sandbox
  if (process.env.COINFLOW_ENV !== 'prod') return true;
  const secret = process.env.COINFLOW_WEBHOOK_SECRET;
  if (!secret) return false;
  const crypto = require('crypto');
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return signature === expected;
}