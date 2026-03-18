import nodemailer from "nodemailer";
import {
  MONTHLY_EXPLORE_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
} from "./templates";

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

interface ExploreEmailData {
  email: string;
  name: string;
  featureContent?: string;
}

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://avatar-ai-swart.vercel.app";

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

export const sendMonthlyExploreCampaignEmail = async ({
  email,
  name,
  featureContent,
}: ExploreEmailData) => {
  const unsubscribeUrl = `${APP_URL}/api/unsubscribe?email=${encodeURIComponent(email)}`;
  const htmlTemplate = MONTHLY_EXPLORE_EMAIL_TEMPLATE.replace(
    /\{\{name\}\}/g,
    name,
  )
    .replace("{{featureContent}}", featureContent || "")
    .replace("{{unsubscribeUrl}}", unsubscribeUrl);

  const mailOptions = {
    from: `"AvatarAI" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: "Visit AvatarAI: Explore Every Core Feature",
    text: `Discover all AvatarAI core features and visit: ${APP_URL}`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};
