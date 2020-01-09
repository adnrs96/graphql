import postgraphile, { HttpRequestHandler, PostGraphileOptions, mixed } from 'postgraphile'
import { Request, Response } from 'express'
import Helpers from '../utils/Helpers'
import StoryscriptPlugin from './StoryscriptPlugin'

// PostGraphile options are documented here:
// https://www.graphile.org/postgraphile/usage-library/#api-postgraphilepgconfig-schemaname-options
const DEFAULT_GQL_OPTIONS: PostGraphileOptions = {
  dynamicJson: true,
  graphiql: true,
  bodySizeLimit: '2MB',
  appendPlugins: [StoryscriptPlugin],
  enableCors: false,
  watchPg: process.env.NODE_ENV === 'development',
  ignoreRBAC: false,
  setofFunctionsContainNulls: false,
  legacyRelations: 'omit',
  enhanceGraphiql: true,
  disableQueryLog: process.env.NODE_ENV !== 'development',
  showErrorStack: process.env.NODE_ENV === 'development',
  extendedErrors: process.env.NODE_ENV === 'development' ? ['hint', 'detail', 'errcode'] : ['errcode'],
  retryOnInitFail: true
}

export default class GraphQLServer {
  private readonly _handler: HttpRequestHandler
  private readonly schemas: string[] = ['app_public']
  private readonly opts: PostGraphileOptions<Request, Response>
  private readonly databaseURL: string
  private readonly verificationKey: string

  constructor(databaseURL: string, verificationKey: string, opts?: PostGraphileOptions) {
    this.databaseURL = databaseURL
    this.verificationKey = verificationKey
    this.opts = {
      ...DEFAULT_GQL_OPTIONS,
      pgSettings: (req: Request): Promise<{ [key: string]: mixed }> => this.pgSettings(req),
      ...opts
    }
    this._handler = postgraphile(this.databaseURL, this.schemas, this.opts)
  }

  public get handler(): HttpRequestHandler {
    return this._handler
  }

  // pgSettings is documented here:
  // https://www.graphile.org/postgraphile/usage-library/#pgsettings-function
  private async pgSettings(req: Request): Promise<{ [key: string]: mixed }> {
    const basePermissions = {
      // Logged in or not, you're a visitor:
      role: 'asyncy_visitor'
    }

    const token = Helpers.getTokenFromRequest(req)
    if (token) {
      const ownerUuid = Helpers.getOwnerUuidFromJWT(token, this.verificationKey, { issuer: 'storyscript' })
      return { ...basePermissions, 'jwt.claims.owner_uuid': ownerUuid }
    }
    return basePermissions
  }
}
