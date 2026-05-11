import { Router, Request, Response } from 'express';
import { createSubscriptionCheckout, getSubscriptionStatus } from '../services/dodo';
import { getCoinflowSession, getCoinflowPayoutStatus, verifyCoinflowWebhook, CoinflowWebhookEvent } from '../services/coinflow';
import { getDb } from '../db/client';
import { toErrorMessage } from '../utils';

export const billingRouter = Router();

// POST /api/billing/checkout
// Create a Dodo subscription checkout session
billingRouter.post('/checkout', async (req: Request, res: Response) => {
  try {
    const { companyId, email, plan = 'pro' } = req.body as {
      companyId: string;
      email: string;
      plan?: 'pro' | 'enterprise';
    };

    if (!companyId || !email) {
      res.status(400).json({ error: 'Missing required fields: companyId, email' });
      return;
    }

    const result = await createSubscriptionCheckout({ companyId, email, plan });

    if (!result.success) {
      res.status(500).json({ error: result.error });
      return;
    }

    res.json({ success: true, data: result.data });
  } catch (err) {
    console.error('Billing checkout error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});

// GET /api/billing/subscription/:subscriptionId
billingRouter.get('/subscription/:subscriptionId', async (req: Request, res: Response) => {
  try {
    const status = await getSubscriptionStatus(req.params.subscriptionId);
    if (!status) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }
    res.json({ success: true, data: status });
  } catch (err) {
    res.status(500).json({ error: toErrorMessage(err) });
  }
});

// POST /api/billing/webhooks/dodo
// Dodo subscription webhook handler
billingRouter.post('/webhooks/dodo', async (req: Request, res: Response) => {
  try {
    const event = req.body as any;
    console.log(`📨 Dodo webhook: ${event.type}`);

    const db = getDb();

    switch (event.type) {
      case 'subscription.created':
      case 'subscription.active': {
        const companyId = event.data?.metadata?.companyId;
        const plan = event.data?.metadata?.plan ?? 'pro';
        if (companyId) {
          await db.query(
            `UPDATE companies SET plan = $1 WHERE id = $2`,
            [plan, companyId]
          );
          console.log(`✅ Company ${companyId} upgraded to ${plan}`);
        }
        break;
      }
      case 'subscription.cancelled': {
        const companyId = event.data?.metadata?.companyId;
        if (companyId) {
          await db.query(
            `UPDATE companies SET plan = 'free' WHERE id = $1`,
            [companyId]
          );
          console.log(`⬇️  Company ${companyId} downgraded to free`);
        }
        break;
      }
      default:
        console.log(`⏭️  Unhandled Dodo event: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Dodo webhook error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});

// POST /api/billing/fiat/session
// Get Coinflow session for frontend CoinflowWithdraw component
billingRouter.post('/fiat/session', async (req: Request, res: Response) => {
  try {
    const { walletAddress, companyId } = req.body as {
      walletAddress: string;
      companyId: string;
    };

    if (!walletAddress || !companyId) {
      res.status(400).json({ error: 'Missing required fields: walletAddress, companyId' });
      return;
    }

    const session = await getCoinflowSession(companyId, walletAddress);

    if (!session) {
      res.status(500).json({ error: 'Failed to create Coinflow session' });
      return;
    }

    res.json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ error: toErrorMessage(err) });
  }
});

// GET /api/billing/fiat/status/:payoutId
billingRouter.get('/fiat/status/:payoutId', async (req: Request, res: Response) => {
  try {
    const status = await getCoinflowPayoutStatus(req.params.payoutId);
    if (!status) {
      res.status(404).json({ error: 'Payout not found' });
      return;
    }
    res.json({ success: true, data: status });
  } catch (err) {
    res.status(500).json({ error: toErrorMessage(err) });
  }
});

// POST /api/billing/webhooks/coinflow
billingRouter.post('/webhooks/coinflow', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-coinflow-signature'] as string ?? '';
    const payload = JSON.stringify(req.body);

    if (!verifyCoinflowWebhook(payload, signature)) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    const event = req.body as CoinflowWebhookEvent;
    console.log(`📨 Coinflow webhook: ${event.type}`);

    const db = getDb();

    switch (event.type) {
      case 'withdrawal.completed':
        await db.query(
          `INSERT INTO fiat_conversions (
            dodo_id, amount_usdc, target_currency, status, company_id
          ) VALUES ($1, $2, $3, 'completed', 'trezo-demo')
          ON CONFLICT (dodo_id) DO UPDATE SET status = 'completed'`,
          [event.id, event.amount, event.currency]
        );
        console.log(`✅ Coinflow withdrawal completed: ${event.id}`);
        break;
      case 'withdrawal.failed':
        await db.query(
          `INSERT INTO fiat_conversions (
            dodo_id, amount_usdc, target_currency, status, company_id
          ) VALUES ($1, $2, $3, 'failed', 'trezo-demo')
          ON CONFLICT (dodo_id) DO UPDATE SET status = 'failed'`,
          [event.id, event.amount, event.currency]
        );
        console.log(`❌ Coinflow withdrawal failed: ${event.id}`);
        break;
      default:
        console.log(`⏭️  Unhandled Coinflow event: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Coinflow webhook error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});