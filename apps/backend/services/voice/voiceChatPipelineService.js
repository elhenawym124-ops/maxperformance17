/**
 * Voice Chat Pipeline Service (MaxP Platform)
 * 
 * Implements the complete Egyptian Arabic voice loop:
 * Inbound Voice Note → STT (Egyptian Dialect) → Agent LLM → TTS (Egyptian Dialect) → Outbound Voice Note (PTT)
 *
 * Supports: WhatsApp (Meta Cloud & Baileys), Facebook Messenger, and Telegram.
 */

const { getSharedPrismaClient } = require('../sharedDatabase');
const { transcribeAudio } = require('./voiceSttService');
const { synthesizeEgyptianSpeech } = require('./voiceTtsService');
const aiSdkClient = require('../aiSdkClient');
const socketService = require('../socketService');
const { sanitizeAiReply } = require('../../utils/aiReplySanitizer');

/**
 * Handles an incoming voice note from a customer across any channel.
 *
 * @param {Object} params
 * @param {string} params.companyId - Tenant company ID
 * @param {string} params.customerId - Customer ID
 * @param {string} [params.conversationId] - Internal conversation thread ID
 * @param {string} params.channel - 'WHATSAPP' | 'FACEBOOK' | 'TELEGRAM'
 * @param {string|Buffer} params.audioSource - Audio URL, local path, meta-media:ID, or Buffer
 * @param {string} [params.mimeType] - Mime type of the audio
 * @param {string} [params.messageId] - External or DB message ID
 * @param {string} [params.sessionId] - WhatsApp session ID
 * @param {string} [params.remoteJid] - WhatsApp remote JID (e.g. 201xxxx@s.whatsapp.net)
 * @param {string} [params.senderId] - Facebook sender ID / Telegram ID
 * @param {string} [params.pageId] - Facebook page ID
 * @param {string} [params.accessToken] - Facebook access token
 * @param {string} [params.pushName] - Customer push name
 * @param {Object} [params.memoryContext] - Context metadata (gender, branch, etc.)
 * @returns {Promise<{ success: boolean, transcribedText: string, replyText: string, audioUrl: string }>}
 */
