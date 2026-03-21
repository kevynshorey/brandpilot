export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-32 bg-zinc-200 rounded" />
        <div className="h-4 w-56 bg-zinc-100 rounded mt-2" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-zinc-100 rounded-xl" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="h-64 bg-zinc-100 rounded-xl" />
        <div className="h-64 bg-zinc-100 rounded-xl" />
      </div>
    </div>
  );
}
