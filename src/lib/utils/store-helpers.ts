import { Timestamp } from "firebase/firestore"

export const toDate = (ts: Timestamp | Date | { seconds: number, nanoseconds: number } | null | undefined): Date => {
    if (!ts) return new Date()
    if (ts instanceof Timestamp) return ts.toDate()
    if (ts instanceof Date) return ts
    if (typeof ts === 'object' && 'seconds' in ts) return new Timestamp(ts.seconds, ts.nanoseconds).toDate()
    return new Date()
}

export function sanitizeData(data: any): any {
    if (data === null || data === undefined) return null
    if (data instanceof Date) return data

    if (data && typeof data.toDate === 'function' && typeof data.toMillis === 'function') {
        return data
    }

    if (Array.isArray(data)) {
        return data.map(item => sanitizeData(item))
    }

    if (typeof data === 'object' && Object.getPrototypeOf(data) === Object.prototype) {
        const result: Record<string, any> = {}
        Object.keys(data).forEach(key => {
            const value = data[key]
            if (value !== undefined) {
                result[key] = sanitizeData(value)
            }
        })
        return result
    }

    return data
}

export const hapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        const patterns = {
            light: [10],
            medium: [20],
            heavy: [40],
            success: [10, 50, 10],
            warning: [50, 100, 50],
            error: [100, 50, 100, 50, 100]
        }
        navigator.vibrate(patterns[type])
    }
}

import { playSound as playBase64Sound, playNewOrderSound } from "../sounds"

export const playSound = (type: 'newOrder' | 'newMessage' | 'statusUpdate' | 'generalPush' | 'passwordRequest') => {
    if (typeof window !== 'undefined') {
        if (type === 'newOrder') {
            playNewOrderSound()
        } else if (type === 'passwordRequest' || type === 'generalPush') {
            playBase64Sound('alert')
        } else {
            playBase64Sound('notification')
        }
    }
}
