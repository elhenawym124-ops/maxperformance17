/**
 * Voice Credential Resolver
 * Resolves AI audio credentials (STT and TTS) strictly from PostgreSQL (public.ai_keys).
 * Strictly complies with platform law: never read, store, or hardcode AI keys in .env.
 */

const { getSharedPrismaClient } = require('../sharedDatabase');

/**
 * Resolves an active API key for a voice provider.
 * Priority:
 * 1. Company-specific key in public.ai_keys
 * 2. Central platform key in public.ai_keys (keyType = 'CENTRAL')
 * 3. Company settings fallback (voiceIntegration / custom provider config in company.settings)
 *
 * @param {string} companyId - Tenant company ID
 * @param {string} provider - Provider name: 'GROQ', 'OPENAI', 'GOOGLE', 'ELEVENLABS'
 * @returns {Promise<{ apiKey: string, keyId: string, provider: string } | null>}
 */
async function resolveVoiceKey(companyId, provider) {
  const prisma = getSharedPrismaClient();
  if (!prisma) return null;

  const providerUpper = String(provider || '').trim().toUpperCase();

  try {
    // 1. Check company-specific active key in public.ai_keys
    if (companyId && companyId !== 'default') {
      const companyRows = await prisma.$queryRawUnsafe(
        `SELECT id, "apiKey", name, provider, "keyType"
         FROM public.ai_keys
         WHERE "companyId" = $1
           AND "isActive" = true
           AND (provider::text ILIKE $2 OR name ILIKE $2)
         ORDER BY priority ASC LIMIT 1`,
        companyId,
        `%${providerUpper}%`
      );

      if (companyRows && companyRows.length > 0 && companyRows[0].apiKey) {
        return {
          apiKey: companyRows[0].apiKey.trim(),
          keyId: companyRows[0].id,
          provider: companyRows[0].provider || providerUpper,
          source: 'COMPANY_AI_KEY',
        };
      }
    }

    // 2. Check central platform active key in public.ai_keys
    const centralRows = await prisma.$queryRawUnsafe(
      `SELECT id, "apiKey", name, provider, "keyType"
       FROM public.ai_keys
       WHERE ("keyType" = 'CENTRAL' OR "companyId" IS NULL)
         AND "isActive" = true
         AND (provider::text ILIKE $1 OR name ILIKE $1)
       ORDER BY priority ASC LIMIT 1`,
      `%${providerUpper}%`
    );

    if (centralRows && centralRows.length > 0 && centralRows[0].apiKey) {
      return {
        apiKey: centralRows[0].apiKey.trim(),
        keyId: centralRows[0].id,
        provider: centralRows[0].provider || providerUpper,
        source: 'CENTRAL_AI_KEY',
      };
    }
  } catch (dbError) {
    console.warn(`⚠️ [VOICE-KEYS] Failed to query public.ai_keys for ${providerUpper}:`, dbError.message);
  }

  // 3. Fallback to company settings if configured
  if (companyId) {
    try {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { settings: true },
      });
      if (company?.settings) {
        const parsed = typeof company.settings === 'string' ? JSON.parse(company.settings) : company.settings;
        const voiceConfig = parsed.voiceSettings || parsed.voiceIntegration || {};

        if (providerUpper === 'ELEVENLABS' && voiceConfig.elevenlabsApiKey) {
          return { apiKey: voiceConfig.elevenlabsApiKey.trim(), keyId: 'company_settings', provider: 'ELEVENLABS', source: 'COMPANY_SETTINGS' };
        }
        if (providerUpper === 'OPENAI' && voiceConfig.openaiApiKey) {
          return { apiKey: voiceConfig.openaiApiKey.trim(), keyId: 'company_settings', provider: 'OPENAI', source: 'COMPANY_SETTINGS' };
        }
        if (providerUpper === 'GROQ' && voiceConfig.groqApiKey) {
          return { apiKey: voiceConfig.groqApiKey.trim(), keyId: 'company_settings', provider: 'GROQ', source: 'COMPANY_SETTINGS' };
        }
      }
    } catch (settErr) {
      console.warn(`⚠️ [VOICE-KEYS] Error reading company settings for ${providerUpper}:`, settErr.message);
    }
  }

  return null;
}

module.exports = {
  resolveVoiceKey,
};
