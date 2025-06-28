export const dynamic = "force-dynamic";

import prismadb from "@/lib/prismadb";
import { CompanionForm } from "./components/companion-form";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation"; // ✅ Added

interface CompanionIdPageProps {
  params: {
    companionId: string;
  };
}

const CompanionPage = async ({ params }: CompanionIdPageProps) => {
  const { userId } = auth();

  if (!userId) {
    return redirect("/sign-in"); // ✅ Fixed redirect
  }

  const companion = await prismadb.companion.findUnique({
    where: {
      id: params.companionId,
      userId,
    },
  });

  const categories = await prismadb.category.findMany();

  return (
    <CompanionForm
      initialData={companion ?? undefined}
      categories={categories}
    />
  );
};

export default CompanionPage;
