import Starter from '../src/start'

describe('start', () => {
  let instance: Starter
  let exitMock: jest.SpyInstance

  describe('without environment', () => {
    it('should ask for a database url', async () => {
      await expect(Starter.init()).rejects.toThrow('DATABASE_URL')
    })
    it('should ask for a jwt verification key', async () => {
      process.env.DATABASE_URL = 'postgresql://storyscript-ci:storyscript-ci-pwd@localhost:5432/storyscript'
      await expect(Starter.init()).rejects.toThrow('JWT_VERIFICATION_KEY')
    })
    it('should ask for a whitelist regexp', async () => {
      process.env.DATABASE_URL = 'postgresql://storyscript-ci:storyscript-ci-pwd@localhost:5432/storyscript'
      process.env.JWT_VERIFICATION_KEY = 'secret'
      await expect(Starter.init()).rejects.toThrow('WHITELIST_DOMAINS_REGEXP')
    })
  })

  describe('with a valid environment', () => {
    beforeAll(() => {
      process.env.DATABASE_URL = 'postgresql://storyscript-ci:storyscript-ci-pwd@localhost:5432/storyscript'
      process.env.JWT_VERIFICATION_KEY = 'secret'
      process.env.WHITELIST_DOMAINS_REGEXP = '^http[s]*:\\/\\/([\\w\\-\\.]*)localhost(:[38]0([0-9][0-9])?)?$'
      exitMock = jest.spyOn(process, 'exit').mockImplementation()
    })

    afterAll(() => {
      exitMock.mockClear()
    })

    beforeEach(async () => {
      instance = await Starter.init()
    })

    afterEach(async () => {
      await instance.exit()
    })

    it('should start and stop server properly', async () => {
      expect.assertions(8)
      expect(instance.isStarted).toBeFalsy()
      await expect(instance.stop()).resolves.toBeFalsy()
      expect(instance.isStarted).toBeFalsy()
      await expect(instance.start()).resolves.toBeTruthy()
      await expect(instance.start()).resolves.toBeTruthy()
      expect(instance.isStarted).toBeTruthy()
      await expect(instance.stop()).resolves.toBeTruthy()
      expect(instance.isStarted).toBeFalsy()
    })

    it('should fail starting a server twice', async () => {
      expect.assertions(6)
      const problemIncoming = await Starter.init()
      expect(instance.isStarted).toBeFalsy()
      expect(problemIncoming.isStarted).toBeFalsy()
      await expect(instance.start()).resolves.toBeTruthy()
      await expect(problemIncoming.start()).rejects.toThrow('EADDRINUSE')
      expect(instance.isStarted).toBeTruthy()
      expect(problemIncoming.isStarted).toBeFalsy()
      problemIncoming.stop()
    })
  })
})
