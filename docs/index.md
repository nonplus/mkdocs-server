# About

MkDocks Server is a web server for building MkDocs sites from Git Repos and for hosting the generated sites.

## Motivation

Documentation is an important part of any software projects.
GitHub Pages offer a great way to manage publicly accessible project documentation for public and private projects.

However, there isn't an easy way to restrict access to GitHub Pages documentation.

The MkDocs Server can automatically build [MkDocs](http://www.mkdocs.org/) sites from remote Git repositories
and restrict access to the generated sites to authenticated users.

For more information on MkDocks, visit [mkdocs.org](http://mkdocs.org).

## Anonymous Users

When authentication is configured, a new visitor to the site will be prompted to authenticate
and they will not be able to access the static sites until they do so.

| Home Page (Anonymous User) |
| ---- |
| ![Home Page (Anonymous User)](./img/home-logged-out.png "Home Page (Anonymous User)") |

## Authenticated Users

Once authenticated, the user will se a list of published MkDocs sites.
Clicking on a site name will take the user to the published site.

| Home Page (Authenticated User) |
| ---- |
| ![Home Page (Authenticated User)](./img/home-logged-in.png "Home Page (Authenticated User)") |

If the user is also an administrator, they will be able to configure settings and
register additional projects.
