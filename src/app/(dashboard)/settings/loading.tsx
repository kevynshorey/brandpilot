export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-28 bg-zinc-200 rounded" />
        <div className="h-4 w-64 bg-zinc-100 rounded mt-2" />
      </div>
      <div className="flex gap-2 border-b border-zinc-200 pb-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-24 bg-zinc-100 rounded-lg" />
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-zinc-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
