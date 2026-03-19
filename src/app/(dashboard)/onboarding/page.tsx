'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateWorkspace } from '@/hooks/use-workspaces';
import { useOrganization } from '@/hooks/use-user';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { data: org } = useOrganization();
  const createWorkspace = useCreateWorkspace();
  const { setActiveWorkspace } = useWorkspaceStore();

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [color, setColor] = useState('#000000');

  const handleCreate = async () => {
    if (!name.trim() || !org) return;
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
      toast.success('Workspace created!');
      router.push('/dashboard');
    } catch {
      toast.error('Failed to create workspace');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Brand<span className="text-amber-400">Pilot</span>
          </h1>
          <p className="text-zinc-400 mt-2">Create your first brand workspace</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Brand Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Are You Vintage"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
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
              <option value="Fashion">Fashion</option>
              <option value="Real Estate">Real Estate</option>
              <option value="SaaS">SaaS / Technology</option>
              <option value="E-commerce">E-commerce</option>
              <option value="Food & Beverage">Food & Beverage</option>
              <option value="Health & Wellness">Health & Wellness</option>
              <option value="Professional Services">Professional Services</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Other">Other</option>
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
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!name.trim() || createWorkspace.isPending}
            className="w-full py-3 bg-amber-500 text-zinc-900 rounded-lg font-semibold text-sm hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {createWorkspace.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Create Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
