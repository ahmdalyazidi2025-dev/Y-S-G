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
    icon: "/logo.jpg",
    apple: "/pwa-icon.jpg",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 overflow-x-hidden relative`}>
        {/* --- PREMIUM UNIVERSAL LIGHT BACKGROUND SYSTEM --- */}
        <div className="fixed inset-0 -z-50 pointer-events-none">
          {/* Universal Premium Soft Gradient (Pure White to extremely soft blue/slate tints) */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100/50" />
          
          {/* Soft micro-glows to add depth and luxury feel */}
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-400/5 blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-400/5 blur-[120px]" />
          
          {/* Subtle noise texture for premium film grain look */}
          <div className="absolute inset-0 bg-noise opacity-[0.015]" />
        </div>

        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <StoreProvider>
            <PwaRegistration />
            <PwaInstallPrompt />
            {children}
            <Toaster position="top-center" expand={false} richColors />
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
