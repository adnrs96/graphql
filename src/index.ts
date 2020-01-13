import Starter from './start'
import Config from './config'

Config.prepare()

Starter.init().then((instance: Starter) => {
  instance.startAndWatchProcess().catch((err: Error) => {
    console.error(`Error starting server: ${err.message}`)
    process.exit(1)
  })
})
