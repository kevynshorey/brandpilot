import type { SocialPublisher, PublishRequest, PublishResult } from './types';

const AYRSHARE_API_URL = 'https://app.ayrshare.com/api/post';

/** Maps BrandPilot platform names to Ayrshare platform identifiers */
const PLATFORM_MAP: Record<string, string> = {
  instagram: 'instagram',
  facebook: 'facebook',
  twitter: 'twitter',
  linkedin: 'linkedin',
  pinterest: 'pinterest',
  tiktok: 'tiktok',
};

/**
 * Ayrshare Publisher — publishes to social platforms via the Ayrshare API.
 * Supports all 6 platforms. Requires AYRSHARE_API_KEY env var.
 *
 * @see https://docs.ayrshare.com/rest-api/endpoints/post
 */
export class AyrsharePublisher implements SocialPublisher {
  readonly type = 'ayrshare' as const;

  supports(platform: string): boolean {
    return platform in PLATFORM_MAP;
  }

  isConfigured(): boolean {
    return !!process.env.AYRSHARE_API_KEY;
  }

  async publish(request: PublishRequest): Promise<PublishResult> {
    const apiKey = process.env.AYRSHARE_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'AYRSHARE_API_KEY not configured', publisher: 'ayrshare' };
    }

    const ayrPlatform = PLATFORM_MAP[request.platform];
    if (!ayrPlatform) {
      return { success: false, error: `Unsupported platform: ${request.platform}`, publisher: 'ayrshare' };
    }

    try {
      // Build the caption with hashtags
      const hashtagStr = request.post.hashtags.length > 0
        ? '\n\n' + request.post.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')
        : '';
      const fullCaption = request.post.caption + hashtagStr;

      // Build request body
      const body: Record<string, unknown> = {
        post: fullCaption,
        platforms: [ayrPlatform],
      };

      // Add media URLs if present
      if (request.post.media.length > 0) {
        body.mediaUrls = request.post.media.map((m) => m.url);

        // Pinterest requires a link
        if (request.platform === 'pinterest') {
          body.pinterestOptions = {
            title: request.post.caption.slice(0, 100),
          };
        }

        // TikTok uses video
        if (request.platform === 'tiktok' && request.post.media[0]?.type === 'video') {
          body.isVideo = true;
        }
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);

      const res = await fetch(AYRSHARE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const data = await res.json().catch(() => ({}) as Record<string, unknown>);

      if (!res.ok) {
        const errMsg = (data as Record<string, unknown>).message || (data as Record<string, unknown>).error || `Ayrshare returned ${res.status}`;
        return { success: false, error: String(errMsg), publisher: 'ayrshare' };
      }

      // Ayrshare returns postIds per platform
      const postIds = (data as Record<string, unknown>).postIds as Record<string, string> | undefined;
      const platformPostId = postIds?.[ayrPlatform] || (data as Record<string, unknown>).id as string | undefined;

      return {
        success: true,
        platform_post_id: platformPostId,
        publisher: 'ayrshare',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message.includes('abort')) {
        return { success: false, error: 'Ayrshare request timed out after 30s', publisher: 'ayrshare' };
      }
      return { success: false, error: `Ayrshare publish failed: ${message}`, publisher: 'ayrshare' };
    }
  }
}
