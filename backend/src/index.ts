import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`[ptmp-backend] listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  console.log(`[ptmp-backend] API prefix: ${env.API_PREFIX}`);
});

export default app;
