const rfs = require('rotating-file-stream');
const path = require('path');
const config = require('./config');

const accessLogStream = rfs.createStream('access.log', {
  interval: config.logRotation,
  path: path.join(__dirname, '..', 'log')
});

const log = (level, msg) => {
  const entry = `[${new Date().toISOString()}] ${level.toUpperCase()}: ${msg}\n`;
  accessLogStream.write(entry);
};

module.exports = {
  stream: accessLogStream,
  warn: (msg) => log('warn', msg),
  error: (msg) => log('error', msg)
};
