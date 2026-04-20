import { Router, Request, Response } from 'express';
import { getProgram, PDAs } from '../services/anchor';
import { toErrorMessage, isValidPubkey } from '../utils';

export const treasuryRouter = Router();

// GET /api/treasury/:companyId
// Returns enriched treasury snapshot
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
      data: {
        pubkey: treasuryPda.toBase58(),
        ...treasury,
      },
    });

  } catch (err) {
    console.error('Treasury fetch error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});

// GET /api/treasury/:companyId/departments
// Returns all departments under this treasury
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
      data: departments.map((d: any) => ({
        pubkey: d.publicKey.toBase58(),
        ...d.account,
      })),
    });

  } catch (err) {
    console.error('Departments fetch error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});