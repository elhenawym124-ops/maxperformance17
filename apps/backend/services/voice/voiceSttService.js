/**
 * Voice STT Service (Speech-To-Text) - Egyptian Arabic
 * Transcribes incoming customer voice messages into Egyptian Arabic text.
 * 
 * Provider Cascade:
 * 1. Groq Whisper (whisper-large-v3) - Ultra fast (~200ms latency), high accuracy.
 * 2. OpenAI Whisper (whisper-1) - High accuracy on noisy speech and diverse accents.
 * 3. Google Gemini 2.0 Flash (Multimodal Audio) - Robust fallback with Egyptian prompt biasing.
 *
 * Keys are resolved exclusively from public.ai_keys (zero .env storage).
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { resolveVoiceKey } = require('./voiceCredentialResolver');
const { getSharedPrismaClient } = require('../sharedDatabase');

const EGYPTIAN_STT_PROMPT = 
  'تفريغ صوتي لمحادثة خدمة عملاء بالعامية المصرية: السلام عليكم، لو سمحت، عايز اطلب، بكام ده، المقاس، الشحن، العنوان، التوصيل، تمام، شكرا، أيوة، ماشي، رقم التليفون، الطلب، المنتج، اللون، في منه، تأكيد، كاش، فودافون كاش، إنستاباي.';

/**
 * Downloads or loads audio buffer from various sources (URL, local path, meta-media, Buffer).
 */
async function fetchAudioBuffer(audioSource, options = {}) {
  if (Buffer.isBuffer(audioSource)) {
    return { buffer: audioSource, mimeType: options.mimeType || 'audio/ogg', fileName: 'voice_note.ogg' };
  }

  if (typeof audioSource !== 'string') {
    throw new Error('Invalid audioSource: must be Buffer or string path/URL');
  }

  // 1. Meta Media Reference (meta-media:ID)
  if (audioSource.startsWith('meta-media:')) {
    const mediaId = audioSource.replace('meta-media:', '').trim();
    return await downloadMetaMediaBuffer(mediaId, options.sessionId);
  }

  // 2. HTTP / HTTPS URL
  if (audioSource.startsWith('http://') || audioSource.startsWith('https://')) {
    const res = await axios.get(audioSource, {
      responseType: 'arraybuffer',
      timeout: 25000,
      maxContentLength: 25 * 1024 * 1024,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MaxP-Voice-Pipeline/1.0)',
      },
    });
    const contentType = res.headers['content-type'] || options.mimeType || 'audio/ogg';
    const ext = getExtensionFromMime(contentType);
    return {
      buffer: Buffer.from(res.data),
      mimeType: contentType,
      fileName: `voice_note.${ext}`,
    };
  }

  // 3. Local filesystem path
  let localPath = audioSource;
  if (!path.isAbsolute(localPath)) {
    localPath = path.join(process.cwd(), localPath);
  }

  if (fs.existsSync(localPath)) {
    const buffer = fs.readFileSync(localPath);
    const ext = path.extname(localPath).replace('.', '') || 'ogg';
    const mimeType = getMimeFromExtension(ext);
    return {
      buffer,
      mimeType,
      fileName: path.basename(localPath),
    };
  }

  throw new Error(`Audio source not found or accessible: ${audioSource}`);
}

/**
 * Downloads audio media directly from Meta Cloud Graph API using session credentials.
 */
