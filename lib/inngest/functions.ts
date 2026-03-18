import { inngest } from "@/lib/inngest/client";
import {
  MONTHLY_EXPLORE_EMAIL_PROMPT,
  PERSONALIZED_WELCOME_EMAIL_PROMPT,
} from "./prompt";
import {
  sendMonthlyExploreCampaignEmail,
  sendWelcomeEmail,
} from "../nodemailer";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { getAllUsersForMonthlyEmail } from "@/lib/actions/user.action";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const FALLBACK_INTRO = `<p class="mobile-text" style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">You just unlocked something epic! Chat with <strong>AI avatars</strong> of your favorite celebrities, create your own characters, ace interviews with our AI Voice Agent, and explore 15+ languages. Your AI playground is ready.</p>`;

const FALLBACK_MONTHLY_FEATURE_CONTENT = `<div class="dark-info-box" style="background-color: #212328; padding: 20px; margin: 18px 0; border-radius: 10px; border-left: 3px solid #6C63FF;"><h4 class="dark-text" style="margin: 0 0 10px 0; font-size: 18px; font-weight: 700; color: #FFFFFF; line-height: 1.4;">Your AvatarAI Core Features</h4><ul style="margin: 12px 0 16px 0; padding-left: 0; margin-left: 0; list-style: none;"><li class="dark-text-secondary" style="margin: 0 0 12px 0; font-size: 15px; line-height: 1.6; color: #CCDADC;"><span style="color: #FDD458; font-weight: bold; font-size: 20px; margin-right: 8px;">•</span>Chat with iconic AI avatars for ideas, learning, and perspective.</li><li class="dark-text-secondary" style="margin: 0 0 12px 0; font-size: 15px; line-height: 1.6; color: #CCDADC;"><span style="color: #FDD458; font-weight: bold; font-size: 20px; margin-right: 8px;">•</span>Create custom companions tailored to your own style and goals.</li><li class="dark-text-secondary" style="margin: 0 0 12px 0; font-size: 15px; line-height: 1.6; color: #CCDADC;"><span style="color: #FDD458; font-weight: bold; font-size: 20px; margin-right: 8px;">•</span>Practice mock interviews and improve with instant AI feedback.</li><li class="dark-text-secondary" style="margin: 0 0 12px 0; font-size: 15px; line-height: 1.6; color: #CCDADC;"><span style="color: #FDD458; font-weight: bold; font-size: 20px; margin-right: 8px;">•</span>Use InterviewMate for structured Q&A and faster topic mastery.</li><li class="dark-text-secondary" style="margin: 0 0 12px 0; font-size: 15px; line-height: 1.6; color: #CCDADC;"><span style="color: #FDD458; font-weight: bold; font-size: 20px; margin-right: 8px;">•</span>Generate smart quizzes and track where you can improve next.</li><li class="dark-text-secondary" style="margin: 0 0 12px 0; font-size: 15px; line-height: 1.6; color: #CCDADC;"><span style="color: #FDD458; font-weight: bold; font-size: 20px; margin-right: 8px;">•</span>Upload PDF, Word, or Excel files and chat with your documents.</li></ul><div style="background-color: #141414; border: 1px solid #374151; padding: 14px; border-radius: 6px; margin: 10px 0 0 0;"><p class="dark-text-secondary" style="margin: 0; font-size: 14px; color: #CCDADC; line-height: 1.5;">💡 <strong style="color: #FDD458;">Bottom Line:</strong> AvatarAI gives you one place to learn, practice, and build confidence every day.</p></div></div>`;

export const sendSignUpEmailAvatarAI = inngest.createFunction(
  { id: "send-signup-email-avatarai" },
  { event: "app/user.created" },
  async ({ event, step }) => {
    console.log(
      "[Inngest] Function invoked. Full event.data:",
      JSON.stringify(event.data),
    );

    const email = event.data.email as string | undefined;
    const name = (event.data.name as string) || "there";

    if (!email) {
      console.error(
        "[Inngest] No email found in event data:",
        JSON.stringify(event.data),
      );
      return { success: false, message: "No email provided" };
    }

    console.log("[Inngest] Processing welcome email for:", { email, name });

    const introText = await step.run("generate-welcome-intro", async () => {
      try {
        const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
          /\{\{userName\}\}/g,
          name,
        );

        const response = await generateText({
          model: google("gemini-2.5-flash"),
          prompt,
        });

        if (response.text) {
          return response.text;
        }
      } catch (error) {
        console.error(
          "Gemini AI intro generation failed, using fallback:",
          error,
        );
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

export const sendMonthlyExploreEmail = inngest.createFunction(
  { id: "send-monthly-explore-email" },
   [{ event: "app/send.monthly.explore" }, { cron: "30 6 1 * *" }], // 12 PM IST on 1st day of each month
  async ({ step }) => {
    const users = await step.run(
      "get-subscribed-users",
      getAllUsersForMonthlyEmail,
    );

    if (!users.length) {
      return { success: false, message: "No subscribed users found" };
    }

    const usersWithContent = await step.run(
      "generate-explore-content",
      async () => {
        return Promise.all(
          users.map(async (user) => {
            try {
              const prompt = MONTHLY_EXPLORE_EMAIL_PROMPT.replace(
                /\{\{userName\}\}/g,
                user.name,
              );

              const response = await generateText({
                model: google("gemini-2.5-flash"),
                prompt,
              });

              return {
                ...user,
                featureContent:
                  response.text || FALLBACK_MONTHLY_FEATURE_CONTENT,
              };
            } catch (error) {
              console.error(
                `Failed to generate monthly explore content for ${user.email}:`,
                error,
              );
              return {
                ...user,
                featureContent: FALLBACK_MONTHLY_FEATURE_CONTENT,
              };
            }
          }),
        );
      },
    );

    // Batch sending: 5 users at a time with 2-minute delays
    const BATCH_SIZE = 5;
    const BATCH_DELAY_MS = 2 * 60 * 1000; // 2 minutes in milliseconds
    let totalSent = 0;
    let totalFailed = 0;

    for (let i = 0; i < usersWithContent.length; i += BATCH_SIZE) {
      const batch = usersWithContent.slice(i, i + BATCH_SIZE);
      const batchIndex = Math.floor(i / BATCH_SIZE);

      const result = await step.run(
        `send-explore-emails-batch-${batchIndex}`,
        async () => {
          const settled = await Promise.allSettled(
            batch.map(({ email, name, featureContent }) => {
              return sendMonthlyExploreCampaignEmail({
                email,
                name,
                featureContent,
              });
            }),
          );

          const sent = settled.filter(
            (item) => item.status === "fulfilled",
          ).length;
          const failed = settled.length - sent;

          console.log(
            `[Inngest] Batch ${batchIndex}: Sent ${sent}/${batch.length} emails`,
          );

          return { sent, failed };
        },
      );

      totalSent += result.sent;
      totalFailed += result.failed;

      if (i + BATCH_SIZE < usersWithContent.length) {
        await step.sleep("wait-before-next-batch-" + batchIndex, BATCH_DELAY_MS);
      }
    }

    return {
      success: true,
      message: "Explore emails processed in batches",
      total: users.length,
      sent: totalSent,
      failed: totalFailed,
    };
  },
);
