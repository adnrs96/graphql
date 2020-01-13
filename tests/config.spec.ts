import Config from '../src/config'

describe('config', () => {
  it('should define env value', async () => {
    expect.assertions(2)
    expect(process.env.DATABASE_URL).toBeUndefined()
    Config.prepare()
    expect(process.env.DATABASE_URL).toBeDefined()
  })
})
