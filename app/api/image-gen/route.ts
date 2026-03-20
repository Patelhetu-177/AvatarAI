import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import {
  ImageGenerationService,
  IMAGE_STYLES,
  IMAGE_FORMATS,
  IMAGE_SIZES,
  ImageStyle,
  ImageFormat,
  ImageSize,
} from "@/lib/services/image-generation.service";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      prompt,
      style,
      format = "png",
      size = "1024x1024",
      isPublic = false,
      puterBase64,
      fallback = false,
    } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    if (!style || !Object.keys(IMAGE_STYLES).includes(style)) {
      return NextResponse.json(
        { error: "Valid style is required" },
        { status: 400 },
      );
    }

    if (format && !Object.keys(IMAGE_FORMATS).includes(format)) {
      return NextResponse.json(
        { error: "Valid format is required (png, jpg, webp)" },
        { status: 400 },
      );
    }

    if (size && !Object.keys(IMAGE_SIZES).includes(size)) {
      return NextResponse.json(
        { error: "Valid size is required" },
        { status: 400 },
      );
    }

    const imageService = ImageGenerationService.getInstance();

    let finalImageUrl = "";
    if (fallback && puterBase64) {
      // Fallback: upload Puter base64 image to Cloudinary
      finalImageUrl = await imageService.uploadImageToCloudinary(puterBase64);
    } else {
      finalImageUrl = await imageService.generateWithFreepik({
        prompt: prompt.trim(),
        style: style as ImageStyle,
        format: format as ImageFormat,
        size: size as ImageSize,
      });
    }

    const savedImage = await prismadb.generatedImage.create({
      data: {
        userId,
        userName: user?.firstName || user?.username || "Anonymous",
        prompt: prompt.trim(),
        style,
        imageUrl: finalImageUrl,
        isPublic,
      },
    });

    return NextResponse.json(savedImage);
  } catch (error) {
    console.error("[IMAGE_GENERATE]", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate image";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "my";

    if (type === "gallery") {
      const images = await prismadb.generatedImage.findMany({
        where: { isPublic: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return NextResponse.json(images);
    }

    const images = await prismadb.generatedImage.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(images);
  } catch (error) {
    console.error("[IMAGE_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 },
    );
  }
}