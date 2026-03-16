import { inngest } from "@/lib/inngest/client";
import { headers } from "next/headers";
import crypto from "crypto";
import { NextResponse } from "next/server";

function verifyWebhook(
  secret: string,
  body: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
): boolean {
  const secretBytes = Buffer.from(secret.replace("whsec_", ""), "base64");
  const toSign = `${svixId}.${svixTimestamp}.${body}`;
  const expectedSignature = crypto
    .createHmac("sha256", secretBytes)
    .update(toSign)
    .digest("base64");

  const signatures = svixSignature.split(" ");
  return signatures.some((sig) => {
    const sigValue = sig.split(",")[1];
    return sigValue === expectedSignature;
  });
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET to your .env file");
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 },
    );
  }

  const body = await req.text();

  const isValid = verifyWebhook(
    WEBHOOK_SECRET,
    body,
    svix_id,
    svix_timestamp,
    svix_signature,
  );

  if (!isValid) {
    return NextResponse.json(
      { error: "Webhook verification failed" },
      { status: 400 },
    );
  }

  const evt = JSON.parse(body);

  if (evt.type === "user.created") {
    const { id, email_addresses, first_name, last_name } = evt.data;

    const email = email_addresses?.[0]?.email_address;
    const name = [first_name, last_name].filter(Boolean).join(" ") || null;

    console.log("[Clerk Webhook] user.created:", { id, email, name, email_addresses });

    if (email) {
      await inngest.send({
        name: "app/user.created",
        data: {
          userId: id,
          email,
          name,
        },
      });
    } else {
      console.error("[Clerk Webhook] No email found in email_addresses:", email_addresses);
    }
  }

  return NextResponse.json({ success: true });
}
