import { APP_NAME } from '@socle/shared';
import { fromBase32, newTotpSecret, otpauthUrl, toBase32, totp, verifyTotp } from '@src/auth/application/totp.js';

// Vecteurs de la RFC 6238 (annexe B, SHA-1) : clé ASCII « 12345678901234567890 ».
const RFC_SECRET = toBase32(Buffer.from('12345678901234567890'));

describe('totp', () => {
  it('encodes and decodes base32 like authenticator apps', () => {
    expect(RFC_SECRET).toBe('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
    expect(fromBase32(RFC_SECRET).toString()).toBe('12345678901234567890');
    expect(fromBase32(`${RFC_SECRET}====`).toString()).toBe('12345678901234567890');
    expect(fromBase32(newTotpSecret())).toHaveLength(20);
  });

  it('matches the RFC 6238 test vectors', () => {
    expect(totp(RFC_SECRET, 59_000, 8)).toBe('94287082');
    expect(totp(RFC_SECRET, 1_111_111_109_000, 8)).toBe('07081804');
    expect(totp(RFC_SECRET, 1_234_567_890_000, 8)).toBe('89005924');
    expect(totp(RFC_SECRET, 2_000_000_000_000, 8)).toBe('69279037');
    expect(totp(RFC_SECRET, 59_000)).toBe('287082');
  });

  it('accepts the previous, current and next 30-second code only', () => {
    const now = 1_234_567_890_000;
    expect(verifyTotp(RFC_SECRET, totp(RFC_SECRET, now - 30_000), now)).toBe(true);
    expect(verifyTotp(RFC_SECRET, totp(RFC_SECRET, now), now)).toBe(true);
    expect(verifyTotp(RFC_SECRET, totp(RFC_SECRET, now + 30_000), now)).toBe(true);
    expect(verifyTotp(RFC_SECRET, totp(RFC_SECRET, now - 90_000), now)).toBe(false);
  });

  it('builds the otpauth URL read from the QR code', () => {
    const name = encodeURIComponent(APP_NAME);
    expect(otpauthUrl('ABC', 'lea@example.com')).toBe(`otpauth://totp/${name}%3Alea%40example.com?secret=ABC&issuer=${name}&algorithm=SHA1&digits=6&period=30`);
  });
});