async function processInboundVoiceMessage(params) {
  const {
    companyId,
    customerId,
    conversationId,
    channel = 'WHATSAPP',
    audioSource,
    mimeType,
    messageId,
    sessionId,
    remoteJid,
    senderId,
    pageId,
    accessToken,
    pushName,
    memoryContext,
  } = params;

  const prisma = getSharedPrismaClient();

  console.log(`🎙️ [VOICE-PIPELINE] Starting voice processing for ${channel} message ${messageId || ''}...`);

  // ── Step 1: Speech-To-Text (Egyptian Dialect) ───────────────────────────
  let sttResult;
  try {
    sttResult = await transcribeAudio({
      audioSource,
      companyId,
      sessionId,
      mimeType,
    });
  } catch (sttError) {
    console.error('❌ [VOICE-PIPELINE] STT transcription failed:', sttError.message);
    throw sttError;
  }

  const transcribedText = sttResult?.text?.trim();
  if (!transcribedText) {
    console.warn('⚠️ [VOICE-PIPELINE] Transcribed text is empty. Skipping AI reply.');
    return { success: false, reason: 'EMPTY_TRANSCRIPT' };
  }

  console.log(`📝 [VOICE-PIPELINE] Customer transcribed audio: "${transcribedText}" (${sttResult.provider})`);

  // ── Step 2: Update Inbound Message in DB with Transcript ───────────────────
  try {
    if (messageId && channel === 'WHATSAPP') {
      await prisma.whatsAppMessage.updateMany({
        where: { messageId },
        data: {
          content: transcribedText,
          updatedAt: new Date(),
        },
      });
    }

    if (conversationId) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          lastMessagePreview: `🎤 ${transcribedText.substring(0, 80)}`,
          updatedAt: new Date(),
        },
      });
    }

    // Emit live transcript update to frontend dashboard
    const io = socketService.getIO();
    if (io && companyId) {
      io.to(`company_${companyId}`).emit('voice_message_transcribed', {
        messageId,
        conversationId,
        transcribedText,
        sttProvider: sttResult.provider,
      });
    }
  } catch (dbErr) {
    console.warn('⚠️ [VOICE-PIPELINE] Failed to persist transcript to DB:', dbErr.message);
  }

  // ── Step 3: Run AI Agent with the Transcribed Egyptian Text ─────────────
  console.log(`🤖 [VOICE-PIPELINE] Sending transcribed text to AI Agent...`);

  const agentResponse = await aiSdkClient.sendChatMessage({
    companyId,
    customerId,
    message: transcribedText,
    threadId: conversationId,
    channel,
    memoryContext: {
      ...(memoryContext || {}),
      isVoiceInput: true,
      inputModality: 'voice',
      voiceNoteLanguage: 'ar-EG',
      conversationalPromptBias: 'العميل أرسل فويس نوت. رد عليه بالعامية المصرية الطبيعية بجمل واضحة وقصيرة وسلسة تناسب الاستماع الصوتي.',
    },
  });

  // Handle Silent Escalation (AI failed or requested human takeover)
  if (agentResponse && (agentResponse.status === 'escalated' || (agentResponse.escalation && !agentResponse.reply))) {
    console.log('🔴 [VOICE-PIPELINE] AI agent escalated to human team.');
    const { flagThreadForHumanTakeover } = require('../silentEscalationService');
    await flagThreadForHumanTakeover({
      companyId,
      conversationId,
      customerPhone: remoteJid || senderId,
      customerId,
      reason: agentResponse.escalation?.reason || 'voice_ai_failure',
      customerMessage: `[Voice Note]: ${transcribedText}`,
      channel,
    });
    return { success: false, escalated: true, transcribedText };
  }

  const rawReplyText = agentResponse?.reply;
  if (!rawReplyText) {
    console.warn('⚠️ [VOICE-PIPELINE] AI agent returned no reply text.');
    return { success: false, transcribedText, reason: 'NO_AGENT_REPLY' };
  }

  const { cleanedText: replyText, attachments } = sanitizeAiReply(
    rawReplyText,
    agentResponse.response_attachments || agentResponse.responseAttachments
  );

  console.log(`💬 [VOICE-PIPELINE] Agent reply text: "${replyText.substring(0, 80)}..."`);

  // ── Step 4: Text-To-Speech (Egyptian Dialect) ─────────────────────────────
  console.log(`🔊 [VOICE-PIPELINE] Synthesizing Egyptian voice note for reply...`);

  let ttsResult;
  try {
    ttsResult = await synthesizeEgyptianSpeech(replyText, {
      companyId,
      format: 'opus',
    });
  } catch (ttsErr) {
    console.error('❌ [VOICE-PIPELINE] TTS failed, falling back to text reply:', ttsErr.message);
    // Graceful fallback: send reply as text if TTS fails
    await fallbackSendTextReply({
      channel,
      sessionId,
      remoteJid,
      senderId,
      pageId,
      accessToken,
      replyText,
      conversationId,
      companyId,
    });
    return { success: true, transcribedText, replyText, fallbackText: true };
  }

  // ── Step 5: Dispatch Outbound Voice Note (Push-To-Talk) ───────────────────
  console.log(`🚀 [VOICE-PIPELINE] Dispatching voice note (PTT) to customer on ${channel}...`);

  if (channel === 'WHATSAPP' && sessionId && remoteJid) {
    const WhatsAppMessageHandler = require('../whatsapp/WhatsAppMessageHandler');
    try {
      // Send as authentic WhatsApp Voice Note (PTT = true)
      await WhatsAppMessageHandler.sendAudio(
        sessionId,
        remoteJid,
        ttsResult.filePath || ttsResult.publicUrl || ttsResult.audioBuffer,
        {
          ptt: true,
          isAIResponse: true,
        }
      );
      console.log('✅ [VOICE-PIPELINE] WhatsApp voice note (PTT) sent successfully!');
    } catch (waSendErr) {
      console.error('❌ [VOICE-PIPELINE] Failed to send WhatsApp voice note:', waSendErr.message);
      // Fallback: send text if voice send failed
      await WhatsAppMessageHandler.sendText(sessionId, remoteJid, replyText, { isAIResponse: true }).catch(() => {});
    }

    // Persist outbound voice reply to DB (public.messages)
    if (conversationId) {
      await prisma.message.create({
        data: {
          conversationId,
          content: replyText, // Store transcript for agent visibility
          type: 'AUDIO',
          isFromCustomer: false,
          mediaUrl: ttsResult.publicUrl,
          metadata: JSON.stringify({
            platform: 'whatsapp',
            source: 'ai_voice_reply',
            isVoiceNote: true,
            isAIResponse: true,
            transcript: replyText,
            ttsProvider: ttsResult.provider,
            sttProvider: sttResult.provider,
          }),
        },
      }).catch((e) => console.warn('⚠️ [VOICE-PIPELINE] Failed to save message to DB:', e.message));
    }
  } else if (channel === 'FACEBOOK' && senderId && pageId && accessToken) {
    const { sendProductionFacebookMessage } = require('../../utils/production-facebook-fix');
    try {
      await sendProductionFacebookMessage(
        senderId,
        ttsResult.publicUrl,
        'AUDIO',
        pageId,
        accessToken
      );
      console.log('✅ [VOICE-PIPELINE] Facebook Messenger voice audio sent successfully!');
    } catch (fbSendErr) {
      console.error('❌ [VOICE-PIPELINE] Failed to send Facebook voice message:', fbSendErr.message);
      await sendProductionFacebookMessage(senderId, replyText, 'TEXT', pageId, accessToken).catch(() => {});
    }

    if (conversationId) {
      await prisma.message.create({
        data: {
          conversationId,
          content: replyText,
          type: 'AUDIO',
          isFromCustomer: false,
          mediaUrl: ttsResult.publicUrl,
          metadata: JSON.stringify({
            platform: 'facebook',
            source: 'ai_voice_reply',
            isVoiceNote: true,
            isAIResponse: true,
            transcript: replyText,
            ttsProvider: ttsResult.provider,
          }),
        },
      }).catch(() => {});
    }
  } else if (channel === 'TELEGRAM' && conversationId) {
    try {
      const TelegramBotService = require('../TelegramBotService');
      await TelegramBotService.sendMessage(conversationId, replyText, {
        type: 'voice',
        fileUrl: ttsResult.publicUrl || ttsResult.filePath,
      });
      console.log('✅ [VOICE-PIPELINE] Telegram voice reply dispatched successfully');
    } catch (tgErr) {
      console.error('❌ [VOICE-PIPELINE] Telegram voice send failed:', tgErr.message);
    }
  }

  // ── Step 6: Dispatch any supplementary image attachments ─────────────────
  if (Array.isArray(attachments) && attachments.length > 0) {
    for (const att of attachments) {
      if (att.type === 'image' && att.url && !att.url.startsWith('data:')) {
        try {
          if (channel === 'WHATSAPP' && sessionId && remoteJid) {
            const WhatsAppMessageHandler = require('../whatsapp/WhatsAppMessageHandler');
            await WhatsAppMessageHandler.sendImage(sessionId, remoteJid, { url: att.url }, '', { isAIResponse: true });
          }
        } catch (attErr) {
          console.warn('⚠️ [VOICE-PIPELINE] Failed to send accompanying image attachment:', attErr.message);
        }
      }
    }
  }

  return {
    success: true,
    transcribedText,
    replyText,
    audioUrl: ttsResult.publicUrl,
    sttProvider: sttResult.provider,
    ttsProvider: ttsResult.provider,
  };
}

