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
    "hot": "atomic-webpack-hot --configDir=client/config"
  }
}
```

# Atomic Reactor Modes
Atomic Reactor supports multiple Javascript applications along with a templating engine that can built your html and assets.

1. Running multiple servers - one per application. Just run `yarn hot` and each application will be served independently on it's own
port starting with the 'hotPort'

2. Running a single app at a time. Run `yarn hot --app [application name]` and only a single application will be started.

3. Only outputting Javascript and assets while ignoring all html. Running `yarn hot --onlyPack` will ignore all html files
and start a server that will output assets. This is useful when used in conjunction with another application framework
like Ruby on Rails.

4. Outputting a single site that contains html to support the other applications. Build your html in one application and the
in all other applications set options.json to:
`
{
  "rootOutput": true,
  "onlyPack": true
}
`

