const app = require('./app');
const config = require('./config');

app.listen(config.gatewayPort, () => console.log(`MQTT Proxy Gateway is running on port ${config.gatewayPort}`));
