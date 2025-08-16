import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CompanionForm } from "../components/companion-form";
import { Companion } from "@prisma/client";
import { Category } from "@prisma/client";

export const dynamic = "force-dynamic";

interface CompanionIdPageProps {
  params: {
    companionId: string;
  };
}

const CompanionPage = async ({ params }: CompanionIdPageProps) => {
  const { userId } = auth();

  if (!userId) {
    return redirect("/sign-in");
  }

  let companion: Companion | null = null;
  const categories: Category[] = await prismadb.category.findMany();

  const idFromParams = params.companionId;

  if (idFromParams && idFromParams !== "new") {
    companion = await prismadb.companion.findUnique({
      where: {
        id: idFromParams,
        userId,
      },
    });
  }

  return (
    <CompanionForm
      initialData={companion ?? undefined}
      categories={categories}
    />
  );
};

export default CompanionPage;
