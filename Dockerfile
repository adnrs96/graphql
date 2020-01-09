FROM          node:alpine
LABEL         description="The Storyscript GraphQL stack, based on PostGraphile https://graphile.org/postgraphile/"

WORKDIR       /app
COPY          package.json .
COPY          yarn.lock .
RUN           yarn install --production
COPY          . .
RUN           yarn build

ENTRYPOINT    ["yarn", "start"]
