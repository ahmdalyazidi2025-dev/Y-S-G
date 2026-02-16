import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

export const generateOrderPDF = async (orderElementId: string, orderId: string) => {
    const element = document.getElementById(orderElementId);
    if (!element) {
        console.error("PDF Element not found:", orderElementId);
        toast.error("لم يتم العثور على محتوى الفاتورة");
        return false;
    }

    try {
        // Ensure fonts are loaded
        await document.fonts.ready;
        // Wait a bit to ensure the element is rendered and images are loaded
        await new Promise(resolve => setTimeout(resolve, 800));

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#080b12',
            logging: false, // Turn off logging in production
            allowTaint: true, // Allow tainting if CORS fails (might help with mixed content)
            onclone: (clonedDoc) => {
                const el = clonedDoc.getElementById(orderElementId);
                if (el) {
                    el.style.opacity = '1';
                    el.style.visibility = 'visible';
                    el.style.display = 'block';
                    el.style.position = 'relative'; // Important for html2canvas
                    el.style.zIndex = '9999';
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
        toast.success("تم تحميل الفاتورة بنجاح PDF");
        return true;
    } catch (error) {
        console.error('PDF Generation Detailed Error:', error);
        toast.error("فشل إنشاء ملف PDF");
        return false;
    }
};
