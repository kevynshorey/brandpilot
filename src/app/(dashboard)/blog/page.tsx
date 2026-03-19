'use client';

import { useState, useCallback } from 'react';
import type { ViewMode, BlogData } from './_components/types';
import { BlogListView } from './_components/blog-list-view';
import { BlogCreateWizard } from './_components/blog-create-wizard';

export default function BlogPage() {
  const [view, setView] = useState<ViewMode>('list');
  const [editState, setEditState] = useState<{
    blog: BlogData | null;
    postId: string | null;
    featuredImage: string | null;
  }>({ blog: null, postId: null, featuredImage: null });

  const startCreate = useCallback(() => {
    setEditState({ blog: null, postId: null, featuredImage: null });
    setView('create');
  }, []);

  const startEdit = useCallback((post: Record<string, unknown>) => {
    setEditState({
      blog: {
        title: (post.title as string) || '',
        slug: (post.slug as string) || '',
        metaDescription: (post.meta_description as string) || '',
        content: (post.content as string) || '',
        excerpt: (post.excerpt as string) || '',
        tags: (post.tags as string[]) || [],
      },
      postId: (post.id as string) || null,
      featuredImage: (post.featured_image as string) || null,
    });
    setView('edit');
  }, []);

  const backToList = useCallback(() => {
    setEditState({ blog: null, postId: null, featuredImage: null });
    setView('list');
  }, []);

  if (view === 'list') {
    return <BlogListView onCreateNew={startCreate} onEditPost={startEdit} />;
  }

  return (
    <BlogCreateWizard
      onBack={backToList}
      isEdit={view === 'edit'}
      initialBlog={editState.blog}
      initialPostId={editState.postId}
      initialFeaturedImage={editState.featuredImage}
      initialStep={view === 'edit' ? 4 : 1}
    />
  );
}
