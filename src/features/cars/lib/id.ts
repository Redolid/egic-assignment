/** Unique id for new products. Falls back when crypto.randomUUID is unavailable (non-secure http origins). */
export function createId(prefix = 'p'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
