import { start } from './start'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()
if (process.env.NODE_ENV !== 'production') {
  try {
    const file = fs.readFileSync('.env.local')
    const envConfig = dotenv.parse(file)
    if (envConfig) {
      for (const k in envConfig) {
        process.env[k] = envConfig[k]
      }
    }
  } catch (ignored) {}
}

start().catch((err: Error) => {
  console.error(`Error starting server: ${err.message}`)
  process.exit(1)
})