/**
 * Fallback to send plain text if audio generation fails.
 */
async function fallbackSendTextReply(opts) {
  const { channel, sessionId, remoteJid, senderId, pageId, accessToken, replyText, conversationId, companyId } = opts;
  try {
    if (channel === 'WHATSAPP' && sessionId && remoteJid) {
      const WhatsAppMessageHandler = require('../whatsapp/WhatsAppMessageHandler');
      await WhatsAppMessageHandler.sendText(sessionId, remoteJid, replyText, { isAIResponse: true });
    } else if (channel === 'FACEBOOK' && senderId && pageId && accessToken) {
      const { sendProductionFacebookMessage } = require('../../utils/production-facebook-fix');
      await sendProductionFacebookMessage(senderId, replyText, 'TEXT', pageId, accessToken);
    }

    if (conversationId) {
      const prisma = getSharedPrismaClient();
      await prisma.message.create({
        data: {
          conversationId,
          content: replyText,
          type: 'TEXT',
          isFromCustomer: false,
          metadata: JSON.stringify({
            platform: channel.toLowerCase(),
            source: 'ai_text_fallback',
          }),
        },
      });
    }
  } catch (err) {
    console.error('❌ [VOICE-PIPELINE] Fallback text send failed:', err.message);
  }
}

module.exports = {
  processInboundVoiceMessage,
};
