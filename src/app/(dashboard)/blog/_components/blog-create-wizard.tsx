'use client';

import { useState, useCallback } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import {
  Search,
  Wand2,
  Image,
  Globe,
  Check,
  ArrowLeft,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BlogData, ScrapedArticle, Step } from './types';
import { ResearchStep } from './research-step';
import { GenerateStep } from './generate-step';
import { ImagesStep } from './images-step';
import { PublishStep } from './publish-step';

interface BlogCreateWizardProps {
  onBack: () => void;
  isEdit?: boolean;
  initialBlog?: BlogData | null;
  initialPostId?: string | null;
  initialFeaturedImage?: string | null;
  initialStep?: Step;
}

export function BlogCreateWizard({
  onBack,
  isEdit = false,
  initialBlog = null,
  initialPostId = null,
  initialFeaturedImage = null,
  initialStep = 1,
}: BlogCreateWizardProps) {
  const { activeWorkspace } = useWorkspaceStore();

  const [step, setStep] = useState<Step>(initialStep);
  const [topic, setTopic] = useState('');
  const [articles, setArticles] = useState<ScrapedArticle[]>([]);
  const [blog, setBlog] = useState<BlogData | null>(initialBlog);
  const [featuredImage, setFeaturedImage] = useState<string | null>(initialFeaturedImage);
  const [editingPostId, setEditingPostId] = useState<string | null>(initialPostId);

  const handleBlogChange = useCallback((newBlog: BlogData) => {
    setBlog(newBlog);
  }, []);

  const steps = [
    { num: 1 as Step, label: 'Research', icon: Search },
    { num: 2 as Step, label: 'Generate', icon: Wand2 },
    { num: 3 as Step, label: 'Images', icon: Image },
    { num: 4 as Step, label: 'Publish', icon: Globe },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-zinc-400">
        <button onClick={onBack} className="hover:text-zinc-600 transition-colors">
          Blog
        </button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-zinc-700 font-medium">
          {isEdit ? 'Edit Post' : 'Create New Post'}
        </span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-amber-600 font-medium">
          {steps.find(s => s.num === step)?.label || 'Step ' + step}
        </span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">
              {isEdit ? 'Edit Post' : 'Create New Post'}
            </h1>
            <p className="text-sm text-zinc-500">
              {activeWorkspace?.name || 'Select a workspace'} — Step {step} of 4
            </p>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <div className="flex items-center gap-1">
          {steps.map(({ num, label, icon: Icon }, idx) => (
            <div key={num} className="flex items-center flex-1">
              <button
                onClick={() => setStep(num)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors w-full',
                  step === num
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : step > num
                    ? 'text-green-600 hover:bg-green-50'
                    : 'text-zinc-400 hover:bg-zinc-50'
                )}
              >
                <div className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                  step === num
                    ? 'bg-amber-400 text-zinc-900'
                    : step > num
                    ? 'bg-green-100 text-green-700'
                    : 'bg-zinc-100 text-zinc-400'
                )}>
                  {step > num ? <Check className="w-3 h-3" /> : num}
                </div>
                <Icon className="w-3.5 h-3.5 hidden sm:block" />
                <span className="hidden sm:inline">{label}</span>
              </button>
              {idx < 3 && <div className={cn('w-4 h-px mx-1', step > num ? 'bg-green-200' : 'bg-zinc-200')} />}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      {step === 1 && (
        <ResearchStep
          topic={topic}
          onTopicChange={setTopic}
          articles={articles}
          onArticlesChange={setArticles}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <GenerateStep
          topic={topic}
          articles={articles}
          blog={blog}
          onBlogChange={handleBlogChange}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <ImagesStep
          articles={articles}
          featuredImage={featuredImage}
          onFeaturedImageChange={setFeaturedImage}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      )}

      {step === 4 && blog && (
        <PublishStep
          blog={blog}
          featuredImage={featuredImage}
          editingPostId={editingPostId}
          onEditingPostIdChange={setEditingPostId}
          onBack={() => setStep(3)}
        />
      )}

      {step === 4 && !blog && (
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="text-center py-12">
            <BookOpen className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm text-zinc-400">No blog content yet</p>
            <p className="text-xs text-zinc-400 mt-1">Go back to Step 2 to generate your blog post first</p>
            <button
              onClick={() => setStep(2)}
              className="mt-4 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
            >
              Go to Generate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
