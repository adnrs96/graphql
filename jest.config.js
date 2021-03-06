module.exports = {
  verbose: true,
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/(index|postgraphile/StoryscriptPlugin).ts'],
  testPathIgnorePatterns: ['node_modules', 'dist'],
  preset: 'ts-jest',
  testMatch: null
}
