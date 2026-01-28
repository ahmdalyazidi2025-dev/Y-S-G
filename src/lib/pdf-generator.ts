import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

export async function generateInvoicePDF(elementId: string, fileName: string = "invoice") {
    const element = document.getElementById(elementId);
    if (!element) {
        toast.error("لم يتم العثور على عنصر الفاتورة");
        return;
    }

    try {
        // Wait to ensure rendering
        await new Promise(resolve => setTimeout(resolve, 800));

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#080b12',
            logging: true,
            allowTaint: false,
            onclone: (clonedDoc) => {
                const el = clonedDoc.getElementById(elementId);
                if (el) {
                    el.style.opacity = '1';
                    el.style.visibility = 'visible';
                    el.style.display = 'block';
                    el.style.position = 'relative';
                }
            }
        });

        const imgData = canvas.toDataURL("image/png", 1.0);
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight, undefined, 'SLOW');
        pdf.save(`${fileName}.pdf`);
        toast.success("تم تحميل الفاتورة بنجاح PDF");

    } catch (error) {
        console.error("PDF Generation Error:", error);
        toast.error("فشل إنشاء ملف PDF");
    }
}
