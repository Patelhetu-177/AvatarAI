import { redirect } from "next/navigation";
import prismadb from "@/lib/prismadb";
import { CompanionForm } from "../components/companion-form";
import { auth } from "@clerk/nextjs/server";

const CompanionCreatePage = async () => {
  const { userId } = auth();

  if (!userId) {
    return redirect("/sign-in");
  }
  
  const categories = await prismadb.category.findMany();

  return (
    <CompanionForm
      initialData={undefined}
      categories={categories}
    />
  );
};

export default CompanionCreatePage;
