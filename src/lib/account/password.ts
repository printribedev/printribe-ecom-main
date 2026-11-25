import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>

/** One-way password hash: scrypt with a random salt. Stored as "scrypt$salt$hash". The password itself is never stored. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const hash = await scrypt(password, salt, 64)
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [kind, saltB64, hashB64] = stored.split('$')
  if (kind !== 'scrypt' || !saltB64 || !hashB64) return false
  const expected = Buffer.from(hashB64, 'base64')
  const actual = await scrypt(password, Buffer.from(saltB64, 'base64'), expected.length)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

const COMMON = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890', 'qwertyuiop', 'iloveyou', 'admin123',
  'welcome1', 'welcome123', 'abc12345', 'letmein1', 'printribe', 'printribe123', 'india123', 'bangalore',
])

/** Returns a plain-language message when the password is not good enough, otherwise null. */
export function validatePassword(password: string, email = ''): string | null {
  if (password.length < 8) return 'Use at least 8 characters.'
  if (password.length > 100) return 'Please use fewer than 100 characters.'
  const lower = password.toLowerCase()
  if (COMMON.has(lower)) return 'This password is too common. Please choose another.'
  if (email && lower === email.toLowerCase()) return 'Your password cannot be your email address.'
  if (/^(.)\1+$/.test(password)) return 'Please choose a less repetitive password.'
  return null
}
