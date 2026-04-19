import { config } from '../config';
import {
  startPythPoller,
  stopPythPoller,
  onRateUpdate,
  PriceData,
  isRateAboveTrigger,
} from '../services/pyth';
import { triggerFiatConversion, generateIdempotencyKey } from '../services/dodo';
import { submitTriggerFiatConversion } from '../agent/solana-client';

const CONVERSION_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

let lastConversionTime = 0;
let unsubscribe: (() => void) | null = null;
let isTriggering = false;

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
    const companyId = process.env.COMPANY_ID ?? 'koshai-demo';
    const onchainResult = await submitTriggerFiatConversion(companyId);

    if (!onchainResult.success) {
      console.error('❌ Onchain trigger failed:', onchainResult.error);
      isTriggering = false;
      return;
    }

    console.log(`  ✅ Onchain event: ${onchainResult.signature?.slice(0, 8)}...`);

    // Step 2 — call Dodo Payments API
    const amountUsdc = parseFloat(process.env.FIAT_CONVERSION_AMOUNT_USDC ?? '1000');
    const targetIban = process.env.FIAT_TARGET_IBAN ?? 'GB82WEST12345698765432';
    const targetCurrency = process.env.FIAT_TARGET_CURRENCY ?? 'USD';

    const dodoResult = await triggerFiatConversion({
      amountUsdc,
      targetCurrency,
      targetIban,
      reference: onchainResult.signature ?? '',
      idempotencyKey: generateIdempotencyKey(onchainResult.signature ?? 'fallback'),
    });

    if (dodoResult.success && dodoResult.data) {
      console.log(
        `  ✅ Dodo conversion: ${dodoResult.data.id} ` +
        `(${amountUsdc} USDC → ${dodoResult.data.targetAmount?.toFixed(2)} ${targetCurrency})`
      );
    } else {
      console.error('  ❌ Dodo API failed:', dodoResult.error);
    }

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