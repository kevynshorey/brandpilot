export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="h-7 w-48 bg-zinc-200 rounded animate-pulse" />
        <div className="h-4 w-72 bg-zinc-100 rounded animate-pulse mt-2" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-3 w-20 bg-zinc-100 rounded animate-pulse" />
              <div className="h-8 w-8 bg-zinc-100 rounded-lg animate-pulse" />
            </div>
            <div className="h-7 w-16 bg-zinc-200 rounded animate-pulse" />
            <div className="h-3 w-24 bg-zinc-50 rounded animate-pulse mt-2" />
          </div>
        ))}
      </div>

      {/* Content area skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="h-4 w-32 bg-zinc-200 rounded animate-pulse mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3 border-b border-zinc-50">
              <div className="h-8 w-8 bg-zinc-100 rounded animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-40 bg-zinc-100 rounded animate-pulse" />
                <div className="h-3 w-24 bg-zinc-50 rounded animate-pulse mt-1" />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="h-4 w-32 bg-zinc-200 rounded animate-pulse mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3 border-b border-zinc-50">
              <div className="h-8 w-8 bg-zinc-100 rounded animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-40 bg-zinc-100 rounded animate-pulse" />
                <div className="h-3 w-24 bg-zinc-50 rounded animate-pulse mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
