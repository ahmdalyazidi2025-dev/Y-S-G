"use client"

import React from 'react'
import Image from 'next/image'
import { Order } from '@/context/store-context'
import { generateOrderPDF } from '@/lib/pdf-utils'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PremiumInvoiceProps {
    order: Order;
    id?: string;
    isPreview?: boolean;
    onClose?: () => void;
}

export function PremiumInvoice({ order, id = "invoice-preview", isPreview = false, onClose }: PremiumInvoiceProps) {
    const containerClasses = isPreview
        ? "fixed inset-0 z-[1001] bg-slate-100 text-slate-900 font-sans overflow-y-auto flex justify-center p-8 animate-in fade-in"
        : "w-[800px] p-12 bg-white text-slate-900 font-sans relative overflow-hidden absolute top-0 left-0 opacity-[0.01] pointer-events-none -z-10"

    const wrapperClasses = isPreview ? "w-[800px] p-12 bg-white relative shadow-2xl min-h-full border-t-[12px] border-slate-900" : ""

    return (
        <>
            {isPreview && (
                <div className="fixed top-6 right-6 z-[1002] flex gap-2 no-print">
                    <Button
                        onClick={() => generateOrderPDF(id, order.id)}
                        className="bg-primary text-white shadow-2xl shadow-primary/20 hover:scale-105 transition-transform font-black"
                    >
                        <Download className="w-4 h-4 ml-2" />
                        تحميل PDF
                    </Button>
                    {onClose && (
                        <Button onClick={onClose} variant="ghost" className="bg-slate-900/10 hover:bg-slate-900/20 text-slate-900 font-black">
                            إغلاق
                        </Button>
                    )}
                </div>
            )}

            {!isPreview && (
                <div className="fixed bottom-8 left-8 z-[1000] flex gap-2 no-print">
                    <Button
                        onClick={() => generateOrderPDF(id, order.id)}
                        className="bg-primary text-white shadow-2xl shadow-primary/20 hover:scale-105 transition-transform font-black"
                    >
                        <Download className="w-4 h-4 ml-2" />
                        تحميل PDF
                    </Button>
                </div>
            )}

            <div id={id} className={containerClasses}>
                <div className={wrapperClasses}>
                    {/* Background Decorative Elements - Subtle for light theme */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -mr-32 -mt-32" />

                    {/* Header */}
                    <div className="flex justify-between items-start mb-16 relative z-10 border-b-2 border-slate-100 pb-8">
                        <div className="flex items-center gap-6">
                            <Image
                                src="/logo.jpg"
                                alt="Logo"
                                width={96}
                                height={96}
                                className="rounded-full border-4 border-slate-900 shadow-xl"
                            />
                            <div>
                                <h1 className="text-4xl font-black tracking-tighter mb-1 text-slate-900">YSG SALES</h1>
                                <p className="text-primary text-sm font-bold uppercase tracking-[0.3em]">The Future of Distribution</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-5xl font-black text-slate-900/10 uppercase tracking-tighter mb-4">Invoice</h2>
                            <p className="text-slate-500 text-sm">تاريخ الإصدار / Date</p>
                            <p className="font-bold text-slate-900">{new Date(order.createdAt).toLocaleString('ar-SA')}</p>
                        </div>
                    </div>

                    {/* Client & Info */}
                    <div className="grid grid-cols-2 gap-12 mb-16 relative z-10">
                        <div className="p-8 border-2 border-slate-900 bg-white rounded-3xl space-y-6">
                            <h3 className="text-primary text-[10px] font-black uppercase tracking-widest mb-4">Bill To | عميلنا العزيز</h3>

                            {/* Account Section */}
                            <div className="space-y-1">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">صاحب الحساب / Account</p>
                                <p className="text-xl font-black text-slate-900">{order.accountName || "---"}</p>
                            </div>

                            {/* Recipient Section - ALWAYS visible for name and phone clarity */}
                            <div className="space-y-1 mt-4 pt-4 border-t border-slate-100">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">المستلم / Recipient</p>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <p className="text-sm font-black text-slate-900">{order.customerName}</p>
                                    <span className="text-slate-600 text-[10px] bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-mono tracking-widest">
                                        {order.customerPhone || "لا يوجد رقم"}
                                    </span>
                                </div>
                            </div>

                            <p className="text-slate-400 text-[10px] mt-4 pt-4 border-t border-slate-100">رقم العميل: {order.customerId}</p>
                        </div>
                        <div className="p-8 border-2 border-slate-900 bg-slate-900 text-white rounded-3xl flex flex-col justify-center">
                            <h3 className="text-primary text-[10px] font-black uppercase tracking-widest mb-4">Order ID | رقم الطلب</h3>
                            <p className="text-4xl font-black mb-2">#{order.id.slice(-8).toUpperCase()}</p>
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <p className="text-slate-400 text-sm">الحالة / Status</p>
                                <p className="font-bold text-lg">{order.status === 'delivered' ? 'مكتمل / Delivered' : 'قيد المعالجة / In Progress'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="mb-16 relative z-10">
                        <div className="grid grid-cols-12 gap-4 px-6 mb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <div className="col-span-6">Product | المنتج</div>
                            <div className="col-span-2 text-center">Unit | الوحدة</div>
                            <div className="col-span-2 text-center">Qty | الكمية</div>
                            <div className="col-span-2 text-right">Total | الإجمالي</div>
                        </div>
                        <div className="space-y-3">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100 items-center">
                                    <div className="col-span-6">
                                        <p className="font-bold text-lg text-slate-900">{item.name}</p>
                                        <p className="text-xs text-slate-500">{item.price} ر.س</p>
                                    </div>
                                    <div className="col-span-2 text-center text-sm font-bold text-slate-600">{item.unit || 'حبة'}</div>
                                    <div className="col-span-2 text-center text-lg font-black text-slate-900">{item.quantity}</div>
                                    <div className="col-span-2 text-right text-lg font-black text-primary">{(item.quantity * item.price).toFixed(2)}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="flex justify-end relative z-10">
                        <div className="w-80 space-y-4">
                            <div className="flex justify-between items-center px-4">
                                <span className="text-slate-500 text-xs font-bold uppercase">Subtotal | المجموع</span>
                                <span className="font-bold text-slate-900">{(order.total).toFixed(2)} ر.س</span>
                            </div>
                            <div className="flex justify-between items-center px-4">
                                <span className="text-slate-500 text-xs font-bold uppercase">Tax | الضريبة (0%)</span>
                                <span className="font-bold text-slate-900">0.00 ر.س</span>
                            </div>
                            <div className="flex justify-between items-center p-8 bg-slate-900 rounded-3xl shadow-2xl">
                                <span className="text-white text-sm font-black uppercase">Grand Total | الإجمالي</span>
                                <span className="text-3xl font-black text-white">{order.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-20 pt-8 border-t-2 border-slate-900 text-center relative z-10">
                        <p className="text-slate-900 text-lg font-black mb-2">شكراً لتعاملكم معنا</p>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.5em] mb-6">Thank you for choosing YSG SALES</p>
                        <div className="flex justify-center gap-12 text-[9px] font-black text-primary uppercase">
                            <span>www.ysg-group.com</span>
                            <span>support@ysg-group.com</span>
                            <span>+966 500 000 000</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
