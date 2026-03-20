'use client';

import { useState } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { cn } from '@/lib/utils';
import {
  Upload,
  Image as ImageIcon,
  Video,
  Search,
  Grid3X3,
  List,
  Trash2,
  Download,
  X,
} from 'lucide-react';

type AssetType = 'all' | 'image' | 'video' | 'logo';

interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'logo';
  url: string;
  tags: string[];
  size: string;
  uploadedAt: string;
  dimensions?: string;
}

// Assets will be loaded from the API in a future release
// For now, show an empty state encouraging users to upload their own media

export default function AssetsPage() {
  const { activeWorkspace } = useWorkspaceStore();
  // TODO: Load assets from API when asset storage is implemented
  const assets: Asset[] = [];

  const [filter, setFilter] = useState<AssetType>('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredAssets = assets.filter((a) => {
    if (filter !== 'all' && a.type !== filter) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.tags.some((t) => t.includes(search.toLowerCase()))) return false;
    if (selectedTag && !a.tags.includes(selectedTag)) return false;
    return true;
  });

  // Collect all tags
  const allTags = [...new Set(assets.flatMap((a) => a.tags))].sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Asset Library</h1>
          <p className="text-sm text-zinc-500">{activeWorkspace?.name} — {assets.length} assets</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-zinc-900 rounded-xl text-sm font-semibold hover:bg-amber-400 transition-colors">
          <Upload className="w-4 h-4" /> Upload
        </button>
      </div>

      {/* Upload Drop Zone */}
      <div className="border-2 border-dashed border-zinc-300 rounded-xl p-6 text-center hover:border-amber-400 transition-colors cursor-pointer bg-white">
        <Upload className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
        <p className="text-sm text-zinc-500">Drag and drop files here, or click to browse</p>
        <p className="text-xs text-zinc-400 mt-1">Images, videos, logos — up to 50MB each</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-lg p-1">
          {(['all', 'image', 'video', 'logo'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                filter === type ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}s
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30"
          />
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {selectedTag && (
            <button onClick={() => setSelectedTag(null)} className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
              {selectedTag} <X className="w-3 h-3" />
            </button>
          )}
          {!selectedTag && allTags.slice(0, 6).map((tag) => (
            <button key={tag} onClick={() => setSelectedTag(tag)} className="px-2 py-1 bg-zinc-100 text-zinc-600 rounded-full text-xs hover:bg-zinc-200 transition-colors">
              {tag}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1 bg-white border border-zinc-200 rounded-lg p-1">
          <button onClick={() => setView('grid')} className={cn('p-1.5 rounded', view === 'grid' ? 'bg-zinc-100' : '')}>
            <Grid3X3 className="w-4 h-4 text-zinc-500" />
          </button>
          <button onClick={() => setView('list')} className={cn('p-1.5 rounded', view === 'list' ? 'bg-zinc-100' : '')}>
            <List className="w-4 h-4 text-zinc-500" />
          </button>
        </div>
      </div>

      {/* Asset Grid */}
      {view === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => (
            <div key={asset.id} className="bg-white rounded-xl border border-zinc-200 overflow-hidden group hover:shadow-md transition-shadow">
              <div className="aspect-square bg-zinc-100 flex items-center justify-center relative">
                {asset.type === 'video' ? (
                  <Video className="w-10 h-10 text-zinc-300" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-zinc-300" />
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button className="p-2 bg-white rounded-lg"><Download className="w-4 h-4 text-zinc-700" /></button>
                  <button className="p-2 bg-white rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-zinc-900 truncate">{asset.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-zinc-400">{asset.size}</span>
                  {asset.dimensions && <span className="text-[10px] text-zinc-400">{asset.dimensions}</span>}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {asset.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded text-[10px]">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100">
          {filteredAssets.map((asset) => (
            <div key={asset.id} className="flex items-center gap-4 p-4 hover:bg-zinc-50 transition-colors">
              <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center flex-shrink-0">
                {asset.type === 'video' ? <Video className="w-5 h-5 text-zinc-400" /> : <ImageIcon className="w-5 h-5 text-zinc-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">{asset.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-zinc-400">{asset.size}</span>
                  <span className="text-xs text-zinc-400">{asset.uploadedAt}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {asset.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded text-xs">{tag}</span>
                ))}
              </div>
              <button className="p-2 rounded-lg hover:bg-zinc-100"><Trash2 className="w-4 h-4 text-zinc-400" /></button>
            </div>
          ))}
        </div>
      )}

      {filteredAssets.length === 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
          <ImageIcon className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-500 mb-2">No assets found</p>
          <p className="text-xs text-zinc-400">Upload real photos of your products and properties for authentic social media posts</p>
        </div>
      )}

      {/* Pro tip */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800">
          <strong>Pro tip:</strong> Upload real product photos and property images here. When creating posts, BrandPilot will use these authentic images instead of AI-generated fakes — resulting in more professional, trustworthy content.
        </p>
      </div>
    </div>
  );
}
