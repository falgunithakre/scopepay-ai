const API_BASES = {
  sandbox: 'https://api-m.sandbox.paypal.com',
  live: 'https://api-m.paypal.com',
} as const;

export type PaypalEnv = keyof typeof API_BASES;

export function paypalConfig() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const env: PaypalEnv = process.env.PAYPAL_ENV === 'live' ? 'live' : 'sandbox';
  return { clientId, clientSecret, base: API_BASES[env], env };
}

export async function getAccessToken(
  base: string,
  clientId: string,
  clientSecret: string,
): Promise<{ token: string; raw: unknown }> {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const raw = await res.json().catch(() => ({}));
  if (!res.ok || !raw?.access_token) {
    throw Object.assign(new Error(raw?.error_description || 'PayPal authentication failed'), {
      status: res.status,
      raw,
    });
  }
  return { token: raw.access_token as string, raw };
}

export function paypalErrorResponse(status: number, raw: unknown, logs?: unknown) {
  const message =
    (raw as { message?: string; error_description?: string })?.message ||
    (raw as { error_description?: string })?.error_description ||
    'PayPal request failed';
  return Response.json({ error: message, paypal: raw, logs }, { status });
}
