import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: 'node',
    fileParallelism: false,
    include: ['tests/**/*.test.{ts,tsx}'],
    globalSetup: ['tests/helpers/setup.ts'],
    setupFiles: ['tests/helpers/setup-mocks.ts'],
    env: {
      DATABASE_URL: `file:${path.resolve(__dirname, 'tests/.test.db')}`,
      ADMIN_DISCORD_IDS: 'admin-discord-123',
      DISCORD_CLIENT_ID: 'test-client-id',
      APP_URL: 'http://localhost:3000',
    },
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/app/api/**'],
      exclude: ['src/components/**', 'src/app/**/page.tsx', 'src/app/**/layout.tsx'],
    },
    benchmark: {
      include: ['tests/**/*.bench.ts'],
      outputJson: 'tests/bench-results.json',
    },
  },
})
