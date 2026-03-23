import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";

export default function ImageStudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full">
      <Navbar />
      <div className="hidden md:flex mt-16 w-20 flex-col fixed insert-y-0">
        <Sidebar />
      </div>    
      <main className="md:pl-20 pt-16 h-full bg-secondary">
        {children}
      </main>
    </div>
  );
}
