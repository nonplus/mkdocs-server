FROM node:9.2.0-alpine

# Configure volume and directories
RUN mkdir /mkdocs-server /mkdocs-server/data /mkdocs-server/data/repos /mkdocs-server/data/.ssh \
    && chown -R node:node /mkdocs-server

VOLUME /mkdocs-server/data

WORKDIR /mkdocs-server

RUN apk add --update git python py-pip openssh expect

# Only needed for debugging...
RUN apk add --update bash

# Port the server is listening on
ENV PORT 3001
EXPOSE 3001

# Install node dependencies
COPY package.json package.json
RUN npm install

# Build the server
COPY . .
RUN npm run build

# Install Python packages
RUN pip install -r mkdocs-packages.txt

RUN chown -R node:node /mkdocs-server

ENV NODE_ENV PRODUCTION

USER node

CMD ["node", "dist/"]
