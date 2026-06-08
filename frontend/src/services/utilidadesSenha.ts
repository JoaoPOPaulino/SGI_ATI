const ENCODER = new TextEncoder();
const SALT_PREFIX = 'sgi_';

export function generateSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...Array.from(arr)))
    .replace(/\+/g, '_')
    .replace(/\//g, '-')
    .replace(/=+$/, '');
}

export async function hashPassword(
  password: string,
  salt: string
): Promise<string> {
  const data = ENCODER.encode(`${SALT_PREFIX}${salt}:${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashPasswordWithNewSalt(
  password: string
): Promise<{ hash: string; salt: string }> {
  const salt = generateSalt();
  const hash = await hashPassword(password, salt);
  return { hash, salt };
}

export async function verifyPassword(
  password: string,
  salt: string,
  hash: string
): Promise<boolean> {
  const computedHash = await hashPassword(password, salt);
  return computedHash === hash;
}
