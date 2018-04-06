FROM          node:alpine

RUN           npm install -g postgraphile

ENTRYPOINT    ["postgraphile", \
               "-n", "0.0.0.0", \
               "-c", "postgres://postgres:@postgres:5432/postgres", \
               "--schema", "app_public,hub_public"]
