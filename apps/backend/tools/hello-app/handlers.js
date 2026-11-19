/**
 * Hello App - Handlers
 * 
 * Demonstrates clean, secure modular tool implementation:
 * - ZERO requireRole anywhere in this code
 * - Access is guarded purely by permission keys declared in manifest.json
 * - Access checks are performed by unified toolAccessGuard
 */

/**
 * Ping handler
 * Requires permission: dashboard.view
 */
const ping = async (req, res) => {
  return res.json({
    success: true,
    tool: 'hello-app',
    message: 'pong',
    companyId: req.user?.companyId,
    timestamp: new Date().toISOString()
  });
};

/**
 * Data retrieval handler
 * Requires permission: dashboard.view
 */
const getData = async (req, res) => {
  return res.json({
    success: true,
    tool: 'hello-app',
    data: {
      items: [
        { id: 1, title: 'Item 1', status: 'ready' },
        { id: 2, title: 'Item 2', status: 'processed' }
      ],
      companySettings: req.companyApp?.settings || {}
    }
  });
};

/**
 * Config saving handler
 * Requires permission: settings.read
 */
const saveConfig = async (req, res) => {
  const config = req.body || {};
  return res.json({
    success: true,
    tool: 'hello-app',
    message: 'Configuration updated successfully',
    savedConfig: config
  });
};

module.exports = {
  ping,
  getData,
  saveConfig
};
