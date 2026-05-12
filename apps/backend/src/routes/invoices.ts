import { Router, Request, Response } from 'express';
import multer from 'multer';

import { parseInvoice } from '../agent/invoice-parser';
import { queryVendorHistory, storeInvoiceEmbedding } from '../agent/rag';
import { buildProposalData, buildProposalSummary } from '../agent/proposal-builder';
import { submitProposePayout } from '../agent/solana-client';
import { toErrorMessage } from '../utils';
import { getDb } from '../db/client';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are accepted'));
  },
});

export const invoicesRouter = Router();
const PDFParse = require('pdf-parse');

// GET /api/invoices/:companyId
// Returns recent invoices persisted in Postgres
invoicesRouter.get('/:companyId', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const limit = Math.min(parseInt(String(req.query.limit ?? '50'), 10) || 50, 200);

    if (!companyId) {
      res.status(400).json({ error: 'companyId is required' });
      return;
    }

    const db = getDb();
    const result = await db.query(
      `
      SELECT
        id,
        vendor,
        amount,
        currency,
        amount_usdc,
        due_date,
        category,
        description,
        invoice_number,
        metadata_uri,
        confidence,
        flags,
        proposal_pda,
        created_at
      FROM invoices
      WHERE company_id = $1
      ORDER BY created_at DESC
      LIMIT $2
      `,
      [companyId, limit],
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    console.error('Invoices list fetch error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});

// POST /api/invoices/parse
// Step 1 — upload PDF, get AI parsed summary back for human review
invoicesRouter.post(
  '/parse',
  upload.single('invoice'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No PDF file uploaded' });
        return;
      }

      const { treasuryPda, deptPda, recipientWallet, companyId } = req.body as {
        treasuryPda: string;
        deptPda: string;
        recipientWallet: string;
        companyId: string;
      };

      if (!treasuryPda || !deptPda || !recipientWallet || !companyId) {
        res.status(400).json({
          error: 'Missing required fields: treasuryPda, deptPda, recipientWallet, companyId',
        });
        return;
      }

      // Extract text from PDF
      const pdfData = await PDFParse(req.file.buffer);
      const invoiceText = pdfData.text.trim();

      if (!invoiceText) {
        res.status(422).json({ error: 'Could not extract text from PDF' });
        return;
      }

      // Parse with Groq
      const invoice = await parseInvoice(invoiceText);

      // Query RAG for vendor history + anomaly flags
      const ragResult = await queryVendorHistory(invoice);

      // Build summary for frontend review modal
      const metadataUri = `ipfs://placeholder-${Date.now()}`;
      const summary = buildProposalSummary(invoice, ragResult, metadataUri);

      res.json({
        success: true,
        summary,
        vendorHistory: ragResult.vendorHistory,
        similarInvoices: ragResult.similarInvoices,
      });

    } catch (err) {
      console.error('Invoice parse error:', err);
      res.status(500).json({ error: toErrorMessage(err) });
    }
  }
);

// POST /api/invoices/confirm
// Step 2 — human reviewed, now submit proposal onchain
invoicesRouter.post('/confirm', async (req: Request, res: Response) => {
  try {
    const {
      invoice,
      ragResult,
      treasuryPda,
      deptPda,
      recipientWallet,
      metadataUri,
      companyId,
    } = req.body;

    if (!invoice || !treasuryPda || !deptPda || !recipientWallet || !companyId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const proposalData = buildProposalData({
      invoice,
      ragResult,
      treasuryPda,
      deptPda,
      recipientWallet,
      metadataUri: metadataUri ?? `ipfs://placeholder-${Date.now()}`,
    });

    const result = await submitProposePayout(proposalData, companyId);

    if (!result.success) {
      res.status(500).json({ error: result.error });
      return;
    }

    // Store in vector DB for future RAG queries
    await storeInvoiceEmbedding(result.proposalPda!, invoice);

    res.json({
      success: true,
      signature: result.signature,
      proposalPda: result.proposalPda,
    });

  } catch (err) {
    console.error('Invoice confirm error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});