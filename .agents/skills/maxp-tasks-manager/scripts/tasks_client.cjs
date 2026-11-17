#!/usr/bin/env node
/**
 * MaxP Tasks API Client
 * Interacts with https://maxp.online/api/v1/external/tasks
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', '.key.json');
const DEFAULT_BASE_URL = process.env.MAXP_TASKS_API_URL || 'https://maxp.online/api/v1/external/tasks';

function getKey() {
  if (process.env.MAXP_TASKS_API_KEY) {
    return process.env.MAXP_TASKS_API_KEY.trim();
  }
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      if (data && data.apiKey) {
        return data.apiKey.trim();
      }
    } catch (_e) {
      // ignore
    }
  }
  return null;
}

function saveKey(apiKey, baseUrl = DEFAULT_BASE_URL) {
  const data = {
    apiKey: apiKey.trim(),
    baseUrl: baseUrl.trim(),
    savedAt: new Date().toISOString()
  };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8');
  console.log('✅ API key saved successfully to:', CONFIG_PATH);
}

async function request(pathname, options = {}, overrideKey = null) {
  const key = overrideKey || getKey();
  if (!key) {
    throw new Error('No API key provided. Set MAXP_TASKS_API_KEY or save it using `save-key <apiKey>`.');
  }

  let baseUrl = DEFAULT_BASE_URL;
  if (!overrideKey && fs.existsSync(CONFIG_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      if (data && data.baseUrl) baseUrl = data.baseUrl;
    } catch (_e) {}
  }

  const url = `${baseUrl.replace(/\/+$/, '')}${pathname ? (pathname.startsWith('/') ? pathname : `/${pathname}`) : ''}`;
  const headers = {
    'x-api-key': key,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const text = await response.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch (_e) {
        json = { raw: text };
      }

      return { status: response.status, ok: response.ok, data: json };
    } catch (err) {
      lastError = err;
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }

  throw lastError;
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  try {
    switch (command) {
      case 'test-key': {
        const candidateKey = args[1] || getKey();
        if (!candidateKey) {
          console.error('❌ Usage: node tasks_client.cjs test-key <key>');
          process.exit(1);
        }
        console.log(`🔍 Testing key format and authentication against: ${DEFAULT_BASE_URL}...`);
        const res = await request('', { method: 'GET' }, candidateKey);
        if (res.ok && res.data?.success) {
          console.log('✅ API Key is VALID and ACTIVE!');
          console.log(`📋 Total tasks accessible: ${res.data.total ?? res.data.data?.length ?? 0}`);
        } else {
          console.error('❌ Key rejected by server:', res.status, res.data);
          process.exit(1);
        }
        break;
      }

      case 'save-key': {
        const key = args[1];
        if (!key) {
          console.error('❌ Usage: node tasks_client.cjs save-key <apiKey>');
          process.exit(1);
        }
        // Test first
        console.log('🔍 Validating key before saving...');
        const res = await request('', { method: 'GET' }, key);
        if (!res.ok || !res.data?.success) {
          console.error('❌ Cannot save invalid key. Server responded:', res.status, res.data);
          process.exit(1);
        }
        saveKey(key);
        break;
      }

      case 'list': {
        const params = new URLSearchParams();
        for (let i = 1; i < args.length; i++) {
          if (args[i].startsWith('--limit=')) params.set('limit', args[i].split('=')[1]);
          if (args[i].startsWith('--status=')) params.set('status', args[i].split('=')[1]);
          if (args[i].startsWith('--priority=')) params.set('priority', args[i].split('=')[1]);
          if (args[i].startsWith('--search=')) params.set('search', args[i].split('=')[1]);
          if (args[i].startsWith('--page=')) params.set('page', args[i].split('=')[1]);
          if (args[i].startsWith('--project=')) params.set('projectId', args[i].split('=')[1]);
        }
        const qs = params.toString() ? `?${params.toString()}` : '';
        const res = await request(qs, { method: 'GET' });
        if (!res.ok) {
          console.error('❌ Error fetching tasks:', res.status, res.data);
          process.exit(1);
        }
        console.log(JSON.stringify(res.data, null, 2));
        break;
      }

      case 'get': {
        const taskId = args[1];
        if (!taskId) {
          console.error('❌ Usage: node tasks_client.cjs get <taskId>');
          process.exit(1);
        }
        const res = await request(`/${taskId}`, { method: 'GET' });
        if (!res.ok) {
          console.error('❌ Error getting task:', res.status, res.data);
          process.exit(1);
        }
        console.log(JSON.stringify(res.data, null, 2));
        break;
      }

      case 'update-status': {
        const taskId = args[1];
        const status = args[2];
        if (!taskId || !status) {
          console.error('❌ Usage: node tasks_client.cjs update-status <taskId> <STATUS>');
          console.error('Allowed statuses: PENDING, IN_PROGRESS, COMPLETED, CANCELLED, ON_HOLD, IN_REVIEW');
          process.exit(1);
        }
        const res = await request(`/${taskId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: status.toUpperCase() })
        });
        if (!res.ok) {
          console.error('❌ Error updating task status:', res.status, res.data);
          process.exit(1);
        }
        console.log('✅ Status updated successfully:');
        console.log(JSON.stringify(res.data, null, 2));
        break;
      }

      case 'update': {
        const taskId = args[1];
        const rawJson = args[2];
        if (!taskId || !rawJson) {
          console.error('❌ Usage: node tasks_client.cjs update <taskId> \'<JSON_PAYLOAD>\'');
          process.exit(1);
        }
        const payload = JSON.parse(rawJson);
        const res = await request(`/${taskId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          console.error('❌ Error updating task:', res.status, res.data);
          process.exit(1);
        }
        console.log('✅ Task updated successfully:');
        console.log(JSON.stringify(res.data, null, 2));
        break;
      }

      case 'create': {
        const rawJson = args[1];
        if (!rawJson) {
          console.error('❌ Usage: node tasks_client.cjs create \'<JSON_PAYLOAD>\'');
          process.exit(1);
        }
        const payload = JSON.parse(rawJson);
        const res = await request('', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          console.error('❌ Error creating task:', res.status, res.data);
          process.exit(1);
        }
        console.log('✅ Task created successfully:');
        console.log(JSON.stringify(res.data, null, 2));
        break;
      }

      case 'projects': {
        const res = await request('/projects', { method: 'GET' });
        console.log(JSON.stringify(res.data, null, 2));
        break;
      }

      case 'users': {
        const res = await request('/users', { method: 'GET' });
        console.log(JSON.stringify(res.data, null, 2));
        break;
      }

      case 'goals': {
        const res = await request('/goals', { method: 'GET' });
        console.log(JSON.stringify(res.data, null, 2));
        break;
      }

      case 'help':
      default: {
        console.log(`
MaxP Tasks CLI Tool
Usage:
  node tasks_client.cjs test-key <key>             Test an API key
  node tasks_client.cjs save-key <key>             Validate and persist key locally
  node tasks_client.cjs list [--limit=N] [--status=STATUS] [--search=QUERY]
  node tasks_client.cjs get <taskId>
  node tasks_client.cjs update-status <taskId> <STATUS>
  node tasks_client.cjs update <taskId> '<JSON>'
  node tasks_client.cjs create '<JSON>'
  node tasks_client.cjs projects
  node tasks_client.cjs users
  node tasks_client.cjs goals
`);
        break;
      }
    }
  } catch (err) {
    console.error('❌ Exception occurred:', err.message);
    process.exit(1);
  }
}

main();
