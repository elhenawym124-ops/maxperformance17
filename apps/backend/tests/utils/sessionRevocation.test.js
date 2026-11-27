const { isSessionRevoked, REVOCATION_GRACE_MS } = require('../../utils/sessionRevocation');

describe('session revocation', () => {
  const NOW = new Date('2026-11-27T12:00:00.000Z');
  const nowSeconds = Math.floor(NOW.getTime() / 1000);

  it('keeps tokens issued after the cut-off', () => {
    const issuedAt = nowSeconds + 60;
    expect(isSessionRevoked(issuedAt, NOW)).toBe(false);
  });

  it('revokes tokens issued before the cut-off', () => {
    const issuedAt = nowSeconds - 8 * 60 * 60; // 8h old session
    expect(isSessionRevoked(issuedAt, NOW)).toBe(true);
  });

  it('does not revoke a token minted in the same second as the cut-off', () => {
    expect(isSessionRevoked(nowSeconds, NOW)).toBe(false);
    expect(isSessionRevoked(nowSeconds - 1, NOW)).toBe(false);
  });

  it('revokes once the grace window is exceeded', () => {
    expect(isSessionRevoked(nowSeconds - 6, NOW)).toBe(true);
    expect(isSessionRevoked(nowSeconds - 2, NOW)).toBe(false);
  });

  it('honours an explicit grace window', () => {
    expect(isSessionRevoked(nowSeconds - 6, NOW, 1000)).toBe(true);
    expect(isSessionRevoked(nowSeconds - 2, NOW, 60_000)).toBe(false);
  });

  it('never revokes when the account has no cut-off', () => {
    expect(isSessionRevoked(nowSeconds - 10_000, null)).toBe(false);
    expect(isSessionRevoked(nowSeconds - 10_000, undefined)).toBe(false);
  });

  it('accepts ISO strings coming from the database', () => {
    const iso = '2026-11-27T12:00:00.000Z';
    expect(isSessionRevoked(nowSeconds - 60, iso)).toBe(true);
    expect(isSessionRevoked(nowSeconds + 60, iso)).toBe(false);
  });

  it('ignores malformed timestamps and claims', () => {
    expect(isSessionRevoked(nowSeconds, 'not-a-date')).toBe(false);
    expect(isSessionRevoked(undefined, NOW)).toBe(false);
    expect(isSessionRevoked('123', NOW)).toBe(false);
  });

  it('exposes a 5 second default grace', () => {
    expect(REVOCATION_GRACE_MS).toBe(5000);
  });
});
