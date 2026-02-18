/**
 * Compresses an image file to a maximum size and quality.
 * @param file The original File object.
 * @param maxWidth The maximum width of the output image (default: 1024px).
 * @param quality The image quality from 0 to 1 (default: 0.7).
 * @returns A Promise resolving to a Base64 string of the compressed image.
 */
/**
 * Compresses an image file to a maximum size and quality.
 * @param file The original File object.
 * @param maxWidth The maximum width of the output image (default: 1024px).
 * @param quality The image quality from 0 to 1 (default: 0.7).
 * @param cropSquare Whether to crop the image to a square (center crop) before resizing.
 * @returns A Promise resolving to a Base64 string of the compressed image.
 */
export async function compressImage(file: File, maxWidth = 1024, quality = 0.7, cropSquare = false): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                let sx = 0, sy = 0, sWidth = width, sHeight = height;

                if (cropSquare) {
                    // Balanced Scaling (Contain): Ensure the entire image fits in the square
                    const ratio = Math.min(maxWidth / width, maxWidth / height);
                    const newWidth = width * ratio;
                    const newHeight = height * ratio;

                    canvas.width = maxWidth;
                    canvas.height = maxWidth;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error("Could not get canvas context"));
                        return;
                    }

                    // Fill white background
                    ctx.fillStyle = "#FFFFFF";
                    ctx.fillRect(0, 0, maxWidth, maxWidth);

                    // Center the image within the square canvas
                    const dx = (maxWidth - newWidth) / 2;
                    const dy = (maxWidth - newHeight) / 2;
                    ctx.drawImage(img, dx, dy, newWidth, newHeight);
                } else {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error("Could not get canvas context"));
                        return;
                    }
                    ctx.drawImage(img, 0, 0, width, height);
                }

                // Use JPEG for general compression, but we can also use WebP if supported/needed
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
}

/**
 * Applies a professional template to the image (Square crop, white background, optional logo).
 * @param file The original image file.
 * @param logoUrl Optional URL for the store logo to add as watermark.
 * @returns Promise resolving to the processed image as Base64.
 */
export async function applyProfessionalTemplate(file: File, logoUrl?: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = async () => {
                const size = 1080; // Standard square size
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    reject(new Error("Could not get canvas context"));
                    return;
                }

                // 1. Fill white background
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, size, size);

                // 2. Draw Image (Contain)
                const scale = Math.min((size - 100) / img.width, (size - 100) / img.height);
                const w = img.width * scale;
                const h = img.height * scale;
                const x = (size - w) / 2;
                const y = (size - h) / 2;
                ctx.drawImage(img, x, y, w, h);

                // 3. Draw Watermark/Logo if present (Bottom Right)
                if (logoUrl) {
                    try {
                        const logoImg = new Image();
                        logoImg.crossOrigin = "Anonymous"; // Try to load cross-origin
                        logoImg.src = logoUrl;
                        await new Promise((r) => { logoImg.onload = r; logoImg.onerror = r; }); // Wait but don't fail if logo fails

                        if (logoImg.width > 0) {
                            const logoSize = 150;
                            const logoScale = Math.min(logoSize / logoImg.width, logoSize / logoImg.height);
                            const lw = logoImg.width * logoScale;
                            const lh = logoImg.height * logoScale;
                            const lx = size - lw - 50;
                            const ly = size - lh - 50;

                            ctx.globalAlpha = 0.8;
                            ctx.drawImage(logoImg, lx, ly, lw, lh);
                            ctx.globalAlpha = 1.0;
                        }
                    } catch (e) {
                        console.warn("Failed to load watermark logo", e);
                    }
                }

                // Return high quality JPEG
                resolve(canvas.toDataURL('image/jpeg', 0.9));
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
}
