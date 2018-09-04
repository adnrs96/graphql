const http = require("http");
const { postgraphile } = require("postgraphile");
const manifest = require("postgraphile/package.json");

const isDev = process.env.NODE_ENV === "development";

const databaseURL =
  process.env.DATABASE_URL || "postgres://postgres:@postgres:5432/postgres";
const databaseSchemaNames = ["app_public"];

// pgSettings is documented here:
// https://www.graphile.org/postgraphile/usage-library/#pgsettings-function
function pgSettings(req) {
  return {};
}

// PostGraphile options are documented here:
// https://www.graphile.org/postgraphile/usage-library/#api-postgraphilepgconfig-schemaname-options
const postgraphileOptions = {
  dynamicJson: true,
  graphiql: true,
  appendPlugins: [require("./AsyncyPlugin")],
  pgSettings,

  watchPg: false,
  ignoreRBAC: true,
  setofFunctionsContainNulls: false,
  legacyRelations: "omit",

  disableQueryLog: !isDev,
  showErrorStack: isDev,
  extendedErrors: isDev ? ["hint", "detail", "errcode"] : ["errcode"]
};
http
  .createServer(
    postgraphile(databaseURL, databaseSchemaNames, postgraphileOptions)
  )
  .listen(5000, "0.0.0.0", () => {
    const actualPort = server.address().port;
    console.log(
      `Asyncy GraphQL, running PostGraphile v${
        manifest.version
      } listening on port ${chalk.underline(actualPort.toString())} 🚀`
    );
  });
