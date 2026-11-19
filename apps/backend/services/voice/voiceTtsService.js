/**
 * Voice TTS Service (Text-To-Speech) - Egyptian Arabic
 * Converts AI Agent text responses into natural, clear Egyptian voice notes.
 *
 * Provider Cascade:
 * 1. ElevenLabs (eleven_multilingual_v2 / eleven_flash_v2_5) - High quality, native nuance.
 * 2. OpenAI Audio (tts-1 with voice 'nova' or 'alloy' in native OPUS format) - Fast, low latency.
 * 3. Google Cloud Text-To-Speech (ar-XA Neural/Wavenet OGG_OPUS) - Reliable fallback.
 *
 * Keys are resolved exclusively from public.ai_keys (zero .env storage).
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { resolveVoiceKey } = require('./voiceCredentialResolver');

const UPLOADS_VOICE_DIR = path.join(process.cwd(), 'uploads', 'chat-media', 'voice-replies');

// Ensure storage directory exists
try {
  fs.mkdirSync(UPLOADS_VOICE_DIR, { recursive: true });
} catch (_) {}

/**
 * Clean text for natural speech pronunciation:
 * - Strips Markdown (*, **, _, #, bullets, code blocks)
 * - Strips raw URLs (so TTS doesn't read http-colon-slash-slash)
 * - Strips emojis and marketing symbols
 * - Normalizes spacing
 */
function cleanTextForSpeech(text) {
  if (!text || typeof text !== 'string') return '';

  let cleaned = text;

  // 1. Remove thought blocks or internal AI tags
  cleaned = cleaned.replace(/<thought\b[^>]*>.*?<\/thought>/gis, '');
  cleaned = cleaned.replace(/<think\b[^>]*>.*?<\/think>/gis, '');
  cleaned = cleaned.replace(/<\/?(thought|think)\b[^>]*>/gi, '');

  // 2. Remove URLs (these should not be read phonetically)
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/gi, '');

  // 3. Remove Markdown formatting
  cleaned = cleaned.replace(/```[\s\S]*?```/g, ''); // code blocks
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1');
  cleaned = cleaned.replace(/^#+\s+/gm, ''); // headers
  cleaned = cleaned.replace(/^\s*[-*•]\s+/gm, ''); // bullet points
  cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, ''); // numbered lists

  // 4. Remove emojis and visual clutter
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

  // 5. Clean punctuation and whitespace
  cleaned = cleaned.replace(/[—–]/g, '،');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Generate speech with ElevenLabs (eleven_multilingual_v2).
 */
async function synthesizeWithElevenLabs(text, apiKey, options = {}) {
  // Default voices:
  // - 21m00Tcm4TlvDq8ikWAM (Rachel / versatile female)
  // - cgSgspJ2msm6clMCkdW9 (Jessica)
  // - custom voiceId if provided in options
  const voiceId = options.voiceId || 'cgSgspJ2msm6clMCkdW9';
  const modelId = options.modelId || 'eleven_multilingual_v2';

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const response = await axios.post(
    url,
    {
      text,
      model_id: modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.1,
        use_speaker_boost: true,
      },
    },
    {
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      responseType: 'arraybuffer',
      timeout: 30000,
    }
  );

  return {
    buffer: Buffer.from(response.data),
    mimeType: 'audio/mpeg',
    format: 'mp3',
    provider: 'ELEVENLABS',
  };
}

/**
 * Generate speech with OpenAI Audio (tts-1).
 * Supports native 'opus' format which is directly playable as WhatsApp PTT.
 */
async function synthesizeWithOpenAI(text, apiKey, options = {}) {
  const voice = options.voice || 'nova'; // nova is lively, warm, and natural for Egyptian phrasing
  const format = options.format || 'opus'; // opus format is native WhatsApp voice note standard

  const response = await axios.post(
    'https://api.openai.com/v1/audio/speech',
    {
      model: 'tts-1',
      input: text,
      voice,
      response_format: format,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      responseType: 'arraybuffer',
      timeout: 25000,
    }
  );

  const mimeType = format === 'opus' ? 'audio/ogg' : 'audio/mpeg';

  return {
    buffer: Buffer.from(response.data),
    mimeType,
    format,
    provider: 'OPENAI_TTS',
  };
}

/**
 * Generate speech with Google Cloud Text-To-Speech (ar-XA).
 */
