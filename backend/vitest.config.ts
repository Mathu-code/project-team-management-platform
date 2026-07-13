import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    env: {
      JWT_SECRET: 'test-secret-key-for-unit-tests',
      NODE_ENV: 'test',
    },
  },
});
