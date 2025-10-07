import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { payment_id } = params;

    if (!payment_id) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    console.log('Checking payment status for:', payment_id);

    const response = await fetch(`https://api.nowpayments.io/v1/payment/${payment_id}`, {
      headers: {
        'x-api-key': process.env.NOWPAYMENT_API_KEY
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('NOWPayments status check error:', response.status, errorData);
      throw new Error(`Status check failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Payment status response:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}