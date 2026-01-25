"use client"

import React from 'react'
import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'
import { Order } from '@/context/store-context'
import { generateInvoicePDF } from '@/lib/pdf-generator'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PremiumInvoiceProps {
    order: Order;
    id: string;
}

export function PremiumInvoice({ order, id }: PremiumInvoiceProps) {
    return (
        <>
            <div className="fixed bottom-8 left-8 z-[1000] flex gap-2 no-print">
                <Button
                    onClick={() => generateInvoicePDF(id, `Invoice-${order.id}`)}
                    className="bg-primary text-white shadow-2xl shadow-primary/20 hover:scale-105 transition-transform"
                >
                    <Download className="w-4 h-4 ml-2" />
                    تحميل PDF
                </Button>
            </div>

            <div id={id} className="w-[800px] p-12 bg-[#080b12] text-white font-sans relative overflow-hidden fixed top-[-9999px] left-[-9999px]">
                {/* Background Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -ml-32 -mb-32" />

                {/* Header */}
                <div className="flex justify-between items-start mb-16 relative z-10">
                    <div className="flex items-center gap-6">
                        <Image
                            src="/logo.jpg"
                            alt="Logo"
                            width={96}
                            height={96}
                            className="rounded-full border-4 border-white/10 shadow-2xl"
                        />
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter mb-1">YSG SALES</h1>
                            <p className="text-primary text-sm font-bold uppercase tracking-[0.3em]">The Future of Distribution</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-5xl font-black text-white/5 uppercase tracking-tighter mb-4">Invoice</h2>
                        <p className="text-slate-400 text-sm">تاريخ الإصدار / Date</p>
                        <p className="font-bold">{new Date(order.createdAt).toLocaleString('ar-SA')}</p>
                    </div>
                </div>

                {/* Client & Info */}
                <div className="grid grid-cols-2 gap-12 mb-16 relative z-10">
                    <div className="glass-card p-8 border-white/10 bg-white/5 rounded-3xl">
                        <h3 className="text-primary text-[10px] font-black uppercase tracking-widest mb-4">Bill To | عميلنا العزيز</h3>
                        <p className="text-2xl font-black mb-2">{order.customerName}</p>
                        <p className="text-slate-400 text-sm">رقم العميل: {order.customerId}</p>
                    </div>
                    <div className="glass-card p-8 border-white/10 bg-white/5 rounded-3xl flex justify-between items-center">
                        <div>
                            <h3 className="text-primary text-[10px] font-black uppercase tracking-widest mb-4">Order ID | رقم الطلب</h3>
                            <p className="text-2xl font-black mb-2">#{order.id.slice(-6).toUpperCase()}</p>
                            <p className="text-slate-400 text-sm">الحالة: {order.status === 'delivered' ? 'مكتمل' : 'قيد المعالجة'}</p>
                        </div>
                        <div className="p-3 bg-white rounded-2xl shadow-2xl">
                            <QRCodeSVG value={`https://ysg-sales.web.app/verify/${order.id}`} size={80} level="H" />
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
                            <div key={idx} className="grid grid-cols-12 gap-4 p-6 bg-white/5 rounded-2xl border border-white/5 items-center">
                                <div className="col-span-6">
                                    <p className="font-bold text-lg">{item.name}</p>
                                    <p className="text-xs text-slate-500">{item.price} ر.س</p>
                                </div>
                                <div className="col-span-2 text-center text-sm font-bold text-slate-400">{item.unit || 'حبة'}</div>
                                <div className="col-span-2 text-center text-lg font-black">{item.quantity}</div>
                                <div className="col-span-2 text-right text-lg font-black text-primary">{(item.quantity * item.price).toFixed(2)}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Summary */}
                <div className="flex justify-end relative z-10">
                    <div className="w-72 space-y-4">
                        <div className="flex justify-between items-center px-4">
                            <span className="text-slate-500 text-xs font-bold uppercase">Subtotal</span>
                            <span className="font-bold">{(order.total).toFixed(2)} ر.س</span>
                        </div>
                        <div className="flex justify-between items-center px-4">
                            <span className="text-slate-500 text-xs font-bold uppercase">Tax (VAT 0%)</span>
                            <span className="font-bold">0.00 ر.س</span>
                        </div>
                        <div className="flex justify-between items-center p-6 bg-primary rounded-3xl shadow-xl shadow-primary/20">
                            <span className="text-white text-sm font-black uppercase">Grand Total</span>
                            <span className="text-3xl font-black text-white">{order.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-20 pt-8 border-t border-white/5 text-center relative z-10">
                    <p className="text-slate-400 text-xs font-medium mb-2">(هذا الإشعار هو تأكيد لإتمام طلبكم فقط)</p>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.5em] mb-4">Thank you for choosing YSG SALES</p>
                    <div className="flex justify-center gap-12 text-[8px] font-black text-primary uppercase">
                        <span>www.ysg-group.com</span>
                        <span>support@ysg-group.com</span>
                        <span>+966 500 000 000</span>
                    </div>
                </div>
            </div>
        </>
    )
}
