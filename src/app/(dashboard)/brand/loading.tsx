export default function BrandLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-40 bg-zinc-200 rounded" />
        <div className="h-4 w-56 bg-zinc-100 rounded mt-2" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="h-48 bg-zinc-100 rounded-xl" />
        <div className="h-48 bg-zinc-100 rounded-xl" />
      </div>
      <div className="h-48 bg-zinc-100 rounded-xl" />
    </div>
  );
}
