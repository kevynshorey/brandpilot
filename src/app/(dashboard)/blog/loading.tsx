export default function BlogLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-32 bg-zinc-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-zinc-100 rounded animate-pulse mt-2" />
        </div>
        <div className="h-10 w-32 bg-zinc-200 rounded-xl animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-zinc-200 rounded animate-pulse" />
            <div className="h-4 w-20 bg-zinc-200 rounded animate-pulse" />
          </div>
          <div className="h-7 w-24 bg-zinc-100 rounded-lg animate-pulse" />
        </div>

        {/* Table header */}
        <div className="border-b border-zinc-100 pb-2 mb-2">
          <div className="flex gap-4">
            <div className="h-3 w-16 bg-zinc-100 rounded animate-pulse" />
            <div className="h-3 w-12 bg-zinc-100 rounded animate-pulse" />
            <div className="h-3 w-10 bg-zinc-100 rounded animate-pulse" />
            <div className="h-3 w-16 bg-zinc-100 rounded animate-pulse" />
            <div className="h-3 w-14 bg-zinc-100 rounded animate-pulse ml-auto" />
          </div>
        </div>

        {/* Rows */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-zinc-50">
            <div className="flex-1">
              <div className="h-4 w-48 bg-zinc-100 rounded animate-pulse" />
              <div className="h-3 w-32 bg-zinc-50 rounded animate-pulse mt-1" />
            </div>
            <div className="h-5 w-16 bg-zinc-100 rounded-full animate-pulse" />
            <div className="flex gap-1">
              <div className="h-5 w-12 bg-zinc-100 rounded animate-pulse" />
              <div className="h-5 w-14 bg-zinc-100 rounded animate-pulse" />
            </div>
            <div className="h-3 w-20 bg-zinc-100 rounded animate-pulse" />
            <div className="flex gap-1">
              <div className="h-6 w-6 bg-zinc-100 rounded animate-pulse" />
              <div className="h-6 w-6 bg-zinc-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
