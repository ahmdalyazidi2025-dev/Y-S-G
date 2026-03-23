"use client"

import React from 'react'
import Image from 'next/image'
import { Order, useStore } from '@/context/store-context'
import { generateOrderPDF } from '@/lib/pdf-utils'
import { Download, Printer, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PremiumInvoiceProps {
    order: Order;
    id?: string;
    isPreview?: boolean;
    onClose?: () => void;
}

export function PremiumInvoice({ order, id = "premium-invoice-target", isPreview = false, onClose }: PremiumInvoiceProps) {
    const { storeSettings } = useStore()

    const containerClasses = isPreview
        ? "fixed inset-0 z-[1001] bg-slate-100 text-slate-900 font-sans overflow-y-auto flex justify-center p-2 sm:p-4 md:p-8 animate-in fade-in"
        : "w-[800px] p-12 bg-white text-slate-900 font-sans relative overflow-hidden absolute top-0 left-0 opacity-[0.01] pointer-events-none -z-10"

    const wrapperClasses = isPreview ? "w-full max-w-[850px] p-4 sm:p-6 md:p-12 bg-white relative shadow-2xl min-h-fit border-t-[8px] md:border-t-[12px] border-slate-900 my-auto rounded-b-2xl md:rounded-b-3xl" : ""

    const subtotal = order.total / 1.15
    const tax = order.total - subtotal

    const handlePrint = () => {
        window.print()
    }

    return (
        <>
            {/* Global Print Styles to enforce single-invoice printing */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    body * {
                        visibility: hidden !important;
                    }
                    #${id}, #${id} * {
                        visibility: visible !important;
                    }
                    #${id} {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 20mm !important;
                        background: white !important;
                        z-index: 99999 !important;
                        display: block !important;
                        opacity: 1 !important;
                        pointer-events: auto !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            {isPreview && (
                <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[1002] flex flex-wrap gap-2 justify-end no-print max-w-[calc(100vw-32px)]">
                    <Button
                        onClick={() => generateOrderPDF(id, order.id)}
                        className="bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 transition-transform font-black text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
                    >
                        <Download className="w-3 h-3 sm:w-4 sm:h-4 ml-1.5 sm:ml-2" />
                        <span className="hidden sm:inline">تحميل PDF</span>
                        <span className="sm:hidden">تحميل</span>
                    </Button>
                    <Button
                        onClick={handlePrint}
                        className="bg-slate-900 text-white shadow-xl hover:scale-105 transition-transform font-black text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
                    >
                        <Printer className="w-3 h-3 sm:w-4 sm:h-4 ml-1.5 sm:ml-2" />
                        طباعة
                    </Button>
                    {onClose && (
                        <Button onClick={onClose} variant="ghost" className="bg-white/80 backdrop-blur shadow-xl hover:bg-white text-slate-900 h-9 w-9 sm:h-10 sm:w-10 p-0 flex items-center justify-center rounded-full">
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Button>
                    )}
                </div>
            )}

            <div id={id} className={containerClasses} dir="rtl">
                <div className={wrapperClasses}>
                    {/* Background Decorative Elements - Subtle for light theme */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -mr-32 -mt-32" />

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-0 mb-8 sm:mb-16 relative z-10 border-b-2 border-slate-100 pb-6 sm:pb-8">
                        <div className="flex items-center gap-4 sm:gap-6 text-right w-full sm:w-auto">
                            <Image
                                src={storeSettings.logoUrl || "/logo.jpg"}
                                alt="Logo"
                                width={96}
                                height={96}
                                className="rounded-full border-2 sm:border-4 border-slate-900 shadow-xl object-cover w-[64px] h-[64px] sm:w-[96px] sm:h-[96px]"
                                unoptimized
                            />
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-1 text-slate-900">{storeSettings.aboutTitle || "YSG SALES"}</h1>
                                <p className="text-primary text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em]">{storeSettings.shippingTitle || "The Future of Distribution"}</p>
                            </div>
                        </div>
                        <div className="text-right sm:text-left w-full sm:w-auto">
                            <h2 className="text-4xl sm:text-5xl font-black text-slate-900/10 uppercase tracking-tighter mb-2 sm:mb-4">Invoice</h2>
                            <p className="text-slate-500 text-[9px] sm:text-[10px] font-bold">تاريخ الإصدار / Date</p>
                            <p className="font-bold text-slate-900 text-sm">{new Date(order.createdAt).toLocaleDateString('ar-SA')}</p>
                        </div>
                    </div>

                    {/* Client & Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 mb-8 sm:mb-16 relative z-10">
                        <div className="p-5 sm:p-8 border-2 border-slate-900 bg-white rounded-2xl sm:rounded-3xl space-y-4 sm:space-y-6 text-right">
                            <h3 className="text-primary text-[10px] font-black uppercase tracking-widest mb-2 sm:mb-4 border-b border-primary/10 pb-2">سند لأمر | Bill To</h3>

                            {/* Account Section */}
                            <div className="space-y-1">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">صاحب الحساب / Account</p>
                                <p className="text-lg sm:text-xl font-black text-slate-900 leading-tight">{order.accountName || order.customerName}</p>
                            </div>

                            {/* Recipient Section */}
                            <div className="space-y-1 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">المستلم / Recipient</p>
                                <div className="flex flex-col gap-1 items-start">
                                    <p className="text-sm font-black text-slate-900">{order.customerName}</p>
                                    <span className="text-slate-600 text-[10px] font-mono font-bold">
                                        {order.customerPhone || "لا يوجد رقم تواصل"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 sm:p-8 border-2 border-slate-900 bg-slate-900 text-white rounded-2xl sm:rounded-3xl flex flex-col justify-center text-right relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-24 h-24 bg-primary/20 blur-3xl -ml-12 -mt-12 rounded-full" />
                            <h3 className="text-primary text-[10px] font-black uppercase tracking-widest mb-2 sm:mb-4">رقم الفاتورة | Order ID</h3>
                            <p className="text-2xl sm:text-3xl font-black mb-2 relative z-10">#{order.id.slice(-8).toUpperCase()}</p>
                            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10 relative z-10">
                                <p className="text-slate-400 text-[10px] font-bold uppercase">طريقة الدفع / Payment</p>
                                <p className="font-black text-base sm:text-lg text-primary">{order.paymentMethod || "الدفع عند الاستلام"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="mb-8 sm:mb-16 relative z-10">
                        <div className="hidden md:grid grid-cols-12 gap-4 px-6 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                            <div className="col-span-6">المنتج | Product</div>
                            <div className="col-span-2 text-center">الوحدة | Unit</div>
                            <div className="col-span-2 text-center">الكمية | Qty</div>
                            <div className="col-span-2 text-left">الإجمالي | Total</div>
                        </div>
                        <div className="space-y-3 sm:space-y-2">
                            {(order?.items || []).map((item, idx) => {
                                const itemPrice = item.selectedPrice || item.price || 0
                                const itemQty = item.quantity || 0
                                return (
                                    <div key={idx} className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 p-4 sm:p-5 bg-slate-50 rounded-2xl sm:rounded-[20px] border border-slate-100 text-right">
                                        <div className="md:col-span-6 flex justify-between items-start md:block">
                                            <div className="flex-1">
                                                <p className="font-black text-sm sm:text-base text-slate-900">{item.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400">{itemPrice.toFixed(2)} ر.س / للوحدة</p>
                                            </div>
                                            <div className="md:hidden text-left pl-1">
                                                <p className="text-sm font-black text-primary">{(itemQty * itemPrice).toFixed(2)} ر.س</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center md:contents pt-2 md:pt-0 border-t border-slate-200 md:border-0">
                                            <div className="md:col-span-2 md:text-center flex gap-1 items-center md:justify-center">
                                                <span className="md:hidden text-[10px] text-slate-400 font-bold">الوحدة:</span>
                                                <span className="text-xs sm:text-sm font-black text-slate-700">{item.selectedUnit || item.unit || 'حبة'}</span>
                                            </div>
                                            <div className="md:col-span-2 md:text-center flex gap-1 items-center md:justify-center">
                                                <span className="md:hidden text-[10px] text-slate-400 font-bold">الكمية:</span>
                                                <span className="text-sm sm:text-base font-black text-slate-900">{itemQty}</span>
                                            </div>
                                            <div className="hidden md:block md:col-span-2 text-left text-base font-black text-primary">
                                                {(itemQty * itemPrice).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="flex justify-center sm:justify-start relative z-10 pt-4 sm:pt-0">
                        <div className="w-full sm:w-80 space-y-3">
                            <div className="flex justify-between items-center px-2 sm:px-4">
                                <span className="text-slate-400 text-[10px] font-black uppercase">المجموع الفرعي | Subtotal</span>
                                <span className="font-bold text-slate-900 text-sm">{subtotal.toFixed(2)} ر.س</span>
                            </div>
                            <div className="flex justify-between items-center px-2 sm:px-4">
                                <span className="text-slate-400 text-[10px] font-black uppercase">الضريبة | VAT (15%)</span>
                                <span className="font-bold text-primary text-sm">{tax.toFixed(2)} ر.س</span>
                            </div>
                            <div className="flex justify-between items-center p-5 sm:p-6 bg-slate-900 rounded-2xl sm:rounded-3xl shadow-xl mt-4">
                                <span className="text-white text-[10px] sm:text-xs font-black uppercase">الإجمالي | TOTAL</span>
                                <span className="text-xl sm:text-2xl font-black text-white">{order.total.toFixed(2)} <span className="text-[10px] ml-1">ر.س</span></span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-12 sm:mt-20 pt-6 sm:pt-8 border-t-2 border-slate-900 text-center relative z-10">
                        <p className="text-slate-900 text-base sm:text-lg font-black mb-1">شكراً لتعاملكم معنا</p>
                        <p className="text-slate-400 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.4em] mb-4 sm:mb-6">Thank you for choosing {storeSettings.aboutTitle || "YSG"}</p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 text-[9px] font-black text-primary uppercase">
                            <div className="flex flex-col items-center">
                                <span className="text-slate-400">العنوان / Address</span>
                                <span>{storeSettings.contactAddress || "المملكة العربية السعودية"}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-slate-400">للتواصل / Contact</span>
                                <span>{storeSettings.contactPhone || "+966 000 000 000"}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-slate-400">المتجر / Store</span>
                                <span>www.ysg-group.com</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

