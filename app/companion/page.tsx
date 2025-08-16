export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prismadb from "@/lib/prismadb";
import { Companion } from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { SearchInput } from "@/components/search-input";
import { Companions } from "@/components/companions";
import { Categories } from "@/components/categories";

interface CompanionsPageProps {
  searchParams: {
    name?: string;
  };
}

const CompanionsPage = async ({ searchParams }: CompanionsPageProps) => {
  const { userId } = auth();

  if (!userId) {
    return redirect("/sign-in");
  }

  const companions: (Companion & {
    _count: { messages: number };
  })[] = await prismadb.companion.findMany({
    where: {
      name: searchParams.name
        ? { contains: searchParams.name, mode: "insensitive" }
        : undefined,
      userId: userId, // Added a where clause to filter by the current user's id
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          messages: true,
        },
      },
    },
  });

  const categories = await prismadb.category.findMany();
  return (
    <div className="h-full p-4 space-y-2">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Your Companions</h2>
        <Link href="/companion/new">
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" />
            Create Companion
          </Button>
        </Link>
      </div>

      <SearchInput />
      <Categories data={categories} />
      <Companions data={companions} />
    </div>
  );
};

export default CompanionsPage;
