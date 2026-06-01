"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useStore } from "@/context/store-context"
import { Bell, Send, Trash2, ShieldCheck, Users, User, ArrowRight, Clock, Eye, CheckSquare } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { db } from "@/lib/firebase"
import { collection, addDoc, Timestamp, doc, deleteDoc, writeBatch, getDocs, query, where } from "firebase/firestore"
import { cn } from "@/lib/utils"

export default function AdminNotificationsPage() {
    const { customers, notifications = [], deleteCustomer } = useStore()
    const [targetType, setTargetType] = useState<"all" | "category" | "single">("all")
    const [targetCategory, setTargetCategory] = useState<string>("Active")
    const [targetCustomerId, setTargetCustomerId] = useState<string>("")
    const [title, setTitle] = useState("")
    const [body, setBody] = useState("")
    const [actionLink, setActionLink] = useState("/")
    const [isLoading, setIsLoading] = useState(false)
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    const groupedNotifications = useMemo(() => {
        const grouped = [];
        const seen = new Set();
        for (const notif of notifications) {
            const groupKey = notif.broadcastId || `${notif.title}_${notif.body}`;
            if (!seen.has(groupKey)) {
                seen.add(groupKey);
                const count = notifications.filter((n: any) => 
                    notif.broadcastId ? n.broadcastId === notif.broadcastId : (n.title === notif.title && n.body === notif.body)
                ).length;
                grouped.push({ ...notif, recipientCount: count });
            }
        }
        return grouped.slice(0, 30); // Show up to 30 recent broadcasts
    }, [notifications]);

    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    const handleSelectAll = () => {
        if (selectedIds.length === groupedNotifications.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(groupedNotifications.map((n: any) => n.id))
        }
    }

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`هل أنت متأكد من حذف ${selectedIds.length} من الإشعارات المحددة نهائياً؟`)) return;

        setIsLoading(true);
        try {
            for (const id of selectedIds) {
                await deleteSingleBroadcast(id, false);
            }
            setSelectedIds([]);
            toast.success("تم حذف الإشعارات المحددة بنجاح");
        } catch (error) {
            console.error("Bulk delete failed:", error);
            toast.error("حدث خطأ أثناء حذف بعض الإشعارات");
        } finally {
            setIsLoading(false);
        }
    }

    const deleteSingleBroadcast = async (id: string, showToast = true) => {
        const targetNotif = notifications.find((n: any) => n.id === id)
        if (targetNotif && targetNotif.broadcastId) {
            const q = query(collection(db, "notifications"), where("broadcastId", "==", targetNotif.broadcastId))
            const querySnapshot = await getDocs(q)
            const batch = writeBatch(db)
            querySnapshot.forEach((doc) => {
                batch.delete(doc.ref)
            })
            await batch.commit()
        } else if (targetNotif) {
            const q = query(
                collection(db, "notifications"), 
                where("title", "==", targetNotif.title),
                where("body", "==", targetNotif.body)
            )
            const querySnapshot = await getDocs(q)
            const batch = writeBatch(db)
            let count = 0
            
            const getTimestampMs = (val: any) => {
                if (!val) return 0
                if (val.seconds) return val.seconds * 1000
                if (val.toDate) return val.toDate().getTime()
                if (val instanceof Date) return val.getTime()
                return new Date(val).getTime()
            }
            
            const targetTime = getTimestampMs(targetNotif.createdAt)
            
            querySnapshot.forEach((doc) => {
                const data = doc.data()
                const docTime = getTimestampMs(data.createdAt)
                const diff = Math.abs(docTime - targetTime)
                if (diff < 60000) {
                    batch.delete(doc.ref)
                    count++
                }
            })
            if (count > 0) {
                await batch.commit()
            } else {
                await deleteDoc(doc(db, "notifications", id))
            }
        } else {
            await deleteDoc(doc(db, "notifications", id))
        }
        if (showToast) toast.success("تم حذف الإشعار نهائياً من سجل الإدارة وحسابات العملاء")
    }

    const handleDeleteNotification = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا الإشعار نهائياً من سجل الإدارة ومن جميع العملاء؟")) return
        try {
            await deleteSingleBroadcast(id, true)
        } catch (error) {
            console.error("Delete notification failed:", error)
            toast.error("فشل حذف الإشعار")
        }
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || !body.trim()) {
            toast.error("يرجى ملء جميع الحقول المطلوبة")
            return
        }

        setIsLoading(true)
        try {
            // Determine target user IDs
            let targetUserIds: string[] = []
            let targetNameLabel = "الكل"

            if (targetType === "all") {
                targetUserIds = customers.map(c => c.id)
                targetNameLabel = "جميع العملاء"
            } else if (targetType === "category") {
                const getCategory = (lastActive?: any) => {
                    if (!lastActive) return "Disconnected"
                    const dateObj = lastActive.toDate ? lastActive.toDate() : new Date(lastActive)
                    const days = Math.floor((new Date().getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24))
                    if (days <= 7) return "Active"
                    if (days <= 14) return "Average"
                    if (days <= 30) return "Weak"
                    return "Disconnected"
                }
                const filtered = customers.filter(c => getCategory(c.lastActive) === targetCategory)
                targetUserIds = filtered.map(c => c.id)
                targetNameLabel = `فئة ${
                    targetCategory === "Active" ? "نشط" :
                    targetCategory === "Average" ? "متوسط" :
                    targetCategory === "Weak" ? "ضعيف" : "منقطع"
                }`
            } else if (targetType === "single") {
                const selectedCust = customers.find(c => c.id === targetCustomerId)
                if (!selectedCust) {
                    toast.error("يرجى اختيار عميل محدد")
                    setIsLoading(false)
                    return
                }
                targetUserIds = [targetCustomerId]
                targetNameLabel = selectedCust.name
            }

            if (targetUserIds.length === 0) {
                toast.warning("لم يتم العثور على أي عملاء مطابقين لإرسال الإشعار لهم")
                setIsLoading(false)
                return
            }

            const broadcastId = `bcast_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

            // Save to Firestore notifications collection for each targeted customer
            const promises = targetUserIds.map(async (uid) => {
                await addDoc(collection(db, "notifications"), {
                    userId: uid,
                    title: title.trim(),
                    body: body.trim(),
                    link: actionLink.trim() || "/",
                    read: false,
                    targetLabel: targetNameLabel,
                    broadcastId: broadcastId,
                    createdAt: Timestamp.now()
                })
            })

            await Promise.all(promises)

            // Trigger push notifications
            const { sendPushToUsers } = await import("@/app/actions/notifications")
            await sendPushToUsers(targetUserIds, title.trim(), body.trim(), actionLink.trim() || "/customer?notifications=open")

            toast.success(`تم إرسال الإشعار بنجاح إلى ${targetUserIds.length} عميل (${targetNameLabel})`)
            setTitle("")
            setBody("")
            setActionLink("/")
        } catch (error) {
            console.error("Error sending notification:", error)
            toast.error("حدث خطأ أثناء إرسال الإشعارات")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-8 text-right max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white">
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">بث الإشعارات الذكية</h1>
                    <p className="text-xs text-slate-400">أرسل تنبيهات مباشرة وعروض فورية إلى جوالات العملاء وحساباتهم</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Component */}
                <div className="lg:col-span-2 bg-white dark:bg-[#1a242f] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-md space-y-6">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2 justify-end">
                        <span>إرسال إشعار جديد</span>
                        <Bell className="w-5 h-5 text-amber-500" />
                    </h3>

                    <form onSubmit={handleSend} className="space-y-5">
                        {/* Target Selection */}
                        <div className="space-y-2">
                            <Label className="block font-bold text-slate-700 dark:text-slate-300">الجهة المستهدفة</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTargetType("all")}
                                    className={cn(
                                        "py-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5",
                                        targetType === "all"
                                            ? "bg-primary text-white border-transparent shadow-sm"
                                            : "bg-slate-50 dark:bg-black/10 border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-100"
                                    )}
                                >
                                    <Users className="w-4 h-4" />
                                    <span>الكل</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTargetType("category")}
                                    className={cn(
                                        "py-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5",
                                        targetType === "category"
                                            ? "bg-primary text-white border-transparent shadow-sm"
                                            : "bg-slate-50 dark:bg-black/10 border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-100"
                                    )}
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>فئة محددة</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTargetType("single")}
                                    className={cn(
                                        "py-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5",
                                        targetType === "single"
                                            ? "bg-primary text-white border-transparent shadow-sm"
                                            : "bg-slate-50 dark:bg-black/10 border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-100"
                                    )}
                                >
                                    <User className="w-4 h-4" />
                                    <span>عميل معين</span>
                                </button>
                            </div>
                        </div>

                        {/* Category Dropdown */}
                        {targetType === "category" && (
                            <div className="space-y-2 animate-fadeIn">
                                <Label className="block font-bold text-xs text-slate-400">اختر فئة العملاء</Label>
                                <select
                                    value={targetCategory}
                                    onChange={(e) => setTargetCategory(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white rounded-xl h-11 px-3 text-right text-sm font-bold"
                                >
                                    <option value="Active">نشط (آخر 7 أيام)</option>
                                    <option value="Average">متوسط (7-14 يوم)</option>
                                    <option value="Weak">ضعيف (14-30 يوم)</option>
                                    <option value="Disconnected">منقطع (أكثر من 30 يوم)</option>
                                </select>
                            </div>
                        )}

                        {/* Specific Customer Selection */}
                        {targetType === "single" && (
                            <div className="space-y-2 animate-fadeIn">
                                <Label className="block font-bold text-xs text-slate-400">اختر العميل</Label>
                                <select
                                    value={targetCustomerId}
                                    onChange={(e) => setTargetCustomerId(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white rounded-xl h-11 px-3 text-right text-sm font-bold"
                                >
                                    <option value="">-- اختر عميلاً من القائمة --</option>
                                    {customers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} (@{c.username}) - {c.phone}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Notification Title */}
                        <div className="space-y-2">
                            <Label className="block font-bold text-slate-700 dark:text-slate-300">عنوان التنبيه</Label>
                            <Input
                                placeholder="مثال: عرض نهاية الأسبوع 🎉"
                                className="bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/5 rounded-xl text-right h-11 text-slate-900 dark:text-white placeholder-slate-400"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        {/* Notification Message */}
                        <div className="space-y-2">
                            <Label className="block font-bold text-slate-700 dark:text-slate-300">نص الإشعار / الرسالة</Label>
                            <Textarea
                                placeholder="اكتب تفاصيل الإشعار الذي سيظهر على جوالات العملاء..."
                                className="bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/5 rounded-xl text-right h-32 text-slate-900 dark:text-white placeholder-slate-400 leading-relaxed"
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                required
                            />
                        </div>

                        {/* Submit button */}
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl font-bold h-12 gap-2 flex items-center justify-center text-sm shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]"
                        >
                            <Send className="w-4 h-4 rotate-180" />
                            <span>{isLoading ? "جاري الإرسال وبث التنبيه..." : "بث وإرسال الآن"}</span>
                        </Button>
                    </form>
                </div>

                {/* Live Stats & Side Summary Info */}
                <div className="space-y-6">
                    {/* Audience breakdown card */}
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-3xl p-6 shadow-md space-y-4 relative overflow-hidden">
                        <div className="absolute -left-10 -bottom-10 opacity-10">
                            <Bell className="w-40 h-40" />
                        </div>
                        <h4 className="font-black text-lg">قاعدة الجمهور المستهدف 🎯</h4>
                        <p className="text-xs text-white/80 leading-relaxed">
                            يقوم النظام تلقائياً بفرز وتوجيه الرسائل لتطبيق الجوال وأجهزة المتصفح للعملاء المستهدفين بمجرد الضغط على إرسال.
                        </p>
                        <div className="pt-2 space-y-2 border-t border-white/10 text-xs">
                            <div className="flex justify-between">
                                <span className="font-bold">{customers.length} عميل</span>
                                <span>إجمالي المسجلين:</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-bold">{customers.filter(c => c.fcmTokens && c.fcmTokens.length > 0).length} جهاز</span>
                                <span>أجهزة تدعم الإشعارات:</span>
                            </div>
                        </div>
                    </div>

                    {/* Explanatory details */}
                    <div className="bg-white dark:bg-[#1a242f] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-md text-xs text-slate-500 dark:text-slate-400 space-y-4">
                        <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 justify-end">
                            <span>طريقة ظهور الإشعار</span>
                            <Clock className="w-4 h-4 text-primary" />
                        </h4>
                        <ul className="space-y-2 text-right list-disc list-inside">
                            <li>يصل العميل إشعار هاتف فوري خارجي (حتى لو كان المتصفح مغلقاً).</li>
                            <li>تضيء **أيقونة الجرس** باللون الأحمر في حساب العميل مع عداد غير المقروء 🔔.</li>
                            <li>ينسدل له درج الإشعارات الجانبي الأنيق فور ضغطه على الجرس لقراءة تفاصيل التنبيه.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* History of sent notifications */}
            <div className="bg-white dark:bg-[#1a242f] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-md space-y-4">
                <div className="flex justify-between items-center">
                    {selectedIds.length > 0 ? (
                        <Button 
                            onClick={handleDeleteSelected}
                            disabled={isLoading}
                            variant="destructive" 
                            size="sm" 
                            className="font-bold text-xs gap-2 rounded-xl animate-in fade-in"
                        >
                            <Trash2 className="w-4 h-4" />
                            حذف المحدد ({selectedIds.length})
                        </Button>
                    ) : <div />}
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">سجل الإشعارات المرسلة مؤخراً</h3>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                    {groupedNotifications.length === 0 ? (
                        <div className="text-center py-12 text-slate-450 dark:text-slate-500 text-xs font-bold">
                            لا توجد إشعارات مرسلة في السجل حالياً
                        </div>
                    ) : (
                        <table className="w-full text-right text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/5 text-slate-400 font-bold">
                                    <th className="pb-3 text-right">العنوان والرسالة</th>
                                    <th className="pb-3 text-right">المستهدفين</th>
                                    <th className="pb-3 text-right">رابط التوجيه</th>
                                    <th className="pb-3 text-right">التوقيت</th>
                                    <th className="pb-3 text-center w-20">حذف</th>
                                    <th className="pb-3 text-center w-12">
                                        <button 
                                            onClick={handleSelectAll}
                                            className={cn(
                                                "w-5 h-5 rounded border mx-auto flex items-center justify-center transition-all",
                                                selectedIds.length === groupedNotifications.length 
                                                    ? "bg-primary border-primary text-white" 
                                                    : "border-slate-300 dark:border-white/20 hover:border-primary"
                                            )}
                                        >
                                            {selectedIds.length === groupedNotifications.length && <CheckSquare className="w-3.5 h-3.5" />}
                                        </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupedNotifications.map((notif: any) => {
                                    const isSelected = selectedIds.includes(notif.id);
                                    return (
                                        <tr 
                                            key={notif.id} 
                                            onClick={() => handleToggleSelect(notif.id)}
                                            className={cn(
                                                "border-b border-slate-100 dark:border-white/5 transition-colors cursor-pointer",
                                                isSelected ? "bg-primary/5 dark:bg-primary/10" : "hover:bg-slate-50 dark:hover:bg-white/5"
                                            )}
                                        >
                                            <td className="py-4 space-y-1">
                                                <div className="font-bold text-slate-900 dark:text-white text-sm">{notif.title}</div>
                                                <div className="text-slate-400 leading-relaxed text-[11px] max-w-sm">{notif.body}</div>
                                            </td>
                                            <td className="py-4">
                                                <span className="font-bold px-2.5 py-1 rounded-full text-[10px] bg-primary/10 text-primary border border-primary/5">
                                                    {notif.targetLabel || "عميل محدد"} ({notif.recipientCount})
                                                </span>
                                            </td>
                                            <td className="py-4 font-mono text-slate-400">{notif.link || "/"}</td>
                                            <td className="py-4 text-slate-400">
                                                {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString("ar-SA", {
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                }) : "مؤخراً"}
                                            </td>
                                            <td className="py-4 text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-full"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteNotification(notif.id);
                                                    }}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </td>
                                            <td className="py-4 text-center">
                                                <div 
                                                    className={cn(
                                                        "w-5 h-5 rounded border mx-auto flex items-center justify-center transition-all",
                                                        isSelected 
                                                            ? "bg-primary border-primary text-white" 
                                                            : "border-slate-300 dark:border-white/20"
                                                    )}
                                                >
                                                    {isSelected && <CheckSquare className="w-3.5 h-3.5" />}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}
