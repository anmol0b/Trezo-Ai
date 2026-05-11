import { Router, Request, Response } from 'express';
import { getCoinflowSession, getCoinflowPayoutStatus } from '../services/coinflow';
import { toErrorMessage } from '../utils';
import { getPendingTrigger, clearPendingTrigger } from '../jobs/oracle-watcher';

export const fiatRouter = Router();

// POST /api/fiat/session
// Issues a Coinflow session key for the frontend CoinflowWithdraw component
fiatRouter.post('/session', async (req: Request, res: Response) => {
  try {
    const { userId, walletAddress } = req.body as {
      userId: string;
      walletAddress: string;
    };

    if (!userId || !walletAddress) {
      res.status(400).json({ error: 'Missing required fields: userId, walletAddress' });
      return;
    }

    const session = await getCoinflowSession(userId, walletAddress);

    if (!session) {
      res.status(500).json({ error: 'Failed to create Coinflow session' });
      return;
    }

    res.json({ success: true, data: session });

  } catch (err) {
    console.error('Fiat session error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});

// GET /api/fiat/status/:payoutId
// Check status of a Coinflow payout
fiatRouter.get('/status/:payoutId', async (req: Request, res: Response) => {
  try {
    const { payoutId } = req.params;
    const status = await getCoinflowPayoutStatus(payoutId);

    if (!status) {
      res.status(404).json({ error: 'Payout not found' });
      return;
    }

    res.json({ success: true, data: status });

  } catch (err) {
    console.error('Fiat status error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});

// GET /api/fiat/pending
// Frontend polls this to know when to open CoinflowWithdraw
fiatRouter.get('/pending', (_req: Request, res: Response) => {
  const trigger = getPendingTrigger();
  res.json({ pending: !!trigger, data: trigger });
});

// POST /api/fiat/pending/clear
// Frontend calls this after CoinflowWithdraw completes
fiatRouter.post('/pending/clear', (_req: Request, res: Response) => {
  clearPendingTrigger();
  res.json({ success: true });
});