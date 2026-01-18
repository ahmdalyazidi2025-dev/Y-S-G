"use client"

import { useStore } from "@/context/store-context"
import { FileText, MapPin, Phone } from "lucide-react"

export function InvoiceTemplate({ order }: { order: any }) {
    const { storeSettings } = useStore()

    return (
        <div className="bg-white text-black p-8 max-w-2xl mx-auto hidden print:block print:fixed print:inset-0 print:z-[9999] print:bg-white" id={`invoice-${order.id}`}>
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-8">
                <div className="flex items-center gap-4">
                    <img
                        src="/logo.jpg"
                        alt="Logo"
                        className="w-16 h-16 rounded-full object-cover border border-slate-200 shadow-sm"
                    />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">{storeSettings.aboutTitle}</h1>
                        <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                            <MapPin className="w-4 h-4" />
                            <span>{storeSettings.contactAddress}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <Phone className="w-4 h-4" />
                            <span>{storeSettings.contactPhone}</span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-lg mb-2 inline-block">
                        فاتورة مبيعات
                    </div>
                    <p className="text-slate-500 text-xs">رقم الفاتورة: <span className="text-slate-900 font-bold">#{order.id}</span></p>
                    <p className="text-slate-500 text-xs">التاريخ: <span className="text-slate-900 font-bold">{new Date(order.createdAt).toLocaleDateString('ar-SA')}</span></p>
                </div>
            </div>

            {/* Customer Info */}
            <div className="mb-8 p-4 bg-slate-50 rounded-xl">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">معلومات العميل</p>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-slate-500">الاسم:</p>
                        <p className="font-bold">{order.customerName}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">طريقة الدفع:</p>
                        <p className="font-bold">الدفع عند الاستلام</p>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-8">
                <thead>
                    <tr className="border-b border-slate-200">
                        <th className="text-right py-3 text-xs font-bold text-slate-400">المنتج</th>
                        <th className="text-center py-3 text-xs font-bold text-slate-400">الكمية</th>
                        <th className="text-center py-3 text-xs font-bold text-slate-400">السعر</th>
                        <th className="text-left py-3 text-xs font-bold text-slate-400">الإجمالي</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {order.items.map((item: any, idx: number) => (
                        <tr key={idx}>
                            <td className="py-4">
                                <p className="font-bold text-sm">{item.name}</p>
                                <p className="text-[10px] text-slate-400">{item.unit}</p>
                            </td>
                            <td className="py-4 text-center text-sm font-medium">{item.quantity}</td>
                            <td className="py-4 text-center text-sm font-medium">{item.price.toFixed(2)}</td>
                            <td className="py-4 text-left text-sm font-bold">{(item.quantity * item.price).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end pt-4 border-t-2 border-slate-900">
                <div className="w-64 space-y-3">
                    <div className="flex justify-between text-slate-500 text-sm">
                        <span>المجموع الفرعي</span>
                        <span>{order.total.toFixed(2)} ر.س</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-sm">
                        <span>الضريبة (15%)</span>
                        <span>0.00 ر.س</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-bold text-xl pt-3 border-t border-slate-100">
                        <span>الإجمالي</span>
                        <span>{order.total.toFixed(2)} ر.س</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-16 text-center text-[10px] text-slate-400">
                <p>شكراً لتعاملكم معنا! نأمل رؤيتكم مرة أخرى.</p>
                <p className="mt-2">هذه فاتورة إلكترونية صادرة عن نظام {storeSettings.aboutTitle}</p>
            </div>
        </div>
    )
}
