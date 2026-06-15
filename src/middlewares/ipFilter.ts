import { NextFunction, Request, Response } from 'express';
import config from '../config.js';
import * as logger from '../logger.js';

const isLoopbackAddress = (ip: string): boolean => {
  // IPv4 loopback
  if (ip === '127.0.0.1') {
    return true;
  }
  // IPv6 loopback
  if (ip === '::1' || ip === '::ffff:127.0.0.1') { // Added ::ffff:127.0.0.1 for completeness
    return true;
  }
  return false;
};

const ipFilter = (req: Request, res: Response, next: NextFunction): void => {
  let clientIp = `${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`;
  if (!clientIp) {
    logger.warn('Blocked access: Client IP not found.');
    res.status(403).json({ error: 'Unsupported network.' });
    return;
  }

  // Handle IPv4-mapped IPv6 addresses (e.g., ::ffff:127.0.0.1) by converting them to IPv4
  if (clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.replace('::ffff:', '');
  }

  if (config.allowedIP === '*' || (clientIp === config.allowedIP) || (isLoopbackAddress(clientIp) && isLoopbackAddress(config.allowedIP))) {
    next();
  } else {
    logger.warn(`Blocked access from IP: ${clientIp} (Configured: ${config.allowedIP})`);
    res.status(403).json({ error: 'Unsupported network.' });
  }
};

export default ipFilter;
