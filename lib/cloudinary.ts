import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(
  imageData: string,
  folder: string = "generated-images"
): Promise<string> {
  const result = await cloudinary.uploader.upload(imageData, {
    folder,
    resource_type: "image",
    transformation: [
      { quality: "auto:best" },
      { fetch_format: "auto" },
    ],
  });

  return result.secure_url;
}

export async function uploadImageFromUrl(
  imageUrl: string,
  folder: string = "generated-images"
): Promise<string> {
  return uploadToCloudinary(imageUrl, folder);
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export { cloudinary };