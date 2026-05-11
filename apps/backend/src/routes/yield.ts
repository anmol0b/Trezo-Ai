import { Router, Request, Response } from 'express';
import { getProgram, PDAs } from '../services/anchor';
import { getAccountBalance } from '../services/sol_rpc';
import { getLastKnownPrice } from '../services/pyth';
import { getKaminoMarketStats, getKaminoVaultStats } from '../services/kamino';
import { toErrorMessage } from '../utils';

export const yieldRouter = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcEstimatedYield(totalDeposited: number, apy: number, lastDepositAt: string | null): number {
  if (!lastDepositAt || totalDeposited === 0) return 0;
  const daysDeposited = (Date.now() - new Date(lastDepositAt).getTime()) / (1000 * 60 * 60 * 24);
  return totalDeposited * apy * (daysDeposited / 365);
}

function formatPosition(pos: any, apy: number, currentBalance: number, kaminoSource: string) {
  const account = pos.account ?? pos;
  const totalDeposited = Number(account.totalDeposited) / 1_000_000;
  const idleThreshold = Number(account.idleThreshold) / 1_000_000;
  const lastDepositAt = account.lastDepositAt && Number(account.lastDepositAt) > 0
    ? new Date(Number(account.lastDepositAt) * 1000).toISOString()
    : null;

  return {
    pubkey: pos.publicKey?.toBase58() ?? null,
    deptPda: account.deptPda?.toBase58(),
    companyId: account.companyId,
    isActive: account.isActive,
    currentBalance,
    totalDeposited,
    idleThreshold,
    estimatedYieldUsdc: parseFloat(calcEstimatedYield(totalDeposited, apy, lastDepositAt).toFixed(6)),
    estimatedApy: apy,
    estimatedApyPercent: `${(apy * 100).toFixed(2)}%`,
    lastDepositAt,
    kaminoStatus: kaminoSource === 'kamino_api' ? 'live_apy' : 'devnet_simulated',
  };
}

// ─── GET /api/yield/kamino/stats ──────────────────────────────────────────────
// Returns live Kamino market + vault data
// Must be defined BEFORE /:companyId to avoid route conflict
yieldRouter.get('/kamino/stats', async (_req: Request, res: Response) => {
  try {
    const [market, vault] = await Promise.all([
      getKaminoMarketStats(),
      getKaminoVaultStats(),
    ]);

    res.json({
      success: true,
      data: {
        market: {
          usdcSupplyApy: market.usdcSupplyApy,
          usdcSupplyApyPercent: `${(market.usdcSupplyApy * 100).toFixed(2)}%`,
          usdcBorrowApy: market.usdcBorrowApy,
          usdcBorrowApyPercent: `${(market.usdcBorrowApy * 100).toFixed(2)}%`,
          totalDeposits: market.totalDeposits,
          availableLiquidity: market.availableLiquidity,
          utilizationRate: market.utilizationRate,
          utilizationPercent: `${(market.utilizationRate * 100).toFixed(2)}%`,
          source: market.source,
        },
        vault: {
          address: vault.vaultAddress,
          apy: vault.apy,
          apyPercent: `${(vault.apy * 100).toFixed(2)}%`,
          exchangeRate: vault.exchangeRate,
          source: vault.source,
        },
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Kamino stats error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});

// ─── GET /api/yield/:companyId ────────────────────────────────────────────────
// Returns yield positions for all departments with live Kamino APY
yieldRouter.get('/:companyId', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const program = getProgram();

    // Fetch in parallel
    const [yieldPositions, kaminoStats, price] = await Promise.all([
      (program.account as any).yieldPosition.all(),
      getKaminoMarketStats(),
      Promise.resolve(getLastKnownPrice()),
    ]);

    const liveApy = kaminoStats.usdcSupplyApy;
    const usdcPrice = price?.price ?? 1.0;

    const positions = await Promise.all(
      yieldPositions.map(async (pos: any) => {
        let currentBalance = 0;
        try {
          currentBalance = await getAccountBalance(pos.account.deptVaultAta);
        } catch {
          // vault ATA not set up yet
        }
        return {
          ...formatPosition(pos, liveApy, currentBalance, kaminoStats.source),
          usdcPrice,
        };
      })
    );

    const totalDeposited = positions.reduce((s, p) => s + p.totalDeposited, 0);
    const totalBalance = positions.reduce((s, p) => s + p.currentBalance, 0);
    const totalEstimatedYield = positions.reduce((s, p) => s + p.estimatedYieldUsdc, 0);

    res.json({
      success: true,
      data: {
        companyId,
        summary: {
          totalDeposited,
          totalCurrentBalance: totalBalance,
          totalEstimatedYield: parseFloat(totalEstimatedYield.toFixed(6)),
          estimatedApy: liveApy,
          estimatedApyPercent: `${(liveApy * 100).toFixed(2)}%`,
          usdcPrice,
          kamino: {
            supplyApy: kaminoStats.usdcSupplyApy,
            borrowApy: kaminoStats.usdcBorrowApy,
            utilizationRate: kaminoStats.utilizationRate,
            source: kaminoStats.source,
          },
          kaminoStatus: kaminoStats.source === 'kamino_api' ? 'live_apy' : 'devnet_simulated',
        },
        positions,
      },
    });

  } catch (err) {
    console.error('Yield fetch error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});

// ─── GET /api/yield/:companyId/:deptId ────────────────────────────────────────
// Returns yield position for a single department
yieldRouter.get('/:companyId/:deptId', async (req: Request, res: Response) => {
  try {
    const { companyId, deptId } = req.params;
    const program = getProgram();
    const [treasuryPda] = PDAs.treasury(companyId);
    const [deptPda] = PDAs.department(treasuryPda, deptId);
    const [yieldPositionPda] = PDAs.yieldPosition(deptPda);

    const [account, kaminoStats, price] = await Promise.all([
      (program.account as any).yieldPosition.fetch(yieldPositionPda),
      getKaminoMarketStats(),
      Promise.resolve(getLastKnownPrice()),
    ]);

    const liveApy = kaminoStats.usdcSupplyApy;

    let currentBalance = 0;
    try {
      currentBalance = await getAccountBalance(account.deptVaultAta);
    } catch {
      // vault ATA not set up yet
    }

    const totalDeposited = Number(account.totalDeposited) / 1_000_000;
    const idleThreshold = Number(account.idleThreshold) / 1_000_000;
    const lastDepositAt = account.lastDepositAt && Number(account.lastDepositAt) > 0
      ? new Date(Number(account.lastDepositAt) * 1000).toISOString()
      : null;

    res.json({
      success: true,
      data: {
        pubkey: yieldPositionPda.toBase58(),
        deptId,
        companyId,
        isActive: account.isActive,
        currentBalance,
        totalDeposited,
        idleThreshold,
        estimatedYieldUsdc: parseFloat(
          calcEstimatedYield(totalDeposited, liveApy, lastDepositAt).toFixed(6)
        ),
        estimatedApy: liveApy,
        estimatedApyPercent: `${(liveApy * 100).toFixed(2)}%`,
        lastDepositAt,
        usdcPrice: price?.price ?? 1.0,
        kamino: {
          supplyApy: kaminoStats.usdcSupplyApy,
          source: kaminoStats.source,
        },
        kaminoStatus: kaminoStats.source === 'kamino_api' ? 'live_apy' : 'devnet_simulated',
      },
    });

  } catch (err: any) {
    if (err?.message?.includes('Account does not exist')) {
      res.status(404).json({ error: `Yield position not found for dept: ${req.params.deptId}` });
      return;
    }
    console.error('Yield dept fetch error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});