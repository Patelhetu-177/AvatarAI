"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Download,
  Heart,
  Sparkles,
  ImageIcon,
  Globe,
  Lock,
  Trash2,
  Copy,
} from "lucide-react";
import Image from "next/image";

const IMAGE_STYLES = [
  { id: "realistic", name: "Realistic" },
  { id: "ghibli", name: "Ghibli Style" },
  { id: "anime", name: "Anime Style" },
  { id: "cartoon", name: "Cartoon Style" },
  { id: "fantasy", name: "Fantasy Style" },
  { id: "3d", name: "3D Render" },
  { id: "portrait", name: "Portrait Style" },
  { id: "cyberpunk", name: "Cyberpunk" },
  { id: "watercolor", name: "Watercolor" },
  { id: "oil_painting", name: "Oil Painting" },
] as const;

const IMAGE_FORMATS = [
  { id: "png", name: "PNG" },
  { id: "jpg", name: "JPG" },
  { id: "webp", name: "WebP" },
] as const;

const IMAGE_SIZES = [
  { id: "512x512", name: "512 x 512" },
  { id: "768x768", name: "768 x 768" },
  { id: "1024x1024", name: "1024 x 1024" },
  { id: "1024x768", name: "1024 x 768 (Landscape)" },
  { id: "768x1024", name: "768 x 1024 (Portrait)" },
  { id: "1920x1080", name: "1920 x 1080 (HD)" },
] as const;

interface GeneratedImage {
  id: string;
  userId: string;
  userName: string;
  prompt: string;
  style: string;
  imageUrl: string;
  isPublic: boolean;
  likes: number;
  downloads: number;
  createdAt: string;
}

