import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar"; 

const InterviewzLayout = ({
  children
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="h-full">
      <Navbar/>
      <div className="hidden md:flex mt-16 w-20 flex-col fixed inset-y-0"> {/* Corrected 'insert-y-0' to 'inset-y-0' */}
        <Sidebar/>
      </div>
      <main className="md:pl-20 pt-16 h-full">
        {children}
      </main>
    </div>
  )
}

export default InterviewzLayout;