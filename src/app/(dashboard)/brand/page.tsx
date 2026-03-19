'use client';

import { useState } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { Save, Plus, X, Palette, Type, MessageSquare, Hash } from 'lucide-react';

export default function BrandPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const [tone, setTone] = useState('Professional but approachable, data-driven, empowering');
  const [style, setStyle] = useState('Short sentences. Active voice. No jargon.');
  const [topicsCover, setTopicsCover] = useState<string[]>(['startup tips', 'fundraising', 'product development']);
  const [topicsAvoid, setTopicsAvoid] = useState<string[]>(['politics', 'competitor mentions']);
  const [exampleCaptions, setExampleCaptions] = useState<string[]>([
    'Every founder has a moment when they realize: this is bigger than me. That realization is the beginning.',
  ]);
  const [hashtagSets, setHashtagSets] = useState<Record<string, string[]>>({
    default: ['startup', 'entrepreneur', 'business', 'growth'],
    fundraising: ['venturecapital', 'angelinvestor', 'funding', 'seedround'],
  });
  const [newTopic, setNewTopic] = useState('');
  const [newAvoid, setNewAvoid] = useState('');
  const [saved, setSaved] = useState(false);

  const addTopic = (list: string[], setter: (v: string[]) => void, value: string, inputSetter: (v: string) => void) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      setter([...list, trimmed]);
      inputSetter('');
    }
  };

  const handleSave = () => {
    // TODO: Save to Supabase brand_guidelines table
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Brand Guidelines</h1>
          <p className="text-sm text-zinc-500">{activeWorkspace?.name || 'Select a workspace'} — AI content will follow these rules</p>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-zinc-900 rounded-xl text-sm font-semibold hover:bg-amber-400 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saved ? 'Saved!' : 'Save Guidelines'}
        </button>
      </div>

      {/* Tone of Voice */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-zinc-900">Tone of Voice</h2>
        </div>
        <textarea
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          rows={3}
          placeholder="Describe how your brand sounds (e.g., 'Professional but warm, confident, uses humor sparingly')"
          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/30"
        />
      </section>

      {/* Writing Style */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Type className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-zinc-900">Writing Style</h2>
        </div>
        <textarea
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          rows={3}
          placeholder="Rules for how content is written (e.g., 'Short paragraphs. No emojis. Always include a CTA.')"
          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/30"
        />
      </section>

      {/* Topics to Cover */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Topics to Cover</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {topicsCover.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
              {t}
              <button onClick={() => setTopicsCover(topicsCover.filter((x) => x !== t))}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newTopic} onChange={(e) => setNewTopic(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic(topicsCover, setTopicsCover, newTopic, setNewTopic))} placeholder="Add topic" className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30" />
          <button onClick={() => addTopic(topicsCover, setTopicsCover, newTopic, setNewTopic)} className="px-3 py-2 bg-zinc-100 rounded-lg text-sm hover:bg-zinc-200"><Plus className="w-4 h-4" /></button>
        </div>
      </section>

      {/* Topics to Avoid */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Topics to Avoid</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {topicsAvoid.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-xs font-medium">
              {t}
              <button onClick={() => setTopicsAvoid(topicsAvoid.filter((x) => x !== t))}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newAvoid} onChange={(e) => setNewAvoid(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic(topicsAvoid, setTopicsAvoid, newAvoid, setNewAvoid))} placeholder="Add topic to avoid" className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30" />
          <button onClick={() => addTopic(topicsAvoid, setTopicsAvoid, newAvoid, setNewAvoid)} className="px-3 py-2 bg-zinc-100 rounded-lg text-sm hover:bg-zinc-200"><Plus className="w-4 h-4" /></button>
        </div>
      </section>

      {/* Hashtag Sets */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Hash className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-zinc-900">Hashtag Presets</h2>
        </div>
        {Object.entries(hashtagSets).map(([setName, tags]) => (
          <div key={setName} className="mb-4 p-3 bg-zinc-50 rounded-lg">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">{setName}</p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span key={tag} className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs">#{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Example Captions */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-zinc-900">Example Captions</h2>
        </div>
        <p className="text-xs text-zinc-500 mb-3">Add examples of your best captions so AI can match your style</p>
        {exampleCaptions.map((cap, i) => (
          <div key={i} className="mb-2 p-3 bg-zinc-50 rounded-lg text-sm text-zinc-700 italic">
            &ldquo;{cap}&rdquo;
          </div>
        ))}
      </section>
    </div>
  );
}
