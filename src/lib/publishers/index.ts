import type { SocialPublisher, PublishRequest, PublishResult } from './types';
import { AyrsharePublisher } from './ayrshare-publisher';
import { MakePublisher } from './make-publisher';

// ---------------------------------------------------------------------------
// Publisher Registry
// ---------------------------------------------------------------------------
// Publishers are tried in priority order. The first configured publisher
// that supports the target platform wins. Make.com is always the fallback.
// ---------------------------------------------------------------------------

const publishers: SocialPublisher[] = [
  // Priority 1: Ayrshare (direct API for all platforms)
  new AyrsharePublisher(),
  // Priority 2: Make.com (fallback for everything)
  new MakePublisher(),
];

/**
 * Find the best available publisher for a given platform.
 * Returns null if no publisher is configured for this platform.
 */
export function getPublisher(platform: string): SocialPublisher | null {
  for (const publisher of publishers) {
    if (publisher.isConfigured() && publisher.supports(platform)) {
      return publisher;
    }
  }
  return null;
}

/**
 * Publish a post to all target platforms using the best available publisher
 * for each platform. Returns results per platform.
 */
export async function publishToAllPlatforms(
  post: PublishRequest['post'],
  platforms: string[],
  accountsByPlatform: Map<string, PublishRequest['account']>,
): Promise<Record<string, PublishResult>> {
  const results: Record<string, PublishResult> = {};

  // Publish to each platform concurrently (capped at 5)
  const tasks = platforms.map(async (platform) => {
    const account = accountsByPlatform.get(platform);
    if (!account) {
      results[platform] = {
        success: false,
        error: `No connected account for ${platform}`,
        publisher: 'make', // default
      };
      return;
    }

    const publisher = getPublisher(platform);
    if (!publisher) {
      results[platform] = {
        success: false,
        error: `No publisher configured for ${platform}. Set AYRSHARE_API_KEY or MAKE_PUBLISH_WEBHOOK_URL.`,
        publisher: 'make',
      };
      return;
    }

    try {
      results[platform] = await publisher.publish({ post, platform, account });
    } catch (err) {
      results[platform] = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown publishing error',
        publisher: publisher.type,
      };
    }
  });

  // Run up to 5 concurrent publishes
  const batches = [];
  for (let i = 0; i < tasks.length; i += 5) {
    batches.push(tasks.slice(i, i + 5));
  }
  for (const batch of batches) {
    await Promise.all(batch);
  }

  return results;
}

// Re-export types
export type { SocialPublisher, PublishRequest, PublishResult, PublisherType } from './types';
