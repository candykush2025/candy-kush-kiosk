import { NextResponse } from "next/server";

/**
 * Loyverse API Proxy Handler
 * This route proxies requests to Loyverse API to avoid CORS issues
 * Documentation: https://developer.loyverse.com/
 */

const LOYVERSE_API_BASE = "https://api.loyverse.com/v1.0";
const LOYVERSE_ACCESS_TOKEN = process.env.LOYVERSE_ACCESS_TOKEN;

export async function GET(request) {
  try {
    // Check if access token is configured
    if (!LOYVERSE_ACCESS_TOKEN) {
      return NextResponse.json(
        {
          error: true,
          message: "Loyverse access token not configured",
        },
        { status: 500 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");

    if (!endpoint) {
      return NextResponse.json(
        {
          error: true,
          message: "Endpoint parameter is required",
        },
        { status: 400 }
      );
    }

    // Build Loyverse API URL
    const loyverseURL = new URL(`${LOYVERSE_API_BASE}${endpoint}`);

    // Copy all query parameters except 'endpoint' to Loyverse API request
    searchParams.forEach((value, key) => {
      if (key !== "endpoint") {
        loyverseURL.searchParams.append(key, value);
      }
    });

    console.log(`[Loyverse API] Fetching: ${loyverseURL.toString()}`);

    // Make request to Loyverse API
    const response = await fetch(loyverseURL.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${LOYVERSE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Loyverse API] Error ${response.status}:`, errorText);

      return NextResponse.json(
        {
          error: true,
          message: `Loyverse API Error: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    // Parse and return response
    const data = await response.json();
    console.log(
      `[Loyverse API] Success: ${endpoint} - Items returned:`,
      data.items?.length || data.categories?.length || "N/A"
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Loyverse API] Exception:", error);

    return NextResponse.json(
      {
        error: true,
        message: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
