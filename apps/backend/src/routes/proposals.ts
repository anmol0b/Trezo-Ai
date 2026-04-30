import { Router, Request, Response } from 'express';
import { getProgram, PDAs } from '../services/anchor';
import { toErrorMessage } from '../utils';

export const proposalsRouter = Router();

// GET /api/proposals/:companyId
// Returns all proposals, optionally filtered by status
proposalsRouter.get('/:companyId', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { status } = req.query;

    const program = getProgram();
    const [treasuryPda] = PDAs.treasury(companyId);

    const proposals = await (program.account as any).payoutProposal.all([
      {
        memcmp: {
          offset: 8,
          bytes: treasuryPda.toBase58(),
        },
      },
    ]);

    const filtered = status
      ? proposals.filter((p: any) => (p.account as any).status === status)
      : proposals;

    res.json({
      success: true,
      data: filtered.map((p: any) => ({
        pubkey: p.publicKey.toBase58(),
        ...p.account,
      })),
      count: filtered.length,
    });

  } catch (err) {
    console.error('Proposals fetch error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});

// GET /api/proposals/:companyId/:proposalPubkey
// Returns a single proposal by pubkey
proposalsRouter.get('/:companyId/:proposalPubkey', async (req: Request, res: Response) => {
  try {
    const { proposalPubkey } = req.params;
    const program = getProgram();

    const proposal = await (program.account as any).payoutProposal.fetch(proposalPubkey);

    res.json({
      success: true,
      data: {
        pubkey: proposalPubkey,
        ...proposal,
      },
    });

  } catch (err) {
    console.error('Proposal fetch error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});