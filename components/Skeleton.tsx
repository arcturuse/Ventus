
import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => (
  <div className={`skeleton ${className}`} />
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Stats Cards Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <div className="premium-card p-6 h-40 flex flex-col justify-between bg-slate-50/50">
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="premium-card p-6 h-40 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-8 rounded-xl" />
          </div>
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-1.5 w-full mt-4" />
        </div>
      ))}
    </div>

    {/* Charts Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="premium-card p-6 h-[400px]">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-5 w-5 rounded-md" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-[280px] w-full" />
      </div>
      <div className="premium-card p-6 h-[400px]">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-5 w-5 rounded-md" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center justify-center h-full pb-10">
           <Skeleton className="h-56 w-56 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="divide-y divide-slate-100">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="px-6 py-5 flex justify-between items-center animate-fade-in">
        <div className="flex gap-4 items-center">
          <div className="space-y-2">
            <Skeleton className="h-2.5 w-12" />
            <Skeleton className="h-4 w-64 md:w-80" />
            <Skeleton className="h-2 w-32" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-8 rounded-md" />
        </div>
      </div>
    ))}
  </div>
);

export const GenericSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="premium-card p-8 h-48">
      <Skeleton className="h-8 w-64 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="premium-card p-6 h-64">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-full w-full" />
      </div>
      <div className="premium-card p-6 h-64">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  </div>
);
