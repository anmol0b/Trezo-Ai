import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import WebSocket from 'ws';
import { config } from '../config';
import { getConnection } from './anchor';

export interface StealthPaymentEvent {
  signature: string;
  timestamp: number;
  ephemeralPubkey: string;
  encryptedNote: string;
  amount: number;
  slot: number;
}

// In memory cache
const stealthEventCache: StealthPaymentEvent[] = [];
let wsConnection: WebSocket | null = null;
let wsReconnectTimer: NodeJS.Timeout | null = null;

// RPC helpers

export async function getAccountBalance(pubkey: PublicKey): Promise<number> {
  const connection = getConnection();
  const balance = await connection.getTokenAccountBalance(pubkey);
  return parseFloat(balance.value.uiAmountString ?? '0');
}

export async function getMultipleAccountBalances(
  pubkeys: PublicKey[]
): Promise<Map<string, number>> {
  const connection = getConnection();
  const results = new Map<string, number>();

  // Batch in groups of 100 (Helius limit)
  const chunks = chunkArray(pubkeys, 100);
  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async (pk) => {
        try {
          const balance = await connection.getTokenAccountBalance(pk);
          results.set(pk.toBase58(), parseFloat(balance.value.uiAmountString ?? '0'));
        } catch {
          results.set(pk.toBase58(), 0);
        }
      })
    );
  }
  return results;
}

export async function getRecentTransactions(
  programId: PublicKey,
  limit = 20
): Promise<ParsedTransactionWithMeta[]> {
  const connection = getConnection();
  const signatures = await connection.getSignaturesForAddress(programId, { limit });

  const txs = await connection.getParsedTransactions(
    signatures.map((s) => s.signature),
    { commitment: 'confirmed', maxSupportedTransactionVersion: 0 }
  );

  return txs.filter((tx): tx is ParsedTransactionWithMeta => tx !== null);
}

// Stealth event indexer

export function getCachedStealthEvents(): StealthPaymentEvent[] {
  return [...stealthEventCache];
}

function parseStealthPaymentFromLog(
  log: string,
  signature: string,
  slot: number,
  timestamp: number
): StealthPaymentEvent | null {
  if (!log.startsWith('Program log: StealthPayment:')) return null;

  const parts = log.replace('Program log: StealthPayment:', '').split(':');
  if (parts.length < 3) return null;

  const [ephemeralPubkey, encryptedNote, amountStr] = parts;
  return {
    signature,
    timestamp,
    ephemeralPubkey: ephemeralPubkey ?? '',
    encryptedNote: encryptedNote ?? '',
    amount: parseFloat(amountStr ?? '0'),
    slot,
  };
}

// WebSocket subscription

export function startStealthEventIndexer(programId: PublicKey): void {
  if (wsConnection?.readyState === WebSocket.OPEN) return;

  const wsUrl = config.helius.wsUrl;

  const connect = () => {
    console.log('🔌 Connecting to Helius WebSocket...');
    wsConnection = new WebSocket(wsUrl);

    wsConnection.on('open', () => {
      console.log('✅ Helius WebSocket connected');

      // Subscribe to program logs
      const subscribeMsg = {
        jsonrpc: '2.0',
        id: 1,
        method: 'logsSubscribe',
        params: [
          { mentions: [programId.toBase58()] },
          { commitment: 'confirmed' },
        ],
      };
      wsConnection?.send(JSON.stringify(subscribeMsg));
    });

    wsConnection.on('message', (data: WebSocket.Data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.method !== 'logsNotification') return;

        const { logs, signature, slot } =
          msg.params?.result?.value ?? {};
        if (!logs || !signature) return;

        const timestamp = Date.now();
        for (const log of logs) {
          const event = parseStealthPaymentFromLog(log, signature, slot, timestamp);
          if (event) {
            stealthEventCache.push(event);
            console.log(`📩 Stealth payment indexed: ${signature.slice(0, 8)}...`);
          }
        }
      } catch (err) {
            console.warn('⚠️ Failed to parse Helius WS message:', err);
        }
    });

    wsConnection.on('error', (err) => {
      console.error('❌ Helius WebSocket error:', err.message);
    });

    wsConnection.on('close', () => {
      console.warn('⚠️  Helius WebSocket closed — reconnecting in 5s...');
      wsReconnectTimer = setTimeout(connect, 5000);
    });
  };

  connect();
}

export function stopStealthEventIndexer(): void {
  if (wsReconnectTimer) clearTimeout(wsReconnectTimer);
  wsConnection?.close();
  wsConnection = null;
}

// utility

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}