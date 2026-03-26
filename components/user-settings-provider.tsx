"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  getUserSettings,
  updateUserSettings,
  UserSettings,
} from "@/lib/actions/user-settings.action";
import { useAuth } from "@clerk/nextjs";
import { useToast } from "@/lib/hooks/use-toast";

interface UserSettingsContextType {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  isLoading: boolean;
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(
  undefined,
);

export function UserSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = useAuth();
  const { setTheme } = useTheme();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>({
    theme: "system",
    showPricing: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const userSettings = await getUserSettings();
        if (userSettings) {
          setSettings(userSettings);
          setTheme(userSettings.theme);
        }
      } catch (error) {
        console.error("Failed to load user settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [userId, setTheme]);

  const updateSettingsHandler = async (newSettings: Partial<UserSettings>) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be signed in to update settings",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await updateUserSettings(newSettings);

      if (result.success) {
        setSettings((prev) => ({ ...prev, ...newSettings }));

        if (newSettings.theme) {
          setTheme(newSettings.theme);
        }

        toast({
          title: "Success",
          description: "Settings updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  return (
    <UserSettingsContext.Provider
      value={{
        settings,
        updateSettings: updateSettingsHandler,
        isLoading,
      }}
    >
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (context === undefined) {
    throw new Error(
      "useUserSettings must be used within a UserSettingsProvider",
    );
  }
  return context;
}
