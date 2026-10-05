import { APP_NAME } from '@socle/shared';
import { createHmac, randomBytes } from 'node:crypto';

// Codes à usage limité dans le temps (TOTP, RFC 6238) des applications d'authentification : HMAC-SHA1, 6 chiffres, 30 s.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP = 30;

// Base32 (RFC 4648, sans « = ») : format des clés affichées et des QR codes.
export function toBase32(bytes: Buffer): string {
  let bits = '';
  for (const byte of bytes) bits += byte.toString(2).padStart(8, '0');
  return (bits.match(/.{1,5}/g) ?? []).map((chunk) => ALPHABET[parseInt(chunk.padEnd(5, '0'), 2)]).join('');
}

export function fromBase32(text: string): Buffer {
  const bits = text.replace(/=+$/, '').toUpperCase().split('').map((c) => ALPHABET.indexOf(c).toString(2).padStart(5, '0')).join('');
  return Buffer.from((bits.match(/.{8}/g) ?? []).map((byte) => parseInt(byte, 2)));
}

export const newTotpSecret = () => toBase32(randomBytes(20));

export function totp(secret: string, at = Date.now(), digits = 6): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 1000 / STEP)));
  const hmac = createHmac('sha1', fromBase32(secret)).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const value = hmac.readUInt32BE(offset) & 0x7fffffff;
  return String(value % 10 ** digits).padStart(digits, '0');
}

// Code accepté sur la période courante, la précédente et la suivante (décalage d'horloge du téléphone).
export const verifyTotp = (secret: string, code: string, at = Date.now()) => [-1, 0, 1].some((drift) => totp(secret, at + drift * STEP * 1000) === code);

export const otpauthUrl = (secret: string, email: string) =>
  `otpauth://totp/${encodeURIComponent(`${APP_NAME}:${email}`)}?secret=${secret}&issuer=${encodeURIComponent(APP_NAME)}&algorithm=SHA1&digits=6&period=${STEP}`;
