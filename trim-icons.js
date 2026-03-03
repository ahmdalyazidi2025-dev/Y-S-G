const sharp = require('sharp');

async function makeCircle(inputPath, outputPath) {
    try {
        const original = sharp(inputPath);
        const metadata = await original.metadata();
        const size = Math.min(metadata.width, metadata.height);

        // Create a circular SVG mask
        const circleSvg = Buffer.from(
            `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white" /></svg>`
        );

        await original
            .resize(size, size) // Ensure it's square
            .composite([{
                input: circleSvg,
                blend: 'dest-in'
            }])
            .png({ quality: 100 })
            .toFile(outputPath);

        console.log('Successfully created circular image:', outputPath);
    } catch (error) {
        console.error('Error creating circle:', outputPath, error);
    }
}

makeCircle('public/admin-logo.png', 'public/admin-logo-circle.png');
makeCircle('public/app-icon-v2.png', 'public/app-icon-circle.png');
