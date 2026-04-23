import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import '../mocks/helius.mock';
import { mockStealthEvents } from '../mocks/helius.mock';

let app: express.Express;

beforeAll(async () => {
  const { auditRouter } = await import('../../src/routes/audit');
  app = express();
  app.use(express.json());
  app.use('/api/audit', auditRouter);
});

describe('GET /api/audit/events', () => {
  it('returns cached stealth events', async () => {
    const res = await request(app)
      .get('/api/audit/events');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.count).toBe(mockStealthEvents.length);
  });

  it('returns event with correct shape', async () => {
    const res = await request(app).get('/api/audit/events');
    const event = res.body.data[0];

    expect(event).toHaveProperty('signature');
    expect(event).toHaveProperty('timestamp');
    expect(event).toHaveProperty('ephemeralPubkey');
    expect(event).toHaveProperty('encryptedNote');
    expect(event).toHaveProperty('amount');
    expect(event).toHaveProperty('slot');
  });
});

describe('GET /api/audit/events/:ephemeralPubkey', () => {
  it('returns specific event by ephemeral pubkey', async () => {
    const res = await request(app)
      .get('/api/audit/events/ephemeral-pubkey-1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ephemeralPubkey).toBe('ephemeral-pubkey-1');
  });

  it('returns 404 for unknown ephemeral pubkey', async () => {
    const res = await request(app)
      .get('/api/audit/events/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Event not found');
  });
});
