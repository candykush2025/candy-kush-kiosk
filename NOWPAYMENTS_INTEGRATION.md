# NOWPayments Integration Guide

## Overview

This guide explains how to integrate NOWPayments into your website to accept cryptocurrency payments. It covers creating invoices, reading invoice status, handling IPN/webhooks, verifying payments, sample code (Node.js and PHP), testing, and troubleshooting.

**Note:** Replace placeholders like `YOUR_API_KEY`, `YOUR_ORDER_ID`, and `YOUR_CALLBACK_URL` with your real values.

---

## Quick Facts

- **Base API URL (current):** https://api.nowpayments.io/v1
- **Authentication:** API key in request header (`x-api-key`)
- **Common flows:**
  - Create an invoice (client/server) → receive payment URL / payment data
  - Customer pays on NOWPayments checkout
  - NOWPayments calls your IPN/webhook URL (optional)
  - Verify payment by checking invoice status via the API
- **Always verify IPN callbacks** by querying the invoice via the API (don't trust the webhook payload alone)

---

## 1) Create an Invoice (Server-side Recommended)

Create invoices on your server using your API key. Minimal payload:

### Request

- **Method:** POST
- **URL:** https://api.nowpayments.io/v1/invoice
- **Headers:**
  - Content-Type: application/json
  - x-api-key: YOUR_API_KEY

### Body (Example JSON)

```json
{
  "price_amount": 12.5,
  "price_currency": "THB",
  "pay_currency": "BTC",
  "order_id": "ORDER-12345",
  "ipn_callback_url": "https://your-site.com/api/nowpayments/ipn",
  "success_url": "https://your-site.com/pay/success",
  "cancel_url": "https://your-site.com/pay/cancel",
  "buyer_email": "customer@example.com",
  "title": "Order #12345"
}
```

### Response (Typical)

A JSON object containing invoice id, payment url(s), amounts, currency info, and status.
**Important fields:**

- `id` or `invoice_id`: unique invoice identifier
- `payment_url` or `invoice_url`: checkout page for the customer
- `price_amount` / `price_currency`
- `pay_amount` / `pay_currency` (amount in crypto)
- `status`: current invoice status (waiting/confirming/paid/finished/failed — see your account's API docs for exact values)

### Example cURL

```bash
curl -X POST "https://api.nowpayments.io/v1/invoice" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"price_amount":12.5,"price_currency":"THB","order_id":"ORDER-12345","ipn_callback_url":"https://your-site.com/api/nowpayments/ipn"}'
```

### Notes

- Create the invoice server-side so API key stays secret
- Capture `response.invoice_url` to redirect the user to the NOWPayments checkout
- Save invoice id and mapping to your local order id for later verification

---

## 2) Webhook / IPN Handling

NOWPayments can call your server after status updates. Configure `ipn_callback_url` when creating the invoice or in your merchant dashboard.

### Best Practices

- Always respond quickly (HTTP 200) to acknowledge you received the webhook
- **Do not trust the webhook payload blindly.** Verify by querying the invoice via the API (GET /invoice/{id})
- Implement idempotency: process each invoice ID once (store processed invoice IDs or use order lock)

### Example Webhook Payload

```json
{
  "invoice_id": "abc123",
  "order_id": "ORDER-12345",
  "price_amount": 12.5,
  "price_currency": "THB",
  "pay_amount": 0.000345,
  "pay_currency": "BTC",
  "status": "finished"
}
```

### Webhook Processing Steps

1. Receive the HTTP POST from NOWPayments
2. Extract `invoice_id` or `order_id` from the payload
3. Call the NOWPayments API to fetch the invoice details (GET /invoice/{invoice_id}) using your API key
4. Verify:
   - `invoice_id` matches
   - `order_id` matches your local order
   - `price_amount` / `price_currency` match (or are within acceptable tolerance)
   - `status` is one you consider paid (e.g., `finished` / `paid`)
   - `pay_amount` > 0 and `pay_currency` is expected (optional)
5. If valid and not processed before, mark your local order as paid and do fulfillment
6. Return 200 OK

### Why Re-query the Invoice?

- The webhook can be spoofed; re-querying with your API key ensures data authenticity
- The GET response comes directly from NOWPayments so you have a single source of truth

---

## 3) Verify Invoice (Server-side Example)

### Endpoint to Query Invoice

- **GET** https://api.nowpayments.io/v1/invoice/{invoice_id}
- **Header:** x-api-key: YOUR_API_KEY

### Example Node.js (fetch)

```javascript
const res = await fetch(`https://api.nowpayments.io/v1/invoice/${invoiceId}`, {
  headers: { "x-api-key": process.env.NOWPAYMENTS_API_KEY },
});
const invoice = await res.json();
```

Check `invoice.status` and returned amounts.

---

## 4) Status Mapping & Business Rules

Common statuses you will see (names may vary slightly by API version):

- `waiting`: invoice created, waiting for payment
- `confirming`: payment detected but confirmations pending
- `finished` / `paid`: payment completed and confirmed (fulfill order)
- `expired` / `canceled` / `failed`: not paid — do not fulfill

### Business Logic Decisions

- Fulfill on `finished` or when the API documents that payment is final
- Optionally accept `confirming` if you want to provision provisional resources (not recommended)

---

## 5) Sample Node.js Server: Create Invoice and Webhook Verify

### Create Invoice (Server)

```javascript
const fetch = require("node-fetch"); // or native fetch

