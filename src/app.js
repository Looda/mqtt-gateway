const express = require('express');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const morgan = require('morgan');
const commandRoutes = require('./routes/command');
const otherRoutes = require('./routes/other');
const logger = require('./logger');
const config = require('./config');

const app = express();
app.use(cors({
  methods: ['GET'],
  allowedHeaders: ['Content-Type', 'x-mqtt-user', 'x-mqtt-pass', 'x-mqtt-command'],
}));
app.use(compression());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));
app.use(morgan('combined', { stream: logger.stream }))
app.use('/command', commandRoutes);
app.use('/', otherRoutes);

module.exports = app;
