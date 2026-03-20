import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { isPublic, incrementDownloads, incrementLikes } = body;

    const existingImage = await prismadb.generatedImage.findUnique({
      where: { id },
    });

    if (!existingImage) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (existingImage.userId !== userId && !incrementDownloads && !incrementLikes) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updateData: Record<string, unknown> = {};

    if (typeof isPublic === "boolean") {
      updateData.isPublic = isPublic;
    }

    if (incrementDownloads) {
      updateData.downloads = { increment: 1 };
    }

    if (incrementLikes) {
      updateData.likes = { increment: 1 };
    }

    const updatedImage = await prismadb.generatedImage.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedImage);
  } catch (error) {
    console.error("[IMAGE_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update image" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const existingImage = await prismadb.generatedImage.findUnique({
      where: { id },
    });

    if (!existingImage) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (existingImage.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prismadb.generatedImage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[IMAGE_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const image = await prismadb.generatedImage.findUnique({
      where: { id },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    return NextResponse.json(image);
  } catch (error) {
    console.error("[IMAGE_GET_BY_ID]", error);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
}
