import { Router, Request, Response } from 'express';
import { getCachedStealthEvents } from '../services/sol_rpc';
import { toErrorMessage } from '../utils';

export const auditRouter = Router();

// GET /api/audit/events
// Returns cached stealth payment events indexed from chain
auditRouter.get('/events', (_req: Request, res: Response) => {
  try {
    const events = getCachedStealthEvents();
    res.json({
      success: true,
      data: events,
      count: events.length,
    });
  } catch (err) {
    console.error('Audit events error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});

// GET /api/audit/events/:ephemeralPubkey
// Returns a single stealth event by ephemeral pubkey
// Frontend uses this when auditor decrypts a specific payment
auditRouter.get('/events/:ephemeralPubkey', (req: Request, res: Response) => {
  try {
    const { ephemeralPubkey } = req.params;
    const events = getCachedStealthEvents();
    const event = events.find((e: any) => e.ephemeralPubkey === ephemeralPubkey);

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.json({ success: true, data: event });

  } catch (err) {
    console.error('Audit event fetch error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});