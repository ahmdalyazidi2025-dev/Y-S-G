import { ThemeToggle } from "@/components/theme-toggle"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-slate-100/50 text-slate-900 relative overflow-hidden">
            {/* Universal Premium Soft Background decorations to add depth and luxury feel */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-400/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-400/5 blur-[120px] pointer-events-none" />
            <div className="absolute inset-0 bg-noise opacity-[0.015] pointer-events-none" />

            {/* Floating theme toggle */}
            <div className="absolute top-6 left-6 z-50">
                <ThemeToggle />
            </div>

            {/* Background decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md z-10 relative">
                {children}
            </div>
        </div>
    )
}
