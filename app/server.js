const http = require("http");
const { postgraphile } = require("postgraphile");
const manifest = require("postgraphile/package.json");
const pg = require("pg");

const isDev = process.env.NODE_ENV === "development";

const rootDatabaseURL =
  process.env.ROOT_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgres://postgres@postgres/postgres";
const databaseURL =
  process.env.DATABASE_URL || "postgres://postgres@postgres/postgres";
const databaseSchemaNames = ["app_public"];

const rootPgPool = new pg.Pool({
  connectionString: rootDatabaseURL
});

// pgSettings is documented here:
// https://www.graphile.org/postgraphile/usage-library/#pgsettings-function
async function pgSettings(req) {
  const auth = req.headers.authorization || "";
  const matches = auth.match(/^bearer ([-a-zA-Z0-9_/+=]+)$/i);
  if (matches) {
    const token = matches[1];
    // TODO: assert token is a valid UUID before talking to the database.
    // TODO: need to consider adding more `WHERE` clauses to the below SQL query - e.g. `type`, `permissions`, etc.
    // TODO: security review
    const {
      rows: [row]
    } = await rootPgPool.query(
      "select * from app_public.tokens where uuid = $1 and expires <= NOW()",
      [token]
    );
    if (!row) {
      throw new Error("Invalid or expired token");
    }
    return {
      // Though this is not actually a JWT, we know that the 'jwt' namespace is
      // safe within PostgreSQL and we may want to use JWTs in future, so using
      // the same mechanism for everything makes sense - saves us having to
      // COALESCE(...) a number of different settings.
      "jwt.claims.user_id": row.owner_uuid,
      "jwt.claims.permissions": row.permissions.join(",")

      // TODO: add `role: 'asyncy_visitor'` or similar once RLS is in place.
    };
  }
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
