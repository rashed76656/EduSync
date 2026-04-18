import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded-md bg-gray-200/60', className)} />
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="border border-white/50 rounded-2xl overflow-hidden bg-white/40 backdrop-blur-sm">
        <div className="bg-gray-50/50 h-12 border-b border-gray-100" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center px-6 py-4 border-b border-gray-100 last:border-0">
             <Skeleton className="h-4 w-12 mr-8" />
             <Skeleton className="h-4 w-40 mr-auto" />
             <Skeleton className="h-4 w-20 mr-8" />
             <Skeleton className="h-4 w-20 mr-8" />
             <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
