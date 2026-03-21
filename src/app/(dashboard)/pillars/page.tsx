'use client';

import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useBrandGuidelines, useUpdateBrandGuidelines } from '@/hooks/use-workspaces';
import { toast } from 'sonner';
import {
  Columns3,
  Plus,
  X,
  Save,
  Loader2,
  Sparkles,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentPillar {
  name: string;
  description: string;
  color: string;
  percentage: number;
  exampleTopics: string[];
}

const PILLAR_COLORS = [
  { id: 'amber', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  { id: 'blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
  { id: 'emerald', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  { id: 'violet', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', dot: 'bg-violet-500' },
  { id: 'rose', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500' },
  { id: 'cyan', bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', dot: 'bg-cyan-500' },
];

const DEFAULT_PILLARS: ContentPillar[] = [];

export default function PillarsPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { data: guidelines, isLoading } = useBrandGuidelines(activeWorkspace?.id);
  const updateGuidelines = useUpdateBrandGuidelines();

  const [pillars, setPillars] = useState<ContentPillar[]>(DEFAULT_PILLARS);
  const [newTopic, setNewTopic] = useState<Record<number, string>>({});
  const [generating, setGenerating] = useState(false);

  // Load from brand guidelines
  useEffect(() => {
    if (guidelines?.content_pillars && Array.isArray(guidelines.content_pillars)) {
      setPillars(guidelines.content_pillars as ContentPillar[]);
    }
  }, [guidelines]);

  const addPillar = () => {
    if (pillars.length >= 6) { toast.error('Maximum 6 pillars'); return; }
    const remaining = 100 - pillars.reduce((sum, p) => sum + p.percentage, 0);
    setPillars([...pillars, {
      name: '',
      description: '',
      color: PILLAR_COLORS[pillars.length % PILLAR_COLORS.length].id,
      percentage: Math.max(remaining, 10),
      exampleTopics: [],
    }]);
  };

  const removePillar = (index: number) => {
    setPillars(pillars.filter((_, i) => i !== index));
  };

  const updatePillar = (index: number, updates: Partial<ContentPillar>) => {
    setPillars(pillars.map((p, i) => i === index ? { ...p, ...updates } : p));
  };

  const addTopic = (pillarIndex: number) => {
    const topic = newTopic[pillarIndex]?.trim();
    if (!topic) return;
    const pillar = pillars[pillarIndex];
    if (!pillar.exampleTopics.includes(topic)) {
      updatePillar(pillarIndex, { exampleTopics: [...pillar.exampleTopics, topic] });
    }
    setNewTopic({ ...newTopic, [pillarIndex]: '' });
  };

  const removeTopic = (pillarIndex: number, topicIndex: number) => {
    const pillar = pillars[pillarIndex];
    updatePillar(pillarIndex, { exampleTopics: pillar.exampleTopics.filter((_, i) => i !== topicIndex) });
  };

  const handleSave = async () => {
    if (!activeWorkspace?.id) return;
    try {
      await updateGuidelines.mutateAsync({
        workspaceId: activeWorkspace.id,
        content_pillars: pillars,
      });
      toast.success('Content pillars saved!');
    } catch {
      toast.error('Failed to save pillars');
    }
  };

  const handleAIGenerate = async () => {
    if (!activeWorkspace?.name) { toast.error('Select a workspace first'); return; }
    setGenerating(true);
    try {
      const resp = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'caption',
          topic: `Generate 4 content pillars for a brand called "${activeWorkspace.name}" ${guidelines?.tone_of_voice ? `with a ${guidelines.tone_of_voice} tone` : ''}. For each pillar, give: name, short description (1 sentence), color (amber/blue/emerald/violet/rose/cyan), percentage of content mix (must total 100%), and 3 example post topics. Return as JSON array of objects with keys: name, description, color, percentage, exampleTopics.`,
          brandVoice: guidelines?.tone_of_voice || '',
        }),
      });

      if (!resp.ok) throw new Error('Generation failed');
      const data = await resp.json();
      const content = data.content || '';

      // Try to parse JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          setPillars(parsed.map((p: Record<string, unknown>, i: number) => ({
            name: String(p.name || ''),
            description: String(p.description || ''),
            color: PILLAR_COLORS[i % PILLAR_COLORS.length].id,
            percentage: Number(p.percentage) || 25,
            exampleTopics: Array.isArray(p.exampleTopics) ? p.exampleTopics.map(String) : [],
          })));
          toast.success('Pillars generated! Edit and save.');
          return;
        }
      }
      toast.error('Could not parse AI response — try again');
    } catch {
      toast.error('AI generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const totalPercentage = pillars.reduce((sum, p) => sum + p.percentage, 0);
  const getColorClasses = (colorId: string) => PILLAR_COLORS.find(c => c.id === colorId) || PILLAR_COLORS[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-zinc-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Content Pillars</h1>
          <p className="text-zinc-500 mt-1">Define your content strategy — what topics you post about and how often</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAIGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            AI Generate
          </button>
          <button
            onClick={handleSave}
            disabled={updateGuidelines.isPending}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-zinc-900 rounded-xl text-sm font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
          >
            {updateGuidelines.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>

      {/* Mix Visualization */}
      {pillars.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-zinc-700">Content Mix</h3>
            <span className={cn('text-xs font-medium', totalPercentage === 100 ? 'text-emerald-600' : 'text-red-500')}>
              {totalPercentage}% / 100%
            </span>
          </div>
          <div className="flex h-4 rounded-full overflow-hidden bg-zinc-100">
            {pillars.map((pillar, i) => {
              const colors = getColorClasses(pillar.color);
              return (
                <div
                  key={i}
                  className={cn('h-full transition-all', colors.dot.replace('bg-', 'bg-'))}
                  style={{ width: `${pillar.percentage}%` }}
                  title={`${pillar.name || 'Unnamed'}: ${pillar.percentage}%`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            {pillars.map((pillar, i) => {
              const colors = getColorClasses(pillar.color);
              return (
                <div key={i} className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <div className={cn('w-2.5 h-2.5 rounded-full', colors.dot)} />
                  {pillar.name || 'Unnamed'} ({pillar.percentage}%)
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pillar Cards */}
      <div className="space-y-4">
        {pillars.map((pillar, i) => {
          const colors = getColorClasses(pillar.color);
          return (
            <div key={i} className={cn('rounded-xl border p-5', colors.bg, colors.border)}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-3 h-3 rounded-full', colors.dot)} />
                    <input
                      type="text"
                      value={pillar.name}
                      onChange={e => updatePillar(i, { name: e.target.value })}
                      placeholder="Pillar name (e.g., Educational)"
                      className="flex-1 bg-transparent border-none text-lg font-semibold text-zinc-900 focus:outline-none placeholder:text-zinc-400"
                    />
                  </div>
                  <input
                    type="text"
                    value={pillar.description}
                    onChange={e => updatePillar(i, { description: e.target.value })}
                    placeholder="Brief description..."
                    className="w-full bg-transparent border-none text-sm text-zinc-600 focus:outline-none placeholder:text-zinc-400"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={pillar.percentage}
                      onChange={e => updatePillar(i, { percentage: Math.min(100, Math.max(5, Number(e.target.value) || 5)) })}
                      className="w-14 text-center bg-white border border-zinc-200 rounded-lg py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="text-xs text-zinc-400">%</span>
                  </div>
                  <select
                    value={pillar.color}
                    onChange={e => updatePillar(i, { color: e.target.value })}
                    className="bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
                  >
                    {PILLAR_COLORS.map(c => (
                      <option key={c.id} value={c.id}>{c.id}</option>
                    ))}
                  </select>
                  <button onClick={() => removePillar(i)} className="p-1 text-zinc-400 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Example Topics */}
              <div>
                <p className="text-xs font-medium text-zinc-500 mb-2">Example Topics</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {pillar.exampleTopics.map((topic, ti) => (
                    <span key={ti} className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs', colors.text, 'bg-white border', colors.border)}>
                      {topic}
                      <button onClick={() => removeTopic(i, ti)} className="hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTopic[i] || ''}
                    onChange={e => setNewTopic({ ...newTopic, [i]: e.target.value })}
                    placeholder="Add a topic..."
                    className="flex-1 bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    onKeyDown={e => e.key === 'Enter' && addTopic(i)}
                  />
                  <button
                    onClick={() => addTopic(i)}
                    className="px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-500 hover:bg-zinc-50 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Pillar */}
      <button
        onClick={addPillar}
        disabled={pillars.length >= 6}
        className="w-full py-3 border-2 border-dashed border-zinc-300 rounded-xl text-sm text-zinc-500 hover:border-amber-400 hover:text-amber-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Pillar {pillars.length > 0 && `(${pillars.length}/6)`}
      </button>

      {/* Empty state */}
      {pillars.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <Columns3 className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm mb-2">No content pillars defined yet</p>
          <p className="text-zinc-300 text-xs">Click &ldquo;AI Generate&rdquo; to create pillars based on your brand, or add them manually</p>
        </div>
      )}
    </div>
  );
}
