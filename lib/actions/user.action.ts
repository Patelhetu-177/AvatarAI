"use server";

import { db } from "@/firebase/admin";
import prismadb from "@/lib/prismadb";

export interface UserForMonthlyEmail {
  id: string;
  email: string;
  name: string;
}

const deriveNameFromEmail = (email: string) => {
  const raw = email.split("@")[0]?.trim();
  if (!raw) return "there";

  const cleaned = raw.replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return "there";

  return cleaned
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

export const getAllUsersForMonthlyEmail = async (): Promise<UserForMonthlyEmail[]> => {
  try {
    const [usersSnapshot, unsubscribed] = await Promise.all([
      db.collection("users").get(),
      prismadb.userPreference.findMany({
        where: { emailSubscribed: false },
        select: { email: true },
      }),
    ]);

    const unsubscribedSet = new Set(
      unsubscribed
        .map((item) => item.email?.trim().toLowerCase())
        .filter((email): email is string => !!email),
    );

    return usersSnapshot.docs
      .map((doc) => {
        const data = doc.data() as { email?: string; name?: string };
        const email = data.email?.trim();
        const name = data.name?.trim();

        return {
          id: doc.id,
          email,
          name: name || (email ? deriveNameFromEmail(email) : "there"),
        };
      })
      .filter(
        (user): user is UserForMonthlyEmail =>
          !!user.email && !unsubscribedSet.has(user.email.toLowerCase()),
      );
  } catch (e) {
    console.error("Error fetching users for monthly email:", e);
    return [];
  }
};
