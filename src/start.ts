import Server from './express'
import GraphQLServer from './postgraphile'

export async function start(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL envvar is required, it should be the authenticated URL to the database using the unprivileged storyscript_authenticator account, e.g. postgres://storyscript_authenticator:SUPER_SECURE_PASSWORD_HERE@pghost/storyscript'
    )
  }
  if (!process.env.JWT_VERIFICATION_KEY) {
    throw new Error(
      'JWT_VERIFICATION_KEY envvar is required, it should be the secret used to verify the JWT user token'
    )
  }
  if (!process.env.WHITELIST_DOMAINS_REGEXP) {
    throw new Error(
      'WHITELIST_DOMAINS_REGEXP envvar is required, it should be the list of domains allowed to access to the graphql api, e.g /^http[s]*://([w-.]*)localhost(:8080)?$/'
    )
  }

  const postgraphile = new GraphQLServer(process.env.DATABASE_URL, process.env.JWT_VERIFICATION_KEY)
  const server = new Server(postgraphile, process.env.WHITELIST_DOMAINS_REGEXP)

  await server.start()

  const graceful = async () => {
    await server.stop()
    process.exit(0)
  }

  process.on('SIGTERM', graceful)
  process.on('SIGINT', graceful)
}
