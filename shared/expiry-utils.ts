// Utility functions for handling video link expiry
export interface ExpiryPreset {
  id: string;
  label: string;
  duration: string;
}

export const EXPIRY_PRESETS: ExpiryPreset[] = [
  { id: "7d", label: "7 days (recommended)", duration: "7d" },
  { id: "30d", label: "30 days", duration: "30d" },
  { id: "24h", label: "24 hours (short term)", duration: "24h" },
  { id: "custom", label: "Custom date", duration: "custom" }
];

/**
 * Calculate expiry date from duration preset
 * @param duration - Duration string like "24h", "7d", "30d", or "custom"
 * @param customDate - Custom date for "custom" duration
 * @returns Date object for expiry
 */
export function calculateExpiryDate(duration: string, customDate?: Date): Date {
  const now = new Date();
  
  switch (duration) {
    case "24h":
      return new Date(now.getTime() + (24 * 60 * 60 * 1000));
    case "7d":
      return new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    case "30d":
      return new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    case "custom":
      return customDate || new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    default:
      // Default to 7 days if unknown duration
      return new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
  }
}

/**
 * Check if a video is expired
 * @param expiresAt - Expiry timestamp
 * @returns boolean indicating if expired
 */
export function isVideoExpired(expiresAt: Date | string | null): boolean {
  if (!expiresAt) return false;
  const expiryDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return expiryDate <= new Date();
}

/**
 * Check if a video is expiring soon (within 24 hours)
 * @param expiresAt - Expiry timestamp
 * @returns boolean indicating if expiring soon
 */
export function isVideoExpiringSoon(expiresAt: Date | string | null): boolean {
  if (!expiresAt) return false;
  const expiryDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  const now = new Date();
  const twentyFourHoursFromNow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
  return expiryDate <= twentyFourHoursFromNow && expiryDate > now;
}

/**
 * Get human-readable time until expiry
 * @param expiresAt - Expiry timestamp
 * @returns string description of time until expiry
 */
export function getTimeUntilExpiry(expiresAt: Date | string | null): string {
  if (!expiresAt) return "No expiry set";
  
  const expiryDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  
  if (diffMs <= 0) return "Expired";
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffDays > 0) {
    return diffDays === 1 ? "1 day" : `${diffDays} days`;
  } else if (diffHours > 0) {
    return diffHours === 1 ? "1 hour" : `${diffHours} hours`;
  } else {
    return diffMinutes === 1 ? "1 minute" : `${diffMinutes} minutes`;
  }
}

/**
 * Format expiry date for display
 * @param expiresAt - Expiry timestamp
 * @returns formatted date string
 */
export function formatExpiryDate(expiresAt: Date | string | null): string {
  if (!expiresAt) return "No expiry set";
  
  const expiryDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return expiryDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}