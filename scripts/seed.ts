import * as anchor from '@coral-xyz/anchor';
import { PublicKey, Keypair, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: join(__dirname, '../apps/backend/.env') });

// ─── Config ───────────────────────────────────────────────────────────────────

const COMPANY_ID = 'trezo-demo';
const RPC_URL = process.env.SOLANA_RPC_URL ?? 'http://localhost:8899';
const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID ?? 'Fg6PaFpoGXkYsidMpWxTWqkZxJotP7R9R3jJfG8h6Y2G'
);

// ─── DB Client ────────────────────────────────────────────────────────────────

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findPda(seeds: Buffer[], programId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(seeds, programId);
  return pda;
}

function pseudoEmbed(text: string): number[] {
  const vec = new Array(128).fill(0);
  for (let i = 0; i < text.length; i++) {
    vec[i % 128] += text.charCodeAt(i) / 255;
  }
  const norm = Math.sqrt(vec.reduce((s: number, v: number) => s + v * v, 0)) || 1;
  return vec.map((v: number) => v / norm);
}

// ─── Seed invoices ────────────────────────────────────────────────────────────

async function seedInvoices(): Promise<void> {
  console.log('📄 Seeding invoices...');

  const invoices = [
    {
      vendor: 'Vercel Inc.',
      amount: 120.00,
      currency: 'USD',
      amount_usdc: 120.00,
      due_date: '2024-03-30',
      category: 'infrastructure',
      description: 'Pro Plan Hosting — March 2024',
      invoice_number: 'INV-2024-0392',
      confidence: 0.97,
      flags: [],
    },
    {
      vendor: 'AWS',
      amount: 2840.50,
      currency: 'USD',
      amount_usdc: 2840.50,
      due_date: '2024-03-15',
      category: 'infrastructure',
      description: 'EC2 + S3 + RDS — March 2024',
      invoice_number: 'AWS-2024-03-001',
      confidence: 0.95,
      flags: [],
    },
    {
      vendor: 'Figma',
      amount: 45.00,
      currency: 'USD',
      amount_usdc: 45.00,
      due_date: '2024-04-01',
      category: 'software',
      description: 'Professional Plan — April 2024',
      invoice_number: 'FIG-2024-04',
      confidence: 0.98,
      flags: [],
    },
    {
      vendor: 'Notion',
      amount: 96.00,
      currency: 'USD',
      amount_usdc: 96.00,
      due_date: '2024-04-05',
      category: 'software',
      description: 'Team Plan Annual — Q2 2024',
      invoice_number: 'NOT-2024-Q2',
      confidence: 0.96,
      flags: [],
    },
    {
      vendor: 'Stripe',
      amount: 320.00,
      currency: 'USD',
      amount_usdc: 320.00,
      due_date: '2024-03-20',
      category: 'operations',
      description: 'Payment processing fees — March 2024',
      invoice_number: 'STR-2024-03',
      confidence: 0.93,
      flags: ['Amount 28% above average for Stripe'],
    },
    {
      vendor: 'Legal Partners LLP',
      amount: 5000.00,
      currency: 'USD',
      amount_usdc: 5000.00,
      due_date: '2024-04-15',
      category: 'legal',
      description: 'Contract review and compliance audit',
      invoice_number: 'LP-2024-0042',
      confidence: 0.89,
      flags: ['New vendor — no history found'],
    },
    {
      vendor: 'AWS',
      amount: 3100.00,
      currency: 'USD',
      amount_usdc: 3100.00,
      due_date: '2024-04-15',
      category: 'infrastructure',
      description: 'EC2 + S3 + RDS — April 2024',
      invoice_number: 'AWS-2024-04-001',
      confidence: 0.95,
      flags: ['Amount 9% above average for AWS'],
    },
  ];

  for (const invoice of invoices) {
    const text = `${invoice.vendor} ${invoice.description} ${invoice.category} ${invoice.amount}`;
    const embedding = pseudoEmbed(text);
    const embeddingStr = `[${embedding.join(',')}]`;

    await db.query(
      `INSERT INTO invoices (
        vendor, amount, currency, amount_usdc, due_date,
        category, description, invoice_number, confidence,
        flags, embedding, company_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::vector,$12)
      ON CONFLICT DO NOTHING`,
      [
        invoice.vendor,
        invoice.amount,
        invoice.currency,
        invoice.amount_usdc,
        invoice.due_date,
        invoice.category,
        invoice.description,
        invoice.invoice_number,
        invoice.confidence,
        invoice.flags,
        embeddingStr,
        COMPANY_ID,
      ]
    );

    // Update vendor history
    await db.query(
      `INSERT INTO vendor_history (vendor, company_id, invoice_count, total_amount, average_amount, last_seen_at, categories)
       VALUES ($1, $2, 1, $3, $3, NOW(), ARRAY[$4])
       ON CONFLICT (vendor, company_id) DO UPDATE SET
         invoice_count = vendor_history.invoice_count + 1,
         total_amount = vendor_history.total_amount + $3,
         average_amount = (vendor_history.total_amount + $3) / (vendor_history.invoice_count + 1),
         last_seen_at = NOW(),
         categories = array_append(vendor_history.categories, $4)`,
      [invoice.vendor, COMPANY_ID, invoice.amount_usdc, invoice.category]
    );

    console.log(`  ✅ Invoice: ${invoice.vendor} — $${invoice.amount}`);
  }
}

