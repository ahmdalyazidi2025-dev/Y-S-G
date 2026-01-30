/**
 * Compresses an image file to a maximum size and quality.
 * @param file The original File object.
 * @param maxWidth The maximum width of the output image (default: 1024px).
 * @param quality The image quality from 0 to 1 (default: 0.7).
 * @returns A Promise resolving to a Base64 string of the compressed image.
 */
export async function compressImage(file: File, maxWidth = 1024, quality = 0.7): Promise<string> {
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

                // Compress specific types as JPEG (good for photos), others as PNG/WebP if needed
                // Using image/jpeg ensures good compression for photos.
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
}
