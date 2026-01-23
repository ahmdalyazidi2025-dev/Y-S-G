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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportComprehensiveReport(customers: any[], orders: any[]) {
    // 1. Prepare Data structure: Flat Table (Customer + Order details per row)
    // "Customer Name", "Phone", "Email", "Order ID", "Date", "Total", "Status", "Items"

    // Sort customers by name
    const sortedCustomers = [...customers].sort((a, b) => a.name.localeCompare(b.name));

    const reportData = [];

    for (const customer of sortedCustomers) {
        // Find customer's orders
        const customerOrders = orders.filter(o => o.customerId === customer.id)
            .sort((a, b) => new Date(b.createdAt?.seconds * 1000).getTime() - new Date(a.createdAt?.seconds * 1000).getTime());

        if (customerOrders.length === 0) {
            // Include customer even if no orders (Sales leads?)
            reportData.push({
                "اسم العميل": customer.name,
                "رقم الجوال": customer.phone || "-",
                "البريد الإلكتروني": customer.email,
                "العنوان": customer.location || "-",
                "رقم الطلب": "-",
                "تاريخ الطلب": "-",
                "المبلغ الإجمالي": "-",
                "حالة الطلب": "لا يوجد طلبات",
                "ملخص المنتجات": "-"
            });
        } else {
            for (const order of customerOrders) {
                // Format Date
                let dateStr = "";
                if (order.createdAt?.seconds) {
                    dateStr = new Date(order.createdAt.seconds * 1000).toLocaleDateString('ar-EG');
                }

                // Format Items
                const itemsSummary = order.items.map((i: any) => `${i.product.name} (x${i.quantity})`).join(" | ");

                reportData.push({
                    "اسم العميل": customer.name,
                    "رقم الجوال": customer.phone || "-",
                    "البريد الإلكتروني": customer.email,
                    "العنوان": customer.location || "-", // Assuming location is a string address, if object needs parsing
                    "رقم الطلب": order.id, // Or simplified ID if exists
                    "تاريخ الطلب": dateStr,
                    "المبلغ الإجمالي": order.total,
                    "حالة الطلب": order.status,
                    "ملخص المنتجات": itemsSummary
                });
            }
        }
    }

    exportToCSV(reportData, "التقرير_الشامل_للمتجر");
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
