import { inngest } from "@/lib/inngest/client";
import { PERSONALIZED_WELCOME_EMAIL_PROMPT } from "./prompt";
import { sendWelcomeEmail } from "../nodemailer";

const FALLBACK_INTRO = `<p class="mobile-text" style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">You just unlocked something epic! Chat with <strong>AI avatars</strong> of your favorite celebrities, create your own characters, ace interviews with our AI Voice Agent, and explore 15+ languages. Your AI playground is ready.</p>`;

export const sendSignUpEmail = inngest.createFunction(
  { id: "send-signup-email" },
  { event: "app/user.created" },
  async ({ event, step }) => {
    const email = event.data.email as string | undefined;
    const name = (event.data.name as string) || "there";

    if (!email) {
      console.error("No email found in event data:", JSON.stringify(event.data));
      return { success: false, message: "No email provided" };
    }

    const introText = await step.run("generate-welcome-intro", async () => {
      try {
        const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
          /\{\{userName\}\}/g,
          name,
        );

        const { google } = await import("@ai-sdk/google");
        const { generateText } = await import("ai");
        const response = await generateText({
          model: google("gemini-2.5-flash"),
          prompt,
        });

        if (response.text) {
          return response.text;
        }
      } catch (error) {
        console.error("Gemini AI intro generation failed, using fallback:", error);
      }
      return FALLBACK_INTRO;
    });

    await step.run("send-welcome-email", async () => {
      await sendWelcomeEmail({ email, name, intro: introText });
      return { email, name };
    });

    return {
      success: true,
      message: "Welcome email sent successfully",
    };
  },
);