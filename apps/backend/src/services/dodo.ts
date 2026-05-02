import axios, { AxiosInstance } from 'axios';
import { config } from '../config';

export interface ConversionRequest {
  amountUsdc: number;
  targetCurrency: string;
  targetIban: string;
  reference: string;
  idempotencyKey: string;
}

export interface ConversionResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  amountUsdc: number;
  targetCurrency: string;
  exchangeRate: number;
  targetAmount: number;
  reference: string;
  createdAt: string;
}

export interface ConversionResult {
  success: boolean;
  data?: ConversionResponse;
  error?: string;
}

let _client: AxiosInstance | null = null;

function getDodoClient(): AxiosInstance {
  if (!_client) {
    if (!config.dodo.apiKey) {
      throw new Error('DODO_API_KEY is not set in environment variables');
    }

    _client = axios.create({
      baseURL: config.dodo.apiUrl,
      headers: {
        'Authorization': `Bearer ${config.dodo.apiKey}`,
        'Content-Type': 'application/json',
        'X-Sandbox': config.dodo.sandbox ? 'true' : 'false',
      },
      timeout: 15_000,
    });

    // Log requests in dev
    if (config.isDev) {
      _client.interceptors.request.use((req) => {
        console.log(`📤 Dodo API: ${req.method?.toUpperCase()} ${req.url}`);
        return req;
      });
    }
  }
  return _client;
}

export async function triggerFiatConversion(
  req: ConversionRequest
): Promise<ConversionResult> {
  try {
    const client = getDodoClient();

    const response = await client.post<ConversionResponse>('/v1/conversions', {
      amount: req.amountUsdc,
      source_currency: 'USDC',
      target_currency: req.targetCurrency,
      target_iban: req.targetIban,
      reference: req.reference,
    }, {
      headers: {
        'Idempotency-Key': req.idempotencyKey,
      },
    });

    console.log(`✅ Dodo conversion initiated: ${response.data.id}`);
    return { success: true, data: response.data };

  } catch (err) {
    if (axios.isAxiosError(err)) {
      const message = err.response?.data?.message ?? err.message;
      console.error(`❌ Dodo API error: ${message}`);
      return { success: false, error: message };
    }
    return { success: false, error: 'Unknown error during fiat conversion' };
  }
}

export async function getConversionStatus(
  conversionId: string
): Promise<ConversionResponse | null> {
  try {
    const client = getDodoClient();
    const response = await client.get<ConversionResponse>(
      `/v1/conversions/${conversionId}`
    );
    return response.data;
  } catch {
    return null;
  }
}

export function generateIdempotencyKey(
  proposalPubkey: string,
  dateStr?: string
): string {
  const day = dateStr ?? new Date().toISOString().split('T')[0];
  return `trezo-${proposalPubkey.slice(0, 16)}-${day}`;
}