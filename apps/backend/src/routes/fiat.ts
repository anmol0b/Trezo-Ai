import { Router, Request, Response } from 'express';
import { getCoinflowSession, getCoinflowPayoutStatus } from '../services/coinflow';
import { getPendingTrigger, clearPendingTrigger } from '../jobs/oracle-watcher';
import { toErrorMessage } from '../utils';

export const fiatRouter = Router();

// POST /api/fiat/convert
// Frontend calls this to initiate a withdrawal — returns a Coinflow session
fiatRouter.post('/convert', async (req: Request, res: Response) => {
  try {
    const { amountUsdc, targetCurrency, reference } = req.body as {
      amountUsdc: number;
      targetCurrency: string;
      targetIban: string;
      reference: string;
    };

    if (!amountUsdc || !targetCurrency || !reference) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const walletAddress = process.env.FIAT_WALLET_ADDRESS ?? '';
    const userId = process.env.COMPANY_ID ?? 'trezo-demo';

    const session = await getCoinflowSession(userId, walletAddress);

    if (!session) {
      res.status(500).json({ error: 'Failed to create Coinflow session' });
      return;
    }

    // Return shaped to match FiatStatusSchema on frontend
    res.json({
      success: true,
      data: {
        id: reference,
        status: 'pending',
        amount: amountUsdc,
        currency: targetCurrency,
        sessionKey: session.sessionKey,
        merchantId: session.merchantId,
        env: session.env,
        createdAt: new Date().toISOString(),
      },
    });

  } catch (err) {
    console.error('Fiat convert error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});

// GET /api/fiat/status/:payoutId
fiatRouter.get('/status/:payoutId', async (req: Request, res: Response) => {
  try {
    const { payoutId } = req.params;
    const status = await getCoinflowPayoutStatus(payoutId);

    if (!status) {
      res.status(404).json({ error: 'Payout not found' });
      return;
    }

    // Normalize Coinflow response to match FiatStatusSchema
    res.json({
      success: true,
      data: {
        id: payoutId,
        status: status.status ?? 'unknown',
        amount: status.amount ?? 0,
        currency: status.currency ?? 'USD',
        createdAt: status.createdAt ?? new Date().toISOString(),
      },
    });

  } catch (err) {
    console.error('Fiat status error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});

// GET /api/fiat/session
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
    res.status(500).json({ error: toErrorMessage(err) });
  }
});

// GET /api/fiat/pending
fiatRouter.get('/pending', (_req: Request, res: Response) => {
  const trigger = getPendingTrigger();
  res.json({ pending: !!trigger, data: trigger });
});

// POST /api/fiat/pending/clear
fiatRouter.post('/pending/clear', (_req: Request, res: Response) => {
  clearPendingTrigger();
  res.json({ success: true });
});