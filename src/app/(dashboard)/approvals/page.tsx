'use client';

import { useState } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useApprovalRequests, useReviewApproval, useSubmitForApproval, type ApprovalStatus } from '@/hooks/use-approvals';
import { toast } from 'sonner';
import {
  Shield,
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Image as ImageIcon,
  MessageSquare,
} from 'lucide-react';

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

const statusBadges: Record<ApprovalStatus, { label: string; bg: string; text: string; icon: typeof Clock }> = {
  pending: { label: 'Pending Review', bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
  approved: { label: 'Approved', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  revision_requested: { label: 'Revision Needed', bg: 'bg-blue-100', text: 'text-blue-700', icon: RotateCcw },
};

export default function ApprovalsPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const [statusFilter, setStatusFilter] = useState('all');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const { data: approvals = [], isLoading } = useApprovalRequests(statusFilter);
  const reviewApproval = useReviewApproval();

  const handleReview = async (approvalId: string, postId: string, decision: 'approved' | 'rejected' | 'revision_requested') => {
    try {
      await reviewApproval.mutateAsync({ approvalId, postId, decision, notes: reviewNotes });
      toast.success(`Post ${decision === 'approved' ? 'approved' : decision === 'rejected' ? 'rejected' : 'sent back for revision'}`);
      setReviewingId(null);
      setReviewNotes('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Review failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-amber-500" />
          Approvals
        </h1>
        <p className="text-sm text-zinc-500">
          {activeWorkspace?.name || 'Select workspace'} — review and approve content before publishing
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-1 bg-zinc-100 rounded-lg p-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
        </div>
      ) : approvals.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">
            {statusFilter === 'all' ? 'No approval requests yet' : `No ${statusFilter} requests`}
          </h3>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            When team members submit posts for approval, they&apos;ll appear here for review.
            Use the &quot;Submit for Approval&quot; button in the Posts page to start the workflow.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => {
            const post = approval.posts;
            const badge = statusBadges[approval.status] || statusBadges.pending;
            const BadgeIcon = badge.icon;
            const isReviewing = reviewingId === approval.id;

            return (
              <div key={approval.id} className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="flex items-start gap-4 p-5">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                    {post?.post_media?.[0]?.url ? (
                      <img src={post.post_media[0].url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-zinc-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                        <BadgeIcon className="w-3 h-3" /> {badge.label}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {new Date(approval.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-900 line-clamp-2">{post?.caption || 'Untitled post'}</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {post?.content_type} · {post?.target_platforms?.join(', ')}
                      {approval.requester && ` · By ${(approval.requester as { full_name: string }).full_name}`}
                    </p>
                    {approval.notes && (
                      <div className="mt-2 flex items-start gap-1.5 text-xs text-zinc-500">
                        <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>{approval.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {approval.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      {!isReviewing ? (
                        <>
                          <button
                            onClick={() => handleReview(approval.id, approval.post_id, 'approved')}
                            disabled={reviewApproval.isPending}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => setReviewingId(approval.id)}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-zinc-100 text-zinc-700 rounded-lg text-xs font-medium hover:bg-zinc-200 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <textarea
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            placeholder="Add feedback (optional)..."
                            rows={2}
                            className="w-56 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 resize-none"
                          />
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleReview(approval.id, approval.post_id, 'rejected')}
                              disabled={reviewApproval.isPending}
                              className="flex-1 px-2 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 disabled:opacity-50"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleReview(approval.id, approval.post_id, 'revision_requested')}
                              disabled={reviewApproval.isPending}
                              className="flex-1 px-2 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 disabled:opacity-50"
                            >
                              Revise
                            </button>
                            <button
                              onClick={() => { setReviewingId(null); setReviewNotes(''); }}
                              className="px-2 py-1.5 bg-zinc-100 text-zinc-500 rounded-lg text-xs hover:bg-zinc-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
