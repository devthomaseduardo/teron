import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const PREFIX = 'scrypt$'

/** Gera hash scrypt (sem dependencia extra). Formato: scrypt$salt$hex */
export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(plain, salt, 64).toString('hex')
  return `${PREFIX}${salt}$${hash}`
}

/** Aceita hash scrypt ou texto plano legado (demo). */
export function verifyPassword(plain: string, stored: string): boolean {
  if (!stored) return false

  if (stored.startsWith(PREFIX)) {
    const [, salt, hash] = stored.split('$')
    if (!salt || !hash) return false
    const candidate = scryptSync(plain, salt, 64)
    const expected = Buffer.from(hash, 'hex')
    if (candidate.length !== expected.length) return false
    return timingSafeEqual(candidate, expected)
  }

  // Legado: comparacao em tempo quase constante para senhas demo curtas
  const a = Buffer.from(plain)
  const b = Buffer.from(stored)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function isHashed(stored: string): boolean {
  return stored.startsWith(PREFIX)
}
