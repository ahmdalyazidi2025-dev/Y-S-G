import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YSG Sales Management",
  description: "Sales Management System for YSG Group",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/app-icon-v2.png", // PNG for better iOS support
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Y S G",
  },
};

export const viewport: Viewport = {
  themeColor: "#080b12",
  userScalable: false, // Prevent zooming
};

import { StoreProvider } from "@/context/store-context";
import { Toaster } from "sonner";
import { PwaRegistration } from "@/components/pwa-registration";
import { PwaInstallPrompt } from "@/components/shared/pwa-install-prompt";
import { NotificationManager } from "@/components/shared/notification-manager";
import { SystemNotifications } from "@/components/shared/system-notifications";
import { PushNotificationManager } from "@/components/shared/push-notification-manager";
import { AppBadgeManager } from "@/components/shared/app-badge-manager";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 overflow-x-hidden relative`}>

        {/* --- DUAL-LAYER BACKGROUND SYSTEM --- */}

        {/* LAYER 1: Dark Mode Universe (Only visible in Dark Mode) */}
        <div className="fixed inset-0 -z-50 hidden dark:block pointer-events-none">
          <div className="absolute inset-0 bg-[#080b12] transition-colors duration-500" /> {/* Deep Space Base */}
          <div className="absolute inset-0 bg-noise opacity-[0.03]" /> {/* Film Grain */}

          {/* Nebula Glows - Only for Dark Mode */}
          <div className="nebula-glow bg-purple-600/20 top-[-10%] left-[-10%] w-[50vw] h-[50vw]" />
          <div className="nebula-glow bg-teal-500/20 bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] [animation-delay:-5s]" />
          <div className="nebula-glow bg-blue-600/10 top-[20%] left-[20%] w-[80vw] h-[80vw] [animation-delay:-10s]" />
        </div>

        {/* LAYER 2: Light Mode Clean (Only visible in Light Mode) */}
        <div className="fixed inset-0 -z-50 block dark:hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white to-emerald-50/20 transition-colors duration-500" /> {/* Soft Gradient */}
          {/* No Noise, No Heavy Glows - Just clean elegance */}
        </div>

        {/* ------------------------------------ */}

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <StoreProvider>
            <PwaRegistration />
            <PwaInstallPrompt />
            <SystemNotifications />
            <PushNotificationManager />
            <AppBadgeManager />
            {children}
            <Toaster position="top-center" expand={false} richColors />
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
