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

## Running in a Docker Container

The server can be run as a docker container with the server listening on port `3001`.
The server stores its data at the `/mkdocs-server/data`.

```bash
docker build -t mkdocs-server .
docker run -p 3001:3001 mkdocs-server
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
