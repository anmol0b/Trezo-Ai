import { describe, it, expect } from 'vitest';
import {
  usdcToLamports,
  lamportsToUsdc,
  formatUsdc,
  shortenPubkey,
  isValidPubkey,
  toPubkey,
  nowUnix,
  isExpired,
  isValidCategory,
  toErrorMessage,
  withRetry,
  sleep,
  INVOICE_CATEGORIES,
} from '../../src/utils';

describe('amount helpers', () => {
  it('converts USDC to lamports correctly', () => {
    expect(usdcToLamports(1).toString()).toBe('1000000');
    expect(usdcToLamports(25).toString()).toBe('25000000');
    expect(usdcToLamports(0.5).toString()).toBe('500000');
    expect(usdcToLamports(100).toString()).toBe('100000000');
  });

  it('converts lamports to USDC correctly', () => {
    expect(lamportsToUsdc(1000000)).toBe(1);
    expect(lamportsToUsdc(25000000)).toBe(25);
    expect(lamportsToUsdc(500000)).toBe(0.5);
  });

  it('round-trips USDC → lamports → USDC', () => {
    const amounts = [1, 5, 25, 100, 999.99, 10000];
    for (const amount of amounts) {
      const lamports = usdcToLamports(amount);
      expect(lamportsToUsdc(lamports)).toBeCloseTo(amount, 2);
    }
  });

  it('formats USDC with commas and 2 decimal places', () => {
    expect(formatUsdc(1000000)).toBe('1.00');
    expect(formatUsdc(1000000000)).toBe('1,000.00');
    expect(formatUsdc(25000000)).toBe('25.00');
  });
});

describe('pubkey helpers', () => {
  const VALID_PUBKEY = '11111111111111111111111111111111';
  const INVALID_PUBKEY = 'not-a-pubkey';

  it('accepts valid pubkeys', () => {
    expect(isValidPubkey(VALID_PUBKEY)).toBe(true);
  });

  it('rejects invalid pubkeys', () => {
    expect(isValidPubkey(INVALID_PUBKEY)).toBe(false);
    expect(isValidPubkey('')).toBe(false);
    expect(isValidPubkey('short')).toBe(false);
  });

  it('shortens pubkey with default 4 chars', () => {
    const short = shortenPubkey(VALID_PUBKEY);
    expect(short).toBe('1111...1111');
    expect(short.length).toBe(11);
  });

  it('shortens pubkey with custom chars', () => {
    const short = shortenPubkey(VALID_PUBKEY, 6);
    expect(short).toBe('111111...111111');
  });

  it('converts valid string to PublicKey', () => {
    const pk = toPubkey(VALID_PUBKEY);
    expect(pk.toBase58()).toBe(VALID_PUBKEY);
  });

  it('throws on invalid pubkey string', () => {
    expect(() => toPubkey(INVALID_PUBKEY)).toThrow('Invalid public key');
  });
});

describe('date helpers', () => {
  it('nowUnix returns current unix timestamp', () => {
    const now = nowUnix();
    expect(now).toBeGreaterThan(1700000000);
    expect(now).toBeLessThan(2000000000);
  });

  it('isExpired returns false for future timestamps', () => {
    expect(isExpired(nowUnix() + 3600)).toBe(false);
  });

  it('isExpired returns true for past timestamps', () => {
    expect(isExpired(nowUnix() - 3600)).toBe(true);
  });
});

describe('category helpers', () => {
  it('accepts valid categories', () => {
    for (const cat of INVOICE_CATEGORIES) {
      expect(isValidCategory(cat)).toBe(true);
    }
  });

  it('rejects invalid categories', () => {
    expect(isValidCategory('rent')).toBe(false);
    expect(isValidCategory('')).toBe(false);
    expect(isValidCategory('SOFTWARE')).toBe(false);
  });
});

describe('error helpers', () => {
  it('extracts message from Error', () => {
    expect(toErrorMessage(new Error('test error'))).toBe('test error');
  });

  it('returns string as-is', () => {
    expect(toErrorMessage('raw error')).toBe('raw error');
  });

  it('returns fallback for unknown', () => {
    expect(toErrorMessage(null)).toBe('Unknown error');
    expect(toErrorMessage(undefined)).toBe('Unknown error');
    expect(toErrorMessage(42)).toBe('Unknown error');
  });
});

describe('retry helper', () => {
  it('resolves on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry(fn, 3, 0);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');

    const result = await withRetry(fn, 3, 0);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws after max retries exceeded', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));
    await expect(withRetry(fn, 3, 0)).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('sleep resolves after delay', async () => {
    const start = Date.now();
    await sleep(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(45);
  });
});
