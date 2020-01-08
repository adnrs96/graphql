import { Server } from './Server'
import { GraphQLServer } from './Postgraphile'

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
  const postgraphile = new GraphQLServer(process.env.DATABASE_URL, process.env.JWT_VERIFICATION_KEY)
  const server = new Server(postgraphile)
  await server.start()
  const graceful = async () => {
    await server.stop()
    process.exit(0)
  }
  process.on('SIGTERM', graceful)
  process.on('SIGINT', graceful)
}
