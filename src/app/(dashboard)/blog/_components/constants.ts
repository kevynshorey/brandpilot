export const LENGTH_OPTIONS = [
  { id: 'short', label: 'Short', desc: '400-600 words' },
  { id: 'medium', label: 'Medium', desc: '700-1000 words' },
  { id: 'long', label: 'Long', desc: '1200-1800 words' },
] as const;

export const STATUS_OPTIONS = [
  { id: 'all', label: 'All Posts' },
  { id: 'draft', label: 'Drafts' },
  { id: 'published', label: 'Published' },
  { id: 'archived', label: 'Archived' },
] as const;
