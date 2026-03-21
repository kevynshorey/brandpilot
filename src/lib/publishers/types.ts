// ---------------------------------------------------------------------------
// Social Publisher Abstraction
// ---------------------------------------------------------------------------
// Every publishing backend (Ayrshare, Graph API, LinkedIn API, Make.com)
// implements this interface. The registry picks the best available publisher
// for each platform and falls back through the chain.

export interface PublishRequest {
  post: {
    id: string;
    caption: string;
    hashtags: string[];
    content_type: string;
    media: Array<{
      url: string;
      type: 'image' | 'video' | 'gif';
      alt_text?: string;
    }>;
  };
  platform: string;
  account: {
    id: string;
    platform_account_id: string;
    account_name: string;
    access_token?: string;
    refresh_token?: string;
    metadata?: Record<string, unknown>;
  };
}

export interface PublishResult {
  success: boolean;
  platform_post_id?: string;
  error?: string;
  publisher: PublisherType;
}

export type PublisherType = 'ayrshare' | 'graph_api' | 'linkedin_api' | 'make';

export interface SocialPublisher {
  readonly type: PublisherType;

  /** Attempt to publish a post to a platform. */
  publish(request: PublishRequest): Promise<PublishResult>;

  /** Check if this publisher can handle the given platform. */
  supports(platform: string): boolean;

  /** Check if this publisher is configured (env vars, API keys, etc.). */
  isConfigured(): boolean;
}
