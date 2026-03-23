"use client"

import React from 'react'
import Image from 'next/image'
import { Order, useStore } from '@/context/store-context'
import { generateOrderPDF } from '@/lib/pdf-utils'
import { Download, Printer, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ReceiptInvoiceProps {
    order: Order;
    id?: string;
    isPreview?: boolean;
    onClose?: () => void;
}

export function ReceiptInvoice({ order, id = "receipt-invoice-target", isPreview = false, onClose }: ReceiptInvoiceProps) {
    const { storeSettings } = useStore()

    const subtotal = order.total / 1.15
    const tax = order.total - subtotal

    const handlePrint = () => {
        window.print()
    }

    return (
        <>
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
                        min-height: 100vh !important;
                        margin: 0 !important;
                        padding: 15mm !important;
                        background: white !important;
                        color: black !important;
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
                <div className="fixed inset-0 z-[1001] bg-black/60 backdrop-blur-sm overflow-y-auto flex items-start justify-center px-2 py-4 sm:p-8 animate-in fade-in" dir="rtl">
                    <div className="w-full max-w-[800px] bg-slate-100 rounded-lg shadow-2xl overflow-hidden flex flex-col relative my-auto">
                        
                        {/* Sticky Top Bar for actions */}
                        <div className="sticky top-0 z-50 bg-white border-b border-slate-200 p-3 sm:p-4 flex items-center justify-between no-print shadow-sm">
                            <h2 className="text-base sm:text-lg font-black text-slate-900 hidden sm:block">معاينة الفاتورة</h2>
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                <Button
                                    onClick={() => generateOrderPDF(id, order.id)}
                                    variant="outline"
                                    className="border-slate-300 hover:bg-slate-50 text-slate-700 font-bold"
                                    size="sm"
                                >
                                    <Download className="w-4 h-4 ml-1.5" />
                                    <span className="hidden sm:inline">تحميل PDF</span>
                                    <span className="sm:hidden">تحميل</span>
                                </Button>
                                <Button
                                    onClick={handlePrint}
                                    className="bg-black text-white hover:bg-slate-800 font-bold"
                                    size="sm"
                                >
                                    <Printer className="w-4 h-4 ml-1.5" />
                                    طباعة
                                </Button>
                                {onClose && (
                                    <Button onClick={onClose} variant="ghost" size="icon" className="text-slate-500 hover:text-red-500 hover:bg-red-50 ml-1">
                                        <X className="w-5 h-5" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Invoice Paper */}
                        <div className="p-3 sm:p-8 flex justify-center w-full">
                            <InvoicePaper id={id} order={order} subtotal={subtotal} tax={tax} storeSettings={storeSettings} />
                        </div>
                    </div>
                </div>
            )}

            {!isPreview && (
                <div className="fixed top-0 left-0 w-[800px] opacity-[0.01] pointer-events-none -z-10 bg-white p-12">
                    <InvoicePaper id={id} order={order} subtotal={subtotal} tax={tax} storeSettings={storeSettings} />
                </div>
            )}
        </>
    )
}

