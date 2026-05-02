import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('../../src/services/dodo', () => ({
  triggerFiatConversion: vi.fn().mockResolvedValue({
    success: true,
    data: {
      id: 'dodo-test-123',
      status: 'pending',
      amountUsdc: 1000,
      targetCurrency: 'USD',
      exchangeRate: 1.002,
      targetAmount: 1002,
      reference: 'test-ref',
      createdAt: new Date().toISOString(),
    },
  }),
  getConversionStatus: vi.fn().mockResolvedValue({
    id: 'dodo-test-123',
    status: 'completed',
  }),
  generateIdempotencyKey: vi.fn().mockReturnValue('trezo-test-key-2024-01-01'),
}));

let app: express.Express;

beforeAll(async () => {
  const { fiatRouter } = await import('../../src/routes/fiat');
  app = express();
  app.use(express.json());
  app.use('/api/fiat', fiatRouter);
});

describe('POST /api/fiat/convert', () => {
  const validBody = {
    amountUsdc: 1000,
    targetCurrency: 'USD',
    targetIban: 'GB82WEST12345698765432',
    reference: 'test-proposal-pubkey',
  };

  it('returns 400 when fields missing', async () => {
    const res = await request(app)
      .post('/api/fiat/convert')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Missing required fields');
  });

  it('returns 400 when amountUsdc is zero', async () => {
    const res = await request(app)
      .post('/api/fiat/convert')
      .send({ ...validBody, amountUsdc: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('greater than 0');
  });

  it('initiates conversion successfully', async () => {
    const res = await request(app)
      .post('/api/fiat/convert')
      .send(validBody);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('dodo-test-123');
    expect(res.body.data.status).toBe('pending');
  });
});

describe('GET /api/fiat/status/:conversionId', () => {
  it('returns conversion status', async () => {
    const res = await request(app)
      .get('/api/fiat/status/dodo-test-123');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('completed');
  });
});