async function downloadMetaMediaBuffer(mediaId, sessionId) {
  const prisma = getSharedPrismaClient();
  let accessToken = null;

  if (sessionId) {
    const session = await prisma.whatsAppSession.findUnique({
      where: { id: sessionId },
      select: { metaAccessToken: true, metadata: true },
    });
    if (session?.metaAccessToken) {
      accessToken = session.metaAccessToken;
    } else if (session?.metadata) {
      try {
        const meta = typeof session.metadata === 'string' ? JSON.parse(session.metadata) : session.metadata;
        accessToken = meta?.accessToken || meta?.pageAccessToken;
      } catch (_) {}
    }
  }

  if (!accessToken) {
    const facebookAppConfig = require('../../config/facebookAppConfig');
    const oauthConfig = facebookAppConfig.getFacebookOAuthConfig();
    accessToken = oauthConfig.systemUserToken || oauthConfig.appSecret;
  }

  if (!accessToken) {
    throw new Error('No access token available to download Meta media');
  }

  // 1. Get media URL
  const metaApiUrl = `https://graph.facebook.com/v21.0/${encodeURIComponent(mediaId)}`;
  const metaMetaRes = await axios.get(metaApiUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: 15000,
  });

  const downloadUrl = metaMetaRes.data?.url;
  const mimeType = metaMetaRes.data?.mime_type || 'audio/ogg';
  if (!downloadUrl) {
    throw new Error(`Meta media URL not returned for ID: ${mediaId}`);
  }

  // 2. Download binary media (Meta requires Authorization header and User-Agent)
  const binaryRes = await axios.get(downloadUrl, {
    responseType: 'arraybuffer',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'curl/7.64.1',
    },
    timeout: 30000,
  });

  const ext = getExtensionFromMime(mimeType);
  return {
    buffer: Buffer.from(binaryRes.data),
    mimeType,
    fileName: `meta_voice_${mediaId}.${ext}`,
  };
}

function getExtensionFromMime(mime) {
  const clean = (mime || '').split(';')[0].trim().toLowerCase();
  const map = {
    'audio/ogg': 'ogg',
    'audio/opus': 'ogg',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/mp4': 'm4a',
    'audio/m4a': 'm4a',
    'audio/wav': 'wav',
    'audio/webm': 'webm',
    'audio/aac': 'aac',
    'audio/amr': 'amr',
  };
  return map[clean] || 'ogg';
}

function getMimeFromExtension(ext) {
  const clean = (ext || '').toLowerCase();
  const map = {
    ogg: 'audio/ogg',
    opus: 'audio/ogg',
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    wav: 'audio/wav',
    webm: 'audio/webm',
    aac: 'audio/aac',
    amr: 'audio/amr',
  };
  return map[clean] || 'audio/ogg';
}

/**
 * Transcribe audio using Groq Whisper (whisper-large-v3).
 */
async function transcribeWithGroq(audioData, apiKey) {
  const form = new FormData();
  form.append('file', audioData.buffer, {
    filename: audioData.fileName || 'audio.ogg',
    contentType: audioData.mimeType || 'audio/ogg',
  });
  form.append('model', 'whisper-large-v3');
  form.append('language', 'ar');
  form.append('prompt', EGYPTIAN_STT_PROMPT);
  form.append('response_format', 'json');
  form.append('temperature', '0.0');

  const response = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', form, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...form.getHeaders(),
    },
    timeout: 25000,
  });

  const text = (response.data?.text || '').trim();
  return {
    text,
    provider: 'GROQ_WHISPER',
    model: 'whisper-large-v3',
    raw: response.data,
  };
}

/**
 * Transcribe audio using OpenAI Whisper (whisper-1).
 */
async function transcribeWithOpenAI(audioData, apiKey) {
  const form = new FormData();
  form.append('file', audioData.buffer, {
    filename: audioData.fileName || 'audio.ogg',
    contentType: audioData.mimeType || 'audio/ogg',
  });
  form.append('model', 'whisper-1');
  form.append('language', 'ar');
  form.append('prompt', EGYPTIAN_STT_PROMPT);
  form.append('response_format', 'json');
  form.append('temperature', '0.0');

  const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...form.getHeaders(),
    },
    timeout: 30000,
  });

  const text = (response.data?.text || '').trim();
  return {
    text,
    provider: 'OPENAI_WHISPER',
    model: 'whisper-1',
    raw: response.data,
  };
}

/**
 * Transcribe audio using Google Gemini multimodal audio.
 */
async function transcribeWithGemini(audioData, apiKey) {
  const base64Audio = audioData.buffer.toString('base64');
  const cleanMime = (audioData.mimeType || 'audio/ogg').split(';')[0].trim();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: 'أنت مفرغ صوتي محترف للعامية المصرية. فرغ هذا المقطع الصوتي بدقة تامة وباللهجة العامية المصرية كما نطقها المتحدث بدون تلخيص وبدون تحويل لفصحى وبدون حذف أي كلمة. اكتب فقط نص الكلام المنطوق مباشرة دون أي تعليق.',
          },
          {
            inlineData: {
              mimeType: cleanMime,
              data: base64Audio,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1000,
    },
  };

  const response = await axios.post(url, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
  });

  const candidates = response.data?.candidates;
  const text = candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  return {
    text,
    provider: 'GOOGLE_GEMINI',
    model: 'gemini-2.0-flash',
    raw: response.data,
  };
}

