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
    const { amountUSD, description, scopeId } = await req.json();
    const amountValue = Number(String(amountUSD).replace(/[^\d.]/g, ''));
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      return NextResponse.json({ error: 'Invalid milestone amount.', logs }, { status: 400 });
    }
    const amount = amountValue.toFixed(2);
    const unitDescription = String(description || 'Project Milestone 1').slice(0, 120);

    log({ source: 'SYSTEM', label: 'Order payload (minimal, Orders v2)', status: 'OK', body: { intent: 'CAPTURE', purchase_units: [{ description: unitDescription, amount: { currency_code: 'USD', value: amount } }] } });

    const { clientId, clientSecret, base, env } = paypalConfig();
    if (!clientId || !clientSecret) {
      log({ source: 'SYSTEM', label: 'PayPal credentials missing', status: 'CONFIG_ERROR', body: { error: 'Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in the environment.' } });
      return NextResponse.json({ error: 'PayPal is not configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.', logs }, { status: 500 });
    }

    log({ source: 'SYSTEM', label: `PayPal environment: ${env}`, status: 'OK', body: { base } });

    const authStart = Date.now();
    const { token, raw: authRaw } = await getAccessToken(base, clientId, clientSecret);
    log({ source: 'PAYPAL', label: 'POST /v1/oauth2/token (client credentials)', method: 'POST', status: 200, durationMs: Date.now() - authStart, body: authRaw });

    const orderStart = Date.now();
    const orderRes = await fetch(`${base}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `SCOPEPAY-${scopeId ?? 'na'}-${Date.now()}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            description: unitDescription,
            amount: { currency_code: 'USD', value: amount },
          },
        ],
      }),
    });
    const orderBody = await orderRes.json().catch(() => ({}));
    log({ source: 'PAYPAL', label: 'POST /v2/checkout/orders (create order)', method: 'POST', status: orderRes.status, durationMs: Date.now() - orderStart, body: orderBody });

    if (!orderRes.ok) {
      const details = (orderBody as { details?: unknown[] })?.details;
      if (details?.length) {
        log({ source: 'PAYPAL', label: 'PayPal error details array', status: orderRes.status, body: details });
      }
      log({ source: 'SYSTEM', label: '422 diagnostics hint', status: 'DIAGNOSTIC', body: { likelyCauses: ['amount.value must be a plain string like "450.00" (no $ or commas)', 'description must be at most 127 chars', 'duplicate PayPal-Request-Id with different payload', 'currency not supported for this account'], sentPayload: { intent: 'CAPTURE', purchase_units: [{ description: unitDescription, amount: { currency_code: 'USD', value: amount } }] } } });
      return paypalErrorResponse(orderRes.status, orderBody, logs);
    }

    const approveLink = orderBody?.links?.find((l: { rel: string }) => l.rel === 'approve')?.href;
    if (!approveLink) {
      return NextResponse.json({ error: 'PayPal did not return an approval link.', logs }, { status: 502 });
    }

    return NextResponse.json({ orderId: orderBody.id, approveLink, logs });
  } catch (err) {
    const e = err as { status?: number; raw?: unknown; message?: string };
    if (e.raw !== undefined) return paypalErrorResponse(e.status ?? 500, e.raw, logs);
    log({ source: 'SYSTEM', label: 'Unhandled server error', status: 500, body: { message: e.message } });
    return NextResponse.json({ error: 'Failed to create PayPal order.', logs }, { status: 500 });
  }
}
