"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2, Check, X, ImageIcon, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { applyProfessionalTemplate } from "@/lib/image-utils";
import { useStore } from "@/context/store-context";

interface ImageEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageFile: File | null;
    onSave: (processedFile: File) => void;
}

export function ImageEditorModal({ isOpen, onClose, imageFile, onSave }: ImageEditorModalProps) {
    const { storeSettings } = useStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [originalUrl, setOriginalUrl] = useState<string | null>(null);
    const [resultFile, setResultFile] = useState<File | null>(null);

    // Initialize preview when file changes
    useEffect(() => {
        if (imageFile) {
            const url = URL.createObjectURL(imageFile);
            setOriginalUrl(url);
            setPreviewUrl(url);
            setResultFile(null); // Reset result
            return () => URL.revokeObjectURL(url);
        }
    }, [imageFile]);

    const handleMagicFix = async () => {
        if (!imageFile) return;
        setIsProcessing(true);
        try {
            // Apply background removal and template
            const processedBase64 = await applyProfessionalTemplate(imageFile, storeSettings?.logoUrl || "");

            // Convert base64 back to file for preview/saving
            const res = await fetch(processedBase64);
            const blob = await res.blob();
            const processedFile = new File([blob], "processed_image.png", { type: "image/png" });

            const processedUrl = URL.createObjectURL(processedFile);
            setPreviewUrl(processedUrl);
            setResultFile(processedFile);
            toast.success("تم تحسين الصورة بنجاح!");
        } catch (error) {
            console.error("Processing failed:", error);
            toast.error("فشلت عملية التحسين. حاول مرة أخرى.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSave = () => {
        if (resultFile) {
            onSave(resultFile);
        } else if (imageFile) {
            onSave(imageFile); // Save original if no changes
        }
        onClose();
    };

    const handleReset = () => {
        if (originalUrl) {
            setPreviewUrl(originalUrl);
            setResultFile(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-white dark:bg-zinc-900 border-none rounded-2xl overflow-hidden shadow-2xl">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
                        <Wand2 className="w-5 h-5 text-indigo-500" />
                        استوديو المنتجات الذكي
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 pt-2 space-y-6">
                    {/* Image Veiwer */}
                    <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex items-center justify-center group">
                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-full h-full object-contain transition-all duration-500"
                            />
                        ) : (
                            <div className="text-zinc-400 flex flex-col items-center">
                                <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                                <span className="text-sm">لا توجد صورة</span>
                            </div>
                        )}

                        {isProcessing && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
                                <Loader2 className="w-10 h-10 animate-spin mb-3 text-indigo-500" />
                                <p className="font-medium animate-pulse">جاري إزالة الخلفية وتوحيد التصميم...</p>
                                <p className="text-xs text-white/70 mt-1">قد يستغرق هذا بضعة ثوانٍ</p>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="flex gap-3">
                        {!resultFile ? (
                            <Button
                                onClick={handleMagicFix}
                                disabled={isProcessing || !imageFile}
                                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20 border-0 h-12 text-lg"
                            >
                                <Wand2 className="w-5 h-5 ml-2 mr-1" />
                                تحسين تلقائي (Magic Fix)
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={handleReset}
                                className="flex-1 border-zinc-200 dark:border-zinc-700 h-12 text-zinc-600 dark:text-zinc-300"
                            >
                                <Undo2 className="w-4 h-4 ml-2" />
                                تراجع
                            </Button>
                        )}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <Button variant="ghost" onClick={onClose} className="text-zinc-500 hover:text-zinc-700">
                            إلغاء
                        </Button>
                        <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]">
                            <Check className="w-4 h-4 ml-2" />
                            حفظ واستخدام
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
