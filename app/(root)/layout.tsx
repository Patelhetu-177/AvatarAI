import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { getCurrentUser } from "@/lib/actions/auth.action";

const RootLayout = async ({
    children
}: {
    children: React.ReactNode;
}) => {
    // Ensures new users get a Firestore record + welcome email event
    await getCurrentUser();

    return (
        <div className="h-full">
            <Navbar/>
            <div className="hidden md:flex mt-16 w-20 flex-col fixed insert-y-0">
                <Sidebar/>
            </div>
            <main className="md:pl-20 pt-16 h-full">
            {children}
            </main>
        </div>
    )
}

export default RootLayout