import { ThemeToggle } from "@/components/theme-toggle"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-background text-foreground transition-colors duration-300 relative overflow-hidden">
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
