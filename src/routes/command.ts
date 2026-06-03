import express, { Request, Response } from 'express';
import fs from 'fs/promises';
import mqtt, { ErrorWithReasonCode } from 'mqtt';
import config from '../config.ts';
import * as logger from '../logger.ts';
import ipFilter from '../middlewares/ipFilter.ts';
import getDirPath from '../helpers/getDirPath.ts';

const router = express.Router();

interface BasicAuthCredentials {
  username: string;
  password: string;
}

interface MqttCommandPayload {
  id: number;
  src: string;
  method: string;
  params: Record<string, any>;
}

const parseBasicAuth = (req: Request): BasicAuthCredentials | null => {
  const authHeader = req.headers.authorization as string | undefined;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return null;
  }
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  return { username: username || '', password: password || '' };
};

router.get('/:command?', ipFilter, async (req: Request, res: Response) => {
  const basicAuth = parseBasicAuth(req);
  const mqttUser: string | undefined = basicAuth?.username || (req.headers['x-mqtt-user'] as string);
  const mqttPass: string | undefined = basicAuth?.password || (req.headers['x-mqtt-pass'] as string);
  const mqttCommand: string | undefined = (req.params.command as string) || (req.headers['x-mqtt-command'] as string);

  if (!mqttUser || !mqttPass) {
    return res.status(401).json({ error: 'Missing credentials.' });
  }

  const client = mqtt.connect(config.mqtt_broker_url, {
    username: mqttUser,
    password: mqttPass,
    connectTimeout: 2000,
    reconnectPeriod: 0,
  });

  if (!mqttCommand) {
    client.end();
    return res.status(400).json({ error: 'No command specified.' });
  }

  client.on('connect', async () => {
    const topic = `${config.mqtt_topic}/${mqttUser}/rpc`;

    let payload: MqttCommandPayload;
    try {
      const commandPath = getDirPath('..', '..', 'command', `${mqttCommand}.json`);
      const fileContent = await fs.readFile(commandPath, 'utf8');
      payload = JSON.parse(fileContent);
    } catch (err: any) {
      client.end();
      if (err.code === 'ENOENT') {
        logger.error(`Command file not found: ${mqttCommand}.json`);
        return res.status(404).json({ error: 'Wrong command' });
      }
      logger.error('Command definition failed', err);
      return res.status(500).json({ error: 'Command definition failed' });
    }

    client.publish(topic, JSON.stringify(payload), { qos: 1 }, (error) => {
      if (error) {
        logger.error('MQTT Publish error', error.message);
        client.end();
        return res.status(500).json({ error: 'Failed to publish MQTT command.' });
      }
      client.end();
      return res.json({ success: true, message: 'Command sent.', command: mqttCommand });
    });
  });

  client.on('error', (err: Error | ErrorWithReasonCode) => {
    logger.error('MQTT Error', (err as ErrorWithReasonCode)?.code.toString());
    client.end();
    if (!res.headersSent) {
      return res.status(401).json({ error: 'MQTT connection refused.', err });
    }
  });
});

export default router;
