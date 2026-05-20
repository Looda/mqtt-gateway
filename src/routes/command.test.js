const request = require('supertest');
const express = require('express');
const router = require('./command');

// Mock dependencies
jest.mock('mqtt', () => {
  const EventEmitter = require('events');
  const mockClient = new EventEmitter();
  mockClient.end = jest.fn();
  mockClient.publish = jest.fn((topic, payload, options, callback) => {
    if (callback) setImmediate(() => callback(null));
  });

  return {
    connect: jest.fn((url, options) => {
      // Clear listeners from previous test runs to prevent side effects
      mockClient.removeAllListeners();

      // Simulate async connection behavior based on credentials
      setImmediate(() => {
        if (options.username === 'test' && options.password === 'password') {
          mockClient.emit('connect');
        } else {
          mockClient.emit('error', { code: 'ECONNREFUSED' });
        }
      });

      return mockClient;
    }),
  };
});
jest.mock('../logger');
jest.mock('../middlewares/ipFilter', () => (req, res, next) => next());
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn().mockResolvedValue(JSON.stringify({ method: "Switch.Set", params: { id: 0, on: true } })),
  },
}));

const app = express();
app.use('/command', router);

describe('GET /command', () => {
  it('should return 401 if credentials are missing', async () => {
    const response = await request(app).get('/command');
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Missing credentials.');
  });
  it('should return 401 if credentials are incorrect for headers', async () => {
    const response = await request(app)
      .get('/command')
      .set('x-mqtt-command', 'toggle')
      .set('x-mqtt-user', 'user')
      .set('x-mqtt-pass', 'wrong');
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('MQTT connection refused.');
  });
  it('should return 401 if credentials are incorrect basic auth', async () => {
    const auth = Buffer.from('user:wrong').toString('base64');
    const response = await request(app)
      .get('/command/toggle')
      .set('Authorization', `Basic ${auth}`);
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('MQTT connection refused.');
  });


  it('should return 400 if command is missing', async () => {
    const response = await request(app)
      .get('/command')
      .set('x-mqtt-user', 'test')
      .set('x-mqtt-pass', 'password');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('No command specified.');
  });

  it('should accept Basic Auth credentials and proceed', async () => {
    const auth = Buffer.from('test:password').toString('base64');
    const response = await request(app)
      .get('/command')
      .set('Authorization', `Basic ${auth}`);

    // Since no command is provided, it should hit the 400 check
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('No command specified.');
  });

  it('should return 401 if MQTT connection fails with wrong credentials', async () => {
    const auth = Buffer.from('user:pass').toString('base64');
    const response = await request(app)
      .get('/command/toggle')
      .set('Authorization', `Basic ${auth}`);

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('MQTT connection refused.');
  });

  it('should return 200 when correct credentials are provided', async () => {
    // Using the credentials specified in the prompt: 'test' and 'passowrd'
    const auth = Buffer.from('test:password').toString('base64');
    const response = await request(app)
      .get('/command/toggle')
      .set('Authorization', `Basic ${auth}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
