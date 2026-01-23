import imageCompression from 'browser-image-compression';
import { removeBackground } from "@imgly/background-removal";

/**
 * Compresses an image file and returns it as a Base64 string.
 * @param file The image file to compress.
 * @returns A promise that resolves to the Base64 string of the compressed image.
 */
export const compressImage = async (file: File): Promise<string> => {
    const options = {
        maxSizeMB: 0.1, // Max size 100KB (safer for Firestore 1MB limit)
        maxWidthOrHeight: 800,
        useWebWorker: true,
        fileType: "image/jpeg",
        initialQuality: 0.7
    };

    try {
        console.log(`Original Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

        const compressedFile = await imageCompression(file, options);

        console.log(`Compressed Size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(compressedFile);
            reader.onloadend = () => {
                const base64data = reader.result as string;
                resolve(base64data);
            };
            reader.onerror = reject;
        });
    } catch (error) {
        console.error("Image compression failed:", error);
        // Fallback to original if compression fails
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
        });
    }
};

/**
 * Applies background removal and a professional branded template.
 */
export const applyProfessionalTemplate = async (file: File, logoUrl?: string): Promise<string> => {
    try {
        // 1. Remove Background
        console.log("Starting background removal...");
        const blobWithoutBg = await removeBackground(file);

        // 2. Prepare Canvas
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not get canvas context");

        // Set dimensions (Professional Square)
        const size = 1080;
        canvas.width = size;
        canvas.height = size;

        // 3. Draw Background (Soft Gradient)
        const gradient = ctx.createLinearGradient(0, 0, 0, size);
        gradient.addColorStop(0, "#FFFFFF"); // Top White
        gradient.addColorStop(1, "#F3F4F6"); // Bottom Light Gray (Zinc-100)
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        // 4. Load Product Image (Without BG)
        const productImg = await loadImage(URL.createObjectURL(blobWithoutBg));

        // 5. Draw Product (Centered with consistent padding + Shadow)
        const padding = 100;
        const availWidth = size - (padding * 2);
        const availHeight = size - (padding * 2);

        // Calculate scaling to fit
        const scale = Math.min(availWidth / productImg.width, availHeight / productImg.height);
        const drawWidth = productImg.width * scale;
        const drawHeight = productImg.height * scale;
        const x = (size - drawWidth) / 2;
        const y = (size - drawHeight) / 2;

        // Add Shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
        ctx.shadowBlur = 40;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 20;

        ctx.drawImage(productImg, x, y, drawWidth, drawHeight);

        // Reset Shadow for Logo
        ctx.shadowColor = "transparent";

        // 6. Draw Logo (if provided)
        if (logoUrl) {
            try {
                // Cross-origin might be an issue, use proxy or try directly if same domain
                const logoImg = await loadImage(logoUrl, true);
                // Draw at bottom center
                const logoHeight = 80;
                const logoScale = logoHeight / logoImg.height;
                const logoWidth = logoImg.width * logoScale;
                const logoX = (size - logoWidth) / 2;
                const logoY = size - logoHeight - 40; // 40px from bottom

                ctx.globalAlpha = 0.8; // Slight transparency
                ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
                ctx.globalAlpha = 1.0;
            } catch (err) {
                console.warn("Could not load logo for template:", err);
            }
        } else {
            // Fallback: Text Watermark
            ctx.fillStyle = "#9CA3AF"; // Zinc-400
            ctx.font = "bold 24px Arial";
            ctx.textAlign = "center";
            ctx.fillText("YSG Auto Parts", size / 2, size - 40);
        }

        // 7. Compress/Export
        const finalDataUrl = canvas.toDataURL("image/jpeg", 0.9);
        return finalDataUrl;

    } catch (error) {
        console.error("Templates application failed:", error);
        // Fallback: Just return compressed original
        return compressImage(file);
    }
};

const loadImage = (src: string, crossOrigin: boolean = false): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        if (crossOrigin) img.crossOrigin = "Anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
};

/**
 * @deprecated Use applyProfessionalTemplate instead
 */
export const applyBrandingTemplate = async (file: File): Promise<string> => {
    return applyProfessionalTemplate(file);
};
