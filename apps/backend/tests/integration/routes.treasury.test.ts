import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import '../mocks/anchor.mock';

let app: express.Express;

beforeAll(async () => {
  const { treasuryRouter } = await import('../../src/routes/treasury');
  app = express();
  app.use(express.json());
  app.use('/api/treasury', treasuryRouter);
});

describe('GET /api/treasury/:companyId', () => {
  it('returns treasury data for valid companyId', async () => {
    const res = await request(app)
      .get('/api/treasury/trezo-test');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.pubkey).toBeDefined();
  });
});

describe('GET /api/treasury/:companyId/departments', () => {
  it('returns departments list', async () => {
    const res = await request(app)
      .get('/api/treasury/trezo-test/departments');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
