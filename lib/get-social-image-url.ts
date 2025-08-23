/**
 * Generates the URL for the social image API endpoint.
 * The actual image generation is handled by the API route.
 *
 * @param path The path of the page (e.g., '/', '/post/my-post').
 * @returns The URL to the social image generation API.
 */
export function getSocialImageUrl(path: string): string {
  try {
    // Use absolute URL for social media compatibility
    const domain = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'localhost:3000';
    const protocol = domain.includes('localhost') ? 'http' : 'https';
    
    // Always point to the on-demand generation API endpoint.
    // The `.tsx` extension is important because the API route now uses JSX.
    const apiUrl = `${protocol}://${domain}/api/generate-social-image.tsx?path=${encodeURIComponent(
      path
    )}`;
    return apiUrl;
  } catch (err) {
    console.error('[getSocialImageUrl] Error creating social image URL:', err);
    // Fallback to the root image URL if something goes wrong.
    const domain = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'localhost:3000';
    const protocol = domain.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${domain}/api/generate-social-image.tsx?path=%2F`;
  }
}

