import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { auth } from "@clerk/nextjs/server";

const RootLayout = async ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const { has } = await auth();
    const plan = has({ plan: "pro" }) ? "pro" : "free";

    return (
        <div className="h-full">
            <Navbar plan={plan} />
            <div className="hidden md:flex mt-16 w-20 flex-col fixed insert-y-0">
                <Sidebar />
            </div>
            <main className="md:pl-20 pt-16 h-full">{children}</main>
        </div>
    );
};

export default RootLayout;