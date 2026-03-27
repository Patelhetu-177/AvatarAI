import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";

export default async function ResumeAnalyzerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  const { has } = await auth();
  const plan = has({ plan: "pro" }) ? "pro" : "free";

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="h-full">
      <Navbar plan={plan} />
      <div className="hidden md:flex mt-16 w-20 flex-col fixed inset-y-0">
        <Sidebar />
      </div>
      <main className="md:pl-20 pt-16 h-full min-h-screen bg-background">
        {children}
      </main>
    </div>
  );
}
