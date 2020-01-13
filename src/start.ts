import Server from './express'
import GraphQLServer from './postgraphile'

export default class Starter {
  private readonly server: Server
  private readonly postgraphile: GraphQLServer
  private started: boolean = false

  constructor(postgraphile: GraphQLServer, server: Server) {
    this.postgraphile = postgraphile
    this.server = server
  }

  private async mount(): Promise<Starter> {
    const handler = await this.postgraphile.handler()
    this.server.app.use(handler)

    return this
  }

  public static async init(): Promise<Starter> {
    if (!process.env.DATABASE_URL) {
      return Promise.reject(
        new Error(
          'DATABASE_URL envvar is required, it should be the authenticated URL to the database using the unprivileged storyscript_authenticator account, e.g. postgres://storyscript_authenticator:SUPER_SECURE_PASSWORD_HERE@pghost/storyscript'
        )
      )
    }
    if (!process.env.JWT_VERIFICATION_KEY) {
      return Promise.reject(
        new Error('JWT_VERIFICATION_KEY envvar is required, it should be the secret used to verify the JWT user token')
      )
    }
    if (!process.env.WHITELIST_DOMAINS_REGEXP) {
      return Promise.reject(
        new Error(
          'WHITELIST_DOMAINS_REGEXP envvar is required, it should be the list of domains allowed to access to the graphql api, e.g ^http[s]*://([w-.]*)localhost(:8080)?$'
        )
      )
    }
    const starter = new Starter(
      new GraphQLServer(process.env.DATABASE_URL, process.env.JWT_VERIFICATION_KEY, process.env.DEBUG_MODE === 'true'),
      new Server(process.env.WHITELIST_DOMAINS_REGEXP)
    )
    await starter.mount()
    return starter
  }

  /* istanbul ignore next line */
  public async exit() {
    await this.stop()
    process.exit(0)
  }

  public async stop(): Promise<boolean> {
    return await this.server.stop().then(async (stopped: boolean) => {
      if (this.started) {
        await this.postgraphile.disconnect()
        this.started = false
      }
      return stopped
    })
  }

  public get isStarted(): boolean {
    return this.started
  }

  public async start(): Promise<boolean> {
    return await this.server
      .start()
      .then((started: boolean) => {
        this.started = started
        return started
      })
      .catch(async e => {
        await this.postgraphile.disconnect()
        throw e
      })
  }

  /* istanbul ignore next line */
  public async startAndWatchProcess() {
    await this.start()
    process.on('SIGTERM', () => this.exit())
    process.on('SIGINT', () => this.exit())
  }
}
