import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SettingsClient } from "./settings-client";

async function SettingsPage() {
  const { userId } = await auth();

  if (!userId) {
    return redirect("/sign-in");
  }

  return <SettingsClient />;
}

export default SettingsPage;
