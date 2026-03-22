"use client";

import { ResumeReviewDisplay } from "@/components/ResumeReviewDisplay";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ResumeAnalyzerPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];

      if (
        ![
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/msword",
        ].includes(selected.type)
      ) {
        toast({
          title: "Invalid file",
          description: "Only PDF and Word files allowed",
          variant: "destructive",
        });
        return;
      }

      setFile(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setResult(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/resume-analyzer", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      setResult(data.result);

      toast({
        title: "Analysis Complete",
        description: "Your resume has been analyzed successfully",
      });
    } catch {
      setError("Something went wrong. Try again.");
      toast({
        title: "Error",
        description: "Failed to analyze resume",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="space-y-2 mb-2">
          <h1 className="text-4xl font-bold flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-9 w-9 text-purple-500 drop-shadow-md">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25M6.5 5.5l1.5 1.5M3 12h2.25M5.5 17.5l1.5-1.5M12 18.75V21M17.5 17.5l-1.5-1.5M18.75 12H21M17.5 6.5l-1.5 1.5M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
            </svg>
            AI Resume Analyzer
          </h1>
          <p className="text-muted-foreground text-lg">
            Get instant ATS-based feedback and improve your resume
          </p>
        </div>

        {/* Layout */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* LEFT - Upload */}
          <Card className="p-6 rounded-2xl shadow-md border bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="text-blue-500" />
                Upload Resume
              </CardTitle>
              <CardDescription>
                PDF or Word only
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">

              {/* Upload Box */}
              <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer hover:border-blue-500 transition">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">
                  Click to upload or drag & drop
                </span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {/* File Preview */}
              {file && (
                <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg">
                  <span className="text-sm truncate">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              )}

              {/* Button */}
              <Button
                onClick={handleSubmit}
                disabled={!file || isUploading}
                className="w-full py-5 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze Resume
                  </>
                )}
              </Button>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
            </CardContent>
          </Card>

          {/* RIGHT - RESULT */}
          <Card className="p-6 rounded-2xl shadow-md border bg-white/80 backdrop-blur h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Resume Review</CardTitle>
              <CardDescription>
                {result
                  ? "Detailed feedback below"
                  : "Upload a resume to get started"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {result ? (
                <ResumeReviewDisplay review={result} />
              ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400 space-y-3">
                  <FileText className="w-12 h-12" />
                  <p>No analysis yet</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}