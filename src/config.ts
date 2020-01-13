import dotenv from 'dotenv'
import fs from 'fs'

export default class Config {
  constructor() {
    dotenv.config()
  }

  /* istanbul ignore next line */
  private load(env: string) {
    if (fs.existsSync(`.env.${env}`)) {
      try {
        const file = fs.readFileSync(`.env.${env}`)
        const envConfig = dotenv.parse(file)
        if (envConfig) {
          for (const k in envConfig) {
            process.env[k] = envConfig[k]
          }
        }
      } catch (ignored) {}
    }
  }

  public static prepare() {
    const config = new Config()
    config.load('local')
  }
}
