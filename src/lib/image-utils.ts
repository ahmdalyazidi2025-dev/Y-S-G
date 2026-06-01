import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file and returns it as a Base64 string.
 * @param file The image file to compress.
 * @returns A promise that resolves to the Base64 string of the compressed image.
 */
export const compressImage = async (file: File): Promise<string> => {
    const options = {
        maxSizeMB: 0.2, // Max size in MB (e.g. 200KB)
        maxWidthOrHeight: 800, // Max width/height
        useWebWorker: true,
        fileType: "image/jpeg"
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
 * Placeholder for applying a branding template to an image.
 * Currently just returns the compressed base64.
 */
export const applyBrandingTemplate = async (file: File): Promise<string> => {
    // For now, we just compress and return. 
    // In a real implementation, this would use a Canvas to draw the template.
    return compressImage(file);
};

export const applyProfessionalTemplate = async (file: File, logoUrl?: string): Promise<string> => {
    return applyBrandingTemplate(file);
};

/**
 * Enhances an image (Base64) by adjusting brightness, contrast, saturation, and applying a sharpening filter.
 * @param base64Src The source Base64 string of the image.
 * @returns A promise that resolves to the enhanced Base64 image string.
 */
export const enhanceImageBase64 = (base64Src: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = base64Src;
        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    resolve(base64Src);
                    return;
                }

                // 1. Draw image with GPU-accelerated adjustments (brightness, contrast, saturation)
                ctx.filter = "brightness(1.05) contrast(1.15) saturate(1.12)";
                ctx.drawImage(img, 0, 0);
                ctx.filter = "none"; // Reset filter

                // 2. Apply a 3x3 Convolution Sharpening Filter for extreme detail clarity
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imgData.data;
                const width = imgData.width;
                const height = imgData.height;
                const output = ctx.createImageData(width, height);
                const outData = output.data;

                // Sharpening weights matrix (3x3)
                // [ 0, -0.5,  0 ]
                // [-0.5,  3,  -0.5]
                // [ 0, -0.5,  0 ]
                const weights = [
                     0, -0.5,  0,
                  -0.5,  3,   -0.5,
                     0, -0.5,  0
                ];
                const side = 3;
                const halfSide = 1;

                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const sy = y;
                        const sx = x;
                        const dstOff = (y * width + x) * 4;

                        // Calculate weighted color values
                        let r = 0, g = 0, b = 0;
                        for (let cy = 0; cy < side; cy++) {
                            for (let cx = 0; cx < side; cx++) {
                                const scy = Math.min(height - 1, Math.max(0, sy + cy - halfSide));
                                const scx = Math.min(width - 1, Math.max(0, sx + cx - halfSide));
                                const srcOff = (scy * width + scx) * 4;
                                const wt = weights[cy * side + cx];

                                r += data[srcOff] * wt;
                                g += data[srcOff + 1] * wt;
                                b += data[srcOff + 2] * wt;
                            }
                        }

                        // Clamp values to [0, 255] and preserve alpha
                        outData[dstOff] = Math.min(255, Math.max(0, r));
                        outData[dstOff + 1] = Math.min(255, Math.max(0, g));
                        outData[dstOff + 2] = Math.min(255, Math.max(0, b));
                        outData[dstOff + 3] = data[dstOff + 3];
                    }
                }

                ctx.putImageData(output, 0, 0);
                resolve(canvas.toDataURL("image/png"));
            } catch (err) {
                console.error("Image enhancement failed:", err);
                resolve(base64Src); // Fallback to original
            }
        };
        img.onerror = (err) => {
            console.error("Failed to load image for enhancement:", err);
            reject(err);
        };
    });
};

