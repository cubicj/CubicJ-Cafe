import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEST_DB_PATH = path.resolve(__dirname, '.test.db')

export function setup() {
  fs.closeSync(fs.openSync(TEST_DB_PATH, 'a'))

  execFileSync('npx', ['prisma', 'db', 'push', '--skip-generate', '--accept-data-loss'], {
    env: { ...process.env, DATABASE_URL: `file:${TEST_DB_PATH}` },
    stdio: 'pipe',
    shell: true,
  })
}

export function teardown() {
  const filesToClean = [
    TEST_DB_PATH,
    TEST_DB_PATH + '-journal',
    TEST_DB_PATH + '-wal',
    TEST_DB_PATH + '-shm',
  ]
  for (const filePath of filesToClean) {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    } catch {
      // ignore cleanup errors
    }
  }
}
