import { db } from "./firebase";
import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    increment,
    query,
    where,
    getDocs,
    Timestamp
} from "firebase/firestore";

// Collection reference
const VISITS_COLLECTION = "analytics_visits";

export interface DailyVisit {
    date: string; // YYYY-MM-DD
    count: number;
    timestamp: Timestamp;
}

/**
 * Increment the visit count for today.
 * Should be called once per session/page load.
 */
export const incrementVisit = async () => {
    try {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
        const docRef = doc(db, VISITS_COLLECTION, dateStr);

        // Try to update existing doc
        try {
            await updateDoc(docRef, {
                count: increment(1)
            });
        } catch (error: any) {
            // If doc doesn't exist, create it (code: not-found is typical, but safe to check existence or just set)
            if (error.code === 'not-found' || error.message.includes('No document to update')) {
                // Double check existence to be safe or just set with merge
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    await updateDoc(docRef, { count: increment(1) });
                } else {
                    await setDoc(docRef, {
                        date: dateStr,
                        timestamp: Timestamp.fromDate(today),
                        count: 1
                    });
                }
            } else {
                // If it's another error, try setting it if it might be missing
                const snap = await getDoc(docRef);
                if (!snap.exists()) {
                    await setDoc(docRef, {
                        date: dateStr,
                        timestamp: Timestamp.fromDate(today),
                        count: 1
                    });
                } else {
                    console.error("Error incrementing visit:", error);
                }
            }
        }
    } catch (error) {
        console.error("Failed to track visit:", error);
    }
};

/**
 * Get visit statistics for a specific date range.
 */
export const getVisits = async (startDate: Date, endDate: Date): Promise<DailyVisit[]> => {
    try {
        // Adjust dates to cover full days if needed, but string comparison works for YYYY-MM-DD
        // Firestore stores by doc ID (YYYY-MM-DD), so we can query by ID or just filter client side if dataset is small
        // Better: Query by 'count' is not useful, query by 'date' field (string) or timestamp

        // Let's use the timestamp field for range queries
        const q = query(
            collection(db, VISITS_COLLECTION),
            where("timestamp", ">=", Timestamp.fromDate(startDate)),
            where("timestamp", "<=", Timestamp.fromDate(endDate))
        );

        const querySnapshot = await getDocs(q);
        const visits: DailyVisit[] = [];

        querySnapshot.forEach((doc) => {
            visits.push(doc.data() as DailyVisit);
        });

        // Sort by date just in case
        return visits.sort((a, b) => a.date.localeCompare(b.date));

    } catch (error) {
        console.error("Error fetching visits:", error);
        return [];
    }
};
