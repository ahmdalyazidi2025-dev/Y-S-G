import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

export async function generateInvoicePDF(elementId: string, fileName: string = "invoice") {
    const element = document.getElementById(elementId);
    if (!element) {
        toast.error("لم يتم العثور على عنصر الفاتورة");
        return;
    }

    // Temporary styling for capture (ensure high res)
    /* const originalStyle = {
        position: element.style.position,
        top: element.style.top,
        left: element.style.left,
        transform: element.style.transform,
        width: element.style.width
    }; */

    try {
        // Force element to be visible and fixed width for standard A4 like scaling
        // We clone the element to avoid flashing on screen? html2canvas can capture hidden elements if we handle it right.
        // But premium-invoice is already fixed positioned off-screen.

        const canvas = await html2canvas(element, {
            scale: 2, // High resolution
            useCORS: true, // Allow loading remote images
            backgroundColor: "#080b12", // Dark theme background
            logging: false,
            windowWidth: 1200 // Force desktop width
        });

        const imgData = canvas.toDataURL("image/png");

        // A4 dimensions in mm
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        const imgWidth = 210; // A4 width
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
        pdf.save(`${fileName}.pdf`);
        toast.success("تم تحميل الفاتورة بنجاح PDF");

    } catch (error) {
        console.error("PDF Generation Error:", error);
        toast.error("فشل إنشاء ملف PDF");
    }
}
