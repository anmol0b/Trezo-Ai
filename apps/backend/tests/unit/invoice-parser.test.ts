import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('groq-sdk', () => {
  const mockCreate = vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          vendor: 'Vercel Inc.',
          amount: 25,
          currency: 'USD',
          amountUsdc: 25,
          dueDate: '2024-03-30',
          category: 'infrastructure',
          description: 'Pro Plan Hosting for March 2024',
          invoiceNumber: 'INV-2024-0392',
          confidence: 0.95,
          flags: [],
        }),
      },
    }],
  });

  const MockGroq = vi.fn().mockImplementation(function() {
    return { chat: { completions: { create: mockCreate } } };
  });

  return { default: MockGroq };
});  // ← this was missing

import { parseInvoice, _resetGroqClient } from '../../src/agent/invoice-parser';

beforeEach(() => {
  _resetGroqClient();
});

describe('parseInvoice', () => {
  const validInvoiceText = `
    INVOICE
    From: Vercel Inc.
    Invoice Number: INV-2024-0392
    Due Date: March 30, 2024
    Total: $25.00 USD
    Services: Pro Plan Hosting
  `;

  it('parses a valid invoice and returns structured data', async () => {
    const result = await parseInvoice(validInvoiceText);
    expect(result.vendor).toBe('Vercel Inc.');
    expect(result.amount).toBe(25);
    expect(result.currency).toBe('USD');
    expect(result.amountUsdc).toBe(25);
    expect(result.category).toBe('infrastructure');
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(Array.isArray(result.flags)).toBe(true);
  });

  it('throws on empty invoice text', async () => {
    await expect(parseInvoice('')).rejects.toThrow('Invoice text is empty');
    await expect(parseInvoice('   ')).rejects.toThrow('Invoice text is empty');
  });

  it('returns valid category from INVOICE_CATEGORIES', async () => {
    const result = await parseInvoice(validInvoiceText);
    const validCategories = [
      'software', 'infrastructure', 'marketing',
      'legal', 'hr', 'operations', 'travel', 'other',
    ];
    expect(validCategories).toContain(result.category);
  });

  it('returns confidence between 0 and 1', async () => {
    const result = await parseInvoice(validInvoiceText);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('handles model returning markdown fences gracefully', async () => {
    const { default: Groq } = await import('groq-sdk');
    vi.mocked(Groq).mockImplementationOnce(function() {
      return {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: '```json\n{"vendor":"Test","amount":100,"currency":"USD","amountUsdc":100,"dueDate":"2024-03-30","category":"software","description":"Test","confidence":0.9,"flags":[]}\n```',
                },
              }],
            }),
          },
        },
      } as any;
    });
    const result = await parseInvoice(validInvoiceText);
    expect(result.vendor).toBeDefined();
  });
});