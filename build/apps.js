const fs = require('fs-extra');
const _ = require('lodash');
const webpack = require('webpack');
const webpackConfigBuilder = require('../webpack.config');

module.exports = function appsBuilder(settings) {
  // clean up old build
  function clean(apps, options) {
    // Clean dirs
    if (!options.noClean) {
      _.each(apps, (app) => {
        fs.emptyDirSync(app.outputPath);
      });
    }
  }

  // -----------------------------------------------------------------------------
  // Build a single app
  // -----------------------------------------------------------------------------
  function buildApp(appName, options) {
    const apps = settings.apps(options);
    const app = _.find(apps, (e, name) => appName === name);
    const webpackCompiler = webpack(webpackConfigBuilder(app, options));

    clean([app], options);

    return {
      app,
      webpackCompiler
    };
  }

  function buildAppsForMultipleServers(options) {
    const apps = settings.apps(options);
    clean(apps, options);
    return _.map(apps, app => ({
      app,
      webpackCompiler: webpack(webpackConfigBuilder(app, options))
    }));
  }

  // -----------------------------------------------------------------------------
  // Build all apps
  // -----------------------------------------------------------------------------
  function buildAppsForOneServer(options) {
    const apps = settings.apps(options);
    clean(apps, options);
    const webpackConfigs = _(apps)
      .sortBy((app) => { return app.options.onlyPack ? 0 : 1; })
      .map(app => webpackConfigBuilder(app, options))
      .value();
    const webpackCompiler = webpack(webpackConfigs);

    return {
      apps,
      webpackCompiler
    };
  }

  return {
    buildApp,
    buildAppsForMultipleServers,
    buildAppsForOneServer
  };
};
