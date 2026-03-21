export default function PostsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-32 bg-zinc-200 rounded" />
          <div className="h-4 w-48 bg-zinc-100 rounded mt-2" />
        </div>
        <div className="h-9 w-28 bg-zinc-200 rounded-lg" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-20 bg-zinc-100 rounded-lg" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 bg-zinc-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
