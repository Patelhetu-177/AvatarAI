"use client";

import React, { useRef, useState } from "react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import toast, { Toaster } from "react-hot-toast";

const Icon = () => (
  <span className="w-5 h-5 bg-gradient-to-tr from-purple-400 to-blue-400 rounded" />
);

const tools = [
  {
    label: "Basic Transformations",
    items: ["Resize", "Crop", "Format", "Quality"],
  },
  {
    label: "AI Transformations",
    items: [
      "Background Removal",
      "Object Removal",
      "Generative Fill",
      "AI Enhancement",
    ],
  },
];

type HistoryItem = {
  id: string;
  url: string;
  action: string;
  likedAt?: string | null;
  date?: string;
};

export default function ImageStudioDashboard() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [transforming, setTransforming] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [format, setFormat] = useState("png");
  const [dragActive, setDragActive] = useState(false);
  const [usingLocalStorage, setUsingLocalStorage] = useState(false);

  const [imageMetadata, setImageMetadata] = useState<{
    width: number;
    height: number;
    format: string;
    size: number;
  } | null>(null);

  // Transformation panel state
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [transformParams, setTransformParams] = useState<{
    crop: {
      width: number;
      height: number;
      gravity: string;
      aspectRatio: number | null;
    };
    resize: {
      width: number;
      height: number;
      aspectLocked: boolean;
      aspectRatio: number | null;
    };
    quality: number;
    adjustments: {
      brightness: number;
      contrast: number;
      saturation: number;
      hue: number;
      vibrance: number;
      gamma: number;
    };
    format: string;
    objectRemoval: { prompt: string };
    generativeFill: { prompt: string };
  }>({
    crop: { width: 400, height: 400, gravity: "center", aspectRatio: null },
    resize: { width: 800, height: 600, aspectLocked: true, aspectRatio: null },
    quality: 80,
    adjustments: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      hue: 0,
      vibrance: 0,
      gamma: 0,
    },
    format: "png",
    objectRemoval: { prompt: "" },
    generativeFill: { prompt: "" },
  });

  // Canvas crop state
  const [cropMode, setCropMode] = useState(false);
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasImage, setCanvasImage] = useState<HTMLImageElement | null>(null);

  // Aspect ratio presets for resize
  const resizePresets = [
    { label: "Instagram Story", ratio: 9 / 16, width: 1080, height: 1920 },
    { label: "Instagram Post", ratio: 1, width: 1080, height: 1080 },
    { label: "YouTube Thumbnail", ratio: 16 / 9, width: 1280, height: 720 },
    { label: "Portrait", ratio: 2 / 3, width: 800, height: 1200 },
    { label: "Facebook Cover", ratio: 2.7, width: 820, height: 312 },
    { label: "Twitter Header", ratio: 3, width: 1500, height: 500 },
  ];

  // Aspect ratio presets for crop
  const cropPresets = [
    { label: "Freeform", ratio: null, icon: "⊡" },
    { label: "Square", ratio: 1, icon: "□" },
    { label: "Widescreen", ratio: 16 / 9, icon: "▭" },
    { label: "Portrait", ratio: 4 / 5, icon: "▯" },
    { label: "Story", ratio: 9 / 16, icon: "📱" },
  ];

  // Handle resize width change with aspect ratio lock
  const handleResizeWidthChange = (newWidth: number) => {
    const { aspectLocked, aspectRatio, height } = transformParams.resize;
    let newHeight = height;

    if (aspectLocked && aspectRatio) {
      newHeight = Math.round(newWidth / aspectRatio);
    } else if (aspectLocked && imageMetadata) {
      const originalRatio = imageMetadata.width / imageMetadata.height;
      newHeight = Math.round(newWidth / originalRatio);
    }

    setTransformParams({
      ...transformParams,
      resize: { ...transformParams.resize, width: newWidth, height: newHeight },
    });
  };

  // Handle resize height change with aspect ratio lock
  const handleResizeHeightChange = (newHeight: number) => {
    const { aspectLocked, aspectRatio, width } = transformParams.resize;
    let newWidth = width;

    if (aspectLocked && aspectRatio) {
      newWidth = Math.round(newHeight * aspectRatio);
    } else if (aspectLocked && imageMetadata) {
      const originalRatio = imageMetadata.width / imageMetadata.height;
      newWidth = Math.round(newHeight * originalRatio);
    }

    setTransformParams({
      ...transformParams,
      resize: { ...transformParams.resize, width: newWidth, height: newHeight },
    });
  };

  // Apply resize preset
  const applyResizePreset = (preset: {
    ratio: number;
    width: number;
    height: number;
  }) => {
    setTransformParams({
      ...transformParams,
      resize: {
        ...transformParams.resize,
        width: preset.width,
        height: preset.height,
        aspectRatio: preset.ratio,
        aspectLocked: true,
      },
    });
  };

  // Apply crop preset
  const applyCropPreset = (preset: { ratio: number | null }) => {
    if (preset.ratio === null) {
      setTransformParams({
        ...transformParams,
        crop: { ...transformParams.crop, aspectRatio: null },
      });
    } else {
      const newWidth = transformParams.crop.width;
      const newHeight = Math.round(newWidth / preset.ratio);
      setTransformParams({
        ...transformParams,
        crop: {
          ...transformParams.crop,
          width: newWidth,
          height: newHeight,
          aspectRatio: preset.ratio,
        },
      });
    }
  };

  // Handle crop width change
  const handleCropWidthChange = (newWidth: number) => {
    const { aspectRatio } = transformParams.crop;
    let newHeight = transformParams.crop.height;

    if (aspectRatio) {
      newHeight = Math.round(newWidth / aspectRatio);
    }

    setTransformParams({
      ...transformParams,
      crop: { ...transformParams.crop, width: newWidth, height: newHeight },
    });
  };

  // Handle crop height change
  const handleCropHeightChange = (newHeight: number) => {
    const { aspectRatio } = transformParams.crop;
    let newWidth = transformParams.crop.width;

    if (aspectRatio) {
      newWidth = Math.round(newHeight * aspectRatio);
    }

    setTransformParams({
      ...transformParams,
      crop: { ...transformParams.crop, width: newWidth, height: newHeight },
    });
  };

  // Initialize canvas crop
  const initCanvasCrop = () => {
    if (!imageUrl) return;

    setCropMode(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setCanvasImage(img);
      if (cropCanvasRef.current) {
        const canvas = cropCanvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const maxWidth = 800;
        const maxHeight = 600;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
      }
    };
    img.src = imageUrl;
  };

  // Handle mouse down on canvas
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropCanvasRef.current) return;
    const rect = cropCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setStartPoint({ x, y });
    setCropRect({ x, y, width: 0, height: 0 });
    setIsDragging(true);
  };

  // Handle mouse move on canvas
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !cropCanvasRef.current || !canvasImage) return;

    const rect = cropCanvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const width = currentX - startPoint.x;
    const height = currentY - startPoint.y;

    const newRect = {
      x: width < 0 ? currentX : startPoint.x,
      y: height < 0 ? currentY : startPoint.y,
      width: Math.abs(width),
      height: Math.abs(height),
    };

    setCropRect(newRect);

    const canvas = cropCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(canvasImage, 0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#8b5cf6";
    ctx.lineWidth = 3;
    ctx.strokeRect(newRect.x, newRect.y, newRect.width, newRect.height);

    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, newRect.y); // Top
    ctx.fillRect(0, newRect.y, newRect.x, newRect.height); // Left
    ctx.fillRect(
      newRect.x + newRect.width,
      newRect.y,
      canvas.width - (newRect.x + newRect.width),
      newRect.height,
    ); // Right
    ctx.fillRect(
      0,
      newRect.y + newRect.height,
      canvas.width,
      canvas.height - (newRect.y + newRect.height),
    ); // Bottom

    ctx.fillStyle = "#8b5cf6";
    ctx.font = "14px sans-serif";
    ctx.fillText(
      `${Math.round(newRect.width)} × ${Math.round(newRect.height)}`,
      newRect.x + 5,
      newRect.y + 20,
    );
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const applyCanvasCrop = () => {
    if (
      !cropCanvasRef.current ||
      !canvasImage ||
      cropRect.width === 0 ||
      cropRect.height === 0
    ) {
      toast.error("Please select a crop area");
      return;
    }

    const canvas = cropCanvasRef.current;

    const scaleX = canvasImage.naturalWidth / canvas.width;
    const scaleY = canvasImage.naturalHeight / canvas.height;

    const originalX = Math.round(cropRect.x * scaleX);
    const originalY = Math.round(cropRect.y * scaleY);
    const originalWidth = Math.round(cropRect.width * scaleX);
    const originalHeight = Math.round(cropRect.height * scaleY);

    applyTransformation("Crop", {
      width: originalWidth,
      height: originalHeight,
      crop: "crop",
      x: originalX,
      y: originalY,
    });

    // Reset crop mode
    setCropMode(false);
    setCropRect({ x: 0, y: 0, width: 0, height: 0 });
  };

  const cancelCanvasCrop = () => {
    setCropMode(false);
    setCropRect({ x: 0, y: 0, width: 0, height: 0 });
    setIsDragging(false);
  };

  // const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userId = "demo-user";

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const getLocalHistory = (): HistoryItem[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(`image-studio-history-${userId}`);
      return stored ? (JSON.parse(stored) as HistoryItem[]) : [];
    } catch {
      return [];
    }
  };

  const saveLocalHistory = (newHistory: HistoryItem[]) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        `image-studio-history-${userId}`,
        JSON.stringify(newHistory),
      );
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  };

  const addToLocalHistory = (item: HistoryItem) => {
    const currentHistory = getLocalHistory();
    const newHistory = [item, ...currentHistory];
    saveLocalHistory(newHistory);
    setHistory(newHistory);
    setUsingLocalStorage(true);
  };

  const extractImageMetadata = (file: File, dataUrl: string) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        setImageMetadata({
          width: img.width,
          height: img.height,
          format: file.type.split("/")[1].toUpperCase(),
          size: file.size,
        });
        resolve();
      };
      img.src = dataUrl;
    });
  };

  const processFile = async (file: File) => {
    if (!file) return;

    setUploading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;

        await extractImageMetadata(file, base64);

        const res = await fetch("/api/image-studio/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageData: base64,
            userId: userId,
            fileName: file.name,
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Upload failed");
        }

        const data = await res.json();
        setImageUrl(data.url);

        if (data.record) {
          await fetchHistory();
        } else {
          addToLocalHistory({
            id: `local-${Date.now()}`,
            url: data.url,
            action: "upload",
            date: new Date().toISOString(),
            likedAt: null,
          });
        }
      } catch (error: unknown) {
        console.error("Upload error:", error);
        if (error instanceof Error) {
          alert(error.message || "Upload failed");
        } else {
          alert("Upload failed");
        }
      } finally {
        setUploading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      await processFile(file);
    } else {
      alert("Please drop an image file");
    }
  };

  const fetchHistory = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/image-studio/history?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setHistory(data as HistoryItem[]);
          setUsingLocalStorage(false);
        } else {
          const localData = getLocalHistory();
          setHistory(localData as HistoryItem[]);
          setUsingLocalStorage(localData.length > 0);
        }
      } else {
        const localData = getLocalHistory();
        setHistory(localData as HistoryItem[]);
        setUsingLocalStorage(true);
      }
    } catch (error) {
      console.error("Failed to fetch history, using localStorage:", error);
      const localData = getLocalHistory();
      setHistory(localData as HistoryItem[]);
      setUsingLocalStorage(true);
    }
  };

  const openTransformationPanel = (type: string) => {
    if (!imageUrl) {
      alert("Please upload an image first");
      return;
    }
    setActivePanel(type);
  };

  const applyTransformation = async (
    type: string,
    transformation: Record<string, unknown>,
  ) => {
    if (!imageUrl) {
      alert("Please upload an image first");
      return;
    }

    if (transforming) return;

    setTransforming(true);
    setActivePanel(null);

    try {
      const res = await fetch("/api/image-studio/transform", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl,
          transformation,
          format,
          userId,
          action: type,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Transformation failed");
      }

      const data = await res.json();
      setImageUrl(data.url);

      if (data.record) {
        await fetchHistory();
      } else {
        addToLocalHistory({
          id: `local-${Date.now()}`,
          url: data.url,
          action: type,
          date: new Date().toISOString(),
          likedAt: null,
        });
      }
    } catch (err: unknown) {
      console.error("Transformation error:", err);
      if (err instanceof Error) {
        alert(err.message || "Transformation failed");
      } else {
        alert("Transformation failed");
      }
    } finally {
      setTransforming(false);
    }
  };

  const handleDownload = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `image-studio-${Date.now()}`;
      link.click();
    } catch (error) {
      console.error("Download failed:", error);
      alert("Download failed");
    }
  };

  const handleLike = async (id: string, currentlyLiked: boolean) => {
    if (id.startsWith("local-")) {
      const localHistory = getLocalHistory();
      const updated = localHistory.map((item) =>
        item.id === id
          ? {
              ...item,
              likedAt: currentlyLiked ? null : new Date().toISOString(),
            }
          : item,
      );
      const sorted = updated.sort((a, b) => {
        const dateA = typeof a.date === "string" ? a.date : "";
        const dateB = typeof b.date === "string" ? b.date : "";
        if (a.likedAt && !b.likedAt) return -1;
        if (!a.likedAt && b.likedAt) return 1;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
      saveLocalHistory(sorted);
      setHistory(sorted as HistoryItem[]);
      return;
    }

    try {
      const res = await fetch("/api/image-studio/history", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, like: !currentlyLiked }),
      });

      if (!res.ok) {
        throw new Error("Failed to like");
      }

      await fetchHistory();
    } catch (error) {
      console.error("Like failed:", error);
      alert("Failed to like image - database unavailable");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;
    if (id.startsWith("local-")) {
      const localHistory = getLocalHistory();
      const updated = localHistory.filter((item) => item.id !== id);
      saveLocalHistory(updated);
      setHistory(updated as HistoryItem[]);
      return;
    }

    try {
      const res = await fetch(`/api/image-studio/history?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete");
      }

      await fetchHistory();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete image - database unavailable");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Toaster position="top-center" />
      <div className="flex flex-1">
        {/* SIDEBAR */}
        <aside className="w-72 bg-white/70 dark:bg-[#23243a]/70 p-6 border-r">
          {tools.map((section, idx) => (
            <div key={section.label}>
              <h3 className="text-xs font-bold mb-2">{section.label}</h3>

              {section.items.map((tool) => (
                <button
                  key={tool}
                  onClick={() => openTransformationPanel(tool)}
                  disabled={transforming || !imageUrl}
                  className={cn(
                    "flex items-center gap-3 w-full p-2 rounded transition-colors",
                    transforming || !imageUrl
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-purple-100 dark:hover:bg-purple-900/30",
                    activePanel === tool &&
                      "bg-purple-100 dark:bg-purple-900/30",
                  )}
                >
                  <Icon />
                  <span>{tool}</span>
                </button>
              ))}

              {idx !== tools.length - 1 && <Separator className="my-4" />}
            </div>
          ))}
        </aside>

        {/* MAIN */}
        <main className="flex-1 flex flex-col items-center justify-center p-10">
          {/* Drag & Drop Upload Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "w-full max-w-2xl border-2 border-dashed rounded-xl p-12 transition-all cursor-pointer",
              dragActive
                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 scale-105"
                : "border-gray-300 dark:border-gray-600 hover:border-purple-400 hover:bg-gray-50 dark:hover:bg-gray-800/50",
              uploading && "opacity-50 pointer-events-none",
            )}
          >
            <div className="flex flex-col items-center gap-4 text-center">
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                  <p className="text-lg font-semibold">Uploading...</p>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 text-purple-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <div>
                    <p className="text-xl font-semibold mb-1">
                      {dragActive
                        ? "Drop your image here"
                        : "Drag & drop your image"}
                    </p>
                    <p className="text-sm text-gray-500">or click to browse</p>
                  </div>
                  <div className="flex gap-2 text-xs text-gray-400">
                    <span>PNG</span>
                    <span>•</span>
                    <span>JPG</span>
                    <span>•</span>
                    <span>WEBP</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <input
            type="file"
            hidden
            ref={fileInputRef}
            accept="image/*"
            onChange={handleUpload}
          />

          {/* Image Details */}
          {imageMetadata && (
            <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border w-full max-w-2xl">
              <h3 className="text-sm font-semibold mb-2">Image Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Width</p>
                  <p className="font-medium">{imageMetadata.width}px</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Height</p>
                  <p className="font-medium">{imageMetadata.height}px</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Format</p>
                  <p className="font-medium">{imageMetadata.format}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Size</p>
                  <p className="font-medium">
                    {(imageMetadata.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Format */}
          <div className="mt-6 flex items-center gap-3">
            <label className="text-sm font-medium">Output Format:</label>
            <select
              className="p-2 border rounded-lg bg-white dark:bg-gray-800"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
              <option value="webp">WEBP</option>
            </select>
          </div>

          {/* Transformation Panels */}
          {activePanel && (
            <div className="mt-6 p-6 bg-white dark:bg-gray-800 rounded-lg border w-full max-w-2xl shadow-lg">
              {activePanel === "Crop" && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Crop Image</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {cropMode
                      ? "Draw a rectangle on the image to select the crop area"
                      : "Choose manual cropping or use presets with dimensions"}
                  </p>

                  {!cropMode ? (
                    <>
                      {/* Manual Crop Button */}
                      <div className="mb-4">
                        <Button
                          onClick={initCanvasCrop}
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M6 2v14a2 2 0 0 0 2 2h14" />
                            <path d="M18 22V8a2 2 0 0 0-2-2H2" />
                          </svg>
                          Start Manual Cropping
                        </Button>
                      </div>

                      <div className="relative mb-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                            or use presets
                          </span>
                        </div>
                      </div>

                      {/* Current Size Display */}
                      {imageMetadata && (
                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Current Size
                          </p>
                          <p className="font-medium">
                            {imageMetadata.width} × {imageMetadata.height} px
                          </p>
                        </div>
                      )}

                      {/* Aspect Ratio Presets */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                          Aspect Ratio
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                          {cropPresets.map((preset) => (
                            <button
                              key={preset.label}
                              onClick={() => applyCropPreset(preset)}
                              className={cn(
                                "flex flex-col items-center p-3 rounded-lg border transition-all",
                                transformParams.crop.aspectRatio ===
                                  preset.ratio
                                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-600"
                                  : "border-gray-200 dark:border-gray-600 hover:border-purple-300 hover:bg-gray-50 dark:hover:bg-gray-700",
                              )}
                            >
                              <span className="text-2xl mb-1">
                                {preset.icon}
                              </span>
                              <span className="text-xs font-medium">
                                {preset.label}
                              </span>
                              {preset.ratio && (
                                <span className="text-xs text-gray-400">
                                  {preset.ratio === 1
                                    ? "1:1"
                                    : preset.ratio > 1
                                      ? "16:9"
                                      : preset.ratio === 4 / 5
                                        ? "4:5"
                                        : "9:16"}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Dimension Inputs */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Width (px)
                          </label>
                          <input
                            type="number"
                            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            value={transformParams.crop.width}
                            onChange={(e) =>
                              handleCropWidthChange(
                                parseInt(e.target.value) || 0,
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Height (px)
                          </label>
                          <input
                            type="number"
                            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            value={transformParams.crop.height}
                            onChange={(e) =>
                              handleCropHeightChange(
                                parseInt(e.target.value) || 0,
                              )
                            }
                          />
                        </div>
                      </div>

                      {/* New Size Preview */}
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          New Size Preview
                        </p>
                        <p className="font-medium text-blue-700 dark:text-blue-300">
                          {transformParams.crop.width} ×{" "}
                          {transformParams.crop.height} px
                        </p>
                      </div>

                      {/* Gravity Selection */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                          Crop Position (Gravity)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            {
                              value: "north_west",
                              label: "↖",
                              title: "Top Left",
                            },
                            { value: "north", label: "↑", title: "Top" },
                            {
                              value: "north_east",
                              label: "↗",
                              title: "Top Right",
                            },
                            { value: "west", label: "←", title: "Left" },
                            { value: "center", label: "⊙", title: "Center" },
                            { value: "east", label: "→", title: "Right" },
                            {
                              value: "south_west",
                              label: "↙",
                              title: "Bottom Left",
                            },
                            { value: "south", label: "↓", title: "Bottom" },
                            {
                              value: "south_east",
                              label: "↘",
                              title: "Bottom Right",
                            },
                          ].map((pos) => (
                            <button
                              key={pos.value}
                              onClick={() =>
                                setTransformParams({
                                  ...transformParams,
                                  crop: {
                                    ...transformParams.crop,
                                    gravity: pos.value,
                                  },
                                })
                              }
                              title={pos.title}
                              className={cn(
                                "p-2 rounded-lg border text-lg transition-all",
                                transformParams.crop.gravity === pos.value
                                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30"
                                  : "border-gray-200 dark:border-gray-600 hover:border-purple-300",
                              )}
                            >
                              {pos.label}
                            </button>
                          ))}
                        </div>
                        <div className="mt-2">
                          <button
                            onClick={() =>
                              setTransformParams({
                                ...transformParams,
                                crop: {
                                  ...transformParams.crop,
                                  gravity: "face",
                                },
                              })
                            }
                            className={cn(
                              "w-full p-2 rounded-lg border text-sm transition-all flex items-center justify-center gap-2",
                              transformParams.crop.gravity === "face"
                                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30"
                                : "border-gray-200 dark:border-gray-600 hover:border-purple-300",
                            )}
                          >
                            <span>👤</span> Face Detection (Auto-center on
                            faces)
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() =>
                            applyTransformation("Crop", {
                              width: transformParams.crop.width,
                              height: transformParams.crop.height,
                              crop: "crop",
                              gravity: transformParams.crop.gravity,
                            })
                          }
                          className="flex-1"
                        >
                          Apply Crop
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setActivePanel(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Manual Crop Canvas */}
                      <div className="mb-4">
                        <div className="border-2 border-purple-500 rounded-lg p-2 bg-gray-900">
                          <canvas
                            ref={cropCanvasRef}
                            onMouseDown={handleCanvasMouseDown}
                            onMouseMove={handleCanvasMouseMove}
                            onMouseUp={handleCanvasMouseUp}
                            onMouseLeave={handleCanvasMouseUp}
                            className="max-w-full cursor-crosshair mx-auto block"
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                          Click and drag to select the crop area
                        </p>
                      </div>

                      {/* Crop Info */}
                      {cropRect.width > 0 && cropRect.height > 0 && (
                        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                          <p className="text-sm text-purple-600 dark:text-purple-400">
                            Selected Area
                          </p>
                          <p className="font-medium text-purple-700 dark:text-purple-300">
                            {Math.round(cropRect.width)} ×{" "}
                            {Math.round(cropRect.height)} px
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={applyCanvasCrop}
                          className="flex-1"
                          disabled={
                            cropRect.width === 0 || cropRect.height === 0
                          }
                        >
                          Apply Crop
                        </Button>
                        <Button variant="outline" onClick={cancelCanvasCrop}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activePanel === "Resize" && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Resize Image</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Scale your image to new dimensions. Use presets or enter
                    custom values.
                  </p>

                  {/* Current Size Display */}
                  {imageMetadata && (
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Current Size
                      </p>
                      <p className="font-medium">
                        {imageMetadata.width} × {imageMetadata.height} px
                      </p>
                    </div>
                  )}

                  {/* Aspect Ratio Presets */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      Quick Presets
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {resizePresets.map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => applyResizePreset(preset)}
                          className={cn(
                            "p-3 rounded-lg border text-left transition-all",
                            transformParams.resize.width === preset.width &&
                              transformParams.resize.height === preset.height
                              ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30"
                              : "border-gray-200 dark:border-gray-600 hover:border-purple-300 hover:bg-gray-50 dark:hover:bg-gray-700",
                          )}
                        >
                          <span className="text-sm font-medium">
                            {preset.label}
                          </span>
                          <span className="block text-xs text-gray-400">
                            {preset.width} × {preset.height}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lock Aspect Ratio Toggle */}
                  <div className="mb-4 flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {transformParams.resize.aspectLocked ? "🔒" : "🔓"}
                      </span>
                      <span className="text-sm font-medium">
                        Lock Aspect Ratio
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        setTransformParams({
                          ...transformParams,
                          resize: {
                            ...transformParams.resize,
                            aspectLocked: !transformParams.resize.aspectLocked,
                            aspectRatio:
                              !transformParams.resize.aspectLocked &&
                              imageMetadata
                                ? imageMetadata.width / imageMetadata.height
                                : transformParams.resize.aspectRatio,
                          },
                        })
                      }
                      className={cn(
                        "px-3 py-1 rounded-lg text-sm font-medium transition-all",
                        transformParams.resize.aspectLocked
                          ? "bg-purple-500 text-white"
                          : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300",
                      )}
                    >
                      {transformParams.resize.aspectLocked
                        ? "Locked"
                        : "Unlocked"}
                    </button>
                  </div>

                  {/* Dimension Inputs */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Width (px)
                      </label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        value={transformParams.resize.width}
                        onChange={(e) =>
                          handleResizeWidthChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Height (px)
                      </label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        value={transformParams.resize.height}
                        onChange={(e) =>
                          handleResizeHeightChange(
                            parseInt(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* New Size Preview */}
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      New Size Preview
                    </p>
                    <p className="font-medium text-blue-700 dark:text-blue-300">
                      {transformParams.resize.width} ×{" "}
                      {transformParams.resize.height} px
                    </p>
                    {imageMetadata && (
                      <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                        {transformParams.resize.width > imageMetadata.width ||
                        transformParams.resize.height > imageMetadata.height
                          ? "⚠️ Upscaling may reduce quality"
                          : `↓ ${Math.round((1 - (transformParams.resize.width * transformParams.resize.height) / (imageMetadata.width * imageMetadata.height)) * 100)}% smaller`}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        applyTransformation("Resize", {
                          width: transformParams.resize.width,
                          height: transformParams.resize.height,
                          crop: "scale",
                        })
                      }
                      className="flex-1"
                    >
                      Apply Resize
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setActivePanel(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {activePanel === "Quality" && (
                <div className="space-y-6">
                  {/* Header with Reset Button */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Image Adjustments
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Fine-tune your image with these controls
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setTransformParams({
                          ...transformParams,
                          quality: 80,
                          adjustments: {
                            brightness: 0,
                            contrast: 0,
                            saturation: 0,
                            hue: 0,
                            vibrance: 0,
                            gamma: 0,
                          },
                        })
                      }
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                      </svg>
                      Reset All
                    </Button>
                  </div>

                  {/* Quality Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Quality</label>
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {transformParams.quality}%
                      </span>
                    </div>
                    <Slider
                      value={[transformParams.quality]}
                      onValueChange={(value) =>
                        setTransformParams({
                          ...transformParams,
                          quality: value[0],
                        })
                      }
                      min={1}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Brightness Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Brightness</label>
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {transformParams.adjustments.brightness}
                      </span>
                    </div>
                    <Slider
                      value={[transformParams.adjustments.brightness]}
                      onValueChange={(value) =>
                        setTransformParams({
                          ...transformParams,
                          adjustments: {
                            ...transformParams.adjustments,
                            brightness: value[0],
                          },
                        })
                      }
                      min={-100}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Contrast Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Contrast</label>
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {transformParams.adjustments.contrast}
                      </span>
                    </div>
                    <Slider
                      value={[transformParams.adjustments.contrast]}
                      onValueChange={(value) =>
                        setTransformParams({
                          ...transformParams,
                          adjustments: {
                            ...transformParams.adjustments,
                            contrast: value[0],
                          },
                        })
                      }
                      min={-100}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Saturation Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Saturation</label>
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {transformParams.adjustments.saturation}
                      </span>
                    </div>
                    <Slider
                      value={[transformParams.adjustments.saturation]}
                      onValueChange={(value) =>
                        setTransformParams({
                          ...transformParams,
                          adjustments: {
                            ...transformParams.adjustments,
                            saturation: value[0],
                          },
                        })
                      }
                      min={-100}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Vibrance Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Vibrance</label>
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {transformParams.adjustments.vibrance}
                      </span>
                    </div>
                    <Slider
                      value={[transformParams.adjustments.vibrance]}
                      onValueChange={(value) =>
                        setTransformParams({
                          ...transformParams,
                          adjustments: {
                            ...transformParams.adjustments,
                            vibrance: value[0],
                          },
                        })
                      }
                      min={-100}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Hue Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Hue</label>
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {transformParams.adjustments.hue}°
                      </span>
                    </div>
                    <Slider
                      value={[transformParams.adjustments.hue]}
                      onValueChange={(value) =>
                        setTransformParams({
                          ...transformParams,
                          adjustments: {
                            ...transformParams.adjustments,
                            hue: value[0],
                          },
                        })
                      }
                      min={-180}
                      max={180}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Gamma Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Gamma</label>
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {transformParams.adjustments.gamma}
                      </span>
                    </div>
                    <Slider
                      value={[transformParams.adjustments.gamma]}
                      onValueChange={(value) =>
                        setTransformParams({
                          ...transformParams,
                          adjustments: {
                            ...transformParams.adjustments,
                            gamma: value[0],
                          },
                        })
                      }
                      min={-50}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Info */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Adjustments will be applied when you click &quot;Apply
                      Adjustments&quot;. Use Reset All to restore default
                      values.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        const effects: string[] = [];
                        const adj = transformParams.adjustments;

                        if (adj.brightness !== 0)
                          effects.push(`brightness:${adj.brightness}`);
                        if (adj.contrast !== 0)
                          effects.push(`contrast:${adj.contrast}`);
                        if (adj.saturation !== 0)
                          effects.push(`saturation:${adj.saturation}`);
                        if (adj.vibrance !== 0)
                          effects.push(`vibrance:${adj.vibrance}`);
                        if (adj.hue !== 0) effects.push(`hue:${adj.hue}`);
                        if (adj.gamma !== 0)
                          effects.push(`gamma:${100 + adj.gamma}`);

                        applyTransformation("Adjustments", {
                          quality: transformParams.quality,
                          effects: effects,
                        });
                      }}
                      className="flex-1"
                    >
                      Apply Adjustments
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setActivePanel(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {activePanel === "Format" && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Change Format</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      Select Format
                    </label>
                    <select
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      value={transformParams.format}
                      onChange={(e) =>
                        setTransformParams({
                          ...transformParams,
                          format: e.target.value,
                        })
                      }
                    >
                      <option value="png">PNG</option>
                      <option value="jpg">JPG</option>
                      <option value="webp">WEBP</option>
                      <option value="gif">GIF</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        applyTransformation("Format", {
                          fetch_format: transformParams.format,
                        })
                      }
                      className="flex-1"
                    >
                      Apply Format
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setActivePanel(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {activePanel === "Background Removal" && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Remove Background
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    This will remove the background from your image using AI.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        applyTransformation("Background Removal", {
                          effect: "background_removal",
                        })
                      }
                      className="flex-1"
                    >
                      Remove Background
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setActivePanel(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {activePanel === "AI Enhancement" && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">AI Enhancement</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Enhance your image quality using AI.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        applyTransformation("AI Enhancement", {
                          effect: "improve",
                        })
                      }
                      className="flex-1"
                    >
                      Enhance Image
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setActivePanel(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {activePanel === "Object Removal" && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Remove Object</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Enter the object you want to remove from the image.
                    Cloudinary AI will detect and remove it.
                  </p>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      Object to Remove
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., person, car, tree, background text..."
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      value={transformParams.objectRemoval.prompt}
                      onChange={(e) =>
                        setTransformParams({
                          ...transformParams,
                          objectRemoval: {
                            ...transformParams.objectRemoval,
                            prompt: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        if (!transformParams.objectRemoval.prompt.trim()) {
                          toast.error("Please enter an object to remove");
                          return;
                        }
                        applyTransformation("Object Removal", {
                          effect: `gen_remove:prompt_${transformParams.objectRemoval.prompt.trim().replace(/\s+/g, "_")}`,
                        });
                      }}
                      className="flex-1"
                      disabled={!transformParams.objectRemoval.prompt.trim()}
                    >
                      Remove Object
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setActivePanel(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {activePanel === "Generative Fill" && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Generative Fill
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Extend or fill areas of your image using AI. Describe what
                    you want to generate.
                  </p>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      Fill Prompt
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., beach sunset, mountains, forest..."
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      value={transformParams.generativeFill.prompt}
                      onChange={(e) =>
                        setTransformParams({
                          ...transformParams,
                          generativeFill: {
                            ...transformParams.generativeFill,
                            prompt: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        if (!transformParams.generativeFill.prompt.trim()) {
                          toast.error("Please enter a fill prompt");
                          return;
                        }
                        applyTransformation("Generative Fill", {
                          effect: `gen_fill:prompt_${transformParams.generativeFill.prompt.trim().replace(/\s+/g, "_")}`,
                        });
                      }}
                      className="flex-1"
                      disabled={!transformParams.generativeFill.prompt.trim()}
                    >
                      Generate Fill
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setActivePanel(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Canvas */}
          {imageUrl && (
            <div className="w-full max-w-2xl mt-6">
              <div className="h-[400px] bg-white dark:bg-gray-800 flex items-center justify-center rounded-xl shadow-lg border">
                {transforming ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Transforming...</p>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl ?? ""}
                    alt="Transformed"
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Button
                  onClick={() => handleDownload(imageUrl)}
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Download
                </Button>

                <div className="relative">
                  <select
                    className="w-full h-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer font-medium text-sm"
                    onChange={async (e) => {
                      if (e.target.value && imageUrl) {
                        const exportFormat = e.target.value;
                        toast.loading("Exporting image...");
                        try {
                          const res = await fetch(
                            "/api/image-studio/transform",
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                imageUrl,
                                transformation: { fetch_format: exportFormat },
                                format: exportFormat,
                                userId,
                                action: `Export as ${exportFormat.toUpperCase()}`,
                              }),
                            },
                          );

                          if (!res.ok) {
                            throw new Error("Export failed");
                          }

                          const data = await res.json();
                          const downloadRes = await fetch(data.url);
                          const blob = await downloadRes.blob();
                          const link = document.createElement("a");
                          link.href = URL.createObjectURL(blob);
                          link.download = `image-studio-${Date.now()}.${exportFormat}`;
                          link.click();

                          toast.dismiss();
                          toast.success(
                            `Exported as ${exportFormat.toUpperCase()}!`,
                          );
                        } catch (error) {
                          toast.dismiss();
                          toast.error("Export failed");
                          console.error("Export error:", error);
                        }
                        e.target.value = "";
                      }
                    }}
                  >
                    <option value="">Export As...</option>
                    <option value="png">PNG</option>
                    <option value="jpg">JPG</option>
                    <option value="webp">WEBP</option>
                    <option value="gif">GIF</option>
                    <option value="pdf">PDF</option>
                  </select>
                </div>

                <Button
                  onClick={async () => {
                    addToLocalHistory({
                      id: `local-${Date.now()}`,
                      url: imageUrl,
                      action: "Saved",
                      date: new Date().toISOString(),
                      likedAt: null,
                    });
                    toast.success("Image saved to history!");
                  }}
                  className="flex items-center justify-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                  </svg>
                  Save
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* HISTORY GALLERY */}
      <div className="p-6 border-t bg-gradient-to-b from-white/50 to-transparent dark:from-[#23243a]/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">History</h2>

          {usingLocalStorage && (
            <div className="flex items-center gap-2 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Using Local Storage (Database offline)</span>
            </div>
          )}
        </div>

        {history.filter((item) => item.action !== "upload").length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            No saved images yet. Transform and save an image to see it here!
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {history
              .filter((item) => item.action !== "upload")
              .map((typedItem) => {
                return (
                  <div
                    key={typedItem.id}
                    className="group relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-md hover:shadow-xl transition-all"
                  >
                    {/* Image Container */}
                    <div
                      className="relative aspect-square cursor-pointer"
                      onClick={() => setImageUrl(typedItem.url)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={typedItem.url}
                        alt={typedItem.action}
                        className="w-full h-full object-cover"
                      />

                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <p className="text-white text-sm font-semibold capitalize mb-2">
                          {typedItem.action}
                        </p>

                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLike(typedItem.id, !!typedItem.likedAt);
                            }}
                            className={cn(
                              "p-2 rounded-full transition-all",
                              typedItem.likedAt
                                ? "bg-red-500 text-white"
                                : "bg-white/20 text-white hover:bg-white/30",
                            )}
                            title={typedItem.likedAt ? "Unlike" : "Like"}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(typedItem.id);
                            }}
                            className="p-2 rounded-full bg-white/20 text-white hover:bg-red-500 transition-all"
                            title="Delete"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Like Badge - shown when liked */}
                      {typedItem.likedAt && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-lg">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Download Button - Always Visible */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(typedItem.url);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Download
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
