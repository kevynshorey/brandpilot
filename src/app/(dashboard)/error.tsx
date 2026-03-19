'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-zinc-900 mb-1">Something went wrong</h2>
        <p className="text-sm text-zinc-500 mb-4">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-900 rounded-xl font-semibold text-sm hover:from-amber-400 hover:to-amber-300 transition-all shadow-sm"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
