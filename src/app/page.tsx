"use client"
// Build Trigger: Fix Page Syntax Error

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Users, ShoppingBag, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Footer } from "@/components/store/footer";
import { useSearchParams, useRouter } from "next/navigation";
import { useStore } from "@/context/store-context";

function LandingContent() {
  const searchParams = useSearchParams();
  const isFromLogout = searchParams.get("logout") === "true";

  const [showContent, setShowContent] = useState(false);
  const [isAssembling, setIsAssembling] = useState(!isFromLogout);

  // Join Request State
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinName, setJoinName] = useState("")
  const [joinPhone, setJoinPhone] = useState("")
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false)
  const { products, categories, storeSettings, currentUser, loading, addJoinRequest } = useStore()

  useEffect(() => {
    // Check if user has already seen splash in this session
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");

    if (isFromLogout || hasSeenSplash) {
      setShowContent(true);
      setIsAssembling(false);
    } else {
      const timer = setTimeout(() => {
        setShowContent(true);
        sessionStorage.setItem("hasSeenSplash", "true");
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isFromLogout]);

  // --- Auto-Redirect Logic ---
  const [selectedCategory, setSelectedCategory] = useState("الكل")
  const router = useRouter()

  const activeCategories = categories.filter(c => !c.isHidden)

  const filteredProducts = products.filter(product => {
    // Filter out drafts
    if (product.isDraft) return false

    if (selectedCategory !== "الكل" && product.category !== selectedCategory) {
      return false
    }
    return true
  })

  useEffect(() => {
    if (!loading && currentUser && !isFromLogout) {
      if (currentUser.role === 'admin' || currentUser.role === 'staff') {
        router.replace('/admin')
      } else {
        router.replace('/customer')
      }
    }
  }, [currentUser, loading, isFromLogout, router])
  // ---------------------------

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

  const handleJoinSubmit = async () => {
    if (!joinName || !joinPhone) {
      import("sonner").then(({ toast }) => toast.error("يرجى تعبئة جميع الحقول"))
      return
    }

    // SA Phone Validation
    const phoneRegex = /^(05)(5|0|3|6|4|9|1|8|7)([0-9]{7})$/;
    if (!phoneRegex.test(joinPhone)) {
      import("sonner").then(({ toast }) => toast.error("يرجى إدخال رقم جوال سعودي صحيح (يبدأ بـ 05 ويتكون من 10 أرقام)"))
      return;
    }

    setIsSubmittingJoin(true);
    try {
      await addJoinRequest(joinName, joinPhone)
      setShowJoinModal(false)
      setJoinName("")
      setJoinPhone("")
      import("sonner").then(({ toast }) => toast.success("تم إرسال طلب الانضمام بنجاح"))
    } catch (error) {
      console.error("Join request failed", error);
      import("sonner").then(({ toast }) => toast.error("حدث خطأ أثناء إرسال الطلب"))
    } finally {
      setIsSubmittingJoin(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-[#080b12] overflow-hidden relative">
      {/* Enhanced Background Gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#080b12] to-[#020408]" />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[100px]" />
      </div>

      <AnimatePresence mode="wait">
        {!showContent ? (
          /* Cinematic Splash Screen */
          /* Cinematic Splash Screen */
          <motion.div
            key="splash"
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
              <div className="relative z-10">
                <Image
                  src="/logo.jpg"
                  alt="Logo"
                  width={192}
                  height={192}
                  className="rounded-full object-cover border-8 border-white/5 shadow-2xl shadow-primary/20"
                  priority
                />
                <motion.div
                  initial={{ top: "-10%" }}
                  animate={{ top: "110%" }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} // Sped up scan slightly
                  className="absolute left-0 right-0 h-[2px] bg-primary/50 blur-[2px] z-20 pointer-events-none"
                />
              </div>
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
                      <Link href="/login?role=customer" className="group block relative z-20 w-full max-w-sm mx-auto">
                        <div className="relative w-full aspect-square glass-card flex flex-col items-center justify-center gap-8 transition-all border border-white/10 group-active:scale-[0.98] cursor-pointer overflow-hidden group-hover:border-primary/50 group-hover:shadow-[0_0_80px_-20px_rgba(59,130,246,0.6)] rounded-[48px]">

                          {/* Soft Ambient Background */}
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-500/10 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />

                          {/* Animated Blobs */}
                          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/30 rounded-full blur-[50px] animate-pulse" />
                          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-600/30 rounded-full blur-[50px] animate-pulse delay-700" />

                          {/* Icon Container with Floating Effect */}
                          <div className="relative z-10">
                            <div className="absolute inset-0 bg-white/5 blur-[40px] rounded-full scale-0 group-hover:scale-150 transition-transform duration-700" />
                            <div className="relative w-28 h-28 rounded-[32px] bg-gradient-to-b from-white/10 to-white/5 border border-white/20 backdrop-blur-xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500 will-change-transform">
                              <div className="absolute inset-0 rounded-[32px] border border-t-white/40 border-b-transparent opacity-50" />
                              <ShoppingBag className="w-12 h-12 text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]" />
                            </div>
                          </div>

                          <div className="text-center relative z-10 space-y-3">
                            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter drop-shadow-lg group-hover:scale-105 transition-transform duration-300">
                              دخول العملاء
                            </h2>
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-md group-hover:bg-primary/20 group-hover:border-primary/30 transition-all duration-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em] group-hover:text-white transition-colors">
                                Portal Access
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-center mt-4 flex-col items-center gap-2">
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="text-[10px] text-primary/80 hover:text-primary transition-colors font-bold tracking-widest uppercase opacity-80 hover:opacity-100"
                  >
                    تسجيل طلب انضمام جديد
                  </button>

                  <Link
                    href="/login?role=admin"
                    className="text-[10px] text-slate-500 hover:text-primary transition-colors font-bold tracking-widest uppercase opacity-50 hover:opacity-100"
                  >
                    دخول الإدارة والموظفين
                  </Link>
                </div>
              </div>
            </div>

            {/* Join Request Modal */}
            <AnimatePresence>
              {showJoinModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                  onClick={() => setShowJoinModal(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#0f131a] border border-white/10 p-6 rounded-3xl w-full max-w-md shadow-2xl space-y-4"
                  >
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-white mb-1">طلب انضمام</h3>
                      <p className="text-slate-400 text-sm">أدخل بياناتك وسيتم التواصل معك من قبل الإدارة</p>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400">الاسم الكامل</label>
                        <input
                          type="text"
                          value={joinName}
                          onChange={(e) => setJoinName(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-right focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                          placeholder="اسمك الكريم"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400">رقم الهاتف</label>
                        <input
                          type="tel"
                          value={joinPhone}
                          onChange={(e) => setJoinPhone(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-right focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                          placeholder="05xxxxxxxx"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setShowJoinModal(false)}
                        className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 font-bold"
                        disabled={isSubmittingJoin}
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={handleJoinSubmit}
                        className="flex-1 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 font-bold flex items-center justify-center gap-2"
                        disabled={isSubmittingJoin}
                      >
                        {isSubmittingJoin ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            جاري الإرسال...
                          </>
                        ) : (
                          "إرسال الطلب"
                        )}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

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
    </main >
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080b12]" />}>
      <LandingContent />
    </Suspense>
  )
}
