import { vi } from 'vitest';

export const mockParsedInvoice = {
  vendor: 'Vercel Inc.',
  amount: 25,
  currency: 'USD',
  amountUsdc: 25,
  dueDate: '2024-03-30',
  category: 'infrastructure' as const,
  description: 'Pro Plan Hosting for March 2024',
  invoiceNumber: 'INV-2024-0392',
  confidence: 0.95,
  flags: [],
};

// Mock the entire groq-sdk module
vi.mock('groq-sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify(mockParsedInvoice),
              },
            }],
          }),
        },
      },
    })),
  };
});
