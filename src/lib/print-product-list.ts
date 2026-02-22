
import { Product } from "@/context/store-context";
import { Timestamp } from "firebase/firestore";

// Helper to handle Firestore Timestamps or Dates
const toDate = (ts: any): Date | null => {
    if (!ts) return null;
    if (ts instanceof Date) return ts;
    if (ts instanceof Timestamp) return ts.toDate();
    if (typeof ts === 'object' && 'seconds' in ts) return new Timestamp(ts.seconds, ts.nanoseconds).toDate();
    try {
        const d = new Date(ts);
        return isNaN(d.getTime()) ? null : d;
    } catch {
        return null;
    }
};

const getPrintStyles = () => `
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        body { 
            font-family: 'Cairo', sans-serif; 
            direction: rtl; 
            padding: 20px; 
            margin: 0;
            color: #000;
        }
        .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 15px; 
            margin-bottom: 20px; 
        }
        .logo-section { display: flex; align-items: center; gap: 15px; }
        .logo { width: 60px; height: 60px; object-fit: contain; border-radius: 50%; }
        .title h1 { margin: 0; font-size: 22px; font-weight: 700; }
        .title p { margin: 5px 0 0; font-size: 14px; color: #555; }
        
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #f3f3f3; padding: 8px; border: 1px solid #ddd; font-weight: 700; text-align: right; }
        td { padding: 8px; border: 1px solid #ddd; }
        
        .footer { 
            margin-top: 20px; 
            text-align: left; 
            font-size: 10px; 
            color: #777; 
            border-top: 1px solid #eee; 
            padding-top: 10px; 
        }
        
        @media print {
            body { padding: 0; }
            table { font-size: 11px; }
            th, td { padding: 4px; }
        }
    </style>
`;

const getPrintHTML = (products: Product[], title: string, filters?: string) => `
    <div class="header">
        <div class="logo-section">
            <img src="/logo.jpg" class="logo" alt="Logo" onerror="this.style.display='none'">
            <div class="title">
                <h1>${title}</h1>
                ${filters ? `<p>${filters}</p>` : ''}
            </div>
        </div>
        <div style="text-align: left;">
            <p style="margin: 0; font-weight: bold;">تاريخ الطباعة</p>
            <p style="margin: 0; font-family: monospace;">${new Date().toLocaleString('ar-SA')}</p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 30%;">اسم المنتج</th>
                <th style="width: 15%;">الباركود</th>
                <th style="width: 15%;">القسم</th>
                <th style="width: 10%;">التكلفة</th>
                <th style="width: 10%;">سعر البيع</th>
                <th style="width: 15%;">ملاحظات / العرض</th>
            </tr>
        </thead>
        <tbody>
            ${products.map((p, i) => {
    let combinedNotes = p.notes || '';
    try {
        const discountDate = toDate(p.discountEndDate);
        const isOffer = discountDate && discountDate > new Date();
        const offerText = isOffer ? `عرض ساري حتى ${discountDate!.toLocaleDateString('ar-SA')}` : '';
        combinedNotes = [p.notes || '', offerText].filter(Boolean).join(' | ');
    } catch (e) {
        console.error("Error processing item date:", e);
    }

    const priceText = typeof p.pricePiece === 'number' ? p.pricePiece.toFixed(2) : (p.pricePiece || '0.00');
    const costText = typeof p.costPrice === 'number' ? p.costPrice.toFixed(2) : (p.costPrice || '-');

    return `
                <tr>
                    <td>${i + 1}</td>
                    <td style="font-weight: 600;">
                        ${p.name || 'بدون اسم'}
                        ${p.unit ? `<span style="font-size: 10px; color: #666; display: block;">(${p.unit})</span>` : ''}
                    </td>
                    <td style="font-family: monospace;">${p.barcode || '-'}</td>
                    <td>${p.category || '-'}</td>
                    <td style="font-weight: 600; color: #d9534f;">${costText}</td>
                    <td style="font-weight: 600; color: #5cb85c;">${priceText}</td>
                    <td style="font-size: 10px;">${combinedNotes}</td>
                </tr>
            `;
}).join('')}
        </tbody>
    </table>

    <div class="footer">
        تم طباعة هذا التقرير من لوحة تحكم النظام | عدد المنتجات: ${products.length}
    </div>
`;

export const printProductList = (products: Product[], title: string = "قائمة المنتجات", filters?: string) => {
    try {
        const html = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>${title}</title>
                ${getPrintStyles()}
            </head>
            <body>
                ${getPrintHTML(products, title, filters)}
                <script>
                    window.onload = function() {
                        try {
                            window.print();
                            setTimeout(() => {
                                window.close();
                            }, 500);
                        } catch (e) {
                            console.error("Print dialog failed", e);
                        }
                    }
                </script>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank', 'width=1000,height=900');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
        } else {
            alert("يرجى السماح بالنوافذ المنبثقة لطباعة التقرير");
        }
    } catch (error) {
        console.error("Critical printing error:", error);
        alert("حدث خطأ تقني أثناء محاولة الطباعة. يرجى محاولة تحديث الصفحة.");
    }
};
