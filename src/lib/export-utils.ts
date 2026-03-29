"use client"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportToCSV(data: any[], filename: string) {
    if (!data || data.length === 0) return

    // Extract headers
    const headers = Object.keys(data[0])

    // Create CSV rows
    const csvContent = [
        headers.join(","), // Header row
        ...data.map(row =>
            headers.map(fieldName => {
                const value = row[fieldName]
                // Handle complex objects (like items array in orders)
                if (Array.isArray(value)) return `"${value.length} items"`
                if (typeof value === "object" && value !== null) return `"${JSON.stringify(value).replace(/"/g, '""')}"`
                // Handle strings with commas
                if (typeof value === "string") return `"${value.replace(/"/g, '""')}"`
                return value
            }).join(",")
        )
    ].join("\n")

    // Create a blob and trigger download
    // Add BOM for Excel UTF-8 support
    const blob = new Blob(["\ufeff", csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }
}

import { Customer, Order, StaffMember } from "@/context/store-context";

export function exportComprehensiveReportWord(customers: Customer[], orders: Order[]) {
    const sortedCustomers = [...customers].sort((a, b) => a.name.localeCompare(b.name));

    let rows = "";

    for (const customer of sortedCustomers) {
        const customerOrders = orders.filter(o => o.customerId === customer.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (customerOrders.length === 0) {
            rows += `
                <tr>
                    <td style="padding:10px; border:1px solid #000; font-weight:bold;">${customer.name}</td>
                    <td style="padding:10px; border:1px solid #000; direction:ltr; text-align:right;">${customer.phone || "-"}</td>
                    <td style="padding:10px; border:1px solid #000;">${customer.email}</td>
                    <td style="padding:10px; border:1px solid #000;">${customer.location || "-"}</td>
                    <td style="padding:10px; border:1px solid #000;">-</td>
                    <td style="padding:10px; border:1px solid #000;">-</td>
                    <td style="padding:10px; border:1px solid #000;">-</td>
                    <td style="padding:10px; border:1px solid #000; color:gray;">لا يوجد طلبات</td>
                    <td style="padding:10px; border:1px solid #000;">-</td>
                </tr>
            `;
        } else {
            for (const order of customerOrders) {
                let dateStr = "";
                if (order.createdAt) {
                    dateStr = new Date(order.createdAt).toLocaleDateString('ar-EG');
                }
                const itemsSummary = order.items.map((i) => `${i.name} (x${i.quantity})`).join(" | ");

                rows += `
                    <tr>
                        <td style="padding:10px; border:1px solid #000; font-weight:bold;">${customer.name}</td>
                        <td style="padding:10px; border:1px solid #000; direction:ltr; text-align:right;">${customer.phone || "-"}</td>
                        <td style="padding:10px; border:1px solid #000;">${customer.email}</td>
                        <td style="padding:10px; border:1px solid #000;">${customer.location || "-"}</td>
                        <td style="padding:10px; border:1px solid #000; font-family:monospace;">${order.id || "-"}</td>
                        <td style="padding:10px; border:1px solid #000;">${dateStr}</td>
                        <td style="padding:10px; border:1px solid #000; font-weight:bold; color:green;">${order.total} ر.س</td>
                        <td style="padding:10px; border:1px solid #000;">${order.status}</td>
                        <td style="padding:10px; border:1px solid #000; font-size:12px;">${itemsSummary}</td>
                    </tr>
                `;
            }
        }
    }

    const htmlContent = `
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: 'Arial', sans-serif; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
                th { background-color: #f8f9fa; font-weight: bold; padding: 12px; border: 1px solid #000; color: #333; }
                td { padding: 8px; border: 1px solid #000; }
                h1 { text-align: center; color: #111; margin-bottom: 5px; }
                .meta { text-align: center; margin-bottom: 20px; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <h1>التقرير الشامل (العملاء والطلبات)</h1>
            <div class="meta">تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-EG')} | إجمالي العملاء المعروضين: ${sortedCustomers.length}</div>
            <table>
                <thead>
                    <tr>
                        <th>اسم العميل</th>
                        <th>رقم الجوال</th>
                        <th>البريد الإلكتروني</th>
                        <th>العنوان</th>
                        <th>رقم الطلب</th>
                        <th>تاريخ الطلب</th>
                        <th>المبلغ الإجمالي</th>
                        <th>حالة الطلب</th>
                        <th>ملخص المنتجات</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </body>
        </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_شامل_${new Date().toISOString().split('T')[0]}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportFullSystemBackup(data: any) {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `BLACK_BOX_BACKUP_${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export function exportCustomersToWord(customers: Customer[]) {
    if (!customers || customers.length === 0) return

    // Sort by registration date (newest first)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sorted = [...customers].sort((a: any, b: any) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return dateB - dateA;
    });

    const rows = sorted.map(c => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const createdAt = c.createdAt as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lastActive = c.lastActive as any;

        let dateStr = "-"
        if (createdAt instanceof Date) dateStr = createdAt.toLocaleDateString('ar-EG');

        let lastActiveStr = "-"
        if (lastActive instanceof Date) lastActiveStr = lastActive.toLocaleDateString('ar-EG');

        return `
            <tr>
                <td style="padding:10px; border:1px solid #000;">${c.name}</td>
                <td style="padding:10px; border:1px solid #000;">${c.username || "-"}</td>
                <td style="padding:10px; border:1px solid #000;">${c.email}</td>
                <td style="padding:10px; border:1px solid #000; direction:ltr; text-align:right;">${c.phone}</td>
                <td style="padding:10px; border:1px solid #000;">${c.location || "-"}</td>
                <td style="padding:10px; border:1px solid #000;">${dateStr}</td>
                <td style="padding:10px; border:1px solid #000;">${lastActiveStr}</td>
            </tr>
        `;
    }).join("");

    const htmlContent = `
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: 'Arial', sans-serif; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background-color: #f0f0f0; font-weight: bold; padding: 10px; border: 1px solid #000; }
                td { padding: 8px; border: 1px solid #000; }
                h1 { text-align: center; color: #333; }
                .meta { text-align: center; margin-bottom: 20px; color: #666; }
            </style>
        </head>
        <body>
            <h1>سجل بيانات العملاء</h1>
            <div class="meta">تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-EG')}</div>
            <table>
                <thead>
                    <tr>
                        <th>الاسم</th>
                        <th>اسم المستخدم</th>
                        <th>البريد الإلكتروني</th>
                        <th>رقم الجوال</th>
                        <th>العنوان</th>
                        <th>تاريخ التسجيل</th>
                        <th>آخر نشاط</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </body>
        </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `سجل_العملاء_${new Date().toISOString().split('T')[0]}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function exportStaffToWord(staff: StaffMember[]) {
    if (!staff || staff.length === 0) return

    const rows = staff.map(s => {
        return `
            <tr>
                <td style="padding:10px; border:1px solid #000;">${s.name}</td>
                <td style="padding:10px; border:1px solid #000;">${s.username}</td>
                <td style="padding:10px; border:1px solid #000;">${s.email || "-"}</td>
                <td style="padding:10px; border:1px solid #000;">${s.role === 'admin' ? 'مدير' : 'موظف'}</td>
            </tr>
        `;
    }).join("");

    const htmlContent = `
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: 'Arial', sans-serif; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background-color: #f0f0f0; font-weight: bold; padding: 10px; border: 1px solid #000; }
                td { padding: 8px; border: 1px solid #000; }
                h1 { text-align: center; color: #333; }
                .meta { text-align: center; margin-bottom: 20px; color: #666; }
            </style>
        </head>
        <body>
            <h1>سجل بيانات الموظفين</h1>
            <div class="meta">تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-EG')}</div>
            <table>
                <thead>
                    <tr>
                        <th>الاسم</th>
                        <th>اسم المستخدم</th>
                        <th>البريد الإلكتروني</th>
                        <th>الصلاحية</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </body>
        </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `سجل_الموظفين_${new Date().toISOString().split('T')[0]}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
