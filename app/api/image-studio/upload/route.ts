import { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const { userId: authenticatedUserId } = await auth();

    if (!authenticatedUserId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const body = await req.json();
    console.log("Upload request received:", {
      hasImageData: !!body.imageData,
      userId: body.userId,
      fileName: body.fileName,
      imageDataLength: body.imageData?.length,
    });

    const { imageData, userId, fileName = "image" } = body;

    if (userId !== authenticatedUserId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
      });
    }

    if (!imageData) {
      console.error("No image data provided");
      return new Response(JSON.stringify({ error: "Image data required" }), {
        status: 400,
      });
    }

    const uploadOptions: Record<string, unknown> = {
      folder: `image-studio/${userId}`,
      resource_type: "image",
      public_id: `upload_${Date.now()}`,
    };

    console.log("Uploading to Cloudinary...");
    const result = await cloudinary.uploader.upload(imageData, uploadOptions);
    console.log("Cloudinary upload successful:", result.secure_url);

    let record = null;
    try {
      record = await prismadb.transformationHistory.create({
        data: {
          userId,
          action: "upload",
          details: fileName,
          url: result.secure_url,
        },
      });
      console.log("Database record created:", record.id);
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
    console.error("Upload error:", error);
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({ error: error.message || "Upload failed" }),
        { status: 500 },
      );
    }
    return new Response(JSON.stringify({ error: "Upload failed" }), {
      status: 500,
    });
  }
}