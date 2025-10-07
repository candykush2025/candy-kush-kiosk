import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    
    const {
      price_amount,
      price_currency,
      pay_currency,
      order_id,
      order_description,
      ipn_callback_url
    } = body;

    // Validate required fields
    if (!price_amount || !price_currency || !pay_currency) {
      return NextResponse.json(
        { error: 'Missing required fields: price_amount, price_currency, pay_currency' },
        { status: 400 }
      );
    }

    const paymentData = {
      price_amount: parseFloat(price_amount),
      price_currency,
      pay_currency,
      order_id,
      order_description,
      ipn_callback_url,
      is_fixed_rate: true,
      is_fee_paid_by_user: false
    };

    console.log('Creating NOWPayments payment:', paymentData);

    const response = await fetch('https://api.nowpayments.io/v1/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.NOWPAYMENT_API_KEY
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('NOWPayments API error:', response.status, errorData);
      throw new Error(`Payment creation failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('NOWPayments response:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}