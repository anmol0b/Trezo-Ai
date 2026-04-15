import { Connection, PublicKey } from '@solana/web3.js';
import { PythHttpClient, getPythClusterApiUrl, getPythProgramKeyForCluster } from '@pythnetwork/client';
import { config } from '../config';
import { getConnection } from './anchor';

export interface PriceData {
  price: number;
  confidence: number;
  status: string;
  publishTime: number;
  isStale: boolean;
}

// Devnet USDC/USD Pyth price account
const USDC_USD_DEVNET = new PublicKey('5SSkXsEKQepHHAewytPVwdej4epN1nxgLVM84L4KXgy7');

const PRICE_STALENESS_THRESHOLD_MS = 30_000; // 30 seconds

let _pythClient: PythHttpClient | null = null;
let _lastPrice: PriceData | null = null;

// Rate change callbacks registered by oracle-watcher job
const rateCallbacks: Array<(price: PriceData) => void> = [];

export function getPythClient(): PythHttpClient {
  if (!_pythClient) {
    const connection = getConnection();
    const pythPublicKey = getPythProgramKeyForCluster('devnet');
    _pythClient = new PythHttpClient(connection, pythPublicKey);
  }
  return _pythClient;
}

export async function getUsdcUsdPrice(): Promise<PriceData | null> {
  try {
    const client = getPythClient();
    const data = await client.getAssetPricesFromAccounts([USDC_USD_DEVNET]);

    if (!data || data.length === 0) return null;

    const feed = data[0];
    if (feed?.price == null || feed?.confidence == null) return null;

    const publishTime = Date.now();
    const isStale = false;

    const priceData: PriceData = {
      price: feed.price,
      confidence: feed.confidence,
      status: feed.status?.toString() ?? 'unknown',
      publishTime,
      isStale,
    };

    _lastPrice = priceData;

    // Notify all registered callbacks
    rateCallbacks.forEach((cb) => cb(priceData));

    return priceData;
  } catch (err) {
    console.error('❌ Pyth price fetch failed:', err);
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
  if (price.status !== 'Trading') {
    console.warn(`⚠️  Pyth price status is "${price.status}" — skipping`);
    return false;
  }
  return price.price >= config.pyth.rateTrigger;
}

export function onRateUpdate(callback: (price: PriceData) => void): () => void {
  rateCallbacks.push(callback);
  // Return unsubscribe function
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
      const status = price.isStale ? '(stale)' : '';
      if (config.isDev) {
        console.log(`💱 USDC/USD: ${price.price.toFixed(6)} ${status}`);
      }
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