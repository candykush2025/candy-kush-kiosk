import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://api.nowpayments.io/v1/currencies?fixed_rate=true', {
      headers: {
        'x-api-key': process.env.NOWPAYMENT_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching currencies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch currencies' },
      { status: 500 }
    );
  }
}