# Installation

MkDocs Server is available as a Docker application.

## Using Docker Compose

1. Clone the [https://github.com/nonplus/mkdocs-server.git](https://github.com/nonplus/mkdocs-server.git) repo.
2. Run `docker-compose up`

Docker compose will build the application, create a `mkdocs-server/data` volume
and start up the server on [http://localhost:3001](http://localhost:3001).

## Using Docker

You can use docker commands to manually build and launch the server:

```bash
# Create volume to persist data
docker volume create mkdocs-server-data

# Build image
docker build -t mkdocs-server .

# Run container
docker run -p 3001:3001 \
   --mount source=mkdocs-server-data,target=/mkdocs-server/data \
   mkdocs-server
```

## Development

The [README.md](https://github.com/nonplus/mkdocs-server/blob/master/README.md#prerequisites)
contains instructions on running MkDocs Server in a development environment.
