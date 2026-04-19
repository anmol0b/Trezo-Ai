import { PublicKey } from '@solana/web3.js';
import { config } from '../config';
import { getProgram } from '../services/anchor';
import { getAccountBalance } from '../services/sol_rpc';
import { submitTriggerYieldDeposit } from '../agent/solana-client';
import { lamportsToUsdc } from '../utils';

let pollTimer: NodeJS.Timeout | null = null;
let isRunning = false;

async function pollYieldOpportunities(): Promise<void> {
  if (isRunning) {
    console.log('⏭️  Yield poll already running — skipping');
    return;
  }

  isRunning = true;
  console.log('🌾 Running yield poll...');

  try {
    const program = getProgram();
    const yieldPositions = await program.account['yieldPosition'].all();

    for (const { account } of yieldPositions) {
      const yieldAccount = account as any;

      if (!yieldAccount.isActive) continue;

      const deptVaultAta = yieldAccount.deptVaultAta as PublicKey;
      const thresholdLamports = yieldAccount.idleThreshold as bigint;
      const thresholdUsdc = lamportsToUsdc(Number(thresholdLamports));
      const companyId = yieldAccount.companyId as string;
      const deptPda = yieldAccount.deptPda as PublicKey;

      let idleBalance = 0;
      try {
        idleBalance = await getAccountBalance(deptVaultAta);
      } catch {
        console.warn(
          `⚠️  Could not fetch balance for vault ${deptVaultAta.toBase58().slice(0, 8)}...`
        );
        continue;
      }

      console.log(
        `  Dept ${deptPda.toBase58().slice(0, 8)}...: ` +
        `idle=${idleBalance.toFixed(2)} USDC, ` +
        `threshold=${thresholdUsdc.toFixed(2)} USDC`
      );

      if (idleBalance < thresholdUsdc) continue;
      if (idleBalance < config.jobs.yieldIdleThresholdUsdc) continue;

      console.log(`  → Triggering yield deposit for ${deptPda.toBase58().slice(0, 8)}...`);

      const result = await submitTriggerYieldDeposit(
        deptPda.toBase58(),
        companyId
      );

      if (result.success) {
        console.log(`  ✅ Yield deposit tx: ${result.signature?.slice(0, 8)}...`);
      } else {
        console.error(`  ❌ Yield deposit failed: ${result.error}`);
      }
    }
  } catch (err) {
    console.error('❌ Yield poll error:', err instanceof Error ? err.message : err);
  } finally {
    isRunning = false;
  }
}

export function startYieldPoller(): void {
  if (pollTimer) return;

  const intervalMs = config.jobs.yieldPollIntervalMs;
  console.log(`🌱 Starting yield poller (every ${intervalMs / 60_000} minutes)...`);

  pollYieldOpportunities();

  const schedule = () => {
    pollTimer = setTimeout(async () => {
      await pollYieldOpportunities();
      schedule();
    }, intervalMs);
  };

  schedule();
}

export function stopYieldPoller(): void {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
    console.log('🛑 Yield poller stopped');
  }
}