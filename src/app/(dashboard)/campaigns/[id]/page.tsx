'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useCampaign, useUpdateCampaign, useDeleteCampaign, useAssignPostToCampaign, type CampaignStatus } from '@/hooks/use-campaigns';
import { CampaignStatusBadge } from '@/components/campaigns/campaign-status-badge';
import { CampaignFormDialog } from '@/components/campaigns/campaign-form-dialog';
import { PostPickerDialog } from '@/components/campaigns/post-picker-dialog';
import {
  ArrowLeft,
  Calendar,
  Target,
  Tag,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Play,
  Pause,
  CheckCircle2,
  X,
  Image as ImageIcon,
} from 'lucide-react';

const STATUS_ACTIONS: Record<CampaignStatus, { label: string; next: CampaignStatus; icon: typeof Play }[]> = {
  draft: [{ label: 'Activate', next: 'active', icon: Play }],
  active: [
    { label: 'Pause', next: 'paused', icon: Pause },
    { label: 'Complete', next: 'completed', icon: CheckCircle2 },
  ],
  paused: [
    { label: 'Resume', next: 'active', icon: Play },
    { label: 'Complete', next: 'completed', icon: CheckCircle2 },
  ],
  completed: [],
  archived: [],
};

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const { data: campaign, isLoading } = useCampaign(campaignId);
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();
  const unassignPost = useAssignPostToCampaign();

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPostPicker, setShowPostPicker] = useState(false);

  const handleStatusChange = async (newStatus: CampaignStatus) => {
    try {
      await updateCampaign.mutateAsync({ id: campaignId, status: newStatus });
      toast.success(`Campaign ${newStatus}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this campaign? Posts will be unassigned but not deleted.')) return;
    try {
      await deleteCampaign.mutateAsync(campaignId);
      toast.success('Campaign deleted');
      router.push('/campaigns');
    } catch {
      toast.error('Failed to delete campaign');
    }
  };

  const handleUnassignPost = async (postId: string) => {
    try {
      await unassignPost.mutateAsync({ postId, campaignId: null });
      toast.success('Post removed from campaign');
    } catch {
      toast.error('Failed to remove post');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500">Campaign not found.</p>
        <Link href="/campaigns" className="text-amber-500 text-sm hover:underline mt-2 inline-block">
          Back to campaigns
        </Link>
      </div>
    );
  }

  const posts = campaign.posts ?? [];
  const actions = STATUS_ACTIONS[campaign.status as CampaignStatus] ?? [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/campaigns"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Campaigns
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-zinc-900">{campaign.name}</h1>
              <CampaignStatusBadge status={campaign.status as CampaignStatus} />
            </div>
            {campaign.description && (
              <p className="text-sm text-zinc-500 mb-4">{campaign.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
              {campaign.goal && (
                <span className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" /> {campaign.goal}
                </span>
              )}
              {(campaign.start_date || campaign.end_date) && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {campaign.start_date && new Date(campaign.start_date).toLocaleDateString()}
                  {campaign.start_date && campaign.end_date && ' — '}
                  {campaign.end_date && new Date(campaign.end_date).toLocaleDateString()}
                </span>
              )}
              {campaign.utm_campaign && (
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> utm_campaign={campaign.utm_campaign}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.next}
                  onClick={() => handleStatusChange(action.next)}
                  disabled={updateCampaign.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-100 text-zinc-700 rounded-lg text-xs font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  <Icon className="w-3.5 h-3.5" /> {action.label}
                </button>
              );
            })}
            <button
              onClick={() => setShowEditDialog(true)}
              className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
              title="Edit campaign"
            >
              <Pencil className="w-4 h-4 text-zinc-400" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg hover:bg-red-50 transition-colors"
              title="Delete campaign"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {campaign.start_date && campaign.end_date && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>{new Date(campaign.start_date).toLocaleDateString()}</span>
              <span>{new Date(campaign.end_date).toLocaleDateString()}</span>
            </div>
            <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      ((Date.now() - new Date(campaign.start_date).getTime()) /
                        (new Date(campaign.end_date).getTime() - new Date(campaign.start_date).getTime())) *
                        100
                    )
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Posts section */}
      <div className="bg-white rounded-xl border border-zinc-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="text-base font-semibold text-zinc-900">
            Posts ({posts.length})
          </h2>
          <button
            onClick={() => setShowPostPicker(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-zinc-900 rounded-lg text-xs font-semibold hover:bg-amber-400 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Posts
          </button>
        </div>

        {posts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-zinc-500 mb-2">No posts in this campaign yet.</p>
            <button
              onClick={() => setShowPostPicker(true)}
              className="text-sm text-amber-500 hover:text-amber-600 font-medium"
            >
              Add your first post
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {posts.map((post: { id: string; caption: string; status: string; content_type: string; target_platforms: string[]; scheduled_at: string | null; post_media?: { url: string }[] }) => (
              <div key={post.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                  {post.post_media?.[0]?.url ? (
                    <img src={post.post_media[0].url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-zinc-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-900 line-clamp-1">{post.caption || 'Untitled post'}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {post.content_type} · {post.status}
                    {post.target_platforms?.length > 0 && ` · ${post.target_platforms.join(', ')}`}
                    {post.scheduled_at && ` · ${new Date(post.scheduled_at).toLocaleDateString()}`}
                  </p>
                </div>
                <button
                  onClick={() => handleUnassignPost(post.id)}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors shrink-0"
                  title="Remove from campaign"
                >
                  <X className="w-4 h-4 text-zinc-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <CampaignFormDialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        campaign={campaign as any}
      />
      <PostPickerDialog
        open={showPostPicker}
        onClose={() => setShowPostPicker(false)}
        campaignId={campaignId}
      />
    </div>
  );
}
