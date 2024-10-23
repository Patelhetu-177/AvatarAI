import prismadb from "@/lib/prismadb";
import { CompanionForm } from "./components/companion-form";
import { auth } from "@clerk/nextjs/server";

interface CompanionIdPageProps {
  params: {
    companionId: string;
  };
}

const CompanionPage = async ({ params }: CompanionIdPageProps) => {
  const { userId } = auth();

  if (!userId) {
    return auth().redirectToSignIn();
  }

  const companion = await prismadb.companion.findUnique({
    where: {
      id: params.companionId,
      userId,
    },
  });

  const categories = await prismadb.category.findMany();

  // If no companion is found, handle null by passing undefined to initialData
  return (
    <CompanionForm
      initialData={companion ?? undefined} // Use undefined if null
      categories={categories}
    />
  );
};

export default CompanionPage;
