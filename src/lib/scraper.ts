import * as cheerio from 'cheerio';

// --- Types ---

export interface ScrapedImage {
  url: string;
  alt: string;
}

export interface ScrapedData {
  title: string;
  description: string;
  images: ScrapedImage[];
  ogImage: string | null;
  favicon: string | null;
}

// --- URL helpers ---

const TRACKING_PARAMS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'fbclid', 'gclid', 'gclsrc', 'dclid', 'msclkid',
  'mc_cid', 'mc_eid', 'ref', 'referrer',
  '_ga', '_gl', 'yclid', 'twclid', 'ttclid',
]);

export function stripTrackingParams(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    for (const param of [...parsed.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(param.toLowerCase())) {
        parsed.searchParams.delete(param);
      }
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

export function resolveUrl(src: string, baseUrl: string): string | null {
  try {
    const resolved = new URL(src, baseUrl).toString();
    return stripTrackingParams(resolved);
  } catch {
    return null;
  }
}

export function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// --- Fetch with timeout ---

export async function fetchWithTimeout(
  url: string,
  timeoutMs: number = 10_000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; BrandPilotBot/1.0; +https://brandpilot.app)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// --- Image filtering ---

const SKIP_PATTERNS = [
  /1x1/,
  /spacer/i,
  /pixel/i,
  /tracking/i,
  /\.gif$/i,       // typically tracking pixels
  /data:image/i,   // data URIs are inline, not useful
  /facebook\.com\/tr/i,
  /google-analytics/i,
  /doubleclick/i,
];

function shouldSkipImage(url: string): boolean {
  return SKIP_PATTERNS.some((p) => p.test(url));
}

// --- Core scraper ---

export async function scrapeUrl(targetUrl: string): Promise<ScrapedData> {
  const response = await fetchWithTimeout(targetUrl, 10_000);

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
    throw new Error('URL did not return HTML content');
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const baseUrl = targetUrl;

  // --- Open Graph data ---
  const ogTitle = $('meta[property="og:title"]').attr('content')?.trim() ?? null;
  const ogDescription =
    $('meta[property="og:description"]').attr('content')?.trim() ?? null;
  const ogImageRaw = $('meta[property="og:image"]').attr('content') ?? null;
  const ogImage = ogImageRaw ? resolveUrl(ogImageRaw, baseUrl) : null;

  // --- Title ---
  const title =
    ogTitle ??
    $('title').first().text().trim() ??
    $('h1').first().text().trim() ??
    '';

  // --- Description ---
  const description =
    ogDescription ??
    $('meta[name="description"]').attr('content')?.trim() ??
    '';

  // --- Favicon ---
  const faviconHref =
    $('link[rel="icon"]').attr('href') ??
    $('link[rel="shortcut icon"]').attr('href') ??
    $('link[rel="apple-touch-icon"]').attr('href') ??
    '/favicon.ico';
  const favicon = resolveUrl(faviconHref, baseUrl);

  // --- Images (deduplicated) ---
  const seen = new Set<string>();
  const images: ScrapedImage[] = [];

  // Add OG image first if present
  if (ogImage && !shouldSkipImage(ogImage)) {
    seen.add(ogImage);
    images.push({
      url: ogImage,
      alt: ogTitle ?? '',
    });
  }

  $('img').each((_, el) => {
    const src =
      $(el).attr('src') ??
      $(el).attr('data-src') ??
      $(el).attr('data-lazy-src') ??
      null;

    if (!src) return;

    const resolved = resolveUrl(src, baseUrl);
    if (!resolved) return;
    if (seen.has(resolved)) return;
    if (shouldSkipImage(resolved)) return;

    seen.add(resolved);
    images.push({
      url: resolved,
      alt: $(el).attr('alt')?.trim() ?? '',
    });
  });

  // Also check <source> inside <picture> elements
  $('picture source').each((_, el) => {
    const srcset = $(el).attr('srcset');
    if (!srcset) return;

    // Take the first URL from srcset
    const firstEntry = srcset.split(',')[0]?.trim().split(/\s+/)[0];
    if (!firstEntry) return;

    const resolved = resolveUrl(firstEntry, baseUrl);
    if (!resolved) return;
    if (seen.has(resolved)) return;
    if (shouldSkipImage(resolved)) return;

    seen.add(resolved);
    images.push({ url: resolved, alt: '' });
  });

  return {
    title,
    description,
    images,
    ogImage,
    favicon,
  };
}

// --- Article scraping (extends scrapeUrl with body text extraction) ---

export interface ScrapedArticle {
  url: string;
  title: string;
  description: string;
  text: string;
  images: ScrapedImage[];
  ogImage: string | null;
}

export async function scrapeArticle(
  targetUrl: string,
  maxTextLen = 5000,
): Promise<ScrapedArticle> {
  if (!isAllowedUrl(targetUrl)) {
    throw new Error('URL scheme not allowed');
  }

  const res = await fetchWithTimeout(targetUrl);
  const html = await res.text();
  const $ = cheerio.load(html);

  // Remove noise
  $('script, style, nav, footer, header, aside, iframe, noscript').remove();

  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('title').text().trim() ||
    '';

  const description =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    '';

  const ogImage = $('meta[property="og:image"]').attr('content') || null;

  // Extract article body text
  let textContainer = $('article');
  if (!textContainer.length) textContainer = $('main');
  if (!textContainer.length) textContainer = $('[role="main"]');
  if (!textContainer.length) textContainer = $('body');

  const text = textContainer
    .find('p, h1, h2, h3, h4, h5, h6, li, blockquote')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((t) => t.length > 20)
    .join('\n\n')
    .slice(0, maxTextLen);

  // Extract images
  const images: ScrapedImage[] = [];
  const seenUrls = new Set<string>();

  textContainer.find('img').each((_, el) => {
    const src =
      $(el).attr('src') ||
      $(el).attr('data-src') ||
      $(el).attr('data-lazy-src') ||
      '';
    const resolved = resolveUrl(src, targetUrl);
    if (!resolved || shouldSkipImage(resolved) || seenUrls.has(resolved)) return;
    seenUrls.add(resolved);
    images.push({
      url: resolved,
      alt: $(el).attr('alt')?.trim() || '',
    });
  });

  return { url: targetUrl, title, description, text, images, ogImage };
}