export function InvoicePaper({ id, order, subtotal, tax, storeSettings }: any) {
    return (
        <div id={id} className="w-full max-w-[800px] bg-white p-4 sm:p-10 text-black font-sans mx-auto shadow-sm border border-slate-200" dir="rtl">
            {/* Header */}
            <div className="flex flex-col items-center mb-8 text-center border-b-2 border-black pb-6">
                {(storeSettings?.logoUrl || "/logo.jpg") && (
                    <Image
                        src={storeSettings?.logoUrl || "/logo.jpg"}
                        alt="Logo"
                        width={80}
                        height={80}
                        className="object-contain mb-4 rounded-lg"
                        unoptimized
                    />
                )}
                <h1 className="text-2xl sm:text-3xl font-black text-black mb-2">{storeSettings.aboutTitle || "متجرك"}</h1>
                {storeSettings.contactAddress && <p className="text-slate-700 font-bold text-xs sm:text-sm mb-1">{storeSettings.contactAddress}</p>}
                {storeSettings.contactPhone && <p className="text-slate-700 font-bold text-xs sm:text-sm mb-1">الهاتف: <span className="font-mono">{storeSettings.contactPhone}</span></p>}
                {storeSettings.taxNumber && <p className="text-slate-700 font-bold text-xs sm:text-sm">الرقم الضريبي: <span className="font-mono">{storeSettings.taxNumber}</span></p>}
                
                <div className="mt-6 border-2 border-black inline-block px-4 sm:px-8 py-2 rounded-md bg-slate-50">
                    <h2 className="text-xl sm:text-2xl font-black uppercase">فاتورة ضريبية مبسطة</h2>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 text-xs sm:text-sm border-b border-dashed border-slate-300 pb-6">
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <span className="font-bold text-slate-500 w-24">رقم الفاتورة:</span>
                        <span className="font-black text-black">#{order.id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="font-bold text-slate-500 w-24">التاريخ:</span>
                        <span className="font-black text-black">{new Date(order.createdAt).toLocaleDateString('ar-SA')} - {new Date(order.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="font-bold text-slate-500 w-24">طريقة الدفع:</span>
                        <span className="font-black text-black">{order.paymentMethod || "الدفع عند الاستلام"}</span>
                    </div>
                </div>
                <div className="space-y-3 sm:text-left">
                    <div className="flex sm:justify-end gap-2">
                        <span className="font-bold text-slate-500 w-24 sm:w-auto text-right sm:ml-2">العميل:</span>
                        <span className="font-black text-black">{order.customerName || "عميل نقدي"}</span>
                    </div>
                    <div className="flex sm:justify-end gap-2">
                        <span className="font-bold text-slate-500 w-24 sm:w-auto text-right sm:ml-2">جوال العميل:</span>
                        <span className="font-black text-black font-mono">{order.customerPhone || "---"}</span>
                    </div>
                </div>
            </div>

            {/* Items Table - Clean and simple */}
            <div className="mb-8 overflow-x-auto">
                <table className="w-full text-right border-collapse min-w-[500px]">
                    <thead>
                        <tr className="border-y-2 border-black bg-slate-50 text-xs sm:text-sm">
                            <th className="py-3 px-2 font-black">الصنف</th>
                            <th className="py-3 px-2 font-black text-center w-24">الكمية</th>
                            <th className="py-3 px-2 font-black text-center w-28">سعر الوحدة</th>
                            <th className="py-3 px-2 font-black text-left w-32">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody className="text-xs sm:text-sm">
                        {(order?.items || []).map((item: any, idx: number) => {
                            const price = item.selectedPrice || item.price || 0
                            const qty = item.quantity || 0
                            const itemTotal = price * qty
                            return (
                                <tr key={idx} className="border-b border-slate-200">
                                    <td className="py-4 px-2">
                                        <p className="font-black text-black text-sm">{item.name}</p>
                                        <p className="text-[10px] sm:text-xs text-slate-500 font-bold mt-1">{item.selectedUnit || item.unit}</p>
                                    </td>
                                    <td className="py-4 px-2 text-center font-bold text-black text-base">{qty}</td>
                                    <td className="py-4 px-2 text-center font-bold text-slate-600">{price.toFixed(2)}</td>
                                    <td className="py-4 px-2 text-left font-black text-black text-base">{itemTotal.toFixed(2)}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-10 sm:mb-16">
                <div className="w-full sm:w-80 border-2 border-black rounded-lg p-5 space-y-3 bg-slate-50/50">
                    <div className="flex justify-between text-xs sm:text-sm">
                        <span className="font-bold text-slate-600">المجموع قبل الضريبة:</span>
                        <span className="font-black text-black font-mono">{subtotal.toFixed(2)} ر.س</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                        <span className="font-bold text-slate-600">الضريبة (15%):</span>
                        <span className="font-black text-black font-mono">{tax.toFixed(2)} ر.س</span>
                    </div>
                    <div className="border-t-2 border-dashed border-slate-300 pt-4 flex justify-between items-center mt-3">
                        <span className="font-black text-lg">الإجمالي للطلب:</span>
                        <span className="font-black text-2xl font-mono">{order.total.toFixed(2)} <span className="text-sm">ر.س</span></span>
                    </div>
                </div>
            </div>

            {/* Footer Text */}
            <div className="text-center font-bold text-xs sm:text-sm text-slate-500 border-t-2 border-black pt-6">
                <p className="mb-2 text-black font-black text-base sm:text-lg">شكراً لتسوقكم معنا!</p>
                <p>البضاعة المباعة لا ترد ولا تستبدل إلا حسب سياسة المتجر</p>
                <p className="mt-2 text-[10px] text-slate-400 font-mono tracking-widest break-all">ID: {order.id}</p>
            </div>
        </div>
    )
}
