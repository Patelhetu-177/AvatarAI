import type { Metadata } from "next";
import {
  ClerkProvider,
} from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import {  ZyraAIAgentWrapper } from "@/components/ZyraAIAgentWrapper";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AvatarAI",
  description: "AI-powered Web Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={cn("bg-secondary", inter.className)}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
            <ZyraAIAgentWrapper  />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
