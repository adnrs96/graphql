import postgraphile, { HttpRequestHandler, PostGraphileOptions, mixed } from 'postgraphile'
import { Request, Response } from 'express'
import TokenManager from '../utils/TokenManager'
import StoryscriptPlugin from './StoryscriptPlugin'

export default class GraphQLServer {
  private readonly _handler: HttpRequestHandler
  private readonly schemas: string[] = ['app_public']
  private readonly opts: PostGraphileOptions<Request, Response>
  private readonly databaseURL: string
  private readonly verificationKey: string

  constructor(databaseURL: string, verificationKey: string, debug: boolean, opts?: PostGraphileOptions) {
    this.databaseURL = databaseURL
    this.verificationKey = verificationKey

    // PostGraphile options are documented here:
    // https://www.graphile.org/postgraphile/usage-library/#api-postgraphilepgconfig-schemaname-options
    /* istanbul ignore next line */
    this.opts = {
      dynamicJson: true,
      graphiql: true,
      bodySizeLimit: '2MB',
      appendPlugins: [StoryscriptPlugin],
      enableCors: false,
      watchPg: debug,
      ignoreRBAC: false,
      setofFunctionsContainNulls: false,
      legacyRelations: 'omit',
      enhanceGraphiql: true,
      disableQueryLog: !debug,
      showErrorStack: debug,
      extendedErrors: debug ? ['hint', 'detail', 'errcode'] : ['errcode'],
      retryOnInitFail: true,
      pgSettings: (req: Request): Promise<{ [key: string]: mixed }> => this.pgSettings(req),
      ...opts
    }

    this._handler = postgraphile<Request, Response>(this.databaseURL, this.schemas, this.opts)
  }

  public async handler(): Promise<HttpRequestHandler> {
    await this._handler.getGraphQLSchema()
    return this._handler
  }

  public async disconnect() {
    await this._handler.pgPool.end()
  }

  // pgSettings is documented here:
  // https://www.graphile.org/postgraphile/usage-library/#pgsettings-function
  private async pgSettings(request: Request): Promise<{ [key: string]: mixed }> {
    const basePermissions = {
      // Logged in or not, you're a visitor:
      role: 'asyncy_visitor'
    }

    const manager = TokenManager.from(request).with(this.verificationKey, { issuer: 'storyscript' })
    if (manager.hasToken) {
      return { ...basePermissions, 'jwt.claims.owner_uuid': manager.get.owner_uuid }
    }
    return basePermissions
  }
}
