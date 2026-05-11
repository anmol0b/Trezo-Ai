import { Router, Request, Response } from 'express';
import { getProgram, PDAs } from '../services/anchor';
import { toErrorMessage } from '../utils';

export const treasuryRouter = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseBN(value: any): number {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseInt(value, 16) || parseInt(value, 10) || 0;
  if (typeof value === 'bigint') return Number(value);
  if (value?.toNumber) return value.toNumber();
  if (value?.toString) return parseInt(value.toString(), 16) || parseInt(value.toString(), 10) || 0;
  return 0;
}

function parseTimestamp(value: any): string | null {
  const n = parseBN(value);
  if (!n || n === 0) return null;
  return new Date(n * 1000).toISOString();
}

function parseTreasury(treasury: any, pubkey: string) {
  return {
    pubkey,
    companyId: treasury.companyId,
    admin: treasury.admin?.toBase58?.() ?? treasury.admin,
    agentPubkey: treasury.agentPubkey?.toBase58?.() ?? treasury.agentPubkey,
    baseMint: treasury.baseMint?.toBase58?.() ?? treasury.baseMint,
    departmentCount: parseBN(treasury.departmentCount),
    proposalCount: parseBN(treasury.proposalCount),
    createdAt: parseTimestamp(treasury.createdAt),
    isPaused: treasury.isPaused,
    multisigThreshold: treasury.multisigThreshold,
    members: treasury.members?.map((m: any) => m.toBase58?.() ?? m) ?? [],
    bump: treasury.bump,
  };
}

function parseDepartment(dept: any, pubkey: string) {
  return {
    pubkey,
    treasuryConfig: dept.treasuryConfig?.toBase58?.() ?? dept.treasuryConfig,
    deptId: dept.deptId,
    name: dept.name,
    deptVaultAta: dept.deptVaultAta?.toBase58?.() ?? dept.deptVaultAta,
    idleThreshold: parseBN(dept.idleThreshold),
    idleThresholdUsdc: parseBN(dept.idleThreshold) / 1_000_000,
    isActive: dept.isActive,
    createdAt: parseTimestamp(dept.createdAt),
    bump: dept.bump,
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/treasury/:companyId
treasuryRouter.get('/:companyId', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      res.status(400).json({ error: 'companyId is required' });
      return;
    }

    const program = getProgram();
    const [treasuryPda] = PDAs.treasury(companyId);
    const treasury = await (program.account as any).treasuryConfig.fetch(treasuryPda);

    res.json({
      success: true,
      data: parseTreasury(treasury, treasuryPda.toBase58()),
    });

  } catch (err) {
    console.error('Treasury fetch error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});

// GET /api/treasury/:companyId/departments
treasuryRouter.get('/:companyId/departments', async (req: Request, res: Response) => {
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

    res.json({
      success: true,
      data: departments.map((d: any) =>
        parseDepartment(d.account, d.publicKey.toBase58())
      ),
    });

  } catch (err) {
    console.error('Departments fetch error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});