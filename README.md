# Atomic Reactor
This package contains all of the development and production build code and should be treated as the core of the front-end applications.

## Installation
This package should be installed into the client node_modules folder as a dev-dependency.

`yarn add --dev atomic-reactor`

This gives you access to all of build processes that were previously in the client folder. You will need to reference the from the node_modules in any scripts that used the build process. For example (in root package.json)

```Json
{
  "scripts": {
    "hot": "./client/webpack.hot.js"
  }
}
```
becomes

```Json
{
  "scripts": {
    "hot": "./client/node_modules/atomic-reactor/webpack.hot.js"
  }
}
```
