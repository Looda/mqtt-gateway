require('dotenv').config();

module.exports = {
    gatewayPort: process.env.GATEWAY_PORT || 3000,
    allowedIP: process.env.ALLOWED_IP || '127.0.0.1',
    mqtt_broker_url: process.env.MQTT_URL || 'mqtt://localhost:1883',
    mqtt_topic: process.env.MQTT_TOPIC || 'shelly',
    logRotation: process.env.LOG_ROTATION || '3d',
};
