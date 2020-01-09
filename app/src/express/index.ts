import express from 'express'
import { Server as HttpServer } from 'http'
import cors from 'cors'
import morgan from 'morgan'
import cookies from 'cookie-parser'
import helmet from 'helmet'
import GraphQLServer from '../postgraphile'
import { UnauthorizedError } from '../utils/Errors'

export default class Server {
  public PORT: number
  private whitelist: RegExp
  private corsOptions: cors.CorsOptions

  private readonly _app: express.Application
  private server?: HttpServer = undefined
  private readonly postgraphile: GraphQLServer

  /**
   * get the current express application object
   *
   * @returns {express.Application} the app object
   */
  public get app(): express.Application {
    return this._app
  }

  constructor(postgaphile: GraphQLServer, whitelistRegexp: string, port = 3000) {
    this._app = express()
    this.whitelist = new RegExp(whitelistRegexp)
    this.corsOptions = {
      allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
      credentials: true,
      methods: 'GET,OPTIONS,POST',
      origin: (origin: string | undefined, callback: Function): void => {
        if (!origin || this.whitelist.test(origin)) {
          callback(null, true)
        } else {
          callback(new UnauthorizedError('Not allowed by CORS'), false)
        }
      },
      preflightContinue: false
    }
    this.config()
    this.PORT = +(process.env.PORT || port)
    this.postgraphile = postgaphile

    this.postConfig()
  }

  /**
   * Start the server
   *
   * @returns {Promise<any>} returns Void when the server is started
   */
  public async start(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.server = this._app.listen(this.PORT, (err: any) => {
        if (err) {
          return reject(err)
        }

        console.log(`Server is running on http://localhost:${this.PORT}`)
        return resolve()
      })
    })
  }

  /**
   * Stop the server (if running)
   *
   * @returns {boolean} returns true if the server is closed
   */
  public async stop(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      if (this.server) {
        this.server.close(() => {
          return resolve(true)
        })
      } else {
        return resolve(true)
      }
    })
  }

  /**
   * Configure the express app middlewares, before services are registered
   */
  private config(): void {
    this._app.use(cors(this.corsOptions))
    this._app.use(cookies())
    this._app.use(helmet())
    this._app.use(morgan('combined'))
  }

  /**
   * Configure the express app middlewares, after services are registered
   */
  private postConfig(): void {
    this._app.options('*', cors(this.corsOptions))
    this._app.use(this.postgraphile.handler)
  }
}
