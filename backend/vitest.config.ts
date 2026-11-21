import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 60000,
    hookTimeout: 60000,
    include: ['tests/**/*.test.ts'],
    fileParallelism: false, // Menjalankan tes secara serial agar tidak bentrok di PostgreSQL
    maxWorkers: 1,
  },
});
