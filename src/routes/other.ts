import express, { Request, Response } from 'express';
import getDirPath from '../helpers/getDirPath.ts';

const router = express.Router();


router.all('*', (req: Request, res: Response) => {
  if (req.path !== '/') {
    return res.redirect('/');
  }
  // Fallback
  res.sendFile(getDirPath('..', '..', 'public', 'index.html'), { maxAge: '1d' });
});

export default router;
