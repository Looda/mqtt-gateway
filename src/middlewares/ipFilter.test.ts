import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NextFunction, Request, Response } from 'express';
import config from '../config.ts';
import * as logger from '../logger.ts';
import ipFilter from './ipFilter.ts';

jest.mock('../config.ts');
jest.mock('../logger.ts');

describe('ipFilter Middleware', () => {
  let req: Partial<Request>, res: Partial<Response>, next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
      socket: { remoteAddress: '127.0.0.1' } as any
    };
    res = {
      status: jest.fn<() => Response>().mockReturnThis(),
      json: jest.fn<() => Response>().mockReturnThis()
    };
    next = jest.fn();
    (config as any).allowedIP = '127.0.0.1';
  });

  it('should allow access for the allowed IPv4 loopback address', () => {
    (req.socket as any).remoteAddress = '127.0.0.1';
    ipFilter(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should allow access for the allowed IPv6 loopback address', () => {
    (req.socket as any).remoteAddress = '::1';
    ipFilter(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should allow access if x-forwarded-for matches allowed IP', () => {
    (config as any).allowedIP = '192.168.1.100';
    req.headers!['x-forwarded-for'] = '192.168.1.100';
    ipFilter(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should block access for unallowed IP and log a warning', () => {
    (config as any).allowedIP = '127.0.0.1';
    (req.socket as any).remoteAddress = '192.168.1.50';

    ipFilter(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});