export default function ImageGenPage() {
  const { user } = useUser();
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<string>("realistic");
  const [selectedFormat, setSelectedFormat] = useState<string>("png");
  const [selectedSize, setSelectedSize] = useState<string>("1024x1024");
  const [isPublic, setIsPublic] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(
    null
  );
  const [myImages, setMyImages] = useState<GeneratedImage[]>([]);
  const [publicImages, setPublicImages] = useState<GeneratedImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const [myRes, publicRes] = await Promise.all([
        fetch("/api/image-gen?type=my"),
        fetch("/api/image-gen?type=gallery"),
      ]);

      if (myRes.ok) {
        const myData = await myRes.json();
        setMyImages(myData);
      }

      if (publicRes.ok) {
        const publicData = await publicRes.json();
        setPublicImages(publicData);
      }
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a description for your image",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const response = await fetch("/api/image-gen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: selectedStyle,
          format: selectedFormat,
          size: selectedSize,
          isPublic,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate image");
      }

      const data = await response.json();
      setGeneratedImage(data);
      setMyImages((prev) => [data, ...prev]);

      if (isPublic) {
        setPublicImages((prev) => [data, ...prev]);
      }

      toast({
        title: "Success",
        description: "Image generated successfully!",
      });
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });

      try {
        if (!window.puter) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://js.puter.com/v2/";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }
        // Use Puter AI to generate image
        // @ts-ignore
        const imageElement = await window.puter.ai.txt2img(prompt.trim());
        const canvas = document.createElement("canvas");
        canvas.width = imageElement.width;
        canvas.height = imageElement.height;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.drawImage(imageElement, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");

        const uploadRes = await fetch("/api/image-gen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: prompt.trim(),
            style: selectedStyle,
            format: selectedFormat,
            size: selectedSize,
            isPublic,
            puterBase64: dataUrl,
            fallback: true,
          }),
        });
        if (!uploadRes.ok) {
          throw new Error("Cloudinary upload failed");
        }
        const savedImage = await uploadRes.json();
        setGeneratedImage(savedImage);
        setMyImages((prev) => [savedImage, ...prev]);
        if (isPublic) {
          setPublicImages((prev) => [savedImage, ...prev]);
        }
        toast({
          title: "Fallback Success",
          description: "Image generated and stored using Puter AI fallback.",
        });
      } catch (fallbackError) {
        console.error("Puter fallback failed:", fallbackError);
        toast({
          title: "Error",
          description: "Both main and fallback image generation failed.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (image: GeneratedImage) => {
    try {
      await fetch(`/api/image-gen/${image.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incrementDownloads: true }),
      });

      const response = await fetch(image.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const extension = selectedFormat || "png";
      a.download = `generated-image-${image.id}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Downloaded",
        description: "Image downloaded successfully!",
      });
    } catch (error) {
      console.error("Error downloading image:", error);
      toast({
        title: "Error",
        description: "Failed to download image",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = async (image: GeneratedImage) => {
    try {
      await navigator.clipboard.writeText(image.imageUrl);
      toast({
        title: "Copied",
        description: "Image link copied to clipboard!",
      });
    } catch (error) {
      console.error("Error copying link:", error);
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleTogglePublic = async (image: GeneratedImage) => {
    try {
      const response = await fetch(`/api/image-gen/${image.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !image.isPublic }),
      });

      if (!response.ok) {
        throw new Error("Failed to update image");
      }

      const updatedImage = await response.json();

      setMyImages((prev) =>
        prev.map((img) => (img.id === image.id ? updatedImage : img))
      );

      if (updatedImage.isPublic) {
        setPublicImages((prev) => [updatedImage, ...prev]);
      } else {
        setPublicImages((prev) => prev.filter((img) => img.id !== image.id));
      }

      if (generatedImage?.id === image.id) {
        setGeneratedImage(updatedImage);
      }

      toast({
        title: updatedImage.isPublic ? "Made Public" : "Made Private",
        description: updatedImage.isPublic
          ? "Image is now visible in the gallery"
          : "Image is now private",
      });
    } catch (error) {
      console.error("Error toggling public:", error);
      toast({
        title: "Error",
        description: "Failed to update image visibility",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (image: GeneratedImage) => {
    try {
      const response = await fetch(`/api/image-gen/${image.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete image");
      }

      setMyImages((prev) => prev.filter((img) => img.id !== image.id));
      setPublicImages((prev) => prev.filter((img) => img.id !== image.id));

      if (generatedImage?.id === image.id) {
        setGeneratedImage(null);
      }

      toast({
        title: "Deleted",
        description: "Image deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting image:", error);
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    }
  };

  const handleLike = async (image: GeneratedImage) => {
    try {
      const response = await fetch(`/api/image-gen/${image.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incrementLikes: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to like image");
      }

      const updatedImage = await response.json();

      setPublicImages((prev) =>
        prev.map((img) => (img.id === image.id ? updatedImage : img))
      );

      toast({
        title: "Liked",
        description: "You liked this image!",
      });
    } catch (error) {
      console.error("Error liking image:", error);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-500" />
            AI Image Generator
          </h1>
          <p className="text-muted-foreground">
            Transform your ideas into stunning images with AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Input */}
          <div className="space-y-6">
            <Card className="p-6">
              <CardContent className="space-y-6 p-0">
                <div className="space-y-2">
                  <Label htmlFor="prompt" className="text-lg font-semibold">
                    Describe Your Image
                  </Label>
                  <Textarea
                    id="prompt"
                    placeholder="A majestic dragon soaring through clouds at sunset, with golden scales reflecting the light..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isGenerating}
                    className="min-h-[120px] resize-none"
                  />
                </div>

                {/* Style Selection */}
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">Select Style</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {IMAGE_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        disabled={isGenerating}
                        className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                          selectedStyle === style.id
                            ? "border-purple-500 bg-purple-500/10 text-purple-500"
                            : "border-border hover:border-purple-500/50 hover:bg-purple-500/5"
                        } ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {style.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Format and Size Selection */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Format Selection */}
                  <div className="space-y-3">
                    <Label className="font-semibold">Image Format</Label>
                    <div className="flex gap-2">
                      {IMAGE_FORMATS.map((format) => (
                        <button
                          key={format.id}
                          onClick={() => setSelectedFormat(format.id)}
                          disabled={isGenerating}
                          className={`flex-1 p-2 rounded-lg border-2 transition-all text-sm font-medium ${
                            selectedFormat === format.id
                              ? "border-blue-500 bg-blue-500/10 text-blue-500"
                              : "border-border hover:border-blue-500/50 hover:bg-blue-500/5"
                          } ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {format.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size Selection */}
                  <div className="space-y-3">
                    <Label className="font-semibold">Image Size</Label>
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      disabled={isGenerating}
                      className="w-full p-2 rounded-lg border-2 border-border bg-background text-sm font-medium focus:border-purple-500 focus:outline-none disabled:opacity-50"
                    >
                      {IMAGE_SIZES.map((size) => (
                        <option key={size.id} value={size.id}>
                          {size.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    {isPublic ? (
                      <Globe className="h-5 w-5 text-green-500" />
                    ) : (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <Label htmlFor="public" className="font-medium">
                        Make it Public
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Share your creation with the community
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="public"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                    disabled={isGenerating}
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating Magic...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Image
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Generated Image */}
          <div className="space-y-4">
            <Card className="p-6 min-h-[400px] flex items-center justify-center">
              {isGenerating ? (
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-purple-500 animate-pulse" />
                  </div>
                  <p className="text-muted-foreground">
                    Creating your masterpiece...
                  </p>
                </div>
              ) : generatedImage ? (
                <div className="w-full space-y-4">
                  <div className="relative aspect-square rounded-lg overflow-hidden">
                    <Image
                      src={generatedImage.imageUrl}
                      alt={generatedImage.prompt}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(generatedImage)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(generatedImage)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTogglePublic(generatedImage)}
                    >
                      {generatedImage.isPublic ? (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Make Private
                        </>
                      ) : (
                        <>
                          <Globe className="h-4 w-4 mr-2" />
                          Make Public
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(generatedImage)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Prompt:</span>{" "}
                    {generatedImage.prompt}
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-4 text-muted-foreground">
                  <ImageIcon className="h-16 w-16 mx-auto opacity-50" />
                  <div>
                    <p className="font-medium">No image generated yet</p>
                    <p className="text-sm">
                      Enter a prompt and click Generate to create an image
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* My Images Section */}
        {myImages.length > 0 && (
          <div className="space-y-4 mt-12">
            <h2 className="text-2xl font-semibold">Your Creations</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {myImages.slice(0, 10).map((image) => (
                <Card
                  key={image.id}
                  className="group relative overflow-hidden cursor-pointer"
                  onClick={() => setGeneratedImage(image)}
                >
                  <div className="aspect-square relative">
                    <Image
                      src={image.imageUrl}
                      alt={image.prompt}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(image);
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePublic(image);
                        }}
                      >
                        {image.isPublic ? (
                          <Globe className="h-4 w-4 text-green-500" />
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(image);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2">
                    {image.isPublic && (
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        Public
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Public Gallery Section */}
        <div className="space-y-4 mt-12">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Globe className="h-6 w-6 text-green-500" />
            Community Gallery
          </h2>
          {isLoadingImages ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : publicImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {publicImages.map((image) => (
                <Card
                  key={image.id}
                  className="group relative overflow-hidden"
                >
                  <div className="aspect-square relative">
                    <Image
                      src={image.imageUrl}
                      alt={image.prompt}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-xs truncate mb-2">
                          {image.prompt}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-white/80 text-xs">
                            by {image.userName}
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-white hover:text-red-400"
                              onClick={() => handleLike(image)}
                            >
                              <Heart className="h-4 w-4" />
                            </Button>
                            <span className="text-white/80 text-xs">
                              {image.likes}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-white hover:text-blue-400"
                              onClick={() => handleDownload(image)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <span className="text-white/80 text-xs">
                              {image.downloads}
                            </span>
                            {user?.id === image.userId && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-white hover:text-red-500"
                                onClick={() => handleDelete(image)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No public images yet. Be the first to share!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}