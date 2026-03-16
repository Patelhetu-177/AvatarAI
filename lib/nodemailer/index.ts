import nodemailer from "nodemailer";
import { WELCOME_EMAIL_TEMPLATE } from "./templates";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

interface WelcomeEmailData {
  email: string;
  name: string;
  intro: string;
}

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://avatar-ai-swart.vercel.app");

export const sendWelcomeEmail = async ({
  email,
  name,
  intro,
}: WelcomeEmailData) => {
  const unsubscribeUrl = `${APP_URL}/api/unsubscribe?email=${encodeURIComponent(email)}`;
  const htmlTemplate = WELCOME_EMAIL_TEMPLATE.replace("{{name}}", name)
    .replace("{{intro}}", intro)
    .replace("{{unsubscribeUrl}}", unsubscribeUrl);

  const mailOptions = {
    from: `"AvatarAI" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: `Welcome to AvatarAI, ${name}! Your AI Companion Awaits`,
    text: "Thanks for joining AvatarAI — your AI-powered world is ready!",
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};
