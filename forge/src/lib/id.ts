export function uid(prefix = ''): string {
  const rnd = Math.random().toString(36).slice(2, 8)
  return `${prefix}${Date.now().toString(36)}${rnd}`
}

/** Jeton aléatoire pour sécuriser l'échange avec le Google Sheet. */
export function randomToken(len = 32): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const bytes = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  let out = ''
  for (const b of bytes) out += alphabet[b % alphabet.length]
  return out
}
