import { jest } from '@jest/globals';
import { EventEmitter } from 'events';

jest.mock('mqtt', () => {
  const mockClient = Object.assign(new EventEmitter(), {
    end: jest.fn(),
    publish: jest.fn((_topic: string, _payload: string | Buffer, _options: any, callback?: (err: Error | null) => void) => {
      // Simulate successful publish
      if (callback) {
        setImmediate(() => callback(null));
      }
    }),
  });

  return {
    connect: jest.fn((_url: string, options: any) => {
      // Clear listeners from previous test runs to prevent side effects
      mockClient.removeAllListeners();

      // Simulate async connection behavior based on credentials
      setImmediate(() => {
        if (options?.username === 'test' && options?.password === 'password') {
          mockClient.emit('connect');
        } else {
          mockClient.emit('error', { code: 'ECONNREFUSED' });
        }
      });

      return mockClient;
    }),

    ErrorWithReasonCode: class extends Error { }
  };
});
