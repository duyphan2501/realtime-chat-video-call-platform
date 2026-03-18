export default function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      {/* Avatar Skeleton */}
      <div className="relative shrink-0">
        <div className="w-12 h-12 bg-gray-700 rounded-full" />
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-700 rounded w-1/3" />
          <div className="h-3 bg-gray-800 rounded w-10" />
        </div>
        <div className="h-3 bg-gray-800 rounded w-3/4" />
      </div>
    </div>
  );
}
