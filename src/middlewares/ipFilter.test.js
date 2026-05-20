const ipFilter = require('./ipFilter');
const config = require('../config');
const logger = require('../logger');

jest.mock('../config');
jest.mock('../logger');

describe('ipFilter Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      socket: { remoteAddress: '127.0.0.1' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    config.allowedIP = '127.0.0.1';
  });

  it('should allow access for the allowed IPv4 loopback address', () => {
    req.socket.remoteAddress = '127.0.0.1';
    ipFilter(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should allow access for the allowed IPv6 loopback address', () => {
    req.socket.remoteAddress = '::1';
    ipFilter(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should allow access if x-forwarded-for matches allowed IP', () => {
    config.allowedIP = '192.168.1.100';
    req.headers['x-forwarded-for'] = '192.168.1.100';
    ipFilter(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should block access for unallowed IP and log a warning', () => {
    config.allowedIP = '127.0.0.1';
    req.socket.remoteAddress = '192.168.1.50';
    
    ipFilter(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(logger.warn).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
