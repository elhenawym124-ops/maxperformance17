/**
 * Standalone Test Runner for App Contract, Manifest & Publishing Gate
 */

const path = require('path');
const fs = require('fs');
const assert = require('assert');

let passedTests = 0;
let failedTests = 0;
const failures = [];
let currentSuite = '';
const testsQueue = [];

const suiteHooks = {
  beforeEach: [],
  afterEach: []
};

global.beforeEach = function (fn) {
  suiteHooks.beforeEach.push(fn);
};

global.afterEach = function (fn) {
  suiteHooks.afterEach.push(fn);
};

global.beforeAll = function (fn) {
  try { fn(); } catch (_) {}
};

global.afterAll = function (fn) {
  try { fn(); } catch (_) {}
};

global.describe = function (suiteName, fn) {
  const previousSuite = currentSuite;
  currentSuite = previousSuite ? `${previousSuite} > ${suiteName}` : suiteName;
  try {
    fn();
  } catch (err) {
    failedTests++;
    failures.push({ test: currentSuite, error: err });
    console.error(`  ❌ Suite execution error in "${currentSuite}": ${err.message}`);
  } finally {
    currentSuite = previousSuite;
  }
};

global.it = function (testName, fn) {
  const fullTestName = `${currentSuite} > ${testName}`;
  testsQueue.push({ name: fullTestName, shortName: testName, fn });
};

global.expect = function (actual) {
  return {
    toBe(expected) {
      assert.strictEqual(actual, expected);
    },
    toEqual(expected) {
      assert.deepStrictEqual(actual, expected);
    },
    toHaveLength(len) {
      assert.strictEqual(actual.length, len);
    },
    toBeTruthy() {
      assert.ok(Boolean(actual));
    },
    toBeFalsy() {
      assert.ok(!actual);
    },
    toBeDefined() {
      assert.notStrictEqual(actual, undefined);
    },
    toBeNull() {
      assert.strictEqual(actual, null);
    },
    toThrow(expectedPattern) {
      assert.throws(() => {
        if (typeof actual === 'function') actual();
      }, (err) => {
        if (!expectedPattern) return true;
        if (expectedPattern instanceof RegExp) return expectedPattern.test(err.message);
        return String(err.message).includes(String(expectedPattern));
      });
    }
  };
};

async function runAll() {
  console.log('===============================================================');
  console.log('🧪 RUNNING APP CONTRACT, MANIFEST & PUBLISHING GATE TEST SUITES');
  console.log('===============================================================\n');

  const testFiles = [
    'appManifestService.test.js',
    'appManifestValidator.test.js',
    'appKillSwitch.test.js',
    'publishingGateIntegration.test.js'
  ];

  for (const file of testFiles) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      try {
        require(fullPath);
      } catch (err) {
        failedTests++;
        failures.push({ test: file, error: err });
        console.error(`❌ Failed to load test file ${file}:`, err.message);
      }
    }
  }

  let lastSuitePrefix = '';
  for (const test of testsQueue) {
    const parts = test.name.split(' > ');
    const suitePrefix = parts.slice(0, -1).join(' > ');
    if (suitePrefix !== lastSuitePrefix) {
      console.log(`\n📂 ${suitePrefix}`);
      lastSuitePrefix = suitePrefix;
    }

    try {
      for (const hook of suiteHooks.beforeEach) {
        await hook();
      }

      await test.fn();

      for (const hook of suiteHooks.afterEach) {
        await hook();
      }

      passedTests++;
      console.log(`  ✅ ${test.shortName}`);
    } catch (err) {
      failedTests++;
      failures.push({ test: test.name, error: err });
      console.error(`  ❌ ${test.shortName}: ${err.message}`);
    }
  }

  console.log('\n===============================================================');
  console.log(`🏁 TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('===============================================================');

  if (failedTests > 0) {
    console.error('\n❌ Failures breakdown:');
    failures.forEach((f) => {
      console.error(`• ${f.test}: ${f.error.message}`);
    });
    process.exit(1);
  } else {
    console.log('🎉 All App Contract, Manifest & Publishing Gate tests passed!\n');
    process.exit(0);
  }
}

runAll().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
