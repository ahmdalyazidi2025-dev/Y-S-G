import { ProtectedRoute } from "@/components/auth/protected-route"
import { AdminSidebar, AdminMobileNav } from "@/components/admin/admin-sidebar"
import Image from "next/image"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ProtectedRoute role="admin">
            <div className="min-h-screen bg-background text-foreground flex transition-colors duration-300">
                {/* Floating Branding Watermark */}
                <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] z-0 overflow-hidden">
                    <Image
                        src="/logo.jpg"
                        alt=""
                        width={800}
                        height={800}
                        className="object-contain grayscale"
                    />
                </div>

                {/* Sidebar & Mobile Nav */}
                <AdminSidebar />
                <AdminMobileNav />

                {/* Main Content */}
                <main className="flex-1 w-full p-4 lg:pr-72 pb-24 lg:pb-4 relative z-10 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    )
}
