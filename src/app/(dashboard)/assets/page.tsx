'use client';

import { useState, useCallback } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAssets, useUploadAsset, useDeleteAsset } from '@/hooks/use-assets';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Upload,
  Image as ImageIcon,
  Video,
  Search,
  Grid3X3,
  List,
  Trash2,
  X,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';

type AssetFilter = 'all' | 'image' | 'video';

export default function AssetsPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { data: assets = [], isLoading } = useAssets();
  const uploadAsset = useUploadAsset();
  const deleteAsset = useDeleteAsset();

  const [filter, setFilter] = useState<AssetFilter>('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [dragOver, setDragOver] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredAssets = assets.filter(a => {
    if (filter !== 'all' && a.file_type !== filter) return false;
    if (search && !a.file_name.toLowerCase().includes(search.toLowerCase()) && !a.tags?.some(t => t.includes(search.toLowerCase()))) return false;
    return true;
  });

  const allTags = [...new Set(assets.flatMap(a => a.tags || []))].sort();

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    for (const file of fileArr) {
      try {
        await uploadAsset.mutateAsync({ file });
        toast.success(`Uploaded ${file.name}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Failed to upload ${file.name}`);
      }
    }
  }, [uploadAsset]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteAsset.mutateAsync(id);
      toast.success('Asset deleted');
    } catch {
      toast.error('Failed to delete asset');
    }
  };

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('URL copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Asset Library</h1>
          <p className="text-sm text-zinc-500">{activeWorkspace?.name} — {assets.length} asset{assets.length !== 1 ? 's' : ''}</p>
        </div>
        <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-zinc-900 rounded-xl text-sm font-semibold hover:bg-amber-400 transition-colors cursor-pointer">
          <Upload className="w-4 h-4" />
          Upload
          <input
            type="file"
            multiple
            accept="image/*,video/mp4,video/quicktime"
            className="hidden"
            onChange={e => e.target.files && handleFiles(e.target.files)}
          />
        </label>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer bg-white',
          dragOver ? 'border-amber-400 bg-amber-50' : 'border-zinc-300 hover:border-amber-400',
          uploadAsset.isPending && 'opacity-50 pointer-events-none'
        )}
        onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
      >
        {uploadAsset.isPending ? (
          <>
            <Loader2 className="w-8 h-8 text-amber-500 mx-auto mb-2 animate-spin" />
            <p className="text-sm text-zinc-500">Uploading...</p>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">Drag and drop files here, or click to browse</p>
            <p className="text-xs text-zinc-400 mt-1">Images, videos — up to 50MB each</p>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-lg p-1">
          {(['all', 'image', 'video'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                filter === type ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              {type === 'all' ? 'All' : type === 'image' ? 'Images' : 'Videos'}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {allTags.slice(0, 6).map(tag => (
              <button
                key={tag}
                onClick={() => setSearch(tag)}
                className="px-2 py-1 bg-zinc-100 text-zinc-600 rounded-full text-xs hover:bg-zinc-200 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-1 bg-white border border-zinc-200 rounded-lg p-1">
          <button onClick={() => setView('grid')} className={cn('p-1.5 rounded', view === 'grid' ? 'bg-zinc-100' : '')}>
            <Grid3X3 className="w-4 h-4 text-zinc-500" />
          </button>
          <button onClick={() => setView('list')} className={cn('p-1.5 rounded', view === 'list' ? 'bg-zinc-100' : '')}>
            <List className="w-4 h-4 text-zinc-500" />
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-zinc-300 animate-spin" />
        </div>
      )}

      {/* Grid View */}
      {!isLoading && view === 'grid' && filteredAssets.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.map(asset => (
            <div key={asset.id} className="bg-white rounded-xl border border-zinc-200 overflow-hidden group hover:shadow-md transition-shadow">
              <div className="aspect-square bg-zinc-100 relative overflow-hidden">
                {asset.file_type === 'video' ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-10 h-10 text-zinc-300" />
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.public_url} alt={asset.file_name} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => copyUrl(asset.public_url, asset.id)}
                    className="p-2 bg-white rounded-lg hover:bg-zinc-100 transition-colors"
                    title="Copy URL"
                  >
                    {copiedId === asset.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-zinc-700" />}
                  </button>
                  <button
                    onClick={() => handleDelete(asset.id, asset.file_name)}
                    className="p-2 bg-white rounded-lg hover:bg-zinc-100 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-zinc-900 truncate">{asset.file_name}</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">{formatSize(asset.file_size)}</p>
                {asset.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {asset.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded text-[10px]">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {!isLoading && view === 'list' && filteredAssets.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100">
          {filteredAssets.map(asset => (
            <div key={asset.id} className="flex items-center gap-4 p-4 hover:bg-zinc-50 transition-colors">
              <div className="w-12 h-12 bg-zinc-100 rounded-lg flex-shrink-0 overflow-hidden">
                {asset.file_type === 'video' ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-5 h-5 text-zinc-400" />
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.public_url} alt={asset.file_name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">{asset.file_name}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{formatSize(asset.file_size)}</p>
              </div>
              {asset.tags?.length > 0 && (
                <div className="hidden sm:flex items-center gap-1.5">
                  {asset.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded text-xs">{tag}</span>
                  ))}
                </div>
              )}
              <button
                onClick={() => copyUrl(asset.public_url, asset.id)}
                className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
                title="Copy URL"
              >
                {copiedId === asset.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-zinc-400" />}
              </button>
              <button
                onClick={() => handleDelete(asset.id, asset.file_name)}
                className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-zinc-400 hover:text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && filteredAssets.length === 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
          <ImageIcon className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-500 mb-2">{search ? 'No assets match your search' : 'No assets uploaded yet'}</p>
          <p className="text-xs text-zinc-400">Upload real photos of your products for authentic social media posts</p>
        </div>
      )}

      {/* Pro tip */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800">
          <strong>Pro tip:</strong> Upload real product photos and property images. BrandPilot will use authentic images in your posts — resulting in more professional, trustworthy content.
        </p>
      </div>
    </div>
  );
}
