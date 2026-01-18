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
