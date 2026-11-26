const assert = require('assert');
const pricingService = require('../../services/aiCreditPricingService');

async function runTests() {
  pricingService.invalidateSettingsCache();

  // 1. Default pricing settings & quote math (Flash vs Pro + Agent Steps)
  const settings = await pricingService.getPricingSettings(null, { bypassCache: true });
  assert.strictEqual(settings.usdToEgp, 50);
  assert.strictEqual(settings.creditPriceEgp, 0.05);
  assert.ok(settings.packages.length >= 4, 'Should have 4 default top-up packages');

  const flashChat = pricingService.quoteUsageCost(
    { modelName: 'deepseek-flash', inputTokens: 2000, outputTokens: 400, agentSteps: 0, source: 'CHAT' },
    settings
  );
  assert.strictEqual(flashChat.tier, 'flash');
  assert.strictEqual(flashChat.credits, 1, 'Standard flash chat should be 1 credit (0.05 EGP)');
  assert.ok(flashChat.grossProfitEgp > 0, 'Flash chat must yield positive gross profit');

  const agentRun = pricingService.quoteUsageCost(
    { modelName: 'deepseek-flash', inputTokens: 4000, outputTokens: 800, agentSteps: 3, source: 'AGENT_RUN' },
    settings
  );
  assert.ok(agentRun.credits >= 4, 'Multi-step agent run should include step fees');

  const proModel = pricingService.quoteUsageCost(
    { modelName: 'gpt-4o', inputTokens: 4000, outputTokens: 1000, agentSteps: 1, source: 'AGENT_RUN' },
    settings
  );
  assert.strictEqual(proModel.tier, 'pro');
  assert.ok(proModel.credits > agentRun.credits, 'Pro model should cost more credits than flash');

  // 2. Live Super Admin override updates quote dynamically
  const updated = await pricingService.updatePricingSettings(
    {
      usdToEgp: 55,
      flashMarkupPercent: 100,
      modelCostOverrides: {
        'custom-fast-model': { input: 0.1, output: 0.4, tier: 'flash', enabled: true, multiplier: 2 },
      },
    },
    null
  );
  assert.strictEqual(updated.usdToEgp, 55);
  const customQuote = pricingService.quoteUsageCost(
    { modelName: 'custom-fast-model', inputTokens: 10000, outputTokens: 2000, agentSteps: 1, source: 'AGENT_RUN' },
    updated
  );
  assert.strictEqual(customQuote.tier, 'flash');
  assert.ok(customQuote.credits >= 4, 'Multiplier x2 should scale custom model credits');

  // 3. Memory wallet metering + BYOK zero-deduction + enforcementMode
  await pricingService.updatePricingSettings({ enforcementMode: 'enforce', trialBonusCredits: 200 }, null);
  const meter1 = await pricingService.meterAndDeductAiUsage(
    { companyId: 'comp-test-1', source: 'CHAT', modelName: 'deepseek-flash', inputTokens: 1500, outputTokens: 300 },
    null
  );
  assert.strictEqual(meter1.billingMode, 'PLATFORM');
  assert.strictEqual(meter1.deducted, 1);
  assert.strictEqual(meter1.wallet.balance, 199);

  // BYOK mock Prisma check
  const byokPrisma = {
    aiKey: { findFirst: async () => ({ id: 'company-key-1' }) },
  };
  const allowanceByok = await pricingService.checkCreditAllowance(
    { companyId: 'comp-test-1', estimatedCredits: 500 },
    byokPrisma
  );
  assert.strictEqual(allowanceByok.allowed, true);
  assert.strictEqual(allowanceByok.billingMode, 'BYOK');

  // Restore clean default settings in memory
  await pricingService.updatePricingSettings(pricingService.DEFAULT_PRICING_SETTINGS, null);

  console.log('✅ All aiCreditPricingService tests passed!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
