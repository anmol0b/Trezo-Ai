import axios, { AxiosInstance } from 'axios';
import { config } from '../config';

// ─── Dodo Payments — Subscription Billing Only ────────────────────────────────

export interface CheckoutRequest {
  companyId: string;
  email: string;
  plan: 'basic' | 'pro' | 'enterprise';
}

export interface CheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
}

export interface CheckoutResult {
  success: boolean;
  data?: CheckoutResponse;
  error?: string;
}

export interface SubscriptionStatus {
  id: string;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  plan: string;
  currentPeriodEnd: string;
}

// Plan product IDs — create these in Dodo dashboard
// TODO: replace prod_basic_placeholder when Dodo product is created
const PLAN_PRODUCT_IDS: Record<string, string> = {
  basic: process.env.DODO_BASIC_PRODUCT_ID ?? 'prod_basic_placeholder',
  pro: process.env.DODO_PRO_PRODUCT_ID ?? 'prod_pro_placeholder',
  enterprise: process.env.DODO_ENTERPRISE_PRODUCT_ID ?? 'prod_enterprise_placeholder',
};

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
      },
      timeout: 15_000,
    });

    if (config.isDev) {
      _client.interceptors.request.use((req) => {
        console.log(`📤 Dodo: ${req.method?.toUpperCase()} ${req.baseURL}${req.url}`);
        return req;
      });
    }
  }
  return _client;
}

// Create a checkout session for Trezo subscription
export async function createSubscriptionCheckout(
  req: CheckoutRequest
): Promise<CheckoutResult> {
  try {
    const client = getDodoClient();
    const productId = PLAN_PRODUCT_IDS[req.plan];

    const response = await client.post('/checkout/sessions', {
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { email: req.email },
      metadata: { companyId: req.companyId, plan: req.plan },
      business_id: process.env.DODO_BRAND_ID,
      success_url: `${config.frontendUrl}/dashboard?checkout=success`,
      cancel_url: `${config.frontendUrl}/pricing?checkout=cancelled`,
    });

    console.log(`✅ Dodo checkout created: ${response.data.session_id}`);
    return {
      success: true,
      data: {
        checkoutUrl: response.data.payment_link ?? response.data.url,
        sessionId: response.data.session_id,
      },
    };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error('❌ Dodo checkout error:', err.response?.status, err.response?.data);
      return { success: false, error: JSON.stringify(err.response?.data ?? err.message) };
    }
    return { success: false, error: 'Unknown error creating checkout' };
  }
}

// Get subscription status
export async function getSubscriptionStatus(
  subscriptionId: string
): Promise<SubscriptionStatus | null> {
  try {
    const client = getDodoClient();
    const response = await client.get(`/subscriptions/${subscriptionId}`);
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error('❌ Failed to fetch subscription:', err.response?.status);
    }
    return null;
  }
}

export function generateIdempotencyKey(ref: string, dateStr?: string): string {
  const day = dateStr ?? new Date().toISOString().split('T')[0];
  return `trezo-${ref.slice(0, 16)}-${day}`;
}