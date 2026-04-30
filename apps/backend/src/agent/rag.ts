import { config } from '../config';
import { ParsedInvoice } from './invoice-parser';

export interface VendorHistory {
  vendor: string;
  invoiceCount: number;
  averageAmount: number;
  lastSeenDate: string;
  categories: string[];
}

export interface RAGResult {
  vendorHistory: VendorHistory | null;
  anomalyFlags: string[];
  suggestedDepartment: string | null;
  similarInvoices: SimilarInvoice[];
}

export interface SimilarInvoice {
  vendor: string;
  amount: number;
  date: string;
  category: string;
  similarity: number;
}

// Embedding

// Groq does not have an embedding API yet
// We use a pseudo-embedding for now — good enough for hackathon
// Switch to OpenAI text-embedding-3-small or Cohere when you have budget
function pseudoEmbed(text: string): number[] {
  const vec = new Array(128).fill(0);
  for (let i = 0; i < text.length; i++) {
    vec[i % 128] += text.charCodeAt(i) / 255;
  }
  const norm = Math.sqrt(vec.reduce((s: number, v: number) => s + v * v, 0)) || 1;
  return vec.map((v: number) => v / norm);
}

// Pinecone client

async function getPineconeIndex() {
  if (!config.pinecone.apiKey) return null;
  try {
    const { Pinecone } = await import('@pinecone-database/pinecone');
    const pc = new Pinecone({ apiKey: config.pinecone.apiKey });
    return pc.index(config.pinecone.index);
  } catch {
    console.warn('⚠️  Pinecone not available — RAG running without vector DB');
    return null;
  }
}

// Store invoice embedding

export async function storeInvoiceEmbedding(
  invoiceId: string,
  invoice: ParsedInvoice
): Promise<void> {
  const index = await getPineconeIndex();
  if (!index) return;

  const text = `${invoice.vendor} ${invoice.description} ${invoice.category} ${invoice.amount}`;
  const embedding = pseudoEmbed(text);

  await index.upsert({
  records: [
    {
      id: invoiceId,
      values: embedding,
      metadata: {
        vendor: invoice.vendor,
        amount: Number(invoice.amountUsdc),
        category: invoice.category,
        date: invoice.dueDate,
        description: invoice.description,
      },
    },
  ],
});
}

// Query vendor history 

export async function queryVendorHistory(invoice: ParsedInvoice): Promise<RAGResult> {
  const anomalyFlags: string[] = [...invoice.flags];
  const index = await getPineconeIndex();

  if (!index) {
    return {
      vendorHistory: null,
      anomalyFlags,
      suggestedDepartment: guessDepartment(invoice.category),
      similarInvoices: [],
    };
  }

  const text = `${invoice.vendor} ${invoice.description} ${invoice.category}`;
  const embedding = pseudoEmbed(text);

  const results = await index.query({
    vector: embedding,
    topK: 5,
    includeMetadata: true,
    filter: { vendor: invoice.vendor },
  });

  const matches = results.matches ?? [];

  let vendorHistory: VendorHistory | null = null;

  if (matches.length > 0) {
    const amounts = matches
      .map((m) => Number(m.metadata?.['amount'] ?? 0))
      .filter((a) => a > 0);

    const avgAmount = amounts.length
      ? amounts.reduce((s, a) => s + a, 0) / amounts.length
      : 0;

    vendorHistory = {
      vendor: invoice.vendor,
      invoiceCount: matches.length,
      averageAmount: avgAmount,
      lastSeenDate: String(matches[0]?.metadata?.['date'] ?? ''),
      categories: [...new Set(matches.map((m) => String(m.metadata?.['category'] ?? '')))],
    };

    if (avgAmount > 0 && invoice.amountUsdc > avgAmount * 1.5) {
      anomalyFlags.push(
        `Amount is ${Math.round((invoice.amountUsdc / avgAmount - 1) * 100)}% above average for ${invoice.vendor}`
      );
    }
  }

  return {
    vendorHistory,
    anomalyFlags,
    suggestedDepartment: guessDepartment(invoice.category),
    similarInvoices: matches.map((m) => ({
      vendor: String(m.metadata?.['vendor'] ?? ''),
      amount: Number(m.metadata?.['amount'] ?? 0),
      date: String(m.metadata?.['date'] ?? ''),
      category: String(m.metadata?.['category'] ?? ''),
      similarity: m.score ?? 0,
    })),
  };
}

// Department suggestion

function guessDepartment(category: string): string {
  const map: Record<string, string> = {
    software: 'engineering',
    infrastructure: 'engineering',
    marketing: 'marketing',
    legal: 'operations',
    hr: 'operations',
    operations: 'operations',
    travel: 'operations',
    other: 'operations',
  };
  return map[category] ?? 'operations';
}
