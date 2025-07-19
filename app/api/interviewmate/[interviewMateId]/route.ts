
// api/interviewmate/[interviewMateId]/route.ts
export const dynamic = "force-dynamic";

import prismadb from "@/lib/prismadb";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: { interviewMateId: string } }
) {
  try {
    const body = await req.json();
    const user = await currentUser();
    const { src, name, description, instruction, seed } = body;

    if (!params.interviewMateId) {
      return new NextResponse("InterviewMate Id is required", { status: 400 });
    }

    if (!user || !user.id || !user.firstName) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    if (!src || !name || !description || !instruction || !seed) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const data: Prisma.InterviewMateUncheckedUpdateInput = {
      userId: user.id,
      userName: user.firstName,
      src,
      name,
      description,
      instruction,
      seed,
    };

    const interviewMate = await prismadb.interviewMate.update({
      where: {
        id: params.interviewMateId,
        userId: user.id
      },
      data,
    });

    return NextResponse.json(interviewMate);
  } catch (error) {
    console.log("[INTERVIEWMATE_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { interviewMateId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    const interviewMate = await prismadb.interviewMate.delete({
      where: {
        userId,
        id: params.interviewMateId,
      },
    });
    return NextResponse.json(interviewMate);

  } catch (error) {
    console.log("[INTERVIEWMATE_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}