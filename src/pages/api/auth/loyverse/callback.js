// OAuth callback handler for Loyverse
import { exchangeCodeForToken } from "../../../../lib/loyverse";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, state, error } = req.query;

  // Handle OAuth error
  if (error) {
    console.error("OAuth error:", error);
    return res.send(`
      <html>
        <head><title>OAuth Error</title></head>
        <body>
          <h2>OAuth Authorization Failed</h2>
          <p>Error: ${error}</p>
          <p>You can close this window and try again.</p>
          <script>
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `);
  }

  // Validate required parameters
  if (!code) {
    return res.send(`
      <html>
        <head><title>OAuth Error</title></head>
        <body>
          <h2>Authorization Code Missing</h2>
          <p>No authorization code received from Loyverse.</p>
          <p>You can close this window and try again.</p>
          <script>
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `);
  }

  try {
    // Exchange authorization code for access token
    const tokenData = await exchangeCodeForToken(
      code,
      process.env.LOYVERSE_CLIENT_ID,
      process.env.LOYVERSE_CLIENT_SECRET,
      `${req.headers.host?.includes("localhost") ? "http" : "https"}://${
        req.headers.host
      }/api/auth/loyverse/callback`
    );

    // Store tokens securely (in a real app, save to database)
    // For now, we'll just log them - you should save these to your database
    console.log("Loyverse OAuth Success:", {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
    });

    // For development purposes, temporarily update environment variable
    // In production, save these tokens to your database associated with your account
    process.env.LOYVERSE_ACCESS_TOKEN = tokenData.access_token;
    process.env.LOYVERSE_REFRESH_TOKEN = tokenData.refresh_token;

    // Return success page that closes the window
    res.send(`
      <html>
        <head><title>OAuth Success</title></head>
        <body>
          <h2>✅ Authorization Successful!</h2>
          <p>Loyverse has been successfully connected.</p>
          <p>Access Token: ${tokenData.access_token.substring(0, 20)}...</p>
          <p>Scopes: ${tokenData.scope}</p>
          <p>This window will close automatically.</p>
          <script>
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Token exchange failed:", error);
    res.send(`
      <html>
        <head><title>OAuth Error</title></head>
        <body>
          <h2>Token Exchange Failed</h2>
          <p>Error: ${error.message}</p>
          <p>You can close this window and try again.</p>
          <script>
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `);
  }
}
