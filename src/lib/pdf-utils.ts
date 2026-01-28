import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateOrderPDF = async (orderElementId: string, orderId: string) => {
    const element = document.getElementById(orderElementId);
    if (!element) return;

    try {
        // Wait a bit to ensure the element is rendered and images are loaded
        await new Promise(resolve => setTimeout(resolve, 500));

        const canvas = await html2canvas(element, {
            scale: 2, // 2 is usually enough and more stable
            useCORS: true,
            backgroundColor: '#080b12',
            logging: true, // Enable logging for debugging
            allowTaint: false,
            onclone: (clonedDoc) => {
                const el = clonedDoc.getElementById(orderElementId);
                if (el) {
                    el.style.opacity = '1';
                    el.style.visibility = 'visible';
                    el.style.display = 'block';
                    el.style.position = 'relative';
                }
            }
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'SLOW');
        pdf.save(`YSG-Invoice-${orderId}.pdf`);
        return true;
    } catch (error) {
        console.error('PDF Generation Detailed Error:', error);
        return false;
    }
};
