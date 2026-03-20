import { uploadToCloudinary } from "@/lib/cloudinary";

export const IMAGE_STYLES = {
  realistic: "Realistic",
  ghibli: "Ghibli Style",
  anime: "Anime Style",
  cartoon: "Cartoon Style",
  fantasy: "Fantasy Style",
  "3d": "3D Render",
  portrait: "Portrait Style",
  cyberpunk: "Cyberpunk Style",
  watercolor: "Watercolor Style",
  oil_painting: "Oil Painting Style",
} as const;

export const IMAGE_FORMATS = {
  png: "PNG",
  jpg: "JPG",
  webp: "WebP",
} as const;

export const IMAGE_SIZES = {
  "512x512": "512 x 512",
  "768x768": "768 x 768",
  "1024x1024": "1024 x 1024",
  "1024x768": "1024 x 768 (Landscape)",
  "768x1024": "768 x 1024 (Portrait)",
  "1920x1080": "1920 x 1080 (HD)",
} as const;

export type ImageStyle = keyof typeof IMAGE_STYLES;
export type ImageFormat = keyof typeof IMAGE_FORMATS;
export type ImageSize = keyof typeof IMAGE_SIZES;

const STYLE_PROMPTS: Record<ImageStyle, string> = {
  realistic:
    "photorealistic, highly detailed, 8k resolution, professional photography",
  ghibli: "Studio Ghibli style, hand-drawn animation, soft colors, whimsical",
  anime: "anime style, vibrant colors, clean lines, Japanese animation",
  cartoon: "cartoon style, bold outlines, exaggerated features, playful",
  fantasy: "fantasy art, magical atmosphere, ethereal lighting, mystical",
  "3d": "3D rendered, CGI quality, volumetric lighting",
  portrait: "portrait photography, dramatic lighting, shallow depth of field",
  cyberpunk: "cyberpunk aesthetic, neon lights, futuristic city",
  watercolor: "watercolor painting, soft edges, flowing colors",
  oil_painting: "oil painting, rich textures, classical art technique",
};

export interface GenerateImageOptions {
  prompt: string;
  style: ImageStyle;
  format?: ImageFormat;
  size?: ImageSize;
}

const FREEPIK_MODELS: Record<ImageStyle, string> = {
  realistic: "realism",
  ghibli: "anime",
  anime: "anime",
  cartoon: "cartoon",
  fantasy: "fantasy",
  "3d": "3d",
  portrait: "realism",
  cyberpunk: "realism",
  watercolor: "artistic",
  oil_painting: "artistic",
};

export class ImageGenerationService {
  private static instance: ImageGenerationService;
  private freepikApiKey: string;

  private constructor() {
    this.freepikApiKey = process.env.FREEPIK_API_KEY || "";
  }

  public static getInstance(): ImageGenerationService {
    if (!this.instance) {
      this.instance = new ImageGenerationService();
    }
    return this.instance;
  }

  public getEnhancedPrompt(prompt: string, style: ImageStyle): string {
    const styleKeywords = STYLE_PROMPTS[style];
    return `${prompt}, ${styleKeywords}`;
  }

  public async uploadImageToCloudinary(base64Data: string): Promise<string> {
    console.log("[IMAGE_GEN] Uploading to Cloudinary...");
    const imageUrl = await uploadToCloudinary(base64Data, "generated-images");
    console.log("[IMAGE_GEN] Upload successful!");
    return imageUrl;
  }

  public async generateWithFreepik(
    options: GenerateImageOptions
  ): Promise<string> {
    const { prompt, style, size = "1024x1024" } = options;

    console.log("[IMAGE_GEN] Trying Freepik API...");

    try {
      const aspectRatioMap: Record<string, string> = {
        "512x512": "square_1_1",
        "768x768": "square_1_1",
        "1024x1024": "square_1_1",
        "1024x768": "landscape_4_3",
        "768x1024": "portrait_3_4",
        "1920x1080": "landscape_16_9",
      };

      const aspectRatio = aspectRatioMap[size] || "square_1_1";
      const model = FREEPIK_MODELS[style] || "realism";
      const enhancedPrompt = this.getEnhancedPrompt(prompt, style);

      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
      const response = await fetch("https://api.freepik.com/v1/ai/mystic", {
        method: "POST",
        headers: {
          "x-freepik-api-key": this.freepikApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          aspect_ratio: aspectRatio,
          model: model,
          resolution: "2k",
          creative_detailing: 33,
          engine: "automatic",
          fixed_generation: false,
          filter_nsfw: true,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Freepik API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("[IMAGE_GEN] Freepik response:", data);

      // Immediate result
      if (data.data && data.data[0] && data.data[0].url) {
        const imageUrl = data.data[0].url;
        console.log("[IMAGE_GEN] Got Freepik URL, uploading to Cloudinary...");
        return await this.uploadImageToCloudinary(imageUrl);
      } else if (data.data && data.data[0] && data.data[0].base64) {
        console.log("[IMAGE_GEN] Got Freepik base64, uploading to Cloudinary...");
        return await this.uploadImageToCloudinary(
          `data:image/png;base64,${data.data[0].base64}`
        );
      }

      // Async task handling
      if (data.data && data.data[0] && data.data[0].task_id) {
        const taskId = data.data[0].task_id;
        let pollAttempts = 0;
        let pollResult = null;
        while (pollAttempts < 20) { // max 20 polls (~60s)
          await new Promise((resolve) => setTimeout(resolve, 3000)); // wait 3s
          const pollRes = await fetch(`https://api.freepik.com/v1/ai/mystic/${taskId}`, {
            method: "GET",
            headers: {
              "x-freepik-api-key": this.freepikApiKey,
              "Content-Type": "application/json",
            },
          });
          if (!pollRes.ok) {
            throw new Error(`Freepik poll error: ${pollRes.status}`);
          }
          pollResult = await pollRes.json();
          console.log("[IMAGE_GEN] Freepik poll result:", pollResult);
          if (
            pollResult.data && pollResult.data[0] &&
            (pollResult.data[0].url || pollResult.data[0].base64)
          ) {
            // Success
            if (pollResult.data[0].url) {
              return await this.uploadImageToCloudinary(pollResult.data[0].url);
            } else if (pollResult.data[0].base64) {
              return await this.uploadImageToCloudinary(
                `data:image/png;base64,${pollResult.data[0].base64}`
              );
            }
          }
          if (
            pollResult.data && pollResult.data[0] && pollResult.data[0].status === "FAILED"
          ) {
            throw new Error("Freepik async task failed");
          }
          pollAttempts++;
        }
        throw new Error("Freepik async task timed out");
      }

      throw new Error("Freepik did not return image or task_id");
    } catch (error) {
      console.log("[IMAGE_GEN] Freepik failed, no Pollinations fallback");
      throw error;
    }
  }

  
}
