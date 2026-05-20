const net = require('net');
const config = require('../config');
const logger = require('../logger');

const isLoopbackAddress = (ip) => {
  // IPv4 loopback
  if (ip === '127.0.0.1') {
    return true;
  }
  // IPv6 loopback
  if (ip === '::1') {
    return true;
  }
  return false;
};

const ipFilter = (req, res, next) => {
  let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // Handle IPv4-mapped IPv6 addresses (e.g., ::ffff:127.0.0.1) by converting them to IPv4
  if (clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.replace('::ffff:', '');
  }

    if ((isLoopbackAddress(clientIp) && isLoopbackAddress(config.allowedIP)) || (clientIp === config.allowedIP)) {
      next();
    } else {
      logger.warn(`Blocked access from IP: ${clientIp} (Configured: ${config.allowedIP})`);
      return res.status(403).json({ error: 'Unsupported network.' });
    }
  };

  module.exports = ipFilter;
