import prismadb from "@/lib/prismadb";

export const unsubscribeUser = async (email: string) => {
  try {
    const result = await prismadb.userPreference.updateMany({
      where: { email, emailSubscribed: true },
      data: { emailSubscribed: false },
    });

    return { success: result.count > 0 };
  } catch (e) {
    console.error("Error unsubscribing user:", e);
    return { success: false, error: "Failed to unsubscribe" };
  }
};
