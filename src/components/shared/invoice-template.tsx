"use client"

import { useStore } from "@/context/store-context"
import { MapPin, Phone } from "lucide-react"
import Image from "next/image"

export function InvoiceTemplate({ order, isPreview = false }: { order: import("@/context/store-context").Order, isPreview?: boolean }) {
    const { storeSettings } = useStore()

    return (
        <>
            {/* Print Styles - Robust and aggressive to force white background and hide UI */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    
                    /* Hide everything by default using visibility */
                    body * {
                        visibility: hidden;
                    }

                    /* Show the invoice and its children */
                    #invoice-${order.id}, #invoice-${order.id} * {
                        visibility: visible;
                    }
                    
                    /* Position the invoice directly on the page */
                    #invoice-${order.id} {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: auto;
                        margin: 0;
                        padding: 20px;
                        background: white;
                        z-index: 9999;
                        display: block !important;
                    }

                    /* Reset specific styles for print */
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <div className={`bg-white text-black p-8 max-w-4xl mx-auto ${isPreview ? 'block' : 'hidden print:block'}`} id={`invoice-${order.id}`}>
                {/* Header */}
                <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6 mb-6">
                    <div className="flex items-center gap-4">
                        <Image
                            src="/logo.jpg"
                            alt="Logo"
                            width={90}
                            height={90}
                            className="w-[90px] h-[90px] rounded-full object-cover border-4 border-slate-900 shadow-lg"
                        />
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 mb-2">{storeSettings.aboutTitle}</h1>
                            <div className="flex items-center gap-2 text-slate-700 text-sm font-semibold mb-1">
                                <MapPin className="w-4 h-4" />
                                <span>{storeSettings.contactAddress}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-700 text-sm font-semibold">
                                <Phone className="w-4 h-4" />
                                <span>{storeSettings.contactPhone}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="bg-slate-900 text-white px-8 py-3 rounded-lg font-black text-2xl mb-3 inline-block shadow-lg">
                            فاتورة مبيعات
                        </div>
                        <p className="text-slate-700 text-base font-bold mb-1">
                            <span className="font-black">رقم الفاتورة:</span> #{order.id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-slate-700 text-base font-bold">
                            <span className="font-black">التاريخ:</span> {new Date(order.createdAt).toLocaleDateString('ar-SA')}
                        </p>
                    </div>
                </div>

                {/* Customer Info */}
                <div className="mb-6 p-6 bg-slate-100 rounded-xl border-2 border-slate-300">
                    <p className="text-sm text-slate-700 font-black mb-3 uppercase">معلومات العميل</p>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="flex-1 space-y-4">
                            <div>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">صاحب الحساب / Account:</p>
                                <p className="font-black text-lg text-slate-900 leading-tight">
                                    {order.accountName || "---"}
                                </p>
                            </div>

                            <div className="pt-2 border-t border-slate-200">
                                <p className="text-[10px] text-primary/70 font-black uppercase tracking-widest mb-1">المستلم / Recipient:</p>
                                <div className="space-y-1">
                                    <p className="font-bold text-sm text-slate-900 leading-tight">
                                        {order.customerName}
                                    </p>
                                    <p className="text-xs font-mono font-bold text-slate-500">
                                        {order.customerPhone || "لا يوجد رقم"}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right flex flex-col justify-end">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">تفاصيل الدفع / Payment:</p>
                            <p className="font-black text-lg text-slate-900">الدفع عند الاستلام</p>
                            <p className="text-[10px] text-slate-500 font-bold">Cash on Delivery</p>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-6 border-2 border-slate-900 no-break">
                    <thead>
                        <tr className="bg-slate-900 text-white">
                            <th className="text-right py-4 px-4 text-sm font-black">المنتج</th>
                            <th className="text-center py-4 px-3 text-sm font-black">الكمية</th>
                            <th className="text-center py-4 px-3 text-sm font-black">السعر</th>
                            <th className="text-left py-4 px-4 text-sm font-black">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item, idx) => {
                            const priceBeforeTax = item.price;
                            const taxAmount = priceBeforeTax * 0.15;
                            const priceWithTax = priceBeforeTax * 1.15;
                            const totalBeforeTax = priceBeforeTax * item.quantity;
                            const totalTax = taxAmount * item.quantity;
                            const totalWithTax = priceWithTax * item.quantity;

                            return (
                                <tr key={idx} className={`border-b-2 border-slate-300 ${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                                    <td className="py-4 px-4">
                                        <p className="font-black text-base text-slate-900">{item.name}</p>
                                        <p className="text-sm text-slate-600 font-bold">{item.unit}</p>
                                    </td>
                                    <td className="py-4 px-3 text-center">
                                        <span className="font-black text-lg text-slate-900">{item.quantity}</span>
                                    </td>
                                    <td className="py-4 px-3 text-center">
                                        <span className="font-bold text-base text-slate-700">{priceBeforeTax.toFixed(2)}</span>
                                    </td>
                                    <td className="py-4 px-4 text-left">
                                        <div className="text-right">
                                            <p className="font-black text-lg text-slate-900">{totalBeforeTax.toFixed(2)} ر.س</p>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end pt-6 border-t-4 border-slate-900 mb-8">
                    <div className="w-96 space-y-3">
                        {/* Subtotal before tax */}
                        <div className="flex justify-between text-slate-700 text-base py-3 border-b-2 border-slate-300">
                            <span className="font-black">المجموع قبل الضريبة:</span>
                            <span className="font-black text-lg">{(order.total / 1.15).toFixed(2)} ر.س</span>
                        </div>

                        {/* VAT 15% */}
                        <div className="flex justify-between text-slate-700 text-base py-3 border-b-2 border-slate-300">
                            <span className="font-black">ضريبة القيمة المضافة (15%):</span>
                            <span className="font-black text-lg text-red-600">{(order.total - (order.total / 1.15)).toFixed(2)} ر.س</span>
                        </div>

                        {/* Total with tax */}
                        <div className="flex justify-between bg-slate-900 text-white font-black text-xl p-5 rounded-xl shadow-lg mt-3">
                            <span>الإجمالي شامل الضريبة:</span>
                            <span className="text-2xl">{order.total.toFixed(2)} ر.س</span>
                        </div>
                    </div>
                </div>

                {/* Simple Footer */}
                <div className="mt-12 pt-6 border-t-2 border-slate-300 text-center">
                    <p className="text-lg text-slate-900 font-black">شكراً لتعاملكم معنا</p>
                </div>
            </div>
        </>
    )
}
