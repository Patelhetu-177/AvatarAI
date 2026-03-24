// lib/actions/auth.action.ts
"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/firebase/admin";
import { inngest } from "@/lib/inngest/client";


interface SignUpParams {
  uid: string;
  name: string;
  email: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  profileURL?: string;
  resumeURL?: string;
}

export async function signUp(params: SignUpParams) {
  const { uid, name, email } = params;

  try {
    const userRecord = await db.collection("users").doc(uid).get();
    if (userRecord.exists) {
      return {
        success: false,
        message: "User already exists. Please sign in.",
      };
    }

    await db.collection("users").doc(uid).set({
      name,
      email,
    });

    await inngest.send({
      name: "app/user.created",
      data: { email, name },
    });

    return {
      success: true,
      message: "Account created successfully.",
    };
  } catch (error) {
    const err = error as { code?: string };
    console.error("Error creating user:", err);

    return {
      success: false,
      message: "Failed to create account. Please try again.",
    };
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth();
  const client = await clerkClient()

  if (!userId) {
    return null;
  }

  try {
    const clerkUser = await client.users.getUser(userId);
    const userRecord = await db.collection("users").doc(userId).get();
    if (!userRecord.exists) {
      const name = clerkUser.firstName || "User";
      const email = clerkUser.emailAddresses?.[0]?.emailAddress;

      await db.collection("users").doc(userId).set({ name, email });

      if (email) {
        await inngest.send({
          name: "app/user.created",
          data: { email, name },
        });
      } else {
        console.error(
          "[getCurrentUser] No email found on Clerk user, skipping Inngest event",
        );
      }

      return { id: userId, name, email };
    }
    return {
      ...userRecord.data(),
      id: userRecord.id,
    } as User;
  } catch (error) {
    console.error("[getCurrentUser] Error:", error);
    return null;
  }
}

export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}
