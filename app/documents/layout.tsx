import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

export default async function DocumentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="h-full">
      <Navbar />
      <div className="hidden md:flex mt-16 w-20 flex-col fixed inset-y-0">
        <Sidebar />
      </div>
      <main className="md:pl-20 pt-16 h-full">
        {children}
      </main>
    </div>
  );
}