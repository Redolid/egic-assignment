/**
 * Validators take the raw string typed by the user (inputs are strings) and
 * return either the parsed value or an error message — never both.
 */
export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string }

const MAX_QUANTITY = 1_000_000
const MAX_PRICE = 100_000_000

export function validateName(raw: string): ValidationResult<string> {
  const value = raw.trim()
  if (!value) return { ok: false, error: 'Name is required' }
  if (value.length > 80) return { ok: false, error: 'Name must be 80 characters or less' }
  return { ok: true, value }
}

export function validateQuantity(raw: string): ValidationResult<number> {
  const text = raw.trim()
  if (!text) return { ok: false, error: 'Quantity is required' }
  const value = Number(text)
  if (!Number.isFinite(value)) return { ok: false, error: 'Quantity must be a number' }
  if (value <= 0) return { ok: false, error: 'Quantity must be positive' }
  if (!/^\d+$/.test(text)) return { ok: false, error: 'Quantity must be a whole number' }
  if (value > MAX_QUANTITY) return { ok: false, error: 'Quantity is too large' }
  return { ok: true, value }
}

export function validatePrice(raw: string): ValidationResult<number> {
  const text = raw.trim()
  if (!text) return { ok: false, error: 'Price is required' }
  const value = Number(text)
  if (!Number.isFinite(value)) return { ok: false, error: 'Price must be a number' }
  if (value <= 0) return { ok: false, error: 'Price must be positive' }
  // Reject exotic forms Number() accepts ("1e3", "0x10") and more than 2 decimals.
  if (!/^\d*\.?\d*$/.test(text)) return { ok: false, error: 'Price must be a number' }
  if (!/^\d*(\.\d{0,2})?$/.test(text)) return { ok: false, error: 'Use at most 2 decimals' }
  if (value > MAX_PRICE) return { ok: false, error: 'Price is too large' }
  return { ok: true, value }
}
