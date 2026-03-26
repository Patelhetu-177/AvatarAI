"use server";

import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface UserSettings {
  theme: "light" | "dark" | "system";
  showPricing: boolean;
}

export async function getUserSettings(): Promise<UserSettings | null> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return null;
    }

    const preferences = await prisma.userPreference.findUnique({
      where: { userId },
      select: {
        theme: true,
        showPricing: true,
      },
    });

    if (!preferences) {
      return {
        theme: "system",
        showPricing: true,
      };
    }

    return {
      theme: preferences.theme as "light" | "dark" | "system",
      showPricing: preferences.showPricing,
    };
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return null;
  }
}

export async function updateUserSettings(
  settings: Partial<UserSettings>
): Promise<{ success: boolean; message: string }> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, message: "Unauthorized" };
    }

    const user = await auth();
    if (!user.userId) {
      return { success: false, message: "User not found" };
    }

    await prisma.userPreference.upsert({
      where: { userId },
      update: {
        ...settings,
        updatedAt: new Date(),
      },
      create: {
        userId,
        email: "", 
        theme: settings.theme || "system",
        showPricing: settings.showPricing ?? true,
      },
    });

    return { success: true, message: "Settings updated successfully" };
  } catch (error) {
    console.error("Error updating user settings:", error);
    return { success: false, message: "Failed to update settings" };
  } finally {
    await prisma.$disconnect();
  }
}
