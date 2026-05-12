import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

// amount helpers

const USDC_DECIMALS = 6;
const USDC_MULTIPLIER = Math.pow(10, USDC_DECIMALS);

export function usdcToLamports(usdc: number): BN {
  return new BN(Math.round(usdc * USDC_MULTIPLIER));
}

export function lamportsToUsdc(lamports: BN | number): number {
  const raw = typeof lamports === 'number' ? lamports : lamports.toNumber();
  return raw / USDC_MULTIPLIER;
}

export function formatUsdc(lamports: BN | number): string {
  return lamportsToUsdc(lamports).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// pubkey helpers

export function shortenPubkey(pubkey: string | PublicKey, chars = 4): string {
  const str = pubkey.toString();
  return `${str.slice(0, chars)}...${str.slice(-chars)}`;
}

export function isValidPubkey(str: string): boolean {
  try {
    new PublicKey(str);
    return true;
  } catch {
    return false;
  }
}

export function toPubkey(str: string): PublicKey {
  if (!isValidPubkey(str)) {
    throw new Error(`Invalid public key: ${str}`);
  }
  return new PublicKey(str);
}

// date helpers

export function unixToDate(unixTs: number): Date {
  return new Date(unixTs * 1000);
}

export function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
}

export function isExpired(unixTs: number): boolean {
  return nowUnix() > unixTs;
}

// retry helper 

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error = new Error('Unknown error');
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (i < retries - 1) {
        await sleep(delayMs * Math.pow(2, i)); // Exponential backoff
      }
    }
  }
  throw lastError;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// category helpers

export const INVOICE_CATEGORIES = [
  'software',
  'infrastructure',
  'marketing',
  'legal',
  'hr',
  'operations',
  'travel',
  'other',
] as const;

export type InvoiceCategory = (typeof INVOICE_CATEGORIES)[number];

export function isValidCategory(str: string): str is InvoiceCategory {
  return INVOICE_CATEGORIES.includes(str as InvoiceCategory);
}

// error helpers

export function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Unknown error';
}
