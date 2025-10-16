/**
 * URL transformation utilities for localhost compatibility
 */

/**
 * Transform URLs to work with localhost
 * Converts 10.0.2.2:54321 to 127.0.0.1:54321 for local development
 */
export function transformUrlForLocalhost(url: string | null | undefined): string {
  if (!url) return '';
  
  // Replace 10.0.2.2:54321 with 127.0.0.1:54321
  return url.replace(/10\.0\.2\.2:54321/g, '127.0.0.1:54321');
}

/**
 * Transform an array of URLs for localhost compatibility
 */
export function transformUrlsForLocalhost(urls: (string | null | undefined)[]): string[] {
  return urls.map(transformUrlForLocalhost).filter(Boolean);
}

/**
 * Transform any object property that contains URLs
 */
export function transformObjectUrls<T extends Record<string, unknown>>(obj: T): T {
  const transformed = { ...obj } as Record<string, unknown>;
  
  for (const [key, value] of Object.entries(transformed)) {
    if (typeof value === 'string' && (value.includes('10.0.2.2:54321') || value.includes('http'))) {
      transformed[key] = transformUrlForLocalhost(value);
    } else if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
      transformed[key] = transformUrlsForLocalhost(value as string[]);
    }
  }
  
  return transformed as T;
}