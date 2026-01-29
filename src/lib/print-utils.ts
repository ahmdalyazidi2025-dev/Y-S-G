
import { Order, StoreSettings } from "@/context/store-context";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

const getInvoiceStyles = () => `
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        body { 
            font-family: 'Cairo', sans-serif; 
            direction: rtl; 
            padding: 40px; 
            margin: 0;
            color: #000;
            background: #fff;
            width: 800px;
        }
        .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
        }
        .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .logo { 
            width: 80px; 
            height: 80px; 
            object-fit: contain; 
            border-radius: 50%;
        }
        .company-info h1 { margin: 0; font-size: 24px; font-weight: 700; color: #000; }
        .company-info p { margin: 5px 0 0; font-size: 14px; color: #555; }
        
        .invoice-details {
            display: flex;
            justify-content: space-between;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
            border: 1px solid #eee;
        }
        .detail-group h3 { margin: 0 0 5px; font-size: 12px; color: #666; text-transform: uppercase; }
        .detail-group p { margin: 0; font-weight: 700; font-size: 16px; }

        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { text-align: right; background: #000; color: #fff; padding: 12px; font-size: 14px; }
        td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
        tr:last-child td { border-bottom: 2px solid #000; }
        
        .totals { 
            width: 320px; 
            margin-right: auto; 
            margin-left: 0; 
        }
        .total-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 8px 0; 
            font-size: 14px; 
        }
        .grand-total { 
            font-size: 18px; 
            font-weight: 700; 
            border-top: 2px solid #000; 
            padding-top: 10px; 
            margin-top: 10px; 
        }

        .disclaimer-box {
            margin-top: 50px;
            padding: 20px;
            border: 2px dashed #ccc;
            background: #fff;
            text-align: center;
            border-radius: 12px;
        }
        .disclaimer-text {
            font-size: 16px;
            font-weight: 600;
            color: #555;
        }
        
        @media print {
            .no-print { display: none; }
            body { -webkit-print-color-adjust: exact; padding: 20px; }
            @page { margin: 0; }
        }
    </style>
`;

const getInvoiceHTML = (order: Order, settings: StoreSettings) => `
    <div class="header">
        <div class="logo-section">
            <img src="/logo.jpg" class="logo" alt="Logo" onerror="this.style.display='none'">
            <div class="company-info">
                <h1>${settings.aboutTitle || 'متجرنا'}</h1>
                <p>${settings.contactPhone || ''} | ${settings.contactAddress || ''}</p>
            </div>
        </div>
        <div style="text-align: left;">
            <h2 style="margin: 0;">إشعار طلب</h2>
            <p style="margin: 5px 0 0; color: #555;">Order Notice</p>
        </div>
    </div>

    <div class="invoice-details">
        <div class="detail-group">
            <h3>رقم الطلب</h3>
            <p>#${order.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div class="detail-group">
            <h3>تاريخ الطلب</h3>
            <p>${new Date(order.createdAt).toLocaleDateString('ar-SA')}</p>
        </div>
        <div class="detail-group">
            <h3>العميل</h3>
            <p>${order.customerName}</p>
        </div>
        <div class="detail-group">
            <h3>طريقة الدفع</h3>
            <p>${order.paymentMethod === 'cod' ? 'الدفع عند الاستلام' : order.paymentMethod || 'غير محدد'}</p>
        </div>
    </div>

    <table style="font-size: 13px;">
        <thead>
            <tr>
                <th style="border-radius: 0 8px 8px 0; width: 35%;">المنتج</th>
                <th style="text-align: center; width: 10%;">الكمية</th>
                <th style="text-align: center; width: 15%;">سعر الوحدة</th>
                <th style="text-align: center; width: 15%;">الضريبة (15%)</th>
                <th style="border-radius: 8px 0 0 8px; text-align: left; width: 25%;">المجموع شامل</th>
            </tr>
        </thead>
        <tbody>
            ${order.items.map(item => {
    const vatPerUnit = item.price * 0.15;
    const totalPerUnit = item.price * 1.15;
    const lineTotal = totalPerUnit * item.quantity;
    return `
                    <tr>
                        <td>
                            <strong>${item.name}</strong>
                            ${item.unit ? `<br><small style="color: #666;">${item.unit}</small>` : ''}
                        </td>
                        <td style="text-align: center;">${item.quantity}</td>
                        <td style="text-align: center;">${item.price.toFixed(2)} ر.س</td>
                        <td style="text-align: center;">${vatPerUnit.toFixed(2)} ر.س</td>
                        <td style="text-align: left; font-weight: bold;">${lineTotal.toFixed(2)} ر.س</td>
                    </tr>
                `;
}).join('')}
        </tbody>
    </table>

    <div class="totals">
        <div class="total-row">
            <span>المجموع (قبل الضريبة):</span>
            <span>${order.total.toFixed(2)} ر.س</span>
        </div>
        <div class="total-row">
            <span>إجمالي الضريبة (15%):</span>
            <span>${(order.total * 0.15).toFixed(2)} ر.س</span>
        </div>
        <div class="total-row grand-total">
            <span>الإجمالي النهائي:</span>
            <span>${(order.total * 1.15).toFixed(2)} ر.س</span>
        </div>
    </div>

    <div class="disclaimer-box">
        <p class="disclaimer-text">⚠️ هذا إشعار بالطلب؛ سوف تصلك الفاتورة الأصلية عند وصول الطلب.</p>
        <p style="margin: 10px 0 0; font-size: 12px; color: #999;">تاريخ الطباعة: ${new Date().toLocaleString('ar-SA')}</p>
    </div>
`;

export const printOrderInvoice = (order: Order, settings: StoreSettings) => {
    const html = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>إشعار طلب #${order.id}</title>
            ${getInvoiceStyles()}
        </head>
        <body>
            ${getInvoiceHTML(order, settings)}
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(() => {
                        window.close();
                    }, 500);
                }
            </script>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank', 'width=900,height=900');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
    } else {
        alert("يرجى السماح بالنوافذ المنبثقة لطباعة الفاتورة");
    }
};

export const downloadOrderPDF = async (order: Order, settings: StoreSettings) => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    container.style.backgroundColor = 'white';
    container.innerHTML = `
        ${getInvoiceStyles()}
        <div style="background: white; padding: 40px;">
            ${getInvoiceHTML(order, settings)}
        </div>
    `;
    document.body.appendChild(container);

    try {
        const toastId = toast.loading("جاري تجهيز الفاتورة للتحميل...");

        // Wait for fonts/images
        await document.fonts.ready;
        await new Promise(resolve => setTimeout(resolve, 800));

        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
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
        pdf.save(`Order-Notice-${order.id.slice(0, 8)}.pdf`);

        toast.success("تم تحميل الفاتورة بنجاح", { id: toastId });
    } catch (error) {
        console.error('PDF Generation Error:', error);
        toast.error("فشل في تحميل الفاتورة تلقائياً، يرجى استخدام زر الطباعة وحفظها يدوياً");
    } finally {
        document.body.removeChild(container);
    }
};
