import express from 'express'
import { Server as HttpServer } from 'http'
import cors from 'cors'
import morgan from 'morgan'
import cookies from 'cookie-parser'
import helmet from 'helmet'
import { UnauthorizedError } from '../utils/Errors'

export default class Server {
  public PORT: number
  private whitelist: RegExp
  private corsOptions: cors.CorsOptions

  private readonly _app: express.Application
  private server?: HttpServer = undefined

  /**
   * get the current express application object
   *
   * @returns {express.Application} the app object
   */
  public get app(): express.Application {
    return this._app
  }

  constructor(whitelistRegexp: string, port = 3000) {
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
    this.PORT = +(process.env.PORT || port)
    this.config()
  }

  /**
   * Start the server
   *
   * @returns {Promise<boolean>} returns true when the server is started
   */
  public async start(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (this.server) return resolve(true)

      this.server = this._app
        .listen(this.PORT, () => {
          console.log(`Server is running on http://localhost:${this.PORT}`)
          resolve(true)
        })
        .on('error', (err: Error) => {
          reject(err)
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
      if (!this.server) return resolve(false)

      this.server.close((err?: Error) => {
        if (err) {
          resolve(false)
        } else {
          resolve(true)
        }
      })
    })
  }

  /**
   * Configure the express app middlewares
   */
  private config(): void {
    this._app.use(cors(this.corsOptions))
    this._app.use(cookies())
    this._app.use(helmet())
    this._app.use(morgan('combined'))
    this._app.options('*', cors(this.corsOptions))
  }
}
