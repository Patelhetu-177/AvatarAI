// lib/actions/auth.action.ts
"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/firebase/admin";

// Define the parameter types
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
  const { userId } = auth();

  if (!userId) {
    return null;
  }

  try {
    const clerkUser = await clerkClient.users.getUser(userId);

    const userRecord = await db.collection("users").doc(userId).get();

    if (!userRecord.exists) {
      console.warn("User exists in Clerk but not Firestore. Creating record.");
      await db
        .collection("users")
        .doc(userId)
        .set({
          name: clerkUser.firstName || "User",
          email: clerkUser.emailAddresses?.[0]?.emailAddress,
        });

      return {
        id: userId,
        name: clerkUser.firstName || "User",
        email: clerkUser.emailAddresses?.[0]?.emailAddress,
      };
    }

    return {
      ...userRecord.data(),
      id: userRecord.id,
    } as User;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}
