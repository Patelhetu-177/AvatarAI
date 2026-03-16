import { unsubscribeUser } from "@/lib/actions/unsubscribe.action";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const result = await unsubscribeUser(email);

  if (result.success) {
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribed — AvatarAI</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background-color: #0A0A0F; color: white;">
  <div style="text-align: center; padding: 48px 40px; max-width: 440px; background: linear-gradient(160deg, #13131A 0%, #1A1A2E 50%, #1E1035 100%); border-radius: 20px; border: 1px solid rgba(108, 99, 255, 0.15);">
    <div style="font-size: 48px; margin-bottom: 16px;">&#x2705;</div>
    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #FFFFFF;">
      Unsubscribed Successfully
    </h1>
    <p style="margin: 0 0 28px 0; font-size: 15px; color: #9ca3af; line-height: 1.6;">
      You will no longer receive email updates from <strong style="color: #6C63FF;">AvatarAI</strong>. You can always re-subscribe from your settings.
    </p>
    <a href="https://avatar-ai-swart.vercel.app" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #6C63FF 0%, #9D4EDD 100%); color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 12px; letter-spacing: 0.3px;">
      Go back to AvatarAI &rarr;
    </a>
  </div>
</body>
</html>`,
      { headers: { "Content-Type": "text/html" } },
    );
  } else {
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error — AvatarAI</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background-color: #0A0A0F; color: white;">
  <div style="text-align: center; padding: 48px 40px; max-width: 440px; background: linear-gradient(160deg, #13131A 0%, #1A1A2E 50%, #1E1035 100%); border-radius: 20px; border: 1px solid rgba(108, 99, 255, 0.15);">
    <div style="font-size: 48px; margin-bottom: 16px;">&#x26A0;&#xFE0F;</div>
    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #FFFFFF;">
      Something went wrong
    </h1>
    <p style="margin: 0 0 28px 0; font-size: 15px; color: #9ca3af; line-height: 1.6;">
      We couldn't process your unsubscribe request. Please try again or contact support.
    </p>
    <a href="https://avatar-ai-swart.vercel.app" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #6C63FF 0%, #9D4EDD 100%); color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 12px; letter-spacing: 0.3px;">
      Go back to AvatarAI &rarr;
    </a>
  </div>
</body>
</html>`,
      { status: 500, headers: { "Content-Type": "text/html" } },
    );
  }
}
