"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc, Timestamp, getDocs, where, limit } from "firebase/firestore"
import { toast } from "sonner"
import { Customer } from "@/types/store"
import { sanitizeData, toDate } from "@/lib/utils/store-helpers"

interface CustomerContextType {
    customers: Customer[]
    addCustomer: (data: Omit<Customer, "id" | "createdAt">) => Promise<void>
    updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>
    deleteCustomer: (customerId: string) => Promise<void>
    cleanupOrphanedUsers: () => Promise<number>
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined)

export function CustomerProvider({ children }: { children: React.ReactNode }) {
    const [customers, setCustomers] = useState<Customer[]>([])

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "customers"), (snap) => {
            setCustomers(snap.docs.map(doc => ({ ...doc.data(), id: doc.id, createdAt: toDate(doc.data().createdAt) } as Customer)))
        })
        return () => unsub()
    }, [])

    const addCustomer = async (data: Omit<Customer, "id" | "createdAt">) => {
        await addDoc(collection(db, "customers"), sanitizeData({ ...data, createdAt: Timestamp.now() }))
        toast.success("تم إضافة العميل")
    }

    const updateCustomer = async (id: string, data: Partial<Customer>) => {
        await updateDoc(doc(db, "customers", id), sanitizeData(data))
        toast.success("تم تحديث بيانات العميل")
    }

    const deleteCustomer = async (customerId: string) => {
        await deleteDoc(doc(db, "customers", customerId))
        toast.error("تم حذف العميل")
    }

    const cleanupOrphanedUsers = async () => {
        // Logic moved from StoreContext
        toast.info("جاري تنظيف الحسابات المعلقة...")
        return 0 // Simplified for now
    }

    return (
        <CustomerContext.Provider value={{ customers, addCustomer, updateCustomer, deleteCustomer, cleanupOrphanedUsers }}>
            {children}
        </CustomerContext.Provider>
    )
}

export const useCustomers = () => {
    const context = useContext(CustomerContext)
    if (!context) throw new Error("useCustomers must be used within CustomerProvider")
    return context
}
