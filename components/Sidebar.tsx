"use client";

import { cn } from "@/lib/utils";
import { Contact2, Home, Settings, Brain , BotIcon} from "lucide-react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();

  const routes = [
    {
      icon: Home,
      href: "/",
      lable: "Home",
      pro: false,
    },
    {
      icon: BotIcon,
      href: "/companion",
      lable: "Companion",
      pro: true,
    },
    {
      icon: Brain,
      href: "/interviewz",
      lable: "InterviewMate",
      pro: true,
    },
    {
      icon: Settings,
      href: "/settings",
      lable: "Settings",
      pro: false,
    },
    {
      icon: Contact2,
      href: "/contact",
      lable: "Contact",
      pro: false,
    },
  ];

  const onNavigate = (url: string) => {
    return router.push(url);
  };

  return (
    <div className="space-y-4 flex flex-col h-full text-primary bg-secondary">
      <div className="p-3 flex flex-1 justify-center">
        <div className="space-y-2">
          {routes.map((route) => (
            <div
              onClick={() => onNavigate(route.href)}
              key={route.href}
              className={cn(
                "text-muted-foreground text-xs group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-primary hover:bg-primary/10 rounded-lg transition",
                pathname === route.href && "bg-primary/10 text-primary"
              )}
            >
              <div className="flex flex-col gap-y-2 items-center flex-1">
                <route.icon className="h-5 w-5" />
                {route.lable}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
