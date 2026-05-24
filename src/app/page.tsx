"use client"

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Users, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Footer } from "@/components/store/footer";
import { useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "next-themes";

function LandingContent() {
  const searchParams = useSearchParams();
  const isFromLogout = searchParams.get("logout") === "true";
  const { setTheme } = useTheme();

  const [showContent, setShowContent] = useState(isFromLogout);
  const [isAssembling, setIsAssembling] = useState(!isFromLogout);

  useEffect(() => {
    // Force reset theme to light on first visit to this version to clear old dark caches
    try {
      const hasResetTheme = localStorage.getItem("ysg_theme_reset_v2");
      if (!hasResetTheme) {
        setTheme("light");
        localStorage.setItem("ysg_theme_reset_v2", "true");
      }
    } catch (e) {
      console.error("Theme storage reset failed:", e);
    }
  }, [setTheme]);

  useEffect(() => {
    if (isFromLogout) return;
    const timer = setTimeout(() => setShowContent(true), 2500);
    return () => clearTimeout(timer);
  }, [isFromLogout]);

  useEffect(() => {
    if (showContent && !isFromLogout) {
      const timer = setTimeout(() => {
        if (isAssembling) {
          setIsAssembling(false);
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [showContent, isFromLogout, isAssembling]);

  return (
    <main className="min-h-[100dvh] bg-gradient-to-br from-slate-50 via-white to-slate-100/50 text-slate-900 overflow-hidden relative">
      {/* Universal Premium Soft Background decorations to add depth and luxury feel */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-400/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-400/5 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-noise opacity-[0.015] pointer-events-none" />

      <AnimatePresence mode="wait">
        {!showContent ? (
          /* Cinematic Splash Screen - Strictly Light Theme */
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100/50"
          >
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full"
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative z-10"
              >
                <Image
                  src="/logo.jpg"
                  alt="Logo"
                  width={192}
                  height={192}
                  className="rounded-full object-cover border-8 border-white shadow-2xl shadow-primary/10"
                />
                <motion.div
                  initial={{ top: "-10%" }}
                  animate={{ top: "110%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-[2px] bg-primary/50 blur-[2px] z-20 pointer-events-none"
                />
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="mt-12 text-center"
            >
              <h2 className="text-2xl font-black text-slate-800 tracking-[0.5em] uppercase">Intelligence</h2>
              <div className="mt-4 flex gap-1 justify-center">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          /* Main Landing Page Content - Strictly Light Theme */
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="flex flex-col items-center justify-center min-h-[100dvh] p-4 relative"
          >
            <div className="z-10 flex flex-col items-center gap-8 md:gap-12 w-full max-w-sm">
              <motion.div
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-125 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
                  <Image
                    src="/logo.jpg"
                    alt="Logo"
                    width={96}
                    height={96}
                    className="rounded-full object-cover border-4 border-white shadow-[0_0_40px_rgba(59,130,246,0.15)] relative z-10"
                  />
                </div>
                <div className="text-center space-y-1">
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">YSG SALES</h1>
                  <p className="text-[9px] md:text-[10px] text-primary uppercase tracking-[0.4em] font-bold">The Future of Distribution</p>
                </div>
              </motion.div>

              <div className="w-full flex flex-col gap-6">
                <AnimatePresence mode="wait">
                  {isAssembling ? (
                    <div key="skeleton" className="w-full h-56 bg-white/80 border border-slate-200/80 rounded-[2rem] relative overflow-hidden flex flex-col items-center justify-center gap-6 shadow-md">
                      <div className="w-16 h-16 bg-slate-100 animate-pulse rounded-3xl" />
                      <div className="w-40 h-8 bg-slate-100 animate-pulse rounded-lg" />
                    </div>
                  ) : (
                    <motion.div
                      key="real"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", damping: 20 }}
                    >
                      <Link href="/login?role=customer" className="group block">
                        <div className="relative w-full h-56 md:h-64 bg-white/80 border border-slate-200/80 rounded-[2rem] flex flex-col items-center justify-center gap-6 transition-all shadow-md group-active:scale-95 cursor-pointer overflow-hidden group-hover:border-primary/50 group-hover:bg-primary/[0.02] group-hover:shadow-lg transition-all duration-300">
                          <div className="p-5 rounded-[2rem] bg-primary/5 text-primary group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500">
                            <ShoppingBag className="w-10 h-10 md:w-12 md:h-12" />
                          </div>
                          <div className="text-center">
                            <span className="text-2xl md:text-3xl font-black text-slate-900 block">دخول العملاء</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.25em]">Customer Portal</span>
                          </div>
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-col items-center gap-4 justify-center mt-4">
                  <Link
                    href="/login?role=admin"
                    className="text-[8px] font-bold text-slate-300 hover:text-slate-600 transition-all uppercase tracking-[0.4em] p-2"
                  >
                    Control System
                  </Link>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="w-full mt-auto md:mt-0"
            >
              <Footer forceLight={true} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LandingContent />
    </Suspense>
  )
}
