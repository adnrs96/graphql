FROM          node:alpine

RUN           npm install -g postgraphile

ENTRYPOINT    ["postgraphile", "-n", "0.0.0.0"]
