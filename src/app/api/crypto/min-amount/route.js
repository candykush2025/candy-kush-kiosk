import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const currencyFrom = searchParams.get("currency_from");
    const currencyTo = searchParams.get("currency_to") || "trx";
    const fiatEquivalent = searchParams.get("fiat_equivalent") || "usd";
    const isFixedRate = searchParams.get("is_fixed_rate") || "false";
    const isFeePaidByUser = searchParams.get("is_fee_paid_by_user") || "false";

    if (!currencyFrom) {
      return NextResponse.json(
        { error: "currency_from is required" },
        { status: 400 }
      );
    }

    const url = `https://api.nowpayments.io/v1/min-amount?currency_from=${currencyFrom}&currency_to=${currencyTo}&fiat_equivalent=${fiatEquivalent}&is_fixed_rate=${isFixedRate}&is_fee_paid_by_user=${isFeePaidByUser}`;

    const response = await fetch(url, {
      headers: {
        "x-api-key": process.env.NOWPAYMENT_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching minimum amount:", error);
    return NextResponse.json(
      { error: "Failed to fetch minimum amount" },
      { status: 500 }
    );
  }
}
