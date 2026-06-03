import compression from 'compression';
import cors from 'cors';
import express, { Application } from 'express';
import morgan from 'morgan';
import { stream } from './logger.ts';
import commandRoutes from './routes/command.ts';
import otherRoutes from './routes/other.ts';
import getDirPath from './helpers/getDirPath.ts';

const app: Application = express();

app.use(cors({
  methods: ['GET'],
  allowedHeaders: ['Content-Type', 'x-mqtt-user', 'x-mqtt-pass', 'x-mqtt-command'],
}));
app.use(compression());
app.use(express.static(getDirPath('public'), { maxAge: '1d' }));
app.use(morgan('combined', { stream }));
app.use('/command', commandRoutes);
app.use('/', otherRoutes);

export default app;
