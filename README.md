# MkDocs Server

Web server for building MkDocs sites from Git Repos and hosting generated sites for authenticated users.

## Motivation

Documentation is an important part of any software projects.
GitHub Pages offer a great way to manage publicly accessible project documentation for public and private projects.

However, there isn't an easy way to restrict access to GitHub Pages documentation.

The MkDocs Server can automatically build [MkDocs](http://www.mkdocs.org/) sites from remote Git repos
and restrict access to the generated sites to authenticated users.

## Caveats

This project is currently under development and functionality is limited to the following:

1. Only supports Google Authentication (can add others in the future)
1. Only clones repos that don't require credentials (i.e. you have manually create/configure deploy keys)
1. No user documentaion (ironic, I know...)
1. Docker support not yet implemented

## Prerequisites

* A current version of Node for running mkdocs-server
* Properly [installed MkDocs](http://www.mkdocs.org/#installation)

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
