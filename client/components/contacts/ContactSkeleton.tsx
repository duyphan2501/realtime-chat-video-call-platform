"use client";

export default function ContactSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-2">
          {/* Avatar skeleton */}
          <div className="w-12 h-12 rounded-full bg-slate-700 animate-pulse shrink-0" />

          {/* Text skeleton */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-4 w-32 bg-slate-700 rounded animate-pulse" />
            <div className="h-3 w-20 bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ContactListSkeleton() {
  return (
    <div className="p-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-8 w-32 bg-slate-700 rounded animate-pulse" />
        <div className="h-8 w-24 bg-slate-700 rounded animate-pulse" />
      </div>

      {/* Search skeleton */}
      <div className="h-10 w-full bg-slate-800 rounded-lg animate-pulse mb-4" />

      {/* List skeleton */}
      <div className="flex flex-col gap-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 animate-pulse shrink-0" />
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="h-3.5 w-28 bg-slate-700 rounded animate-pulse" />
              <div className="h-2.5 w-16 bg-slate-700 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContactDetailSkeleton() {
  return (
    <div className="flex flex-col items-center p-6">
      {/* Avatar skeleton */}
      <div className="w-24 h-24 rounded-full bg-slate-700 animate-pulse mb-3" />

      {/* Name skeleton */}
      <div className="h-6 w-40 bg-slate-700 rounded animate-pulse mb-2" />

      {/* Status skeleton */}
      <div className="h-4 w-20 bg-slate-700 rounded animate-pulse mb-4" />

      {/* Action buttons */}
      <div className="flex gap-3 mt-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-16 h-16 rounded-2xl bg-slate-700 animate-pulse"
          />
        ))}
      </div>

      {/* Info section */}
      <div className="w-full mt-8 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 w-20 bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-32 bg-slate-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
