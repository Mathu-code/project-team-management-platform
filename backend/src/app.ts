import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { env, corsOrigins } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import apiRoutes from './routes/api.js';

export function createApp(): Application {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(morgan(env.isProduction ? 'combined' : 'dev'));

  console.log(`[ptmp-backend] CORS origins: ${corsOrigins.join(', ') || '(none)'}`);
  console.log(`[ptmp-backend] DATABASE_URL host: ${(env.DATABASE_URL || '').split('@')[1]?.split('/')[0] || '(missing)'}`);

  app.use(
    `${env.API_PREFIX}/auth/login`,
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use(env.API_PREFIX, apiRoutes);

  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
