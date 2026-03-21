import type { CampaignStatus } from '@/hooks/use-campaigns';

const STATUS_CONFIG: Record<CampaignStatus, { label: string; bg: string; text: string }> = {
  draft: { label: 'Draft', bg: 'bg-zinc-100', text: 'text-zinc-600' },
  active: { label: 'Active', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  paused: { label: 'Paused', bg: 'bg-amber-100', text: 'text-amber-700' },
  completed: { label: 'Completed', bg: 'bg-blue-100', text: 'text-blue-700' },
  archived: { label: 'Archived', bg: 'bg-zinc-100', text: 'text-zinc-500' },
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
