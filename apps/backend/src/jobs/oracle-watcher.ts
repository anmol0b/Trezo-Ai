import { config } from '../config';
import {
  startPythPoller,
  stopPythPoller,
  onRateUpdate,
  PriceData,
  isRateAboveTrigger,
} from '../services/pyth';
import { getCoinflowSession } from '../services/coinflow';
import { submitTriggerFiatConversion } from '../agent/solana-client';

const CONVERSION_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

let lastConversionTime = 0;
let unsubscribe: (() => void) | null = null;
let isTriggering = false;

// Pending trigger that the frontend polls for
export interface PendingConversionTrigger {
  triggeredAt: string;
  onchainSignature: string;
  amountUsdc: number;
  targetCurrency: string;
  sessionKey?: string;
}

let pendingTrigger: PendingConversionTrigger | null = null;

// Frontend polls this to know when to open CoinflowWithdraw
export function getPendingTrigger(): PendingConversionTrigger | null {
  return pendingTrigger;
}

export function clearPendingTrigger(): void {
  pendingTrigger = null;
}

async function handleRateUpdate(price: PriceData): Promise<void> {
  if (isTriggering) return;
  if (!isRateAboveTrigger(price)) return;

  const now = Date.now();
  if (now - lastConversionTime < CONVERSION_COOLDOWN_MS) {
    console.log('⏳ Rate above trigger but in cooldown — skipping');
    return;
  }

  isTriggering = true;
  lastConversionTime = now;

  console.log(
    `🔔 USDC/USD ${price.price.toFixed(6)} >= trigger ${config.pyth.rateTrigger} ` +
    `— initiating fiat conversion`
  );

  try {
    // Step 1 — emit onchain event for audit trail
    const companyId = process.env.COMPANY_ID ?? 'trezo-demo';
    const onchainResult = await submitTriggerFiatConversion(companyId);

    if (!onchainResult.success) {
      console.error('❌ Onchain trigger failed:', onchainResult.error);
      isTriggering = false;
      return;
    }

    console.log(`  ✅ Onchain event: ${onchainResult.signature?.slice(0, 8)}...`);

    // Step 2 — Coinflow is frontend-driven, so we queue a pending trigger
    // The frontend polls GET /api/fiat/pending and opens CoinflowWithdraw when set
    const amountUsdc = parseFloat(process.env.FIAT_CONVERSION_AMOUNT_USDC ?? '1000');
    const targetCurrency = process.env.FIAT_TARGET_CURRENCY ?? 'USD';
    const walletAddress = process.env.FIAT_WALLET_ADDRESS ?? '';
    const userId = process.env.COMPANY_ID ?? 'trezo-demo';

    // Pre-fetch a session key so frontend can open the widget immediately
    const session = walletAddress
      ? await getCoinflowSession(userId, walletAddress)
      : null;

    pendingTrigger = {
      triggeredAt: new Date().toISOString(),
      onchainSignature: onchainResult.signature ?? '',
      amountUsdc,
      targetCurrency,
      sessionKey: session?.sessionKey,
    };

    console.log(
      `  ✅ Conversion trigger queued: ${amountUsdc} USDC → ${targetCurrency}` +
      (session ? ' (session ready)' : ' (no session — wallet address not configured)')
    );

  } catch (err) {
    console.error('❌ Oracle watcher error:', err instanceof Error ? err.message : err);
  } finally {
    isTriggering = false;
  }
}

export function startOracleWatcher(): void {
  if (unsubscribe) return;

  console.log(
    `📡 Starting oracle watcher ` +
    `(trigger at USDC/USD >= ${config.pyth.rateTrigger})...`
  );

  unsubscribe = onRateUpdate(handleRateUpdate);
  startPythPoller(10_000);
}

export function stopOracleWatcher(): void {
  unsubscribe?.();
  unsubscribe = null;
  stopPythPoller();
  console.log('🛑 Oracle watcher stopped');
}