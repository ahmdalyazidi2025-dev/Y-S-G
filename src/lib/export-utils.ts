"use client"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportToCSV(data: any[], filename: string) {
    if (data.length === 0) return

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
