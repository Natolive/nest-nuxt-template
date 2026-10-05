import { TwoFactorChallenges } from '@src/auth/application/two-factor-challenges.js';
import { TwoFactorChallengeExpiredError } from '@src/auth/domain/errors/two-factor-challenge-expired.error.js';

describe('TwoFactorChallenges', () => {
  it('gives back the pending login until resolved', () => {
    const challenges = new TwoFactorChallenges();
    const token = challenges.issue('lea', true, 0);
    expect(challenges.attempt(token, 1000)).toMatchObject({ userId: 'lea', remember: true, attempts: 1 });
    challenges.resolve(token);
    expect(() => challenges.attempt(token, 1000)).toThrow(TwoFactorChallengeExpiredError);
  });

  it('expires after 5 minutes and forgets old ones', () => {
    const challenges = new TwoFactorChallenges();
    const old = challenges.issue('lea', false, 0);
    expect(() => challenges.attempt(old, 5 * 60 * 1000)).toThrow(TwoFactorChallengeExpiredError);
    const stale = challenges.issue('max', false, 0);
    challenges.issue('lea', false, 10 * 60 * 1000);
    expect(challenges['pending'].size).toBe(1);
    expect(() => challenges.attempt(stale, 10 * 60 * 1000)).toThrow(TwoFactorChallengeExpiredError);
  });

  it('allows 5 attempts at most', () => {
    const challenges = new TwoFactorChallenges();
    const token = challenges.issue('lea', false, 0);
    for (let i = 0; i < 5; i++) challenges.attempt(token, 0);
    expect(() => challenges.attempt(token, 0)).toThrow(TwoFactorChallengeExpiredError);
    expect(() => challenges.attempt('unknown', 0)).toThrow(TwoFactorChallengeExpiredError);
  });
});
