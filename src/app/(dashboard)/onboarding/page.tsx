'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateWorkspace } from '@/hooks/use-workspaces';
import { useOrganization } from '@/hooks/use-user';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  Palette,
  MessageSquare,
  Share2,
  Instagram,
  Linkedin,
  SkipForward,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type OnboardingStep = 1 | 2 | 3;

const INDUSTRIES = [
  'Fashion', 'Real Estate', 'SaaS / Technology', 'E-commerce',
  'Food & Beverage', 'Health & Wellness', 'Professional Services',
  'Manufacturing', 'Education', 'Travel & Hospitality', 'Other',
];

const VOICE_OPTIONS = [
  { id: 'professional', label: 'Professional', desc: 'Formal, authoritative, expert' },
  { id: 'friendly', label: 'Friendly', desc: 'Warm, approachable, conversational' },
  { id: 'bold', label: 'Bold', desc: 'Confident, edgy, provocative' },
  { id: 'luxury', label: 'Luxury', desc: 'Elegant, sophisticated, premium' },
  { id: 'casual', label: 'Casual', desc: 'Relaxed, fun, informal' },
  { id: 'educational', label: 'Educational', desc: 'Informative, helpful, clear' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: org } = useOrganization();
  const createWorkspace = useCreateWorkspace();
  const { setActiveWorkspace } = useWorkspaceStore();

  const [step, setStep] = useState<OnboardingStep>(1);
  const [creating, setCreating] = useState(false);

  // Step 1: Brand basics
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [color, setColor] = useState('#C9A96E');

  // Step 2: Voice & tone
  const [voice, setVoice] = useState('');
  const [customVoice, setCustomVoice] = useState('');
  const [targetAudience, setTargetAudience] = useState('');

  const handleCreateAndContinue = async () => {
    if (!name.trim() || !org) return;
    setCreating(true);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    try {
      const workspace = await createWorkspace.mutateAsync({
        name: name.trim(),
        slug,
        industry: industry || undefined,
        brandColor: color,
        orgId: (org as { id: string }).id,
      });
      setActiveWorkspace(workspace);
      toast.success('Brand workspace created!');
      setStep(2);
    } catch {
      toast.error('Failed to create workspace');
    } finally {
      setCreating(false);
    }
  };

  const handleSaveVoice = async () => {
    const { activeWorkspace } = useWorkspaceStore.getState();
    if (!activeWorkspace) return;

    const supabase = createClient();
    const toneValue = voice === 'custom' ? customVoice : voice;

    await supabase
      .from('brand_guidelines')
      .update({
        tone_of_voice: toneValue,
        target_audience: targetAudience || null,
      })
      .eq('workspace_id', activeWorkspace.id);

    toast.success('Brand voice saved!');
    setStep(3);
  };

  const handleFinish = () => {
    router.push('/dashboard');
  };

  const steps = [
    { num: 1, label: 'Brand', icon: Palette },
    { num: 2, label: 'Voice', icon: MessageSquare },
    { num: 3, label: 'Connect', icon: Share2 },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Brand<span className="text-amber-400">Pilot</span>
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">Set up your brand in 3 quick steps</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map(({ num, label, icon: Icon }, idx) => (
            <div key={num} className="flex items-center">
              <div className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                step === num
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : step > num
                  ? 'text-green-400'
                  : 'text-zinc-600'
              )}>
                <div className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                  step === num ? 'bg-amber-500 text-zinc-900'
                    : step > num ? 'bg-green-500/20 text-green-400'
                    : 'bg-zinc-800 text-zinc-500'
                )}>
                  {step > num ? <Check className="w-3 h-3" /> : num}
                </div>
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{label}</span>
              </div>
              {idx < 2 && (
                <div className={cn('w-8 h-px mx-2', step > num ? 'bg-green-500/30' : 'bg-zinc-800')} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Brand Basics */}
        {step === 1 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Name your brand</h2>
              <p className="text-xs text-zinc-500">This will be the name of your workspace</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Brand Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Are You Vintage"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30"
              >
                <option value="">Select an industry</option>
                {INDUSTRIES.map(i => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Brand Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-10 rounded-lg border border-zinc-700 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-28 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                />
                <div className="flex-1 h-10 rounded-lg border border-zinc-700" style={{ backgroundColor: color }} />
              </div>
            </div>

            <button
              onClick={handleCreateAndContinue}
              disabled={!name.trim() || creating}
              className="w-full py-3 bg-amber-500 text-zinc-900 rounded-lg font-semibold text-sm hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Create & Continue
            </button>
          </div>
        )}

        {/* Step 2: Voice & Tone */}
        {step === 2 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Set your brand voice</h2>
              <p className="text-xs text-zinc-500">This guides AI-generated content to match your style</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {VOICE_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setVoice(opt.id)}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-colors',
                    voice === opt.id
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800'
                  )}
                >
                  <p className={cn('text-sm font-medium', voice === opt.id ? 'text-amber-400' : 'text-white')}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>

            {voice === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Custom Voice</label>
                <input
                  value={customVoice}
                  onChange={e => setCustomVoice(e.target.value)}
                  placeholder="Describe your brand's voice..."
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Target Audience <span className="text-zinc-600">(optional)</span>
              </label>
              <input
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
                placeholder="e.g., Young professionals aged 25-40 interested in vintage fashion"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-3 border border-zinc-700 text-zinc-400 rounded-lg text-sm hover:text-white hover:border-zinc-600 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleSaveVoice}
                disabled={!voice}
                className="flex-1 py-3 bg-amber-500 text-zinc-900 rounded-lg font-semibold text-sm hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Save & Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Connect Social */}
        {step === 3 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Connect your accounts</h2>
              <p className="text-xs text-zinc-500">Link your social media to publish directly from BrandPilot</p>
            </div>

            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-4 rounded-lg border border-zinc-700 bg-zinc-800 hover:border-zinc-600 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Instagram className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white">Instagram</p>
                  <p className="text-xs text-zinc-500">Connect via Facebook Business</p>
                </div>
                <span className="text-xs text-zinc-500 px-2 py-1 bg-zinc-700 rounded">Coming soon</span>
              </button>

              <button className="w-full flex items-center gap-3 p-4 rounded-lg border border-zinc-700 bg-zinc-800 hover:border-zinc-600 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Linkedin className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white">LinkedIn</p>
                  <p className="text-xs text-zinc-500">Personal or Company page</p>
                </div>
                <span className="text-xs text-zinc-500 px-2 py-1 bg-zinc-700 rounded">Coming soon</span>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-3 border border-zinc-700 text-zinc-400 rounded-lg text-sm hover:text-white hover:border-zinc-600 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 py-3 bg-amber-500 text-zinc-900 rounded-lg font-semibold text-sm hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
              >
                <SkipForward className="w-4 h-4" />
                Skip & Go to Dashboard
              </button>
            </div>

            <p className="text-xs text-zinc-600 text-center">
              You can always connect accounts later from Settings
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
