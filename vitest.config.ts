import path from 'path'
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/setup.ts'],
    setupFiles: ['tests/setup-mocks.ts'],
    env: {
      DATABASE_URL: `file:${path.resolve(__dirname, 'tests/.test.db')}`,
      ADMIN_DISCORD_IDS: 'admin-discord-123',
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
