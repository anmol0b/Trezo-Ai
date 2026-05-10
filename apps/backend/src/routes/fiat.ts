import { Router, Request, Response } from 'express';
import { triggerFiatConversion, getConversionStatus, generateIdempotencyKey } from '../services/dodo';
import { toErrorMessage } from '../utils';

export const fiatRouter = Router();

// POST /api/fiat/convert
// Manual fiat conversion trigger from frontend
fiatRouter.post('/convert', async (req: Request, res: Response) => {
  try {
    const { amountUsdc, targetCurrency, targetIban, reference } = req.body as {
      amountUsdc: number;
      targetCurrency: string;
      targetIban: string;
      reference: string;
    };

    if (amountUsdc == null || !targetCurrency || !targetIban || !reference) {
      res.status(400).json({
        error: 'Missing required fields: amountUsdc, targetCurrency, targetIban, reference',
      });
      return;
    }

    if (amountUsdc <= 0) {
      res.status(400).json({ error: 'amountUsdc must be greater than 0' });
      return;
    }

    const idempotencyKey = generateIdempotencyKey(reference);
    const result = await triggerFiatConversion({
      amountUsdc,
      targetCurrency,
      targetIban,
      reference,
      idempotencyKey,
    });

    if (!result.success) {
      res.status(500).json({ error: result.error });
      return;
    }

    res.json({ success: true, data: result.data });

  } catch (err) {
    console.error('Fiat convert error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});

// GET /api/fiat/status/:conversionId
// Check status of a conversion
fiatRouter.get('/status/:conversionId', async (req: Request, res: Response) => {
  try {
    const { conversionId } = req.params;
    const status = await getConversionStatus(conversionId);

    if (!status) {
      res.status(404).json({ error: 'Conversion not found' });
      return;
    }

    res.json({ success: true, data: status });

  } catch (err) {
    console.error('Fiat status error:', err);
    res.status(500).json({ error: toErrorMessage(err) });
  }
});