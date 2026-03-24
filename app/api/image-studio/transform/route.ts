import { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getImageTransformCount, incrementImageTransform } from "@/lib/usage";
import { auth } from "@clerk/nextjs/server";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      imageUrl,
      transformation,
      format = "png",
      userId = "demo-user"
    } = body;

    if (!userId || userId === "demo-user") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

     const { has } = await auth();
    const usageCount = await getImageTransformCount(userId);
    const isPro = has({ plan: "pro" });
    if (!isPro && usageCount >= 1) {
      return new Response(
        JSON.stringify({
          error: "Free quota exceeded. Upgrade to Pro for unlimited image transforms.",
          upgradeRequired: true,
        }),
        { status: 402 },
      );
    }

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "Image URL required" }), {
        status: 400,
      });
    }

    const transformations: Record<string, unknown>[] = [];
    // Handle effects array (for adjustments like brightness, contrast, etc.)
    if (transformation?.effects && Array.isArray(transformation.effects)) {
      transformation.effects.forEach((effect: string) => {
        transformations.push({ effect: effect });
      });
    }

    if (transformation?.quality) {
      transformations.push({ quality: transformation.quality });
    }

    if (transformation && !transformation.effects) {
      transformations.push(transformation);
    }

    transformations.push({ fetch_format: format });

    if (!transformation?.quality) {
      transformations.push({ quality: "auto" });
    }

    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: `image-studio/${userId}`,
      resource_type: "image",
      public_id: `transform_${Date.now()}`,
      transformation: transformations,
    });

    let record = null;
    try {
      await incrementImageTransform(userId, result.secure_url);
      record = true;
    } catch (dbError: unknown) {
      if (dbError instanceof Error) {
        console.warn("Database unavailable, skipping save:", dbError.message);
      } else {
        console.warn("Database unavailable, skipping save: Unknown error");
      }
    }

    return new Response(
      JSON.stringify({
        url: result.secure_url,
        publicId: result.public_id,
        record,
      }),
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Transform error:", error);
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({ error: error.message || "Transformation failed" }),
        { status: 500 },
      );
    }
    return new Response(
      JSON.stringify({ error: "Transformation failed" }),
      { status: 500 },
    );
  }
}