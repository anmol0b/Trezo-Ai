import { Router, Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import { getCachedStealthEvents } from '../services/sol_rpc';
import { getProgram, PDAs } from '../services/anchor';
import {
  submitRegisterViewingKey,
  submitRevokeViewingKey,
} from '../agent/solana-client';
import { toErrorMessage } from '../utils';

export const auditRouter = Router();

// GET /api/audit/events
auditRouter.get('/events', (_req: Request, res: Response) => {
  try {
    const events = getCachedStealthEvents();
    res.json({ success: true, data: events, count: events.length });
  } catch (err) {
    console.error('Audit events error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});

// GET /api/audit/events/:ephemeralPubkey
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

// POST /api/audit/viewing-keys
// Register a viewing key for an auditor
// Body: { viewerPubkey, encryptedKey, companyId? }
auditRouter.post('/viewing-keys', async (req: Request, res: Response) => {
  try {
    const { viewerPubkey, encryptedKey, companyId = 'trezo-demo' } = req.body as {
      viewerPubkey: string;
      encryptedKey: string;
      companyId?: string;
    };

    if (!viewerPubkey || !encryptedKey) {
      res.status(400).json({ error: 'Missing required fields: viewerPubkey, encryptedKey' });
      return;
    }

    // Validate pubkey
    try { new PublicKey(viewerPubkey); } catch {
      res.status(400).json({ error: 'Invalid viewerPubkey' });
      return;
    }

    const result = await submitRegisterViewingKey(viewerPubkey, encryptedKey, companyId);

    if (!result.success) {
      res.status(500).json({ error: result.error });
      return;
    }

    res.status(201).json({
      success: true,
      data: { signature: result.signature, viewerPubkey, companyId },
    });
  } catch (err) {
    console.error('Register viewing key error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});

// GET /api/audit/viewing-keys/:companyId/:viewerPubkey
// Fetch a viewing key from onchain
auditRouter.get('/viewing-keys/:companyId/:viewerPubkey', async (req: Request, res: Response) => {
  try {
    const { companyId, viewerPubkey } = req.params;

    try { new PublicKey(viewerPubkey); } catch {
      res.status(400).json({ error: 'Invalid viewerPubkey' });
      return;
    }

    const program = getProgram();
    const [treasuryPda] = PDAs.treasury(companyId);
    const [viewingKeyPda] = PDAs.viewingKey(treasuryPda, new PublicKey(viewerPubkey));

    const account = await (program.account as any).viewingKey.fetch(viewingKeyPda);

    res.json({
      success: true,
      data: {
        viewer: account.viewer.toBase58(),
        encryptedKey: account.encryptedKey,
        createdAt: account.createdAt.toString(),
        pda: viewingKeyPda.toBase58(),
      },
    });
  } catch (err: any) {
    if (err?.message?.includes('Account does not exist')) {
      res.status(404).json({ error: 'Viewing key not found' });
      return;
    }
    console.error('Fetch viewing key error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});

// DELETE /api/audit/viewing-keys/:companyId/:viewerPubkey
// Revoke a viewing key
auditRouter.delete('/viewing-keys/:companyId/:viewerPubkey', async (req: Request, res: Response) => {
  try {
    const { companyId, viewerPubkey } = req.params;

    try { new PublicKey(viewerPubkey); } catch {
      res.status(400).json({ error: 'Invalid viewerPubkey' });
      return;
    }

    const result = await submitRevokeViewingKey(viewerPubkey, companyId);

    if (!result.success) {
      res.status(500).json({ error: result.error });
      return;
    }

    res.json({ success: true, data: { signature: result.signature } });
  } catch (err) {
    console.error('Revoke viewing key error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});