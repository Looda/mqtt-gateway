import { createStream } from 'rotating-file-stream';
import { Writable } from 'stream';
import config from './config.ts';
import getDirPath from './helpers/getDirPath.ts';

interface Logger {
  stream: Writable;
  warn: (msg: string) => void;
  error: (msg: string) => void;
}

export const stream = createStream('access.log', {
  interval: config.logRotation,
  path: getDirPath('..', '..', 'log'),
});

const log = (level: 'warn' | 'error', msg: string, detail?: string): void => {
  const entry = `[${new Date().toISOString()}] ${level.toUpperCase()}: ${msg}${detail ? ' ' + detail : ''}\n`;
  stream.write(entry);
};

export const warn = (msg: string, detail?: string): void => log('warn', msg, detail);
export const error = (msg: string, detail?: string): void => log('error', msg, detail);
