const _ = require('lodash');
const express = require('express');

const webpackMiddleware = require('webpack-dev-middleware');
// const webpackHotMiddleware = require('webpack-hot-middleware');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const clientApps = require('./build/apps');

const localIp = '0.0.0.0';
const appName = argv.app;
const hotPack = argv.hotPack;
const shouldLint = argv.lint;
let rootOutput = argv.rootOutput;

let appPerPort = true;
let onlyPack = false;

if (rootOutput === true) {
  appPerPort = false;
}

if (hotPack) {
  // Only run webpack. Do not run the rest of the build process
  onlyPack = true;
  appPerPort = false;
  if (_.isUndefined(rootOutput)) {
    rootOutput = true;
  }
}

const {
  hotPort,
  paths
} = require('./build/settings');

const options = {
  hotPack,
  shouldLint,
  stage: 'hot',
  onlyPack,
  port:
  hotPort,
  rootOutput,
  appPerPort
};

function setupMiddleware(serverApp, compiler) {
  const webpackMiddlewareInstance = webpackMiddleware(compiler, {
    quiet: true,
    noInfo: true,
    watch: true,
    headers: { 'Access-Control-Allow-Origin': '*' }
  });
  serverApp.use(webpackMiddlewareInstance);
}

function runServer(serverApp, port, servePath) {
  serverApp.use(express.static(servePath));
  serverApp.get('*', (req, res) => {
    res.sendFile(path.join(servePath, req.url));
  });
  serverApp.post('*', (req, res) => {
    res.sendFile(path.join(servePath, req.url));
  });
  serverApp.listen(port, localIp, (err) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log(`Listening on: http://${localIp}:${port}`);
    console.log(`Serving content from: ${servePath}`);
  });
}

function launch(app, compiler) {
  const serverApp = express();
  setupMiddleware(serverApp, compiler);
  runServer(serverApp, app.port, app.outputPath);
}

if (appName) {
  // Run a single app. Note that when using yarn hot in order to run a single
  // application you will need to type 'yarn hot -- --app=my-app'
  const result = clientApps.buildApp(appName, options);
  launch(result.app, result.webpackCompiler);
} else if (hotPack) {
  const results = clientApps.buildAppsForOneServer(options);
  const serverApp = express();
  setupMiddleware(serverApp, results.webpackCompiler);
  runServer(serverApp, hotPort, paths.devOutput);
} else {
  // Run and serve all applications
  const results = clientApps.buildAppsForMultipleServers(options);
  _.each(results, (result) => {
    if (result.app.options.onlyPack) {
      console.log(`Only packing output for: ${result.app.name}`);
    } else {
      console.log(`Starting server for: ${result.app.name}`);
      launch(result.app, result.webpackCompiler);
    }
  });
}
