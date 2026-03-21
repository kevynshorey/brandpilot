import type { SocialPublisher, PublishRequest, PublishResult } from './types';

/**
 * Make.com Publisher — wraps the existing Make.com webhook integration.
 * Acts as the fallback publisher when no direct API is available.
 */
export class MakePublisher implements SocialPublisher {
  readonly type = 'make' as const;

  supports(): boolean {
    // Make.com can theoretically publish to any platform
    return true;
  }

  isConfigured(): boolean {
    return !!process.env.MAKE_PUBLISH_WEBHOOK_URL;
  }

  async publish(request: PublishRequest): Promise<PublishResult> {
    const webhookUrl = process.env.MAKE_PUBLISH_WEBHOOK_URL;
    if (!webhookUrl) {
      return { success: false, error: 'MAKE_PUBLISH_WEBHOOK_URL not configured', publisher: 'make' };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'publish_post',
          post_id: request.post.id,
          platform: request.platform,
          caption: request.post.caption,
          hashtags: request.post.hashtags,
          media: request.post.media,
          account: {
            id: request.account.id,
            platform_account_id: request.account.platform_account_id,
            account_name: request.account.account_name,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error');
        return { success: false, error: `Make.com webhook returned ${res.status}: ${errText}`, publisher: 'make' };
      }

      const data = await res.json().catch(() => ({}));
      return {
        success: true,
        platform_post_id: data.platform_post_id || data.postId || undefined,
        publisher: 'make',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message.includes('abort')) {
        return { success: false, error: 'Make.com webhook timed out after 30s', publisher: 'make' };
      }
      return { success: false, error: `Make.com publish failed: ${message}`, publisher: 'make' };
    }
  }
}
