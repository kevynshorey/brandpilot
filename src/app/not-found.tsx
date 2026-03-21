import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-amber-400 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-white mb-2">Page not found</h2>
        <p className="text-zinc-400 mb-8 max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="px-5 py-2.5 bg-amber-500 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-zinc-800 text-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