/**
 * Main STT function: Transcribes incoming audio into Egyptian Arabic text.
 * Automatically tries providers in order: Groq → OpenAI → Google Gemini.
 *
 * @param {Object} params
 * @param {string|Buffer} params.audioSource - Audio URL, local path, meta-media:ID, or Buffer
 * @param {string} [params.companyId] - Tenant ID to resolve company-specific keys
 * @param {string} [params.sessionId] - WhatsApp session ID for Meta media download
 * @param {string} [params.mimeType] - Audio MIME type if known
 * @returns {Promise<{ text: string, provider: string, language: string }>}
 */
async function transcribeAudio(params = {}) {
  const { audioSource, companyId, sessionId, mimeType } = params;

  if (!audioSource) {
    throw new Error('audioSource is required for STT transcription');
  }

  const audioData = await fetchAudioBuffer(audioSource, { sessionId, companyId, mimeType });
  if (!audioData.buffer || audioData.buffer.length === 0) {
    throw new Error('Audio buffer is empty');
  }

  const errors = [];

  // 1. Try Groq Whisper (fastest ~200ms)
  try {
    const groqKey = await resolveVoiceKey(companyId, 'GROQ');
    if (groqKey?.apiKey) {
      console.log(`🎙️ [STT] Transcribing with Groq Whisper (${groqKey.source})...`);
      const result = await transcribeWithGroq(audioData, groqKey.apiKey);
      if (result.text) {
        console.log(`✅ [STT] Groq transcription: "${result.text}"`);
        return { text: result.text, provider: result.provider, language: 'ar', raw: result.raw };
      }
    }
  } catch (groqErr) {
    console.warn('⚠️ [STT] Groq Whisper failed:', groqErr.response?.data?.error?.message || groqErr.message);
    errors.push(`Groq: ${groqErr.message}`);
  }

  // 2. Try OpenAI Whisper (fallback)
  try {
    const openaiKey = await resolveVoiceKey(companyId, 'OPENAI');
    if (openaiKey?.apiKey) {
      console.log(`🎙️ [STT] Transcribing with OpenAI Whisper (${openaiKey.source})...`);
      const result = await transcribeWithOpenAI(audioData, openaiKey.apiKey);
      if (result.text) {
        console.log(`✅ [STT] OpenAI transcription: "${result.text}"`);
        return { text: result.text, provider: result.provider, language: 'ar', raw: result.raw };
      }
    }
  } catch (openaiErr) {
    console.warn('⚠️ [STT] OpenAI Whisper failed:', openaiErr.response?.data?.error?.message || openaiErr.message);
    errors.push(`OpenAI: ${openaiErr.message}`);
  }

  // 3. Try Google Gemini Flash Multimodal Audio (fallback)
  try {
    const googleKey = await resolveVoiceKey(companyId, 'GOOGLE');
    if (googleKey?.apiKey) {
      console.log(`🎙️ [STT] Transcribing with Google Gemini (${googleKey.source})...`);
      const result = await transcribeWithGemini(audioData, googleKey.apiKey);
      if (result.text) {
        console.log(`✅ [STT] Gemini transcription: "${result.text}"`);
        return { text: result.text, provider: result.provider, language: 'ar', raw: result.raw };
      }
    }
  } catch (geminiErr) {
    console.warn('⚠️ [STT] Google Gemini STT failed:', geminiErr.response?.data?.error?.message || geminiErr.message);
    errors.push(`Gemini: ${geminiErr.message}`);
  }

  throw new Error(`All STT transcription providers failed: ${errors.join(' | ') || 'No active AI key for GROQ, OPENAI, or GOOGLE'}`);
}

module.exports = {
  transcribeAudio,
  fetchAudioBuffer,
  EGYPTIAN_STT_PROMPT,
};