async function createInvoice(orderId, amountTHB, callbackUrl) {
  const payload = {
    price_amount: amountTHB,
    price_currency: "THB",
    order_id: orderId,
    ipn_callback_url: callbackUrl,
  };

  const res = await fetch("https://api.nowpayments.io/v1/invoice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.NOWPAYMENTS_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed creating invoice");
  return res.json();
}
```

### Webhook Handler (Express)

```javascript
const express = require("express");
const router = express.Router();

router.post("/api/nowpayments/ipn", async (req, res) => {
  try {
    const payload = req.body; // JSON body parser required
    const invoiceId = payload.invoice_id || payload.id;

    if (!invoiceId) {
      res.status(400).send("Missing invoice id");
      return;
    }

    // Verify invoice by fetching it from NOWPayments
    const verifyRes = await fetch(
      `https://api.nowpayments.io/v1/invoice/${invoiceId}`,
      {
        headers: { "x-api-key": process.env.NOWPAYMENTS_API_KEY },
      }
    );

    const invoice = await verifyRes.json();

    // Basic checks
    // 1) invoice.order_id matches your order
    // 2) invoice.price_amount matches your expected price
    // 3) invoice.status is 'finished' (or final)

    if (invoice && invoice.status === "finished") {
      // mark order as paid (idempotent)
      // fulfill order
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("IPN handling error", err);
    // respond 200 to avoid repeated webhooks OR 500 to retry depending on your policy
    res.status(500).send("Error");
  }
});
```

### Notes

- Use a signature verification method if NOWPayments supports an IPN secret; otherwise rely on server-side GET verification
- Persist `invoiceId` and processed status to guarantee idempotency

---

## 6) Sample PHP cURL: Create Invoice

```php
<?php
$apiKey = 'YOUR_API_KEY';
$data = [
  'price_amount' => 12.5,
  'price_currency' => 'THB',
  'order_id' => 'ORDER-12345',
  'ipn_callback_url' => 'https://your-site.com/api/nowpayments/ipn'
];

$ch = curl_init('https://api.nowpayments.io/v1/invoice');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  'Content-Type: application/json',
  'x-api-key: ' . $apiKey
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

$res = curl_exec($ch);
curl_close($ch);

$response = json_decode($res, true);
?>
```

---

## 7) Important Security & Reliability Tips

- Keep API key secret and only use it server-side
- Verify all IPNs by re-querying the invoice via the API
- Apply idempotency to prevent double-processing
- Use TLS/HTTPS for webhooks and restrict IPN endpoints to POST only
- Log webhook payloads and verification attempts for debugging
- Implement retry/backoff when calling NOWPayments API if network errors occur
- Sanity check amounts and currencies before fulfilling an order

---

## 8) Testing Checklist

- Create an invoice with a small amount and open the returned `invoice_url` to simulate payment
- If NOWPayments provides a sandbox or test mode, use it (check your merchant dashboard)
- Test webhook receiver: temporarily use a request inspector (e.g., webhook.site or ngrok) to capture a real IPN call and see payload structure
- Simulate partial/failure states to ensure your order flow handles retries and cancellations
- Confirm idempotency: deliver the webhook multiple times and ensure order processed once

---

## 9) Troubleshooting

- **Issue:** "Webhook received but invoice status not found" — Ensure you saved the invoice id returned from create invoice and query that same id
- **Issue:** "Invoice status is 'confirming' and not final" — Wait for final status or define confirmation thresholds
- **Issue:** "Unexpected currency/pay_amount" — validate against your expected price and currency and avoid fulfilling if mismatch
- **Issue:** "IPN spoofing" — verify by calling GET /invoice/{id} using your API key

---

## 10) Example cURL Commands

### Create Invoice

```bash
curl -X POST "https://api.nowpayments.io/v1/invoice" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"price_amount":12.5,"price_currency":"THB","order_id":"ORDER-12345","ipn_callback_url":"https://your-site.com/api/nowpayments/ipn"}'
```

### Get Invoice

```bash
curl -X GET "https://api.nowpayments.io/v1/invoice/INVOICE_ID" \
  -H "x-api-key: YOUR_API_KEY"
```

---

## 11) Environment Variables

Add these to your `.env` file:

```
NOWPAYMENTS_API_KEY=your_api_key_here
NOWPAYMENTS_IPN_SECRET=your_ipn_secret_if_available
```

## 12) Next Steps

- Add concrete sample code integrated with your site stack (Next.js API route + webhook handler)
- Create an automated test harness that simulates IPN payloads and verifies your webhook logic
- Add environment variable instructions and .env.example for NOWPayments key
