import { ParsedInvoice } from './invoice-parser';
import { getDb } from '../db/client';

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

// ─── Embedding ────────────────────────────────────────────────────────────────
// Pseudo-embedding — consistent with seed script
// Replace with real embedding API when budget allows

function pseudoEmbed(text: string): number[] {
  const vec = new Array(128).fill(0);
  for (let i = 0; i < text.length; i++) {
    vec[i % 128] += text.charCodeAt(i) / 255;
  }
  const norm = Math.sqrt(vec.reduce((s: number, v: number) => s + v * v, 0)) || 1;
  return vec.map((v: number) => v / norm);
}

// ─── Store invoice in pgvector ────────────────────────────────────────────────

export async function storeInvoiceEmbedding(
  invoiceId: string,
  invoice: ParsedInvoice,
  companyId = 'trezo-demo'
): Promise<void> {
  try {
    const db = getDb();
    const text = `${invoice.vendor} ${invoice.description} ${invoice.category} ${invoice.amount}`;
    const embedding = pseudoEmbed(text);
    const embeddingStr = `[${embedding.join(',')}]`;

    await db.query(
      `INSERT INTO invoices (
        id, vendor, amount, currency, amount_usdc,
        due_date, category, description, invoice_number,
        confidence, flags, embedding, company_id, proposal_pda
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::vector,$13,$14)
      ON CONFLICT (id) DO UPDATE SET
        proposal_pda = EXCLUDED.proposal_pda,
        updated_at   = NOW()`,
      [
        invoiceId,
        invoice.vendor,
        invoice.amount,
        invoice.currency,
        invoice.amountUsdc,
        invoice.dueDate,
        invoice.category,
        invoice.description,
        invoice.invoiceNumber ?? null,
        invoice.confidence,
        invoice.flags,
        embeddingStr,
        companyId,
        invoiceId,
      ]
    );

    // Update vendor history
    await db.query(
      `INSERT INTO vendor_history (vendor, company_id, invoice_count, total_amount, average_amount, last_seen_at, categories)
       VALUES ($1, $2, 1, $3, $3, NOW(), ARRAY[$4])
       ON CONFLICT (vendor, company_id) DO UPDATE SET
         invoice_count  = vendor_history.invoice_count + 1,
         total_amount   = vendor_history.total_amount + $3,
         average_amount = (vendor_history.total_amount + $3) / (vendor_history.invoice_count + 1),
         last_seen_at   = NOW(),
         categories     = array_append(vendor_history.categories, $4)`,
      [invoice.vendor, companyId, invoice.amountUsdc, invoice.category]
    );

    console.log(`📦 Invoice stored: ${invoice.vendor} — $${invoice.amountUsdc}`);
  } catch (err) {
    // Non-fatal — log and continue
    console.error('⚠️  Failed to store invoice embedding:', err instanceof Error ? err.message : err);
  }
}

// ─── Query vendor history + similar invoices ──────────────────────────────────

export async function queryVendorHistory(
  invoice: ParsedInvoice,
  companyId = 'trezo-demo'
): Promise<RAGResult> {
  const anomalyFlags: string[] = [...invoice.flags];

  try {
    const db = getDb();

    // 1. Get vendor history from vendor_history table
    const vendorResult = await db.query(
      `SELECT
         invoice_count,
         average_amount,
         last_seen_at,
         categories
       FROM vendor_history
       WHERE vendor = $1 AND company_id = $2`,
      [invoice.vendor, companyId]
    );

    let vendorHistory: VendorHistory | null = null;

    if (vendorResult.rows.length > 0) {
      const row = vendorResult.rows[0];
      vendorHistory = {
        vendor: invoice.vendor,
        invoiceCount: row.invoice_count,
        averageAmount: parseFloat(row.average_amount),
        lastSeenDate: row.last_seen_at?.toISOString().split('T')[0] ?? '',
        categories: row.categories ?? [],
      };

      // Anomaly detection
      if (vendorHistory.averageAmount > 0 && invoice.amountUsdc > vendorHistory.averageAmount * 1.5) {
        anomalyFlags.push(
          `Amount is ${Math.round((invoice.amountUsdc / vendorHistory.averageAmount - 1) * 100)}% above average for ${invoice.vendor}`
        );
      }

      if (vendorHistory.invoiceCount >= 2) {
        anomalyFlags.push(
          `${invoice.vendor} has ${vendorHistory.invoiceCount} previous invoices — verify for duplicates`
        );
      }
    } else {
      anomalyFlags.push(`New vendor — no history found for ${invoice.vendor}`);
    }

    // 2. Vector similarity search using pgvector
    const text = `${invoice.vendor} ${invoice.description} ${invoice.category}`;
    const embedding = pseudoEmbed(text);
    const embeddingStr = `[${embedding.join(',')}]`;

    const similarResult = await db.query(
      `SELECT
         vendor,
         amount_usdc AS amount,
         due_date    AS date,
         category,
         1 - (embedding <=> $1::vector) AS similarity
       FROM invoices
       WHERE company_id = $2
         AND vendor = $3
       ORDER BY embedding <=> $1::vector
       LIMIT 5`,
      [embeddingStr, companyId, invoice.vendor]
    );

    const similarInvoices: SimilarInvoice[] = similarResult.rows.map((row: any) => ({
      vendor: row.vendor,
      amount: parseFloat(row.amount),
      date: row.date?.toISOString?.().split('T')[0] ?? String(row.date),
      category: row.category,
      similarity: parseFloat(row.similarity ?? '0'),
    }));

    return {
      vendorHistory,
      anomalyFlags,
      suggestedDepartment: guessDepartment(invoice.category),
      similarInvoices,
    };

  } catch (err) {
    // DB not available — return minimal result
    console.warn('⚠️  RAG query failed, returning minimal result:', err instanceof Error ? err.message : err);
    return {
      vendorHistory: null,
      anomalyFlags,
      suggestedDepartment: guessDepartment(invoice.category),
      similarInvoices: [],
    };
  }
}

// ─── Department suggestion ────────────────────────────────────────────────────

function guessDepartment(category: string): string {
  const map: Record<string, string> = {
    software:       'engineering',
    infrastructure: 'engineering',
    marketing:      'marketing',
    legal:          'operations',
    hr:             'operations',
    operations:     'operations',
    travel:         'operations',
    other:          'operations',
  };
  return map[category] ?? 'operations';
}