import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawAmount = Number(body.amountUSD || body.amount || 250);
    const safeAmount = Math.min(Math.max(rawAmount, 10), 1500).toFixed(2);
    const description = String(body.milestoneTitle || body.projectTitle || "Milestone 1 Escrow")
      .replace(/[^\w\s-]/g, "")
      .slice(0, 100) || "Milestone 1 Escrow";

    const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
    const baseUrl = (process.env.PAYPAL_BASE_URL || "https://paypal.com").trim();

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      return NextResponse.json(
        { error: "PayPal Auth Failed", details: tokenData },
        { status: 400 }
      );
    }

    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          description,
          amount: {
            currency_code: "USD",
            value: safeAmount,
          },
        },
      ],
    };

    const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    const orderData = await orderRes.json();

    if (!orderRes.ok) {
      return NextResponse.json(
        {
          error: orderData?.details?.?.description || orderData?.message || "PayPal Order Failed",
          issue: orderData?.details?.?.issue,
          rawResponse: orderData,
        },
        { status: orderRes.status }
      );
    }

    return NextResponse.json({
      orderID: orderData.id,
      id: orderData.id,
      rawResponse: orderData,
      logs: [
        {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          endpoint: "POST /v2/checkout/orders",
          status: orderRes.status,
          response: orderData,
        },
      ],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server Error" }, { status: 500 });
  }
}
