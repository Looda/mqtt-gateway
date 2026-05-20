const express = require('express');
const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const config = require('../config');
const logger = require('../logger');
const ipFilter = require('../middlewares/ipFilter');

const parseBasicAuth = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return null;
  }
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  return { username, password };
};

router.get('/:command?', ipFilter, async (req, res) => {
  const basicAuth = parseBasicAuth(req);
  const mqttUser = basicAuth?.username || req.headers['x-mqtt-user'];
  const mqttPass = basicAuth?.password || req.headers['x-mqtt-pass'];
  const mqttCommand = req.params?.command || req.headers['x-mqtt-command'];

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

    let payload;
    try {
      const commandPath = path.join(__dirname, '..', '..', 'command', `${mqttCommand}.json`);
      const fileContent = await fs.promises.readFile(commandPath, 'utf8');
      payload = JSON.parse(fileContent);
    } catch (err) {
      client.end();
      if (err.code === 'ENOENT') {
        logger.error('Wrong command', mqttCommand);
        return res.status(404).json({ error: 'Wrong command' });
      }
      logger.error('Command definition failed', err);
      return res.status(500).json({ error: 'Command definition failed' });
    }

    client.publish(topic, JSON.stringify(payload), { qos: 1 }, (error) => {
      if (error) {
        logger.error('MQTT Publish error', error);
        client.end();
        return res.status(500).json({ error: 'Failed to publish MQTT command.' });
      }
      client.end();
      return res.json({ success: true, message: 'Command sent.', command: mqttCommand });
    });
  });

  client.on('error', (err) => {
    logger.error('MQTT Error', err.code);
    client.end();
    if (!res.headersSent) {
      return res.status(401).json({ error: 'MQTT connection refused.' });
    }
  });
});

module.exports = router;