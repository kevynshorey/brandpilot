export default function ApprovalsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-36 bg-zinc-200 rounded" />
        <div className="h-4 w-64 bg-zinc-100 rounded mt-2" />
      </div>
      <div className="flex gap-1 bg-zinc-100 rounded-lg p-1 w-fit">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-7 w-16 bg-zinc-200/50 rounded-md" />
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-zinc-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
