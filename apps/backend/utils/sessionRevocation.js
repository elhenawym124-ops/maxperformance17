/**
 * Session revocation helpers.
 *
 * Every account carries a `sessionsValidAfter` cut-off. Any JWT issued before
 * that moment is dead, which gives us "sign out everywhere" and kills old
 * sessions when the password changes — without a server-side session store.
 *
 * JWTs carry `iat` in whole seconds, so a token minted in the same second as
 * the cut-off can look "older" than it is. A small grace window absorbs that.
 */

const REVOCATION_GRACE_MS = 5000;

const toEpochMs = (value) => {
  if (!value) return 0;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
};

/**
 * @param {number} tokenIssuedAtSeconds JWT `iat` claim (seconds since epoch)
 * @param {Date|string|null|undefined} sessionsValidAfter account cut-off
 * @param {number} [graceMs]
 * @returns {boolean} true when the token predates the cut-off
 */
const isSessionRevoked = (tokenIssuedAtSeconds, sessionsValidAfter, graceMs = REVOCATION_GRACE_MS) => {
  const revokedBefore = toEpochMs(sessionsValidAfter);
  if (!revokedBefore) return false;
  if (typeof tokenIssuedAtSeconds !== 'number' || !Number.isFinite(tokenIssuedAtSeconds)) return false;
  const grace = Number.isFinite(Number(graceMs)) ? Math.max(0, Number(graceMs)) : REVOCATION_GRACE_MS;
  return tokenIssuedAtSeconds * 1000 < revokedBefore - grace;
};

module.exports = { isSessionRevoked, REVOCATION_GRACE_MS, toEpochMs };
