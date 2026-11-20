import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,
    include: ['tests/**/*.test.ts'],
    threads: false, // Menjalankan serial agar transaksi database testing tidak saling tumpang tindih
  },
});
