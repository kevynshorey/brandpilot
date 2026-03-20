'use client';

import { useState } from 'react';
import { MessageSquare, Loader2, CheckCircle2, Send } from 'lucide-react';

interface FeedbackFormProps {
  /** Where the form appears (for tracking) */
  page?: string;
  /** Compact mode for in-app usage */
  compact?: boolean;
}

export function FeedbackForm({ page = 'landing', compact = false }: FeedbackFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 5) {
      setErrorMsg('Please write at least a few words.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim(), page }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setStatus('success');
      setMessage('');
      setName('');
      setEmail('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className={compact ? 'p-4 text-center' : 'bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center'}>
        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
        <p className={compact ? 'text-sm font-medium text-zinc-900' : 'text-lg font-semibold text-white'}>
          Thanks for your feedback!
        </p>
        <p className={compact ? 'text-xs text-zinc-500 mt-1' : 'text-sm text-zinc-400 mt-1'}>
          We read every message and appreciate you taking the time.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className={`mt-4 text-xs font-medium ${compact ? 'text-amber-600 hover:text-amber-700' : 'text-amber-400 hover:text-amber-300'} transition-colors`}
        >
          Send another message
        </button>
      </div>
    );
  }

  // Landing page (dark) variant
  if (!compact) {
    return (
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name (optional)"
            maxLength={100}
            className="px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
          />
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email (optional, for reply)"
            type="email"
            maxLength={320}
            className="px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
          />
        </div>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="What would you like to tell us? Feature requests, bugs, questions — anything goes."
          rows={4}
          maxLength={2000}
          required
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/30 resize-none"
        />
        {status === 'error' && errorMsg && (
          <p className="text-sm text-red-400">{errorMsg}</p>
        )}
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full sm:w-auto px-6 py-3 bg-amber-500 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
        >
          {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {status === 'loading' ? 'Sending...' : 'Send Feedback'}
        </button>
      </form>
    );
  }

  // Compact (in-app, light bg) variant
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Share feedback, report a bug, or request a feature..."
        rows={3}
        maxLength={2000}
        required
        className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 resize-none"
      />
      {status === 'error' && errorMsg && (
        <p className="text-xs text-red-500">{errorMsg}</p>
      )}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        {status === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        {status === 'loading' ? 'Sending...' : 'Send Feedback'}
      </button>
    </form>
  );
}
