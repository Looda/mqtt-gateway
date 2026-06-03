import { describe, expect, it, jest } from '@jest/globals';
import express, { Application } from 'express';
import request from 'supertest';
import router from './command.ts';

jest.mock('../logger.ts');
jest.mock('../middlewares/ipFilter.ts', () => (_req: any, _res: any, next: any) => next());
jest.mock('fs/promises', () => ({
  readFile: jest.fn<() => Promise<string>>().mockResolvedValue(JSON.stringify({ method: "Switch.Set", params: { id: 0, on: true } })),
}));

const app: Application = express();
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

  it('should accept Basic Auth credentials and fails with missing command', async () => {
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
