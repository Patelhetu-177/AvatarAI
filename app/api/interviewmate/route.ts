// api/interviewmate/route.ts
export const dynamic = "force-dynamic";

import prismadb from "@/lib/prismadb";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const user = await currentUser();
    const { src, name, description, instruction, seed } = body;

    if (!user || !user.id || !user.firstName) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!src || !name || !description || !instruction || !seed) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const data: Prisma.InterviewMateUncheckedCreateInput = {
      userId: user.id,
      userName: user.firstName,
      src,
      name,
      description,
      instruction,
      seed,
    };

    const interviewMate = await prismadb.interviewMate.create({
      data,
    });

    return NextResponse.json(interviewMate);
  } catch (error) {
    console.error("[INTERVIEWMATE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}