// ─── Seed audit events ────────────────────────────────────────────────────────

async function seedAuditEvents(): Promise<void> {
  console.log('\n📋 Seeding audit events...');

  const events = [
    {
      signature: 'demo-sig-001',
      event_type: 'StealthPayment',
      ephemeral_pubkey: 'ephemeral-pubkey-demo-001',
      encrypted_note: 'encrypted-note-demo-001',
      amount: 1200.00,
    },
    {
      signature: 'demo-sig-002',
      event_type: 'StealthPayment',
      ephemeral_pubkey: 'ephemeral-pubkey-demo-002',
      encrypted_note: 'encrypted-note-demo-002',
      amount: 4500.00,
    },
    {
      signature: 'demo-sig-003',
      event_type: 'PayoutExecuted',
      ephemeral_pubkey: null,
      encrypted_note: null,
      amount: 120.00,
    },
    {
      signature: 'demo-sig-004',
      event_type: 'YieldDeposit',
      ephemeral_pubkey: null,
      encrypted_note: null,
      amount: 5000.00,
    },
  ];

  for (const event of events) {
    await db.query(
      `INSERT INTO audit_events (
        signature, event_type, ephemeral_pubkey,
        encrypted_note, amount, company_id
      ) VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (signature) DO NOTHING`,
      [
        event.signature,
        event.event_type,
        event.ephemeral_pubkey,
        event.encrypted_note,
        event.amount,
        COMPANY_ID,
      ]
    );
    console.log(`  ✅ Event: ${event.event_type} — $${event.amount}`);
  }
}

// ─── Seed fiat conversions ────────────────────────────────────────────────────

async function seedFiatConversions(): Promise<void> {
  console.log('\n💱 Seeding fiat conversions...');

  const conversions = [
    {
      dodo_id: 'dodo-demo-001',
      onchain_signature: 'demo-onchain-sig-001',
      amount_usdc: 1000.00,
      target_currency: 'USD',
      target_amount: 1002.00,
      exchange_rate: 1.002,
      status: 'completed',
    },
    {
      dodo_id: 'dodo-demo-002',
      onchain_signature: 'demo-onchain-sig-002',
      amount_usdc: 2500.00,
      target_currency: 'EUR',
      target_amount: 2310.00,
      exchange_rate: 0.924,
      status: 'completed',
    },
  ];

  for (const conv of conversions) {
    await db.query(
      `INSERT INTO fiat_conversions (
        dodo_id, onchain_signature, amount_usdc,
        target_currency, target_amount, exchange_rate, status, company_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (dodo_id) DO NOTHING`,
      [
        conv.dodo_id,
        conv.onchain_signature,
        conv.amount_usdc,
        conv.target_currency,
        conv.target_amount,
        conv.exchange_rate,
        conv.status,
        COMPANY_ID,
      ]
    );
    console.log(`  ✅ Conversion: ${conv.amount_usdc} USDC → ${conv.target_currency}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🌱 Trezo AI Seed Script\n');
  console.log(`   Company ID: ${COMPANY_ID}`);
  console.log(`   RPC URL:    ${RPC_URL}`);
  console.log(`   Program:    ${PROGRAM_ID.toBase58()}\n`);

  try {
    await seedCompaniesAndUsers(); 
    await seedInvoices();
    await seedAuditEvents();
    await seedFiatConversions();

    console.log('\n✅ Database seeded successfully');
    console.log('   Ready for demo\n');
  } catch (err) {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  } finally {
    await db.end();
  }
}

main();