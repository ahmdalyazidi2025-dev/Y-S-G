import { Skeleton } from "@/components/ui/skeleton"

export function ProductCardSkeleton() {
    return (
        <div className="relative group">
            <div className="relative aspect-[4/5] bg-card rounded-3xl overflow-hidden border border-border/50">
                <div className="p-3 absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <Skeleton className="w-24 h-24 rounded-full" />
                    <div className="space-y-2 w-full px-4 items-center flex flex-col">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-3">
                    <Skeleton className="h-10 w-full rounded-2xl" />
                </div>
            </div>
        </div>
    )
}

export function CategorySkeleton() {
    return (
        <Skeleton className="h-10 w-24 rounded-2xl shrink-0" />
    )
}

export function AdminStatsSkeleton() {
    return (
        <div className="h-32 rounded-[2rem] bg-white/5 animate-pulse border border-white/5 p-8 flex justify-between">
            <div className="space-y-3">
                <Skeleton className="h-3 w-16 bg-white/10" />
                <Skeleton className="h-8 w-24 bg-white/10" />
            </div>
            <Skeleton className="w-12 h-12 rounded-2xl bg-white/10" />
        </div>
    )
}

export function AdminModuleSkeleton({ index }: { index: number }) {
    const isLarge = index === 0 || index === 1;
    return (
        <div className={`rounded-[2rem] bg-white/5 animate-pulse border border-white/5 min-h-[160px] md:min-h-[180px] ${isLarge ? "col-span-2" : "col-span-1"}`} />
    )
}