async function synthesizeWithGoogle(text, apiKey, options = {}) {
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

  const payload = {
    input: { text },
    voice: {
      languageCode: 'ar-XA',
      name: options.voiceName || 'ar-XA-Wavenet-B',
    },
    audioConfig: {
      audioEncoding: 'OGG_OPUS',
      speakingRate: 1.05,
    },
  };

  const response = await axios.post(url, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 25000,
  });

  const audioContent = response.data?.audioContent;
  if (!audioContent) {
    throw new Error('Google TTS returned empty audioContent');
  }

  return {
    buffer: Buffer.from(audioContent, 'base64'),
    mimeType: 'audio/ogg',
    format: 'ogg',
    provider: 'GOOGLE_TTS',
  };
}

/**
 * Main TTS function: Converts text into an Egyptian voice note audio file.
 * Automatically tries providers in order: ElevenLabs → OpenAI → Google TTS.
 *
 * @param {string} rawText - Text to speak
 * @param {Object} [options]
 * @param {string} [options.companyId] - Tenant ID to resolve keys
 * @param {string} [options.preferredProvider] - Preferred provider ('ELEVENLABS' or 'OPENAI')
 * @param {string} [options.voice] - Specific voice name/ID
 * @returns {Promise<{ audioBuffer: Buffer, mimeType: string, filePath: string, publicUrl: string, cleanText: string, provider: string }>}
 */
async function synthesizeEgyptianSpeech(rawText, options = {}) {
  const cleanText = cleanTextForSpeech(rawText);
  if (!cleanText) {
    throw new Error('Text to synthesize is empty after cleaning');
  }

  const { companyId, preferredProvider } = options;
  const errors = [];
  let result = null;

  // 1. ElevenLabs (if preferred or available)
  if (!preferredProvider || preferredProvider.toUpperCase() === 'ELEVENLABS') {
    try {
      const elevenKey = await resolveVoiceKey(companyId, 'ELEVENLABS');
      if (elevenKey?.apiKey) {
        console.log(`🔊 [TTS] Synthesizing with ElevenLabs (${elevenKey.source})...`);
        result = await synthesizeWithElevenLabs(cleanText, elevenKey.apiKey, options);
      }
    } catch (elevenErr) {
      console.warn('⚠️ [TTS] ElevenLabs synthesis failed:', elevenErr.response?.data || elevenErr.message);
      errors.push(`ElevenLabs: ${elevenErr.message}`);
    }
  }

  // 2. OpenAI Audio TTS (tts-1 opus/mp3)
  if (!result) {
    try {
      const openaiKey = await resolveVoiceKey(companyId, 'OPENAI');
      if (openaiKey?.apiKey) {
        console.log(`🔊 [TTS] Synthesizing with OpenAI Audio TTS (${openaiKey.source})...`);
        result = await synthesizeWithOpenAI(cleanText, openaiKey.apiKey, options);
      }
    } catch (openaiErr) {
      console.warn('⚠️ [TTS] OpenAI TTS failed:', openaiErr.response?.data || openaiErr.message);
      errors.push(`OpenAI: ${openaiErr.message}`);
    }
  }

  // 3. Google TTS (fallback)
  if (!result) {
    try {
      const googleKey = await resolveVoiceKey(companyId, 'GOOGLE');
      if (googleKey?.apiKey) {
        console.log(`🔊 [TTS] Synthesizing with Google TTS (${googleKey.source})...`);
        result = await synthesizeWithGoogle(cleanText, googleKey.apiKey, options);
      }
    } catch (googleErr) {
      console.warn('⚠️ [TTS] Google TTS failed:', googleErr.response?.data || googleErr.message);
      errors.push(`Google: ${googleErr.message}`);
    }
  }

  if (!result) {
    throw new Error(`All TTS providers failed: ${errors.join(' | ') || 'No active AI key found for ELEVENLABS, OPENAI, or GOOGLE'}`);
  }

  // Save audio file locally for serving and delivery
  const fileId = crypto.randomUUID();
  const ext = result.format === 'opus' ? 'ogg' : result.format;
  const fileName = `voice_reply_${fileId}.${ext}`;
  const filePath = path.join(UPLOADS_VOICE_DIR, fileName);

  await fs.promises.writeFile(filePath, result.buffer);

  // Build public URL
  const publicOrigin = process.env.PUBLIC_BASE_URL || process.env.BACKEND_URL || 'https://maxp.online';
  const publicUrl = `${publicOrigin.replace(/\/$/, '')}/uploads/chat-media/voice-replies/${fileName}`;

  console.log(`✅ [TTS] Speech synthesized successfully with ${result.provider}: ${fileName} (${result.buffer.length} bytes)`);

  return {
    audioBuffer: result.buffer,
    mimeType: result.mimeType,
    fileName,
    filePath,
    publicUrl,
    cleanText,
    provider: result.provider,
  };
}

module.exports = {
  synthesizeEgyptianSpeech,
  cleanTextForSpeech,
};
