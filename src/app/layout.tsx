import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "موقع العملاء - مجموعة يحيى سلمان غزواني التجارية (YSG)",
  description: "البوابة الرسمية لمجموعة يحيى سلمان غزواني التجارية لخدمات قطع الغيار ومستلزمات السيارات",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/pwa-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Y S G",
  },
  openGraph: {
    title: "مجموعة يحيى سلمان غزواني التجارية (YSG)",
    description: "البوابة الرسمية لمجموعة يحيى سلمان غزواني التجارية لخدمات قطع الغيار ومستلزمات السيارات",
    siteName: "YSG Group",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "YSG Group Logo",
      },
    ],
    locale: "ar_SA",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "مجموعة يحيى سلمان غزواني التجارية (YSG)",
    description: "البوابة الرسمية لمجموعة يحيى سلمان غزواني التجارية لخدمات قطع الغيار ومستلزمات السيارات",
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#f8fafc",
  userScalable: false, // Prevent zooming
};

import { StoreProvider } from "@/context/store-context";
import { Toaster } from "sonner";
import { PwaRegistration } from "@/components/pwa-registration";
import { PwaInstallPrompt } from "@/components/shared/pwa-install-prompt";
import { SystemNotifications } from "@/components/shared/system-notifications";
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
          <div className="nebula-glow bg-purple-600/20 top-[-10%] left-[-10%]" />
          <div className="nebula-glow bg-teal-500/20 bottom-[-10%] right-[-10%] [animation-delay:-5s]" />
          <div className="nebula-glow bg-blue-600/10 top-[20%] left-[20%] w-[80vw] h-[80vw] [animation-delay:-10s]" />
        </div>

        {/* LAYER 2: Light Mode Clean (Only visible in Light Mode) */}
        <div className="fixed inset-0 -z-50 block dark:hidden pointer-events-none">
          {/* Universal Premium Soft Gradient (Pure White to extremely soft blue/slate tints) */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100/50 transition-colors duration-500" />
          
          {/* Soft micro-glows to add depth and luxury feel */}
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-400/5 blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-400/5 blur-[120px]" />
          
          {/* Subtle noise texture for premium film grain look */}
          <div className="absolute inset-0 bg-noise opacity-[0.015]" />
        </div>

        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <StoreProvider>
            <PwaRegistration />
            <PwaInstallPrompt />
            <SystemNotifications />
            <AppBadgeManager />
            {children}
            <Toaster position="top-center" expand={false} richColors />
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
