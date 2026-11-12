import { NextRequest, NextResponse } from 'next/server';
import type { LogEntry } from '@/lib/types';
import { getAccessToken, paypalConfig, paypalErrorResponse } from '../paypal';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const logs: LogEntry[] = [];
  const log = (entry: Omit<LogEntry, 'id' | 'timestamp'>) =>
    logs.push({ id: `${Date.now()}-${logs.length}`, timestamp: new Date().toISOString(), ...entry });

  try {
    const { orderId, scopeId } = await req.json();
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'Missing PayPal order ID.', logs }, { status: 400 });
    }

    const { clientId, clientSecret, base, env } = paypalConfig();
    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'PayPal is not configured.', logs }, { status: 500 });
    }

    log({ source: 'SYSTEM', label: `PayPal environment: ${env}`, status: 'OK', body: { base } });

    const { token } = await getAccessToken(base, clientId, clientSecret);

    const captureStart = Date.now();
    const captureRes = await fetch(`${base}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const captureBody = await captureRes.json().catch(() => ({}));
    log({ source: 'PAYPAL', label: `POST /v2/checkout/orders/${orderId}/capture`, method: 'POST', status: captureRes.status, durationMs: Date.now() - captureStart, body: captureBody });

    if (!captureRes.ok) return paypalErrorResponse(captureRes.status, captureBody, logs);

    const captureStatus = captureBody?.status;
    const captureAmount = captureBody?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value;
    const payerEmail = captureBody?.payer?.email_address;

    // Mark milestone 1 as paid in Supabase
    let updated = false;
    if (scopeId) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        const dbRes = await fetch(
          `${supabaseUrl}/rest/v1/scopes?id=eq.${encodeURIComponent(scopeId)}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({ payment_status: 'milestone1_paid' }),
          },
        );
        log({ source: 'SYSTEM', label: 'Updated scope payment_status to milestone1_paid', method: 'PATCH', status: dbRes.status, body: { scopeId } });
        updated = dbRes.ok;
      }
    }

    return NextResponse.json({ status: captureStatus, amount: captureAmount, payerEmail, updated, logs });
  } catch (err) {
    const e = err as { status?: number; raw?: unknown; message?: string };
    if (e.raw !== undefined) return paypalErrorResponse(e.status ?? 500, e.raw, logs);
    log({ source: 'SYSTEM', label: 'Unhandled server error', status: 500, body: { message: e.message } });
    return NextResponse.json({ error: 'Failed to capture PayPal payment.', logs }, { status: 500 });
  }
}
