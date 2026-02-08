export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden">
            {/* Background decorations - Dark Mode Only */}
            <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-primary/20 rounded-full blur-[100px] pointer-events-none hidden dark:block" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none hidden dark:block" />

            {/* Light Mode Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none block dark:hidden" />

            <div className="w-full max-w-md z-10 relative">
                {children}
            </div>
        </div>
    )
}
