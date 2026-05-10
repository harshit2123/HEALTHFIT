import crypto from 'crypto'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'

/**
 * Cryptographically random temp password. Replaces Math.random() — that's biased + predictable.
 * 12 chars from 56-char alphabet ≈ 70 bits entropy. Excludes lookalikes (0/O/1/l/I).
 */
export function generateTempPassword(length = 12): string {
  const bytes = crypto.randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length]
  }
  return out
}
