import { Cairo, Tajawal, Readex_Pro, Amiri, Changa } from "next/font/google";

export const fontCairo = Cairo({ weight: ["400", "700", "800"], subsets: ["arabic"], display: "swap" });
export const fontTajawal = Tajawal({ weight: ["400", "500", "700", "800"], subsets: ["arabic"], display: "swap" });
export const fontReadexPro = Readex_Pro({ subsets: ["arabic"], display: "swap" });
export const fontAmiri = Amiri({ weight: ["400", "700"], subsets: ["arabic"], display: "swap" });
export const fontChanga = Changa({ weight: ["400", "700", "800"], subsets: ["arabic"], display: "swap" });

export const getFontClass = (name?: string) => {
    switch (name) {
        case "Tajawal": return fontTajawal.className;
        case "Cairo": return fontCairo.className;
        case "Readex Pro": return fontReadexPro.className;
        case "Amiri": return fontAmiri.className;
        case "Changa": return fontChanga.className;
        default: return fontCairo.className;
    }
}
