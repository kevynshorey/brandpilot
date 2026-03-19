export interface BlogData {
  title: string;
  slug: string;
  metaDescription: string;
  content: string;
  excerpt: string;
  tags: string[];
}

export interface IgPreviewData {
  caption: string;
  hashtags: string[];
  hookLine: string;
  cardText: string;
  cardSubtext: string;
}

export interface ScrapedArticle {
  url: string;
  title: string;
  description: string;
  content: string;
  images: { url: string; alt: string }[];
  selected: boolean;
}

export type ViewMode = 'list' | 'create' | 'edit';
export type Step = 1 | 2 | 3 | 4;
