
import { Order, StoreSettings } from "@/context/store-context";

export const printOrderInvoice = (order: Order, settings: StoreSettings) => {
    // Basic styles ensuring clean print
    const styles = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
            body { 
                font-family: 'Cairo', sans-serif; 
                direction: rtl; 
                padding: 20px; 
                margin: 0;
                color: #000;
                background: #fff;
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
                width: 300px; 
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
                body { -webkit-print-color-adjust: exact; }
            }
        </style>
    `;

    // Calculate totals
    const subtotal = order.total; // Assuming total includes tax or is base. Usually total in store is final.
    // Let's assume order.total is final. If tax logic is needed, we'd calculate backwards or check data.
    // For simplicity and matching current:
    const taxRate = 0.15; // 15% VAT usually
    // Wait, in previous invoice value was calculated: total * 1.15 in one place, or total as final.
    // Let's stick to showing Order Total as final.

    // HTML Content
    const html = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>إشعار طلب #${order.id}</title>
            ${styles}
        </head>
        <body>
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
                    <p>${order.paymentMethod === 'cod' ? 'الدفع عند الاستلام' : order.paymentMethod}</p>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="border-radius: 0 8px 8px 0;">المنتج</th>
                        <th style="text-align: center;">الكمية</th>
                        <th style="text-align: center;">السعر</th>
                        <th style="border-radius: 8px 0 0 8px; text-align: left;">الإجمالي</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map(item => `
                        <tr>
                            <td>
                                <strong>${item.name}</strong>
                                ${item.unit ? `<br><small style="color: #666;">${item.unit}</small>` : ''}
                            </td>
                            <td style="text-align: center;">${item.quantity}</td>
                            <td style="text-align: center;">${item.price} ر.س</td>
                            <td style="text-align: left; font-weight: bold;">${(item.price * item.quantity).toFixed(2)} ر.س</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="totals">
                <div class="total-row">
                    <span>المجموع الفرعي:</span>
                    <span>${order.total.toFixed(2)} ر.س</span>
                </div>
                <div class="total-row grand-total">
                    <span>الإجمالي النهائي:</span>
                    <span>${order.total.toFixed(2)} ر.س</span>
                </div>
            </div>

            <div class="disclaimer-box">
                <p class="disclaimer-text">⚠️ هذا إشعار بالطلب؛ سوف تصلك الفاتورة الأصلية عند وصول الطلب.</p>
                <p style="margin: 10px 0 0; font-size: 12px; color: #999;">تاريخ الطباعة: ${new Date().toLocaleString('ar-SA')}</p>
            </div>

            <script>
                window.onload = function() {
                    window.print();
                    // Optional: Close after print?
                    // window.onafterprint = function() { window.close(); }
                }
            </script>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank', 'width=800,height=800');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
    } else {
        alert("يرجى السماح بالنوافذ المنبثقة لطباعة الفاتورة");
    }
};
