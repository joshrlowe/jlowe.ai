/**
 * Helper functions for social sharing
 */

export interface ShareUrls {
  twitter: string;
  linkedin: string;
  facebook: string;
  email: string;
}

/**
 * Generate social share URLs
 */
export function generateShareUrls(url: string, title: string, description: string): ShareUrls {
  const encodedUrl = encodeURIComponent(url || "");
  const encodedTitle = encodeURIComponent(title || "");
  const encodedDescription = encodeURIComponent(description || "");

  return {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%20${encodedUrl}`,
  };
}

/**
 * Copy URL to clipboard
 */
export async function copyToClipboard(
  url: string,
  fallbackUrl = ""
): Promise<{ success: boolean; error?: unknown }> {
  try {
    const urlToCopy = url || (typeof window !== "undefined" ? window.location.href : fallbackUrl);
    await navigator.clipboard.writeText(urlToCopy);
    return { success: true };
  } catch (error) {
    console.error("Failed to copy link:", error);
    return { success: false, error };
  }
}
