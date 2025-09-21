import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check environment variables
    const hasClientId = !!process.env.LOYVERSE_CLIENT_ID;
    const hasClientSecret = !!process.env.LOYVERSE_CLIENT_SECRET;
    const hasAccessToken = !!process.env.LOYVERSE_ACCESS_TOKEN;

    return NextResponse.json({
      success: true,
      data: {
        hasClientId,
        hasClientSecret,
        hasAccessToken,
        clientId: hasClientId ? process.env.LOYVERSE_CLIENT_ID : null,
        clientIdPreview: hasClientId
          ? process.env.LOYVERSE_CLIENT_ID.substring(0, 8) + "..."
          : null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
