import React from 'react';

export function ShopCardSkeleton() {
  return (
    <div className="w-full rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-premium flex flex-col h-[340px]">
      {/* Cover Skeleton */}
      <div className="h-48 w-full skeleton-pulse" />
      
      {/* Body Skeleton */}
      <div className="p-5 flex-grow flex flex-col justify-between gap-4">
        <div>
          <div className="h-5 w-2/3 rounded-md skeleton-pulse" />
          <div className="h-3 w-1/4 rounded-md skeleton-pulse mt-2" />
          <div className="h-3.5 w-full rounded-md skeleton-pulse mt-3" />
        </div>
        
        {/* Footer Skeleton */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-50 dark:border-slate-800 mt-2">
          <div className="h-3.5 w-1/3 rounded-md skeleton-pulse" />
          <div className="h-8 w-1/4 rounded-lg skeleton-pulse" />
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-premium flex flex-col justify-between p-0">
      {/* Product Image Skeleton */}
      <div className="aspect-square w-full skeleton-pulse" />
      
      {/* Text Skeleton */}
      <div className="p-4 flex-grow flex flex-col gap-4">
        <div>
          <div className="h-4 w-4/5 rounded-md skeleton-pulse" />
          <div className="h-3.5 w-full rounded-md skeleton-pulse mt-2" />
        </div>
        
        {/* Footer Skeleton */}
        <div className="flex flex-col gap-2 mt-2">
          <div className="h-5 w-1/3 rounded-md skeleton-pulse" />
          <div className="h-8 w-full rounded-lg skeleton-pulse mt-1" />
        </div>
      </div>
    </div>
  );
}

export function DashboardStatSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-premium flex items-center justify-between gap-4">
      <div className="flex flex-col gap-2 flex-grow">
        <div className="h-3.5 w-1/2 rounded-md skeleton-pulse" />
        <div className="h-7 w-1/3 rounded-md skeleton-pulse mt-1" />
      </div>
      <div className="w-12 h-12 rounded-xl skeleton-pulse shrink-0" />
    </div>
  );
}
