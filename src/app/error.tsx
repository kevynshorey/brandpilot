'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-red-400 mb-4">Oops</h1>
        <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
        <p className="text-zinc-400 mb-8 max-w-md">
          An unexpected error occurred. Please try again or contact support if the issue persists.
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-amber-500 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
