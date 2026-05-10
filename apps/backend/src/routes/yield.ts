import { Router, Request, Response } from 'express';
import { getProgram, PDAs } from '../services/anchor';
import { getAccountBalance } from '../services/sol_rpc';
import { getLastKnownPrice } from '../services/pyth';
import { toErrorMessage } from '../utils';

export const yieldRouter = Router();

// Kamino devnet USDC lending APY (static until mainnet)
const KAMINO_DEVNET_APY = 0.0485; // 4.85% — approximate mainnet USDC lending rate

// GET /api/yield/:companyId
// Returns yield positions for all departments
yieldRouter.get('/:companyId', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const program = getProgram();
    const [treasuryPda] = PDAs.treasury(companyId);

    const yieldPositions = await (program.account as any).yieldPosition.all();

    const price = getLastKnownPrice();
    const usdcPrice = price?.price ?? 1.0;

    const positions = await Promise.all(
      yieldPositions.map(async (pos: any) => {
        const account = pos.account;

        // Fetch current vault balance
        let currentBalance = 0;
        try {
          currentBalance = await getAccountBalance(account.deptVaultAta);
        } catch {
          // vault ATA not set up yet
        }

        const totalDeposited = Number(account.totalDeposited) / 1_000_000;
        const idleThreshold = Number(account.idleThreshold) / 1_000_000;
        const lastDepositAt = account.lastDepositAt
          ? new Date(Number(account.lastDepositAt) * 1000).toISOString()
          : null;

        // Estimated yield earned (simple APY calculation)
        const daysDeposited = lastDepositAt
          ? (Date.now() - new Date(lastDepositAt).getTime()) / (1000 * 60 * 60 * 24)
          : 0;
        const estimatedYield = totalDeposited * KAMINO_DEVNET_APY * (daysDeposited / 365);

        return {
          pubkey: pos.publicKey.toBase58(),
          deptPda: account.deptPda?.toBase58(),
          companyId: account.companyId,
          isActive: account.isActive,
          currentBalance,
          totalDeposited,
          idleThreshold,
          estimatedYieldUsdc: parseFloat(estimatedYield.toFixed(6)),
          estimatedApy: KAMINO_DEVNET_APY,
          lastDepositAt,
          usdcPrice,
          kaminoStatus: 'devnet_simulated', // changes to 'live' on mainnet
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
          estimatedApy: KAMINO_DEVNET_APY,
          usdcPrice,
          kaminoStatus: 'devnet_simulated',
        },
        positions,
      },
    });

  } catch (err) {
    console.error('Yield fetch error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});

// GET /api/yield/:companyId/:deptId
// Returns yield position for a single department
yieldRouter.get('/:companyId/:deptId', async (req: Request, res: Response) => {
  try {
    const { companyId, deptId } = req.params;
    const program = getProgram();
    const [treasuryPda] = PDAs.treasury(companyId);
    const [deptPda] = PDAs.department(treasuryPda, deptId);
    const [yieldPositionPda] = PDAs.yieldPosition(deptPda);

    const account = await (program.account as any).yieldPosition.fetch(yieldPositionPda);

    let currentBalance = 0;
    try {
      currentBalance = await getAccountBalance(account.deptVaultAta);
    } catch {
      // vault ATA not set up yet
    }

    const totalDeposited = Number(account.totalDeposited) / 1_000_000;
    const idleThreshold = Number(account.idleThreshold) / 1_000_000;
    const lastDepositAt = account.lastDepositAt
      ? new Date(Number(account.lastDepositAt) * 1000).toISOString()
      : null;

    const daysDeposited = lastDepositAt
      ? (Date.now() - new Date(lastDepositAt).getTime()) / (1000 * 60 * 60 * 24)
      : 0;
    const estimatedYield = totalDeposited * KAMINO_DEVNET_APY * (daysDeposited / 365);

    const price = getLastKnownPrice();

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
        estimatedYieldUsdc: parseFloat(estimatedYield.toFixed(6)),
        estimatedApy: KAMINO_DEVNET_APY,
        lastDepositAt,
        usdcPrice: price?.price ?? 1.0,
        kaminoStatus: 'devnet_simulated',
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