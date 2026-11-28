/**
 * Hashtag Express credential handling.
 *
 * API NAME / API PASSWORD must never be stored in plaintext inside
 * ShippingCompany.settings. They are encrypted with the platform field-encryption
 * key (utils/fieldEncryption) and decrypted only in memory right before an API call.
 */

const { encryptField, decryptField } = require('../../utils/fieldEncryption');

const ENCRYPTED_PREFIX = 'enc:v1:';
const SECRET_FIELDS = ['apiName', 'apiPassword', 'username', 'password', 'apiKey'];

const parseSettings = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'object') return { ...raw };
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const isEncrypted = (value) =>
  typeof value === 'string' && value.startsWith(ENCRYPTED_PREFIX);

const encryptCredential = (value) => {
  if (value === null || value === undefined || value === '') return value;
  if (isEncrypted(value)) return value;
  return encryptField(String(value));
};

const decryptCredential = (value) => {
  if (typeof value !== 'string' || !isEncrypted(value)) return value;
  return decryptField(value);
};

/** Decrypt a settings object (or JSON string) for use in memory only. */
const decryptHashtagSettings = (raw) => {
  const settings = parseSettings(raw);
  for (const field of SECRET_FIELDS) {
    if (settings[field]) settings[field] = decryptCredential(settings[field]);
  }
  return settings;
};

/**
 * Merge incoming settings over the existing ones, preserve previously stored
 * secrets when the form submits an empty field, and encrypt every secret.
 * Returns a JSON string ready for ShippingCompany.settings.
 */
const encryptHashtagSettings = (incomingRaw, existingRaw = null) => {
  const incoming = parseSettings(incomingRaw);
  const existing = parseSettings(existingRaw);
  const merged = { ...existing, ...incoming };

  for (const field of SECRET_FIELDS) {
    const incomingValue = incoming[field];
    const isEmptyIncoming = incomingValue === undefined || incomingValue === null || String(incomingValue).trim() === '';
    if (isEmptyIncoming) {
      if (existing[field] !== undefined && existing[field] !== null && String(existing[field]).trim() !== '') {
        merged[field] = existing[field];
      } else {
        delete merged[field];
      }
      continue;
    }
    merged[field] = encryptCredential(String(incomingValue).trim());
  }

  return JSON.stringify(merged);
};

const hasStoredCredentials = (raw) => {
  const settings = parseSettings(raw);
  return Boolean(
    (settings.apiPassword || settings.password) &&
      (settings.apiName || settings.username || settings.apiKey),
  );
};

/** Remove secret material before sending a ShippingCompany to the browser. */
const redactHashtagCompany = (company) => {
  if (!company || String(company.providerKey || '').toUpperCase() !== 'HASHTAG') return company;
  const settings = parseSettings(company.settings);
  const configured = hasStoredCredentials(company.settings);
  for (const field of SECRET_FIELDS) delete settings[field];
  return {
    ...company,
    apiKey: null,
    settings: JSON.stringify(settings),
    hasApiCredentials: configured,
  };
};

module.exports = {
  ENCRYPTED_PREFIX,
  SECRET_FIELDS,
  parseSettings,
  encryptCredential,
  decryptCredential,
  decryptHashtagSettings,
  encryptHashtagSettings,
  hasStoredCredentials,
  redactHashtagCompany,
};
