## Storyscript GraphQL server

> We use [postgraphile](https://www.graphile.org/postgraphile/) on top of [express](https://expressjs.com/)


### Development
```bash
# install the dependencies
yarn

# watch ts changes and start the server
yarn watch

# transpile to es6
yarn build

# start the previous build
yarn start
```

### Production
```bash
# install the dependencies
yarn install --production

# build
yarn build

# run
yarn start
```


#### Docker
```bash
# to build
docker build -t storyscript/graphql .

# to run
docker run \
    -p 3000:3000 \
    -e PORT=3000 \
    -e DATABASE_URL=postgresql://asyncy_authenticator:PLEASE_CHANGE_ME@localhost:5432/storyscript \
    -e JWT_VERIFICATION_KEY=secret \
    -e WHITELIST_DOMAINS_REGEXP="^http[s]*:\/\/([\w\-\.]*)localhost(:[38]0([0-9][0-9])?)?$" \
    --name storyscript_graphql \
    -d storyscript/graphql
```
