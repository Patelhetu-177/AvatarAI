// app/api/chat/message/[messageId]/route.ts
export const dynamic = "force-dynamic";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

export async function DELETE(
  request: Request,
  { params }: { params: { messageId: string } }
) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { messageId } = params;

    if (!messageId) {
      return new NextResponse("Message ID missing", { status: 400 });
    }

    const messageToDelete = await prismadb.message.findUnique({
      where: {
        id: messageId,
      },
    });

    if (!messageToDelete || messageToDelete.userId !== user.id) {
      return new NextResponse("Message not found or unauthorized", { status: 404 });
    }

    await prismadb.message.delete({
      where: {
        id: messageId,
      },
    });

    return new NextResponse("Message deleted", { status: 200 });

  } catch (error) {
    console.error("[MESSAGE_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}