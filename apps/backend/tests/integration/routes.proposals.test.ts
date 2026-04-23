import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import '../mocks/anchor.mock';

let app: express.Express;

beforeAll(async () => {
  const { proposalsRouter } = await import('../../src/routes/proposals');
  app = express();
  app.use(express.json());
  app.use('/api/proposals', proposalsRouter);
});

describe('GET /api/proposals/:companyId', () => {
  it('returns proposals list', async () => {
    const res = await request(app)
      .get('/api/proposals/koshai-test');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(typeof res.body.count).toBe('number');
  });

  it('accepts status filter query param', async () => {
    const res = await request(app)
      .get('/api/proposals/koshai-test?status=pending');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/proposals/:companyId/:proposalPubkey', () => {
  it('returns single proposal', async () => {
    const res = await request(app)
      .get('/api/proposals/koshai-test/11111111111111111111111111111111');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pubkey).toBe('11111111111111111111111111111111');
  });
});
