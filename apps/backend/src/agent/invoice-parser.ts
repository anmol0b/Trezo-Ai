import Groq from 'groq-sdk';
import { z } from 'zod';
import { config } from '../config';
import { INVOICE_CATEGORIES, isValidCategory, InvoiceCategory } from '../utils';

// Output schema

export const ParsedInvoiceSchema = z.object({
  vendor: z.string(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  amountUsdc: z.number().positive(),
  dueDate: z.string(),
  category: z.enum(INVOICE_CATEGORIES),
  description: z.string(),
  invoiceNumber: z.string().optional(),
  confidence: z.number().min(0).max(1),
  flags: z.array(z.string()),
});

export type ParsedInvoice = z.infer<typeof ParsedInvoiceSchema>;

// Groq client

let _groq: Groq | null = null;

function getGroqClient(): Groq {
  if (!_groq) {
    if (!config.ai.groqApiKey) {
      throw new Error('GROQ_API_KEY is not set in .env — get a free key at console.groq.com');
    }
    _groq = new Groq({ apiKey: config.ai.groqApiKey });
  }
  return _groq;
}

// Prompt

function buildPrompt(invoiceText: string): string {
  return `You are a financial document parser for a corporate treasury system.

Extract fields from this invoice and return ONLY valid JSON. No markdown, no explanation, no code fences.

Required fields:
- vendor: string (company or person name)
- amount: number (original invoice amount)
- currency: string (3-letter ISO code e.g. USD, EUR, INR)
- amountUsdc: number (USD equivalent — assume 1:1 for USD, convert others approximately)
- dueDate: string (ISO 8601 format e.g. "2024-03-15", use today if not found)
- category: one of exactly [${INVOICE_CATEGORIES.join(', ')}]
- description: string (one sentence describing what was invoiced)
- invoiceNumber: string or null
- confidence: number 0-1 (your confidence in this extraction)
- flags: array of strings (concerns: unusually high amount, missing info, duplicate risk, etc. Empty array if none)

Invoice text:
---
${invoiceText}
---

Return only the JSON object. No other text.`;
}

// Main parser

export async function parseInvoice(invoiceText: string): Promise<ParsedInvoice> {
  if (!invoiceText.trim()) {
    throw new Error('Invoice text is empty');
  }

  const groq = getGroqClient();

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: 1024,
    temperature: 0.1, // Low temperature for consistent structured output
    messages: [
      {
        role: 'system',
        content: 'You are a precise financial document parser. Always return valid JSON only.',
      },
      {
        role: 'user',
        content: buildPrompt(invoiceText),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? '';

  if (!raw) {
    throw new Error('Groq returned empty response');
  }

  // Strip markdown fences if model added them anyway
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Model returned invalid JSON: ${cleaned.slice(0, 200)}`);
  }

  const result = ParsedInvoiceSchema.safeParse(parsed);
  if (!result.success) {
    console.error('Invoice parse validation failed:', result.error.issues);
    throw new Error(`Validation failed: ${result.error.issues[0]?.message}`);
  }

  // Normalize category if model returned something slightly off
  if (!isValidCategory(result.data.category)) {
    result.data.flags.push(
      `Unknown category "${result.data.category}" — defaulted to "other"`
    );
    (result.data as any).category = 'other' as InvoiceCategory;
  }

  return result.data;
}