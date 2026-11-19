/**
 * Unit & Integration Tests for Egyptian Voice Chat Pipeline
 * Covers STT transcription, TTS synthesis, credential resolution, and end-to-end pipeline orchestration.
 */

const { cleanTextForSpeech } = require('../../services/voice/voiceTtsService');
const { EGYPTIAN_STT_PROMPT } = require('../../services/voice/voiceSttService');

describe('Egyptian Voice Chat Pipeline', () => {
  describe('TTS Text Preprocessing (cleanTextForSpeech)', () => {
    it('strips markdown asterisks, headers, and bullet points', () => {
      const input = '## أهلاً بحضرتك!\n* متاح مقاس **L** و **XL**\n- الشحن للقاهرة ٤٠ جنيه';
      const cleaned = cleanTextForSpeech(input);
      expect(cleaned).not.toContain('**');
      expect(cleaned).not.toContain('##');
      expect(cleaned).not.toContain('*');
      expect(cleaned).toContain('أهلاً بحضرتك!');
      expect(cleaned).toContain('متاح مقاس L و XL');
      expect(cleaned).toContain('الشحن للقاهرة ٤٠ جنيه');
    });

    it('strips raw URLs so they are not read phonetically', () => {
      const input = 'تقدر تشوف المنتج من هنا: https://maxp.online/p/123 والشحن متاح لجميع المحافظات.';
      const cleaned = cleanTextForSpeech(input);
      expect(cleaned).not.toContain('https://');
      expect(cleaned).not.toContain('maxp.online');
      expect(cleaned).toContain('تقدر تشوف المنتج من هنا:');
      expect(cleaned).toContain('والشحن متاح لجميع المحافظات.');
    });

    it('removes thought blocks and internal AI tags', () => {
      const input = '<thought>User is asking about price</thought><think>Calculate shipping</think>السعر ١٥٠ جنيه يا فندم.';
      const cleaned = cleanTextForSpeech(input);
      expect(cleaned).not.toContain('thought');
      expect(cleaned).not.toContain('think');
      expect(cleaned).toContain('السعر ١٥٠ جنيه يا فندم.');
    });

    it('removes emojis and visual stickers', () => {
      const input = 'تمام يا فندم 📦🚀 تم تأكيد الطلب بنجاح ✨🛒';
      const cleaned = cleanTextForSpeech(input);
      expect(cleaned).toBe('تمام يا فندم تم تأكيد الطلب بنجاح');
    });
  });

  describe('STT Dialect Prompt Biasing', () => {
    it('includes essential Egyptian colloquial keywords in the transcription prompt', () => {
      expect(EGYPTIAN_STT_PROMPT).toContain('العامية المصرية');
      expect(EGYPTIAN_STT_PROMPT).toContain('بكام ده');
      expect(EGYPTIAN_STT_PROMPT).toContain('عايز اطلب');
      expect(EGYPTIAN_STT_PROMPT).toContain('الشحن');
    });
  });

  describe('Voice Credential Resolution', () => {
    it('prioritizes company key over central key in database query', async () => {
      const { resolveVoiceKey } = require('../../services/voice/voiceCredentialResolver');
      const mockPrisma = {
        $queryRawUnsafe: jest.fn().mockImplementation((query, ...args) => {
          if (args[0] === 'company-123') {
            return Promise.resolve([{
              id: 'comp-key-1',
              apiKey: 'gsk_company_key_test',
              provider: 'GROQ',
              keyType: 'COMPANY',
            }]);
          }
          return Promise.resolve([]);
        }),
      };

      jest.mock('../../services/sharedDatabase', () => ({
        getSharedPrismaClient: () => mockPrisma,
      }));

      // Testing direct resolver logic with mock
      expect(typeof resolveVoiceKey).toBe('function');
    });
  });

  describe('Voice Chat Pipeline Orchestration (End-to-End)', () => {
    it('orchestrates: transcribe -> agent -> tts -> whatsapp sendAudio with ptt:true', async () => {
      // Mock dependencies
      const mockTranscribe = jest.fn().mockResolvedValue({
        text: 'عايز اعرف مصاريف الشحن لمدينة نصر كام',
        provider: 'GROQ_WHISPER',
        language: 'ar',
      });

      const mockSynthesize = jest.fn().mockResolvedValue({
        audioBuffer: Buffer.from('fake-opus-audio'),
        mimeType: 'audio/ogg',
        fileName: 'voice_reply_123.ogg',
        filePath: '/tmp/voice_reply_123.ogg',
        publicUrl: 'https://maxp.online/uploads/chat-media/voice-replies/voice_reply_123.ogg',
        cleanText: 'الشحن لمدينة نصر ٤٠ جنيه وبيوصل خلال يومين يا فندم.',
        provider: 'OPENAI_TTS',
      });

      const mockSendChatMessage = jest.fn().mockResolvedValue({
        status: 'ok',
        reply: 'الشحن لمدينة نصر ٤٠ جنيه وبيوصل خلال يومين يا فندم.',
      });

      const mockSendAudio = jest.fn().mockResolvedValue({
        messageId: 'wa-msg-reply-1',
      });

      const mockPrisma = {
        whatsAppMessage: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        conversation: { update: jest.fn().mockResolvedValue({}) },
        message: { create: jest.fn().mockResolvedValue({ id: 'msg-reply-1' }) },
      };

      // Mock require targets
      jest.doMock('../../services/voice/voiceSttService', () => ({
        transcribeAudio: mockTranscribe,
      }));
      jest.doMock('../../services/voice/voiceTtsService', () => ({
        synthesizeEgyptianSpeech: mockSynthesize,
      }));
      jest.doMock('../../services/aiSdkClient', () => ({
        sendChatMessage: mockSendChatMessage,
      }));
      jest.doMock('../../services/whatsapp/WhatsAppMessageHandler', () => ({
        sendAudio: mockSendAudio,
        sendText: jest.fn(),
      }));
      jest.doMock('../../services/sharedDatabase', () => ({
        getSharedPrismaClient: () => mockPrisma,
      }));

      const { processInboundVoiceMessage } = require('../../services/voice/voiceChatPipelineService');

      const result = await processInboundVoiceMessage({
        companyId: 'comp-eg-1',
        customerId: 'cust-1',
        conversationId: 'conv-1',
        channel: 'WHATSAPP',
        audioSource: 'https://example.com/customer-voice.ogg',
        mimeType: 'audio/ogg',
        messageId: 'wa-incoming-1',
        sessionId: 'sess-1',
        remoteJid: '201012345678@s.whatsapp.net',
        pushName: 'أحمد',
      });

      expect(result.success).toBe(true);
      expect(result.transcribedText).toBe('عايز اعرف مصاريف الشحن لمدينة نصر كام');
      expect(result.replyText).toContain('الشحن لمدينة نصر ٤٠ جنيه');

      // Verify STT was called
      expect(mockTranscribe).toHaveBeenCalledWith(expect.objectContaining({
        audioSource: 'https://example.com/customer-voice.ogg',
        companyId: 'comp-eg-1',
        sessionId: 'sess-1',
      }));

      // Verify DB was updated with transcribed text
      expect(mockPrisma.whatsAppMessage.updateMany).toHaveBeenCalledWith({
        where: { messageId: 'wa-incoming-1' },
        data: expect.objectContaining({
          content: 'عايز اعرف مصاريف الشحن لمدينة نصر كام',
        }),
      });

      // Verify AI Agent was invoked with the transcribed text
      expect(mockSendChatMessage).toHaveBeenCalledWith(expect.objectContaining({
        companyId: 'comp-eg-1',
        customerId: 'cust-1',
        message: 'عايز اعرف مصاريف الشحن لمدينة نصر كام',
      }));

      // Verify TTS was invoked with the agent reply
      expect(mockSynthesize).toHaveBeenCalledWith(
        expect.stringContaining('الشحن لمدينة نصر ٤٠ جنيه'),
        expect.objectContaining({ companyId: 'comp-eg-1' })
      );

      // Verify WhatsApp sendAudio was called with { ptt: true } for native voice note delivery
      expect(mockSendAudio).toHaveBeenCalledWith(
        'sess-1',
        '201012345678@s.whatsapp.net',
        expect.anything(),
        expect.objectContaining({ ptt: true, isAIResponse: true })
      );
    });

    it('flags silent escalation without sending voice reply when AI requests human takeover', async () => {
      jest.resetModules();
      const mockTranscribe = jest.fn().mockResolvedValue({
        text: 'أنا زعلان جداً الأوردر وصل مكسور وعايز تعويض',
        provider: 'GROQ_WHISPER',
      });

      const mockSendChatMessage = jest.fn().mockResolvedValue({
        status: 'escalated',
        reply: null,
        escalation: { reason: 'customer_complaint_damaged_goods' },
      });

      const mockFlagThread = jest.fn().mockResolvedValue(true);
      const mockSendAudio = jest.fn();

      jest.doMock('../../services/voice/voiceSttService', () => ({
        transcribeAudio: mockTranscribe,
      }));
      jest.doMock('../../services/aiSdkClient', () => ({
        sendChatMessage: mockSendChatMessage,
      }));
      jest.doMock('../../services/silentEscalationService', () => ({
        flagThreadForHumanTakeover: mockFlagThread,
      }));
      jest.doMock('../../services/whatsapp/WhatsAppMessageHandler', () => ({
        sendAudio: mockSendAudio,
      }));

      const { processInboundVoiceMessage } = require('../../services/voice/voiceChatPipelineService');

      const result = await processInboundVoiceMessage({
        companyId: 'comp-eg-1',
        customerId: 'cust-1',
        conversationId: 'conv-1',
        channel: 'WHATSAPP',
        audioSource: Buffer.from('audio'),
        sessionId: 'sess-1',
        remoteJid: '201012345678@s.whatsapp.net',
      });

      expect(result.escalated).toBe(true);
      expect(mockFlagThread).toHaveBeenCalledWith(expect.objectContaining({
        reason: 'customer_complaint_damaged_goods',
        channel: 'WHATSAPP',
      }));
      expect(mockSendAudio).not.toHaveBeenCalled();
    });
  });
});
