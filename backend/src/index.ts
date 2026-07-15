import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`[ptmp-backend] listening on http://0.0.0.0:${env.PORT} (${env.NODE_ENV})`);
  console.log(`[ptmp-backend] API prefix: ${env.API_PREFIX}`);
});

export default app;
