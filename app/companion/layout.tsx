import { Navbar } from "@/components/Navbar";
import { auth } from "@clerk/nextjs/server";
import { Sidebar } from "@/components/Sidebar";

const CompanionLayout = async ({ children }: { children: React.ReactNode }) => {
  const { has } = await auth();
  const plan = has({ plan: "pro" }) ? "pro" : "free";

  return (
    <div className="h-full">
      <Navbar plan={plan} />
      <div className="hidden md:flex mt-16 w-20 flex-col fixed inset-y-0">
        {" "}
        {/* Corrected 'insert-y-0' to 'inset-y-0' */}
        <Sidebar />
      </div>
      <main className="md:pl-20 pt-16 h-full">{children}</main>
    </div>
  );
};

export default CompanionLayout;
