"use client"

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Users, ShoppingBag, Loader2, ArrowRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Footer } from "@/components/store/footer";
import { useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "next-themes";
import { addJoinRequestAction } from "@/app/actions/auth-actions";
import { useStore } from "@/context/store-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function LandingContent() {
  const searchParams = useSearchParams();
  const isFromLogout = searchParams.get("logout") === "true";
  const { setTheme } = useTheme();
  const { storeSettings } = useStore();

  const [showContent, setShowContent] = useState(isFromLogout);
  const [isAssembling, setIsAssembling] = useState(!isFromLogout);

  // Join Request State
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinName, setJoinName] = useState("");
  const [joinPhone, setJoinPhone] = useState("");
  const [joinCenterName, setJoinCenterName] = useState("");
  const [joinLocation, setJoinLocation] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [joinConfirmPassword, setJoinConfirmPassword] = useState("");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaPromptModal, setShowPwaPromptModal] = useState(false);
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [activePolicy, setActivePolicy] = useState<{ title: string; content: string } | null>(null);

  useEffect(() => {
    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

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

  const handleJoinSubmit = async () => {
    if (!joinName || !joinPhone || !joinCenterName || !joinLocation || !joinPassword || !joinConfirmPassword) {
      import("sonner").then(({ toast }) => toast.error("يرجى تعبئة جميع الحقول"));
      return;
    }

    if (!agreeTerms) {
      import("sonner").then(({ toast }) => toast.error("يرجى الموافقة على شروط الاستخدام وسياسة الخصوصية للمتابعة"));
      return;
    }

    if (joinPassword.length < 6) {
      import("sonner").then(({ toast }) => toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل"));
      return;
    }

    if (joinPassword !== joinConfirmPassword) {
      import("sonner").then(({ toast }) => toast.error("كلمة المرور وتأكيدها غير متطابقين"));
      return;
    }

    // SA Phone Validation (strictly 10 digits starting with 05)
    const phoneRegex = /^05\d{8}$/;
    if (!phoneRegex.test(joinPhone)) {
      import("sonner").then(({ toast }) => toast.error("يرجى إدخال رقم جوال سعودي صحيح يتكون من 10 أرقام ويبدأ بـ 05"));
      return;
    }

    setIsSubmittingJoin(true);
    try {
      const result = await addJoinRequestAction(joinName, joinPhone, joinCenterName, joinLocation, joinPassword);
      if (!result.success) {
        throw new Error(result.error || "حدث خطأ أثناء إرسال الطلب");
      }
      try {
        localStorage.setItem("ysg_pending_request", JSON.stringify({
          name: joinName,
          phone: joinPhone,
          centerName: joinCenterName,
          location: joinLocation,
          status: "pending"
        }));
      } catch (e) {
        console.error("Failed to write ysg_pending_request to localStorage:", e);
      }
      setShowJoinModal(false);
      setJoinName("");
      setJoinPhone("");
      setJoinCenterName("");
      setJoinLocation("");
      setJoinPassword("");
      setJoinConfirmPassword("");
      import("sonner").then(({ toast }) => toast.success("تم إرسال طلب الانضمام بنجاح"));
    } catch (error: any) {
      console.error("Join request failed", error);
      import("sonner").then(({ toast }) => toast.error(error.message || "حدث خطأ أثناء إرسال الطلب"));
    } finally {
      setIsSubmittingJoin(false);
    }
  };

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
                    <div key="skeleton" className="w-full space-y-6">
                      <div className="w-full h-56 bg-white/80 border border-slate-200/80 rounded-[2rem] relative overflow-hidden flex flex-col items-center justify-center gap-6 shadow-md">
                        <div className="w-16 h-16 bg-slate-100 animate-pulse rounded-3xl" />
                        <div className="w-40 h-8 bg-slate-100 animate-pulse rounded-lg" />
                      </div>
                      <div className="w-full h-32 bg-white/80 border border-slate-200/80 rounded-[2rem] relative overflow-hidden flex flex-col items-center justify-center gap-4 shadow-md">
                        <div className="w-10 h-10 bg-slate-100 animate-pulse rounded-2xl" />
                        <div className="w-32 h-6 bg-slate-100 animate-pulse rounded-lg" />
                      </div>
                    </div>
                  ) : (
                    <motion.div
                      key="real"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", damping: 20 }}
                      className="space-y-6"
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

                      {/* Join Request Box */}
                      <motion.button
                        onClick={() => {
                          const isInstalled = window.matchMedia("(display-mode: standalone)").matches || localStorage.getItem("ysg-pwa-installed") === "1"
                          if (!isInstalled) {
                            setShowPwaPromptModal(true)
                          } else {
                            setShowJoinModal(true)
                          }
                        }}
                        className="group relative w-full h-32 bg-white/80 border border-slate-200/80 rounded-[2rem] flex items-center justify-center gap-6 transition-all active:scale-[0.98] cursor-pointer overflow-hidden hover:border-primary/50 hover:bg-primary/[0.02] hover:shadow-lg transition-all duration-300 px-8 text-right"
                      >
                        {/* Soft Ambient Background */}
                        <div className="absolute inset-0 bg-gradient-to-l from-primary/5 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                        {/* Icon Container */}
                        <div className="relative z-10 shrink-0">
                          <div className="relative w-16 h-16 rounded-[1.25rem] bg-primary/5 border border-primary/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500 text-primary">
                            <Users className="w-7 h-7" />
                          </div>
                        </div>

                        <div className="text-right flex-1 relative z-10 space-y-1">
                          <h2 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-primary transition-colors">
                            طلب انضمام
                          </h2>
                          <p className="text-[11px] text-slate-500 font-bold tracking-wide">
                            كن شريكاً لنا في النجاح
                          </p>
                        </div>

                        <div className="absolute left-6 top-1/2 -translate-y-1/2 rotate-[-90deg] opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-500">
                          <ArrowRight className="w-5 h-5 text-primary" />
                        </div>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Visible admin link removed for better customer security. Direct URL access /login?role=admin remains functional. */}
                <div className="h-6" />
              </div>
            </div>

            {/* Join Request Modal */}
            <AnimatePresence>
              {showJoinModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                  onClick={() => setShowJoinModal(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white border border-slate-200 p-6 rounded-[2rem] w-full max-w-md shadow-2xl space-y-4 text-slate-900"
                  >
                    <div className="text-center relative">
                      {/* X Button in the top to close */}
                      <button 
                        onClick={() => setShowJoinModal(false)}
                        className="absolute left-0 top-0 p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <h3 className="text-xl font-bold text-slate-900 mb-1">طلب انضمام</h3>
                      <p className="text-slate-500 text-sm">أدخل بياناتك وسيتم تفعيل حسابك فور تعميده من الإدارة</p>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-600 block text-right pr-1 font-bold">الاسم الكامل</label>
                        <input
                          type="text"
                          value={joinName}
                          onChange={(e) => setJoinName(e.target.value)}
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-right focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                          placeholder="اسمك الكريم"
                          autoComplete="off"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-600 block text-right pr-1 font-bold">اسم المركز / المحل</label>
                        <input
                          type="text"
                          value={joinCenterName}
                          onChange={(e) => setJoinCenterName(e.target.value)}
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-right focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                          placeholder="مثال: مركز العناية بالسيارات"
                          autoComplete="off"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-600 block text-right pr-1 font-bold">المدينة / الموقع</label>
                        <input
                          type="text"
                          value={joinLocation}
                          onChange={(e) => setJoinLocation(e.target.value)}
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-right focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                          placeholder="مثال: الرياض"
                          autoComplete="off"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-600 block text-right pr-1 font-bold">رقم الهاتف (لتسجيل الدخول)</label>
                        <input
                          type="tel"
                          value={joinPhone}
                          onChange={(e) => setJoinPhone(e.target.value)}
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-right focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all font-mono"
                          placeholder="05xxxxxxx"
                          autoComplete="off"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-600 block text-right pr-1 font-bold">كلمة المرور</label>
                        <input
                          type="password"
                          value={joinPassword}
                          onChange={(e) => setJoinPassword(e.target.value)}
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-right focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                          placeholder="أدخل كلمة المرور (6 خانات على الأقل)"
                          autoComplete="off"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-600 block text-right pr-1 font-bold">تأكيد كلمة المرور</label>
                        <input
                          type="password"
                          value={joinConfirmPassword}
                          onChange={(e) => setJoinConfirmPassword(e.target.value)}
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-right focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                          placeholder="أعد إدخال كلمة المرور"
                          autoComplete="off"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-2 text-right">
                        <input
                          type="checkbox"
                          id="agree-terms"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                        />
                        <label htmlFor="agree-terms" className="text-xs text-slate-600 cursor-pointer select-none font-bold">
                          أوافق على{" "}
                          <button
                            type="button"
                            onClick={() => setActivePolicy({ title: "شروط الاستخدام", content: storeSettings.footerTerms })}
                            className="text-primary hover:underline font-extrabold focus:outline-none"
                          >
                            شروط الاستخدام
                          </button>{" "}
                          و{" "}
                          <button
                            type="button"
                            onClick={() => setActivePolicy({ title: "سياسة الخصوصية والأحكام", content: storeSettings.footerPrivacy })}
                            className="text-primary hover:underline font-extrabold focus:outline-none"
                          >
                            سياسة الخصوصية
                          </button>
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setShowJoinModal(false)}
                        className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold transition-colors"
                        disabled={isSubmittingJoin}
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={handleJoinSubmit}
                        className="flex-1 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 font-bold flex items-center justify-center gap-2 transition-colors"
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

            {/* PWA Pre-Join Requirement Modal */}
            <AnimatePresence>
              {showPwaPromptModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                  onClick={() => setShowPwaPromptModal(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative bg-slate-950 border border-white/10 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl space-y-6 text-center text-white"
                  >
                    {/* Close 'X' button in the top left for refusal */}
                    <button 
                      onClick={() => {
                        setShowPwaPromptModal(false);
                        setShowJoinModal(true); // Open the join request modal anyway if they refuse/close
                      }}
                      className="absolute top-5 left-5 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                      title="متابعة بدون تثبيت"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="w-20 h-20 bg-primary/10 rounded-[24px] flex items-center justify-center mx-auto text-primary text-4xl shadow-lg border border-primary/20">
                      📱
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-white">تثبيت أيقونة المتجر أولاً</h3>
                      <p className="text-slate-400 text-xs leading-relaxed max-w-[280px] mx-auto">
                        لضمان تلقي إشعارات قبول انضمامك الفورية ومتابعة فواتيرك وطلب المنتجات بضغطة واحدة، نوصيك بتثبيت أيقونة المتجر على شاشتك الرئيسية أولاً.
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <button
                        onClick={async () => {
                          if (deferredPrompt) {
                            await deferredPrompt.prompt()
                            const { outcome } = await deferredPrompt.userChoice
                            if (outcome === "accepted") {
                              localStorage.setItem("ysg-pwa-installed", "1")
                              setShowPwaPromptModal(false)
                              setShowJoinModal(true) // Proceed to join request!
                            }
                          } else {
                            // iOS / unsupported browser
                            import("sonner").then(({ toast }) => {
                              toast.info("لأجهزة الآيفون: اضغط على زر المشاركة بالأسفل ثم اختر 'إضافة إلى الشاشة الرئيسية' للثبيت.", { duration: 6000 });
                            });
                            // Let them proceed after showing iOS message
                            setTimeout(() => {
                              setShowPwaPromptModal(false);
                              setShowJoinModal(true);
                            }, 3000);
                          }
                        }}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-white font-black text-sm shadow-xl shadow-primary/25 hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
                      >
                        📥 تثبيت أيقونة المتجر الآن
                      </button>

                      <button
                        onClick={() => {
                          setShowPwaPromptModal(false);
                          setShowJoinModal(true); // Bypass and open join modal
                        }}
                        className="text-slate-500 hover:text-slate-350 text-xs font-bold transition-colors underline"
                      >
                        متابعة بدون تثبيت (طلب عادي)
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
              <Footer forceLight={true} />
            </motion.div>
            <Dialog open={!!activePolicy} onOpenChange={(open) => !open && setActivePolicy(null)}>
              {activePolicy && (
                <DialogContent className="glass-card border-slate-200 dark:border-white/5 text-slate-950 dark:text-white max-w-2xl bg-white dark:bg-[#1a242f] rounded-3xl p-6 shadow-2xl z-[100]">
                  <DialogHeader className="border-b border-slate-100 dark:border-white/10 pb-4 mb-4">
                    <DialogTitle className="text-right font-black text-xl text-primary">{activePolicy.title}</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[60vh] overflow-y-auto pr-1 no-scrollbar text-right text-slate-700 dark:text-slate-350 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {activePolicy.content || "لا توجد تفاصيل متوفرة حالياً لهذه السياسة."}
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Button onClick={() => setActivePolicy(null)} className="rounded-xl px-6 font-bold bg-primary text-white hover:bg-primary/95 transition-all">
                      إغلاق
                    </Button>
                  </div>
                </DialogContent>
              )}
            </Dialog>
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
