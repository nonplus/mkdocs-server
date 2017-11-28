FROM alpine:3.6

WORKDIR /mkdocs-server

RUN mkdir data data/repos

RUN apk add --update git nodejs nodejs-npm python py-pip openssh

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
COPY mkdocs-packages.txt .
RUN pip install -r mkdocs-packages.txt

ENV NODE_ENV PRODUCTION

CMD ["node", "dist/"]
