'use client';

import { useMemo } from 'react';
import { ArrowLeft, Check, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScrapedArticle } from './types';

interface ImagesStepProps {
  articles: ScrapedArticle[];
  featuredImage: string | null;
  onFeaturedImageChange: (url: string | null) => void;
  onBack: () => void;
  onNext: () => void;
}

export function ImagesStep({
  articles,
  featuredImage,
  onFeaturedImageChange,
  onBack,
  onNext,
}: ImagesStepProps) {
  const allImages = useMemo(() => {
    const imgs: { url: string; alt: string }[] = [];
    for (const article of articles) {
      for (const img of article.images || []) {
        if (img.url && !imgs.some(i => i.url === img.url)) {
          imgs.push(img);
        }
      }
    }
    return imgs;
  }, [articles]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Image className="w-4 h-4 text-amber-600" />
          <label className="text-sm font-semibold text-zinc-900">Featured Image</label>
        </div>

        {allImages.length === 0 ? (
          <div className="text-center py-12">
            <Image className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm text-zinc-400">No images found from research</p>
            <p className="text-xs text-zinc-400 mt-1">Add URLs in Step 1 and research them to find images</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-zinc-500 mb-4">
              Select a featured image from your researched articles ({allImages.length} found)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => onFeaturedImageChange(img.url === featuredImage ? null : img.url)}
                  className={cn(
                    'relative aspect-video rounded-lg overflow-hidden border-2 transition-all group',
                    featuredImage === img.url
                      ? 'border-amber-400 ring-2 ring-amber-200'
                      : 'border-zinc-200 hover:border-zinc-300'
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.alt || 'Article image'}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  {featuredImage === img.url && (
                    <div className="absolute inset-0 bg-amber-400/20 flex items-center justify-center">
                      <Check className="w-6 h-6 text-amber-700" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Featured image preview */}
        {featuredImage && (
          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
            <p className="text-xs font-semibold text-amber-700 mb-2">FEATURED IMAGE PREVIEW</p>
            <div className="relative aspect-video max-w-sm rounded-lg overflow-hidden border border-amber-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={featuredImage} alt="Featured" className="w-full h-full object-cover" />
            </div>
            <button
              onClick={() => onFeaturedImageChange(null)}
              className="mt-2 text-xs text-red-500 hover:text-red-600"
            >
              Remove featured image
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2.5 border border-zinc-200 text-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-900 rounded-xl font-semibold text-sm hover:from-amber-400 hover:to-amber-300 transition-all shadow-sm"
        >
          Next: Publish
        </button>
      </div>
    </div>
  );
}
