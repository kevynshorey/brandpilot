export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Brand<span className="text-amber-400">Pilot</span>
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">Manage all your brands from one dashboard</p>
        </div>
        {children}
      </div>
    </div>
  );
}
