const http = require("http");
const { postgraphile } = require("postgraphile");
const manifest = require("postgraphile/package.json");
const pg = require("pg");

const isDev = process.env.NODE_ENV === "development";

const POSTGRAPHILE_ERRORS_TO_SHOW = false
  ? ["hint", "detail", "errcode"]
  : [
      // This list is excessive, but it does sometimes help debugging! We'll
      // only use this in development, not production.
      "severity",
      "code",
      "detail",
      "hint",
      "positon",
      "internalPosition",
      "internalQuery",
      "where",
      "schema",
      "table",
      "column",
      "dataType",
      "constraint",
      "file",
      "line",
      "routine"
    ];

const rootDatabaseURL = process.env.ROOT_DATABASE_URL;
const databaseURL = process.env.DATABASE_URL;
if (!rootDatabaseURL) {
  throw new Error(
    "ROOT_DATABASE_URL envvar is required, it should be the authenticated URL to the database using the superuser account, e.g. postgres://superuser:superuser_password@pghost/asyncy"
  );
}
if (!databaseURL) {
  throw new Error(
    "DATABASE_URL envvar is required, it should be the authenticated URL to the database using the unprivileged asyncy_authenticator account, e.g. postgres://asyncy_authenticator:SUPER_SECURE_PASSWORD_HERE@pghost/asyncy"
  );
}

const databaseSchemaNames = ["app_public"];

const rootPgPool = new pg.Pool({
  connectionString: rootDatabaseURL
});

// pgSettings is documented here:
// https://www.graphile.org/postgraphile/usage-library/#pgsettings-function
async function pgSettings(req) {
  const basePermissions = {
    // Logged in or not, you're a visitor:
    role: "asyncy_visitor"
  };
  const auth = req.headers.authorization || "";
  const matches = auth.match(/^bearer ([-a-zA-Z0-9_/+=]+)$/i);
  if (matches) {
    const token = matches[1];
    // TODO: need to consider adding more `WHERE` clauses to the below SQL query - e.g. `type`, `permissions`, etc.
    // TODO: security review
    const {
      rows: [row]
    } = await rootPgPool.query(
      `
        select tokens.*
        from app_private.token_secrets
        inner join app_public.tokens ON (tokens.uuid = token_secrets.token_uuid)
        where token_secrets.secret = $1
        and expires >= NOW()
        limit 1
      `,
      [token]
    );
    if (!row) {
      // ensure the error object is matching GraphQL/PostGraphile object: error { name, message, statusCode }
      var error = new Error("InvalidOrExpiredToken");
      error.statusCode = 401;
      error.name = "InvalidOrExpiredToken";
      throw error;
    }
    return {
      ...basePermissions,

      // Though this is not actually a JWT, we know that the 'jwt' namespace is
      // safe within PostgreSQL and we may want to use JWTs in future, so using
      // the same mechanism for everything makes sense - saves us having to
      // COALESCE(...) a number of different settings.
      "jwt.claims.owner_uuid": row.owner_uuid,
      ...(row.permissions
        ? { "jwt.claims.permissions": row.permissions.join(",") }
        : null)
    };
  }
  return {
    ...basePermissions
  };
}

// PostGraphile options are documented here:
// https://www.graphile.org/postgraphile/usage-library/#api-postgraphilepgconfig-schemaname-options
const postgraphileOptions = {
  dynamicJson: true,
  graphiql: true,
  bodySizeLimit: "10MB",
  appendPlugins: [require("./AsyncyPlugin")],
  pgSettings,

  watchPg: isDev,
  ignoreRBAC: false,
  setofFunctionsContainNulls: false,
  legacyRelations: "omit",

  disableQueryLog: !isDev,
  showErrorStack: isDev,
  extendedErrors: isDev ? POSTGRAPHILE_ERRORS_TO_SHOW : ["errcode"]
};
const server = http
  .createServer(
    postgraphile(databaseURL, databaseSchemaNames, postgraphileOptions)
  )
  .listen(5000, "0.0.0.0", () => {
    const actualPort = server.address().port;
    console.log(
      `Asyncy GraphQL, running PostGraphile v${
        manifest.version
      } listening on port ${actualPort.toString()} 🤩`
    );
  });
