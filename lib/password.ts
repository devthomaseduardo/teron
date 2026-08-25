import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const PREFIX = 'scrypt$'

export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(plain, salt, 64).toString('hex')
  return `${PREFIX}${salt}$${hash}`
}

/** Aceita hash scrypt ou texto plano (demo). */
export function verifyPassword(plain: string, stored: string): boolean {
  if (!plain || !stored) return false

  if (stored.startsWith(PREFIX)) {
    const parts = stored.split('$')
    const salt = parts[1]
    const hash = parts[2]
    if (!salt || !hash) return false
    const candidate = scryptSync(plain, salt, 64)
    const expected = Buffer.from(hash, 'hex')
    if (candidate.length !== expected.length) return false
    return timingSafeEqual(candidate, expected)
  }

  // Comparacao legada (demo em texto plano)
  try {
    const a = Buffer.from(plain)
    const b = Buffer.from(stored)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return plain === stored
  }
}
