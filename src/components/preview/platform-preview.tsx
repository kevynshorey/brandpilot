'use client';

import { Instagram, Linkedin, Twitter, Globe, Heart, MessageCircle, Send, Bookmark, ThumbsUp, Repeat2, Share2 } from 'lucide-react';

interface PreviewProps {
  platform: string;
  caption: string;
  hashtags?: string[];
  imageUrl?: string;
  accountName?: string;
}

function InstagramPreview({ caption, hashtags, imageUrl, accountName }: Omit<PreviewProps, 'platform'>) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden max-w-[320px]">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
          {(accountName || 'B')[0].toUpperCase()}
        </div>
        <span className="text-xs font-semibold text-zinc-900">{accountName || 'yourbrand'}</span>
      </div>
      {/* Image */}
      <div className="aspect-square bg-zinc-100 flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <Instagram className="w-10 h-10 text-zinc-300" />
        )}
      </div>
      {/* Actions */}
      <div className="px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Heart className="w-5 h-5 text-zinc-700" />
          <MessageCircle className="w-5 h-5 text-zinc-700" />
          <Send className="w-5 h-5 text-zinc-700" />
        </div>
        <Bookmark className="w-5 h-5 text-zinc-700" />
      </div>
      {/* Caption */}
      <div className="px-3 pb-3">
        <p className="text-xs text-zinc-900">
          <span className="font-semibold">{accountName || 'yourbrand'}</span>{' '}
          <span className="whitespace-pre-wrap">{caption.slice(0, 125)}{caption.length > 125 ? '...' : ''}</span>
        </p>
        {hashtags && hashtags.length > 0 && (
          <p className="text-xs text-blue-500 mt-1">
            {hashtags.slice(0, 10).map((h) => h.startsWith('#') ? h : `#${h}`).join(' ')}
          </p>
        )}
      </div>
    </div>
  );
}

function TwitterPreview({ caption, accountName }: Omit<PreviewProps, 'platform'>) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden max-w-[320px]">
      <div className="p-3">
        <div className="flex gap-2.5">
          <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {(accountName || 'B')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-zinc-900">{accountName || 'Your Brand'}</span>
              <span className="text-xs text-zinc-400">@{(accountName || 'yourbrand').toLowerCase().replace(/\s/g, '')} · 1m</span>
            </div>
            <p className="text-sm text-zinc-900 mt-1 whitespace-pre-wrap">{caption.slice(0, 280)}</p>
          </div>
        </div>
        {/* Actions */}
        <div className="flex items-center justify-between mt-3 pl-12 pr-4">
          <MessageCircle className="w-4 h-4 text-zinc-400" />
          <Repeat2 className="w-4 h-4 text-zinc-400" />
          <Heart className="w-4 h-4 text-zinc-400" />
          <Share2 className="w-4 h-4 text-zinc-400" />
        </div>
      </div>
    </div>
  );
}

function LinkedInPreview({ caption, accountName }: Omit<PreviewProps, 'platform'>) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden max-w-[320px]">
      <div className="p-3">
        <div className="flex gap-2.5">
          <div className="w-10 h-10 rounded bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {(accountName || 'B')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-zinc-900 block">{accountName || 'Your Brand'}</span>
            <span className="text-[11px] text-zinc-400">1m · 🌐</span>
          </div>
        </div>
        <p className="text-xs text-zinc-800 mt-3 whitespace-pre-wrap leading-relaxed">
          {caption.slice(0, 210)}{caption.length > 210 ? '...\n...see more' : ''}
        </p>
        {/* Reactions */}
        <div className="flex items-center gap-1 mt-3 pt-2 border-t border-zinc-100">
          <span className="text-xs">👍</span>
          <span className="text-xs">💡</span>
          <span className="text-[11px] text-zinc-400 ml-1">12</span>
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100">
          <button className="flex items-center gap-1 text-xs text-zinc-500"><ThumbsUp className="w-3.5 h-3.5" /> Like</button>
          <button className="flex items-center gap-1 text-xs text-zinc-500"><MessageCircle className="w-3.5 h-3.5" /> Comment</button>
          <button className="flex items-center gap-1 text-xs text-zinc-500"><Repeat2 className="w-3.5 h-3.5" /> Repost</button>
          <button className="flex items-center gap-1 text-xs text-zinc-500"><Send className="w-3.5 h-3.5" /> Send</button>
        </div>
      </div>
    </div>
  );
}

function GenericPreview({ platform, caption, accountName }: PreviewProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden max-w-[320px] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Globe className="w-5 h-5 text-zinc-400" />
        <span className="text-sm font-semibold text-zinc-700 capitalize">{platform}</span>
      </div>
      <p className="text-xs text-zinc-800 whitespace-pre-wrap">{caption.slice(0, 300)}</p>
    </div>
  );
}

export function PlatformPreview({ platform, caption, hashtags, imageUrl, accountName }: PreviewProps) {
  switch (platform) {
    case 'instagram':
      return <InstagramPreview caption={caption} hashtags={hashtags} imageUrl={imageUrl} accountName={accountName} />;
    case 'twitter':
      return <TwitterPreview caption={caption} accountName={accountName} />;
    case 'linkedin':
      return <LinkedInPreview caption={caption} accountName={accountName} />;
    default:
      return <GenericPreview platform={platform} caption={caption} accountName={accountName} />;
  }
}
