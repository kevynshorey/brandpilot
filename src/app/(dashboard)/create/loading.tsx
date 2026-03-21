export default function CreateLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-36 bg-zinc-200 rounded" />
        <div className="h-4 w-72 bg-zinc-100 rounded mt-2" />
      </div>
      <div className="h-2 w-full bg-zinc-100 rounded-full" />
      <div className="bg-white border border-zinc-200 rounded-xl p-8">
        <div className="space-y-4">
          <div className="h-10 bg-zinc-100 rounded-lg" />
          <div className="h-10 bg-zinc-100 rounded-lg" />
          <div className="h-32 bg-zinc-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
