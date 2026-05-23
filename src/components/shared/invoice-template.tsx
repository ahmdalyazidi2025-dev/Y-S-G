"use client"

import { useStore } from "@/context/store-context"
import { MapPin, Phone } from "lucide-react"
import Image from "next/image"

export function InvoiceTemplate({ order }: { order: import("@/context/store-context").Order }) {
    const { storeSettings } = useStore()

    return (
        <>
            {/* Print Styles - Hide everything except invoice when printing */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 10mm;
                    }
                    
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    
                    body * {
                        visibility: hidden;
                    }
                    
                    #invoice-${order.id}, #invoice-${order.id} * {
                        visibility: visible;
                    }
                    
                    #invoice-${order.id} {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        background: white;
                        page-break-after: avoid;
                    }
                    
                    /* Prevent content from breaking across pages */
                    table, .no-break {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                    
                    /* Hide navigation and other UI elements */
                    nav, header, footer, .no-print, button {
                        display: none !important;
                    }
                    
                    /* Ensure images print */
                    img {
                        max-width: 100%;
                        page-break-inside: avoid;
                    }
                    
                    /* Scale content to fit */
                    #invoice-${order.id} {
                        transform: scale(0.95);
                        transform-origin: top left;
                    }
                }
            `}</style>

            <div className="bg-white text-black p-8 max-w-4xl mx-auto hidden print:block" id={`invoice-${order.id}`}>
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
                        <div>
                            <p className="text-sm text-slate-600 font-bold mb-1">الاسم:</p>
                            <p className="font-black text-lg text-slate-900">{order.customerName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 font-bold mb-1">طريقة الدفع:</p>
                            <p className="font-black text-lg text-slate-900">الدفع عند الاستلام</p>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-6 border-2 border-slate-900 no-break">
                    <thead>
                        <tr className="bg-slate-900 text-white">
                            <th className="text-right py-4 px-4 text-sm font-black">المنتج</th>
                            <th className="text-center py-4 px-3 text-sm font-black">الكمية</th>
                            <th className="text-center py-4 px-3 text-sm font-black">السعر<br />(قبل الضريبة)</th>
                            <th className="text-center py-4 px-3 text-sm font-black">الضريبة<br />(15%)</th>
                            <th className="text-center py-4 px-3 text-sm font-black">السعر<br />(شامل الضريبة)</th>
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
                                    <td className="py-4 px-3 text-center">
                                        <span className="font-bold text-base text-red-600">{taxAmount.toFixed(2)}</span>
                                    </td>
                                    <td className="py-4 px-3 text-center">
                                        <span className="font-black text-base text-slate-900">{priceWithTax.toFixed(2)}</span>
                                    </td>
                                    <td className="py-4 px-4 text-left">
                                        <div className="text-right">
                                            <p className="font-black text-lg text-slate-900">{totalWithTax.toFixed(2)} ر.س</p>
                                            <p className="text-xs text-slate-500 font-bold">({totalBeforeTax.toFixed(2)} + {totalTax.toFixed(2)})</p>
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
                            <span className="font-black text-lg">{order.total.toFixed(2)} ر.س</span>
                        </div>

                        {/* VAT 15% */}
                        <div className="flex justify-between text-slate-700 text-base py-3 border-b-2 border-slate-300">
                            <span className="font-black">ضريبة القيمة المضافة (15%):</span>
                            <span className="font-black text-lg text-red-600">{(order.total * 0.15).toFixed(2)} ر.س</span>
                        </div>

                        {/* Total with tax */}
                        <div className="flex justify-between bg-slate-900 text-white font-black text-xl p-5 rounded-xl shadow-lg mt-3">
                            <span>الإجمالي شامل الضريبة:</span>
                            <span className="text-2xl">{(order.total * 1.15).toFixed(2)} ر.س</span>
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
