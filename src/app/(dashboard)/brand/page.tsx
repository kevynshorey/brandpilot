'use client';

import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useBrandGuidelines, useUpdateBrandGuidelines } from '@/hooks/use-workspaces';
import { toast } from 'sonner';
import { Save, Plus, X, Palette, Type, MessageSquare, Hash, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function BrandPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { data: guidelines, isLoading } = useBrandGuidelines(activeWorkspace?.id);
  const updateGuidelines = useUpdateBrandGuidelines();

  const [tone, setTone] = useState('');
  const [style, setStyle] = useState('');
  const [topicsCover, setTopicsCover] = useState<string[]>([]);
  const [topicsAvoid, setTopicsAvoid] = useState<string[]>([]);
  const [exampleCaptions, setExampleCaptions] = useState<string[]>([]);
  const [hashtagSets, setHashtagSets] = useState<Record<string, string[]>>({});
  const [newTopic, setNewTopic] = useState('');
  const [newAvoid, setNewAvoid] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newSetName, setNewSetName] = useState('');
  const [newSetTags, setNewSetTags] = useState('');

  // Load data from Supabase when guidelines arrive
  useEffect(() => {
    if (guidelines) {
      setTone(guidelines.tone_of_voice || '');
      setStyle(guidelines.writing_style || '');
      setTopicsCover(guidelines.topics_to_cover || []);
      setTopicsAvoid(guidelines.topics_to_avoid || []);
      setExampleCaptions(guidelines.example_captions || []);
      setHashtagSets(guidelines.hashtag_sets || {});
    }
  }, [guidelines]);

  const addToList = (list: string[], setter: (v: string[]) => void, value: string, inputSetter: (v: string) => void) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      setter([...list, trimmed]);
      inputSetter('');
    }
  };

  const handleSave = async () => {
    if (!activeWorkspace?.id) return;
    try {
      await updateGuidelines.mutateAsync({
        workspaceId: activeWorkspace.id,
        tone_of_voice: tone || null,
        writing_style: style || null,
        topics_to_cover: topicsCover,
        topics_to_avoid: topicsAvoid,
        example_captions: exampleCaptions,
        hashtag_sets: hashtagSets,
      });
      toast.success('Brand guidelines saved!');
    } catch {
      toast.error('Failed to save guidelines');
    }
  };

  const addHashtagSet = () => {
    const name = newSetName.trim().toLowerCase();
    const tags = newSetTags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
    if (name && tags.length > 0) {
      setHashtagSets({ ...hashtagSets, [name]: tags });
      setNewSetName('');
      setNewSetTags('');
    }
  };

  const removeHashtagSet = (name: string) => {
    const updated = { ...hashtagSets };
    delete updated[name];
    setHashtagSets(updated);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-zinc-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Brand Guidelines</h1>
          <p className="text-sm text-zinc-500">{activeWorkspace?.name || 'Select a workspace'} — AI content will follow these rules</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/brand/analyze"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Analyze Voice
          </Link>
          <button
            onClick={handleSave}
            disabled={updateGuidelines.isPending}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-zinc-900 rounded-xl text-sm font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
          >
            {updateGuidelines.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Guidelines
          </button>
        </div>
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
          {topicsCover.length === 0 && <span className="text-xs text-zinc-400">No topics added yet</span>}
        </div>
        <div className="flex gap-2">
          <input
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToList(topicsCover, setTopicsCover, newTopic, setNewTopic))}
            placeholder="Add topic"
            className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30"
          />
          <button onClick={() => addToList(topicsCover, setTopicsCover, newTopic, setNewTopic)} className="px-3 py-2 bg-zinc-100 rounded-lg text-sm hover:bg-zinc-200"><Plus className="w-4 h-4" /></button>
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
          {topicsAvoid.length === 0 && <span className="text-xs text-zinc-400">No topics added yet</span>}
        </div>
        <div className="flex gap-2">
          <input
            value={newAvoid}
            onChange={(e) => setNewAvoid(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToList(topicsAvoid, setTopicsAvoid, newAvoid, setNewAvoid))}
            placeholder="Add topic to avoid"
            className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30"
          />
          <button onClick={() => addToList(topicsAvoid, setTopicsAvoid, newAvoid, setNewAvoid)} className="px-3 py-2 bg-zinc-100 rounded-lg text-sm hover:bg-zinc-200"><Plus className="w-4 h-4" /></button>
        </div>
      </section>

      {/* Hashtag Presets */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Hash className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-zinc-900">Hashtag Presets</h2>
        </div>
        <p className="text-xs text-zinc-500 mb-4">Save sets of hashtags to quickly add to posts</p>

        {Object.entries(hashtagSets).length === 0 && (
          <p className="text-xs text-zinc-400 mb-4">No hashtag presets yet</p>
        )}

        {Object.entries(hashtagSets).map(([setName, tags]) => (
          <div key={setName} className="mb-3 p-3 bg-zinc-50 rounded-lg flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">{setName}</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs">#{tag}</span>
                ))}
              </div>
            </div>
            <button onClick={() => removeHashtagSet(setName)} className="text-zinc-400 hover:text-red-500 p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        <div className="border border-zinc-200 rounded-lg p-3 space-y-2 mt-3">
          <input
            value={newSetName}
            onChange={(e) => setNewSetName(e.target.value)}
            placeholder="Set name (e.g., 'product launch')"
            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30"
          />
          <input
            value={newSetTags}
            onChange={(e) => setNewSetTags(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addHashtagSet())}
            placeholder="Tags (comma-separated: startup, launch, new)"
            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30"
          />
          <button
            onClick={addHashtagSet}
            disabled={!newSetName.trim() || !newSetTags.trim()}
            className="px-3 py-2 bg-zinc-900 text-white rounded-lg text-xs font-medium hover:bg-zinc-800 disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5 inline mr-1" /> Add Set
          </button>
        </div>
      </section>

      {/* Example Captions */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-zinc-900">Example Captions</h2>
        </div>
        <p className="text-xs text-zinc-500 mb-3">Add examples of your best captions so AI can match your style</p>

        {exampleCaptions.length === 0 && (
          <p className="text-xs text-zinc-400 mb-3">No example captions yet</p>
        )}

        {exampleCaptions.map((cap, i) => (
          <div key={i} className="mb-2 p-3 bg-zinc-50 rounded-lg text-sm text-zinc-700 italic flex items-start justify-between gap-2">
            <span>&ldquo;{cap}&rdquo;</span>
            <button
              onClick={() => setExampleCaptions(exampleCaptions.filter((_, j) => j !== i))}
              className="text-zinc-400 hover:text-red-500 shrink-0 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        <div className="flex gap-2 mt-3">
          <input
            value={newCaption}
            onChange={(e) => setNewCaption(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToList(exampleCaptions, setExampleCaptions, newCaption, setNewCaption))}
            placeholder="Paste an example caption..."
            className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30"
          />
          <button onClick={() => addToList(exampleCaptions, setExampleCaptions, newCaption, setNewCaption)} className="px-3 py-2 bg-zinc-100 rounded-lg text-sm hover:bg-zinc-200"><Plus className="w-4 h-4" /></button>
        </div>
      </section>
    </div>
  );
}
