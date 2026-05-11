import { config } from '../config';

export interface PriceData {
  price: number;
  confidence: number;
  status: string;
  publishTime: number;
  isStale: boolean;
}

// Pyth Hermes HTTP API — more reliable than on-chain client
const PYTH_HERMES_URL = 'https://hermes.pyth.network';

// USDC/USD price feed ID
const USDC_USD_FEED_ID = '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a';

const PRICE_STALENESS_THRESHOLD_MS = 30_000; // 30 seconds

let _lastPrice: PriceData | null = null;

// Rate change callbacks registered by oracle-watcher
const rateCallbacks: Array<(price: PriceData) => void> = [];

export async function getUsdcUsdPrice(): Promise<PriceData | null> {
  try {
    const res = await fetch(
      `${PYTH_HERMES_URL}/v2/updates/price/latest?ids[]=${USDC_USD_FEED_ID}`
    );

    if (!res.ok) {
      console.error('❌ Pyth Hermes error:', res.status, res.statusText);
      return null;
    }

    const json = await res.json() as any;
    const feed = json?.parsed?.[0];
    if (!feed) {
      console.warn('⚠️  Pyth returned empty feed');
      return null;
    }

    const price = parseFloat(feed.price.price) * Math.pow(10, feed.price.expo);
    const confidence = parseFloat(feed.price.conf) * Math.pow(10, feed.price.expo);
    const publishTime = feed.price.publish_time * 1000;
    const isStale = Date.now() - publishTime > PRICE_STALENESS_THRESHOLD_MS;

    const priceData: PriceData = {
      price,
      confidence,
      status: 'Trading',
      publishTime,
      isStale,
    };

    _lastPrice = priceData;
    rateCallbacks.forEach((cb) => cb(priceData));
    return priceData;

  } catch (err) {
    console.error('❌ Pyth price fetch failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

export function getLastKnownPrice(): PriceData | null {
  return _lastPrice;
}

export function isRateAboveTrigger(price: PriceData): boolean {
  if (price.isStale) {
    console.warn('⚠️  Pyth price is stale — skipping rate trigger check');
    return false;
  }
  return price.price >= config.pyth.rateTrigger;
}

export function onRateUpdate(callback: (price: PriceData) => void): () => void {
  rateCallbacks.push(callback);
  return () => {
    const idx = rateCallbacks.indexOf(callback);
    if (idx !== -1) rateCallbacks.splice(idx, 1);
  };
}

// Poll Pyth every N seconds
let pollTimer: NodeJS.Timeout | null = null;

export function startPythPoller(intervalMs = 10_000): void {
  if (pollTimer) return;
  console.log(`📡 Starting Pyth price poller (every ${intervalMs / 1000}s)...`);

  const poll = async () => {
    const price = await getUsdcUsdPrice();
    if (price) {
      const staleTag = price.isStale ? ' (stale)' : '';
      if (config.isDev) {
        console.log(`💱 USDC/USD: ${price.price.toFixed(6)}${staleTag}`);
      }
    } else {
      console.warn('⚠️  Pyth returned null price');
    }
    pollTimer = setTimeout(poll, intervalMs);
  };

  poll();
}

export function stopPythPoller(): void {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
}