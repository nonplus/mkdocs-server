# MkDocs Server

Web server for building MkDocs sites from Git Repos and hosting generated sites for authenticated users.

## Motivation

Documentation is an important part of any software projects.
GitHub Pages offer a great way to manage publicly accessible project documentation for public and private projects.

However, there isn't an easy way to restrict access to GitHub Pages documentation.

The MkDocs Server can automatically build [MkDocs](http://www.mkdocs.org/) sites from remote Git repositories
and restrict access to the generated sites to authenticated users.

## Caveats

This project is currently under development and functionality is limited to the following:

1. Only supports Google Authentication (can add others in the future)
1. Only clones repos that don't require credentials (i.e. you have manually create/configure deploy keys)
1. No user documentaion (ironic, I know...)

### Roadmap

- [ ] Support Deploy Keys for Git Repos
- [ ] Add webhook for triggering builds
- [ ] Support non-root mkdocs.yaml
- [ ] Refactor authentication
- [ ] Add support for Microsoft Login
- [ ] Add support for GitHub Login
- [ ] Add support for Slack login
- [ ] Write documentation

## Running in a Docker Container

The server can be run as a docker container with the server listening on port `3001`.
Configuration, cloned repos and generated sites are stored at `/mkdocs-server/data`.

You can run the server using [Docker Compose](https://docs.docker.com/compose/):

```bash
docker-compose up
```

Or you use the usual docker commands:

```bash
# Create volume to persist data
docker volume create mkdocs-server-data

# Build image
docker build -t mkdocs-server .

# Run container
docker run -p 3001:3001 --mount source=mkdocs-server-data,target=/mkdocs-server/data mkdocs-server
```

## Prerequisites

To run the server on your development machine, you'll need the following:

* Properly [installed MkDocs](http://www.mkdocs.org/#installation)
* A current version of Node for running mkdocs-server

### Installation

```bash
npm install
```

### Production

```bash
npm run serve
```

### Development

```bash
npm run dev
```

### Running tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Building a container

```bash
docker build .
```

## Copyright & License


Copyright 2017 Stepan Riha. All Rights Reserved.

This may be redistributed under the MIT licence. For the full license terms, see the LICENSE file which
should be alongside this readme.
