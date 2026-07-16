/**
 * Escapes characters in a string that have special meaning in regular expressions.
 * This prevents regex injection and MongoDB regex syntax errors.
 */
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
