import app from './app.ts';
import config from './config.ts';

app.listen(config.gatewayPort, () => console.log(`MQTT Proxy Gateway is running on port ${config.gatewayPort}`));
