'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Target } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateCampaign, useUpdateCampaign, type Campaign } from '@/hooks/use-campaigns';

const GOALS = [
  'Brand Awareness',
  'Engagement',
  'Lead Generation',
  'Sales / Conversion',
  'Website Traffic',
  'App Installs',
  'Community Building',
];

interface CampaignFormDialogProps {
  open: boolean;
  onClose: () => void;
  campaign?: Campaign | null; // null = create mode, campaign = edit mode
}

export function CampaignFormDialog({ open, onClose, campaign }: CampaignFormDialogProps) {
  const isEdit = !!campaign;
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');

  // Populate form when editing
  useEffect(() => {
    if (campaign) {
      setName(campaign.name);
      setDescription(campaign.description ?? '');
      setGoal(campaign.goal ?? '');
      setStartDate(campaign.start_date?.split('T')[0] ?? '');
      setEndDate(campaign.end_date?.split('T')[0] ?? '');
      setUtmCampaign(campaign.utm_campaign ?? '');
    } else {
      setName('');
      setDescription('');
      setGoal('');
      setStartDate('');
      setEndDate('');
      setUtmCampaign('');
    }
  }, [campaign, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (isEdit && campaign) {
        await updateCampaign.mutateAsync({
          id: campaign.id,
          name: name.trim(),
          description: description.trim() || undefined,
          goal: goal || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          utm_campaign: utmCampaign.trim() || undefined,
        });
        toast.success('Campaign updated');
      } else {
        await createCampaign.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          goal: goal || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          utmCampaign: utmCampaign.trim() || undefined,
        });
        toast.success('Campaign created');
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save campaign');
    }
  };

  const isPending = createCampaign.isPending || updateCampaign.isPending;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-zinc-900">
              {isEdit ? 'Edit Campaign' : 'New Campaign'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Campaign Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Launch 2026"
              required
              maxLength={200}
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief campaign description..."
              rows={3}
              maxLength={2000}
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Goal</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            >
              <option value="">Select a goal...</option>
              {GOALS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">UTM Campaign Tag</label>
            <input
              value={utmCampaign}
              onChange={(e) => setUtmCampaign(e.target.value)}
              placeholder="e.g. summer-launch-2026"
              maxLength={200}
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            />
            <p className="text-xs text-zinc-400 mt-1">Auto-applied to all campaign post links for tracking.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="px-4 py-2 bg-amber-500 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
