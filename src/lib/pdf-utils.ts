import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateOrderPDF = async (orderElementId: string, orderId: string) => {
    const element = document.getElementById(orderElementId);
    if (!element) return;

    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#080b12',
            logging: false,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [canvas.width / 2, canvas.height / 2]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
        pdf.save(`YSG-Invoice-${orderId}.pdf`);
        return true;
    } catch (error) {
        console.error('PDF Generation Error:', error);
        return false;
    }
};
