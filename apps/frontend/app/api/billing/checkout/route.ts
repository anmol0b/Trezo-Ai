import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan, email, companyId } = body as {
      plan: string;
      email: string;
      companyId: string;
    };

    if (!plan || !email || !companyId) {
      return NextResponse.json(
        { error: 'Missing required fields: plan, email, companyId' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_API_URL ?? 'http://localhost:4000';

    const response = await fetch(`${backendUrl}/api/billing/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, email, plan }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error ?? 'Checkout failed' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Billing checkout proxy error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}