import { Router, Request, Response } from 'express';
import { getProgram, PDAs } from '../services/anchor';
import { toErrorMessage } from '../utils';

export const settingsRouter = Router();

// GET /api/settings/:companyId
// Returns all configurable settings for a company
settingsRouter.get('/:companyId', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const program = getProgram();

    const [treasuryPda] = PDAs.treasury(companyId);
    const [oracleConfigPda] = PDAs.oracleConfig(treasuryPda);

    // Fetch treasury config
    const treasury = await (program.account as any).treasuryConfig.fetch(treasuryPda);

    // Fetch oracle config (may not exist yet)
    let oracle = null;
    try {
      oracle = await (program.account as any).oracleConfig.fetch(oracleConfigPda);
    } catch {
      // Oracle not initialized yet
    }

    // Fetch all departments for yield thresholds
    const departments = await (program.account as any).departmentAccount.all([
      {
        memcmp: {
          offset: 8,
          bytes: treasuryPda.toBase58(),
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        companyId,
        treasury: {
          pubkey: treasuryPda.toBase58(),
          isPaused: treasury.isPaused,
          multisigThreshold: treasury.multisigThreshold,
          members: treasury.members?.map((m: any) => m.toBase58()) ?? [],
          memberCount: treasury.members?.length ?? 0,
          baseMint: treasury.baseMint?.toBase58(),
          admin: treasury.admin?.toBase58(),
        },
        oracle: oracle ? {
          pubkey: oracleConfigPda.toBase58(),
          rateTriggerMicros: oracle.rateTriggerMicros?.toString(),
          rateTrigger: Number(oracle.rateTriggerMicros) / 1_000_000,
          lastObservedRate: Number(oracle.lastObservedRateMicros) / 1_000_000,
          totalTriggers: oracle.totalTriggers?.toString(),
          lastTriggerAt: oracle.lastTriggerAt?.toString(),
        } : null,
        yield: {
          departments: departments.map((d: any) => ({
            pubkey: d.publicKey.toBase58(),
            deptId: d.account.deptId,
            name: d.account.name,
            idleThreshold: d.account.idleThreshold?.toString(),
            idleThresholdUsdc: Number(d.account.idleThreshold) / 1_000_000,
            isActive: d.account.isActive,
          })),
        },
      },
    });

  } catch (err) {
    console.error('Settings fetch error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});

// PATCH /api/settings/:companyId/threshold
// Update yield idle threshold for a department
settingsRouter.patch('/:companyId/threshold', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { deptId, idleThresholdUsdc } = req.body as {
      deptId: string;
      idleThresholdUsdc: number;
    };

    if (!deptId || idleThresholdUsdc == null) {
      res.status(400).json({ error: 'Missing required fields: deptId, idleThresholdUsdc' });
      return;
    }

    if (idleThresholdUsdc <= 0) {
      res.status(400).json({ error: 'idleThresholdUsdc must be greater than 0' });
      return;
    }

    // For now return the new value — onchain update requires admin signature from frontend
    // Frontend should build and sign this tx client-side
    res.json({
      success: true,
      data: {
        companyId,
        deptId,
        idleThresholdUsdc,
        note: 'Threshold update must be signed by treasury admin via frontend wallet',
      },
    });

  } catch (err) {
    console.error('Settings update error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});

// PATCH /api/settings/:companyId/oracle
// Update oracle rate trigger
settingsRouter.patch('/:companyId/oracle', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { rateTrigger } = req.body as { rateTrigger: number };

    if (rateTrigger == null || rateTrigger <= 0) {
      res.status(400).json({ error: 'rateTrigger must be greater than 0' });
      return;
    }

    res.json({
      success: true,
      data: {
        companyId,
        rateTrigger,
        rateTriggerMicros: Math.floor(rateTrigger * 1_000_000),
        note: 'Oracle update must be signed by treasury admin via frontend wallet',
      },
    });

  } catch (err) {
    console.error('Oracle settings update error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});

// GET /api/settings/:companyId/spending-rules
// Returns all spending rules for all departments
settingsRouter.get('/:companyId/spending-rules', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const program = getProgram();
    const [treasuryPda] = PDAs.treasury(companyId);

    const departments = await (program.account as any).departmentAccount.all([
      {
        memcmp: {
          offset: 8,
          bytes: treasuryPda.toBase58(),
        },
      },
    ]);

    const rules = await Promise.all(
      departments.map(async (d: any) => {
        try {
          const [rulePda] = PDAs.department(treasuryPda, d.account.deptId);
          const rule = await (program.account as any).spendingRule.all([
            {
              memcmp: {
                offset: 8,
                bytes: rulePda.toBase58(),
              },
            },
          ]);
          return {
            deptId: d.account.deptId,
            deptName: d.account.name,
            rules: rule.map((r: any) => ({
              pubkey: r.publicKey.toBase58(),
              maxSinglePayout: r.account.maxSinglePayout?.toString(),
              maxSinglePayoutUsdc: Number(r.account.maxSinglePayout) / 1_000_000,
              dailyLimit: r.account.dailyLimit?.toString(),
              dailyLimitUsdc: Number(r.account.dailyLimit) / 1_000_000,
              windowStart: r.account.windowStart,
              windowEnd: r.account.windowEnd,
              allowlistEnabled: r.account.allowlistEnabled,
            })),
          };
        } catch {
          return { deptId: d.account.deptId, deptName: d.account.name, rules: [] };
        }
      })
    );

    res.json({ success: true, data: rules });

  } catch (err) {
    console.error('Spending rules fetch error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});