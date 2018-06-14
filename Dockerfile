FROM          graphile/postgraphile

COPY          ./AsyncyPlugin.js /AsyncyPlugin.js

ENTRYPOINT    ["postgraphile", \
               "-n", "0.0.0.0", \
               "-c", "postgres://postgres:@postgres:5432/postgres", \
               "--schema", "app_public", \
               "--dynamic-json", \
               "--append-plugins", "/AsyncyPlugin.js"]
