/**
 * Generate a cryptographically secure alphanumeric secret code.
 * Used for student portal access credentials.
 * 
 * Format: Uppercase letters + digits, e.g., "CST3A7XK"
 * Default length: 8 characters
 */
export function generateSecretCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded O, 0, 1, I to avoid confusion
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

/**
 * Validate a secret code format.
 * Must be 6-12 alphanumeric characters.
 */
export function isValidSecretCode(code: string): boolean {
  return /^[A-Z0-9]{6,12}$/i.test(code);
}
