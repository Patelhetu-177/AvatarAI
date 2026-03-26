"use client";

import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Sun,
  Moon,
  Monitor,
  DollarSign,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { useUserSettings } from "@/components/user-settings-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

export function SettingsClient() {
  const router = useRouter();
  const { settings, updateSettings, isLoading } = useUserSettings();

  const handleThemeChange = async (theme: "light" | "dark" | "system") => {
    await updateSettings({ theme });
  };

  const handlePricingToggle = async (showPricing: boolean) => {
    await updateSettings({ showPricing });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 py-12 pt-36 relative">
      <BackgroundBeams className="absolute top-0 left-0 w-full h-full z-0" />
      <div className="max-w-3xl mx-auto p-4 relative z-10">
        <div className="flex items-center justify-center mb-8">
          <Button
            onClick={() => router.back()}
            size="icon"
            variant="ghost"
            className="absolute left-4"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <h1 className="text-3xl md:text-5xl text-center font-sans font-bold text-black dark:text-white">
            Settings
          </h1>
        </div>

        <p className="text-gray-700 dark:text-neutral-400 max-w-lg mx-auto my-4 text-sm text-center mb-8">
          Customize your experience by adjusting theme and display preferences
        </p>

        <div className="space-y-6">
          {/* Theme Settings Card */}
          <Card className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-gray-200 dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black dark:text-white">
                <Sun className="h-5 w-5" />
                Theme Settings
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-neutral-400">
                Choose how AvatarAI looks across the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    variant={settings.theme === "light" ? "default" : "outline"}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => handleThemeChange("light")}
                  >
                    <Sun className="h-6 w-6" />
                    <span>Light</span>
                  </Button>
                  <Button
                    variant={settings.theme === "dark" ? "default" : "outline"}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => handleThemeChange("dark")}
                  >
                    <Moon className="h-6 w-6" />
                    <span>Dark</span>
                  </Button>
                  <Button
                    variant={
                      settings.theme === "system" ? "default" : "outline"
                    }
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => handleThemeChange("system")}
                  >
                    <Monitor className="h-6 w-6" />
                    <span>System</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing Display Settings Card */}
          <Card className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-gray-200 dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black dark:text-white">
                <DollarSign className="h-5 w-5" />
                Display Preferences
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-neutral-400">
                Control what information is displayed in the navbar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50">
                  <div className="flex items-center gap-3">
                    {settings.showPricing ? (
                      <DollarSign className="h-5 w-5 text-green-500" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-gray-500" />
                    )}
                    <div>
                      <Label
                        htmlFor="pricing-toggle"
                        className="text-base font-medium text-black dark:text-white cursor-pointer"
                      >
                        Show Pricing Badge
                      </Label>
                      <p className="text-sm text-gray-600 dark:text-neutral-400">
                        Display your plan status (Pro/Free) in the navbar
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="pricing-toggle"
                    checked={settings.showPricing}
                    onCheckedChange={handlePricingToggle}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-blue-50 dark:bg-blue-950/30 backdrop-blur-sm border-blue-200 dark:border-blue-900">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-900 dark:text-blue-300 text-center">
                Your preferences are saved automatically and will be applied
                across all pages
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 text-center">
          <Button
            onClick={() => router.push("/")}
            className="bg-teal-500 hover:bg-teal-600 text-white"
          >
            Go Back Home
          </Button>
        </div>
      </div>
    </div>
  );
}
