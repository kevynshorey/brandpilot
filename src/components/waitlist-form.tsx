'use client';

import { useState, useRef } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

type Status = 'idle' | 'loading' | 'success' | 'error';

export function WaitlistForm({ source = 'landing' }: { source?: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          source,
          referrer: typeof document !== 'undefined' ? document.referrer || null : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setStatus('success');
      setMessage(data.message || "You're in!");
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 justify-center px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-medium">
        <Check className="w-4 h-4 shrink-0" />
        {message}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto">
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          placeholder="you@email.com"
          required
          className={`w-full px-4 py-3 bg-zinc-900 border rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-colors ${
            status === 'error'
              ? 'border-red-500/40'
              : 'border-zinc-700 hover:border-zinc-600'
          }`}
        />
      </div>
      <button
        type="submit"
        disabled={status === 'loading' || !email.trim()}
        className="px-6 py-3 bg-amber-500 text-zinc-900 rounded-xl text-sm font-bold hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shrink-0"
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Joining...
          </>
        ) : (
          <>
            Join Waitlist
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
      {status === 'error' && message && (
        <p className="text-red-400 text-xs mt-1 sm:absolute sm:-bottom-6 sm:left-0">
          {message}
        </p>
      )}
    </form>
  );
}
