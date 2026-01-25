"use client"

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Users, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Footer } from "@/components/store/footer";
import { useSearchParams } from "next/navigation";

function LandingContent() {
  const searchParams = useSearchParams();
  const isFromLogout = searchParams.get("logout") === "true";

  const [showContent, setShowContent] = useState(isFromLogout);
  const [isAssembling, setIsAssembling] = useState(!isFromLogout);

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
    <main className="min-h-[100dvh] bg-[#080b12] overflow-hidden relative">
      <AnimatePresence mode="wait">
        {!showContent ? (
          /* Cinematic Splash Screen */
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#080b12]"
          >
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-primary/30 blur-[100px] rounded-full"
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
                  className="rounded-full object-cover border-8 border-white/5 shadow-2xl shadow-primary/20"
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
              <h2 className="text-2xl font-black text-white tracking-[0.5em] uppercase">Intelligence</h2>
              <div className="mt-4 flex gap-1 justify-center">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          /* Main Landing Page Content */
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
                  <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full scale-125 group-hover:scale-150 transition-transform duration-700" />
                  <Image
                    src="/logo.jpg"
                    alt="Logo"
                    width={96}
                    height={96}
                    className="rounded-full object-cover border-4 border-white/10 shadow-[0_0_40px_rgba(59,130,246,0.3)] relative z-10"
                  />
                </div>
                <div className="text-center space-y-1">
                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter">YSG SALES</h1>
                  <p className="text-[9px] md:text-[10px] text-primary/80 uppercase tracking-[0.4em] font-bold">The Future of Distribution</p>
                </div>
              </motion.div>

              <div className="w-full flex flex-col gap-6">
                <AnimatePresence mode="wait">
                  {isAssembling ? (
                    <div key="skeleton" className="w-full h-56 glass-card border-white/5 relative overflow-hidden flex flex-col items-center justify-center gap-6">
                      <div className="w-16 h-16 skeleton rounded-3xl" />
                      <div className="w-40 h-8 skeleton" />
                    </div>
                  ) : (
                    <motion.div
                      key="real"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", damping: 20 }}
                    >
                      <Link href="/login?role=customer" className="group block relative z-20">
                        <div className="relative w-full h-64 md:h-72 glass-card flex flex-col items-center justify-center gap-8 transition-all border border-white/10 group-active:scale-[0.98] cursor-pointer overflow-hidden group-hover:border-primary/50 group-hover:shadow-[0_0_50px_-10px_rgba(59,130,246,0.5)]">

                          {/* Animated Background Gradient */}
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                          {/* Tech Grid Background (Subtle) */}
                          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20" />

                          {/* Icon Container with Orb Effect */}
                          <div className="relative">
                            <div className="absolute inset-0 bg-primary/40 blur-[30px] rounded-full scale-0 group-hover:scale-150 transition-transform duration-700 delay-100" />
                            <div className="relative w-24 h-24 rounded-full bg-gradient-to-b from-white/10 to-white/5 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:border-primary/50 transition-all duration-500">
                              <div className="absolute inset-0 rounded-full border border-t-white/30 border-b-transparent opacity-50" />
                              <ShoppingBag className="w-10 h-10 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] group-hover:text-primary transition-colors duration-300" />
                            </div>

                            {/* Floating Particles/dots around icon */}
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className={`absolute w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(59,130,246,1)] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-700`}
                                style={{
                                  transform: `rotate(${i * 120}deg) translateY(-40px)`,
                                  transitionDelay: `${i * 100}ms`
                                }}
                              />
                            ))}
                          </div>

                          <div className="text-center relative z-10 space-y-2">
                            <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tracking-tighter group-hover:to-white transition-all">
                              دخول العملاء
                            </h2>
                            <div className="flex items-center justify-center gap-3">
                              <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-primary/50" />
                              <span className="text-[10px] text-primary font-bold uppercase tracking-[0.4em] group-hover:tracking-[0.6em] transition-all duration-500 shadow-primary/50">
                                CUSTOMER PORTAL
                              </span>
                              <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-primary/50" />
                            </div>
                          </div>

                          {/* Hover Reveal Text */}
                          <div className="absolute bottom-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0 text-[10px] text-slate-400 font-medium font-mono">
                            CLICK TO ACCESS STORE
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-center mt-4">
                  <Link
                    href="/login?role=admin"
                    className="text-[10px] text-slate-500 hover:text-primary transition-colors font-bold tracking-widest uppercase opacity-50 hover:opacity-100"
                  >
                    دخول الإدارة والموظفين
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
              <Footer />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080b12]" />}>
      <LandingContent />
    </Suspense>
  )
}
