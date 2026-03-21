export default function CalendarLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 bg-zinc-200 rounded" />
        <div className="flex gap-2">
          <div className="h-9 w-9 bg-zinc-100 rounded-lg" />
          <div className="h-9 w-32 bg-zinc-100 rounded-lg" />
          <div className="h-9 w-9 bg-zinc-100 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px bg-zinc-200 rounded-xl overflow-hidden">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="h-24 bg-zinc-50" />
        ))}
      </div>
    </div>
  );
}
