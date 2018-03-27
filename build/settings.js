const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');

const utils = require('./utils');
const configDir = '../../../config';

const {
  paths,
  hotPort,
  devOutput,
  prodOutput,
  buildSuffix,
  htmlOptions,
  templateData, // Object that will be passed to every page as it is rendered
  templateMap, // Used to specify specific templates on a per file basis
  themeTemplateDirs
} = require(`${configDir}/settings`);

// -----------------------------------------------------------------------------
// Helper function to generate full template paths for the given app
// -----------------------------------------------------------------------------
function templateDirs(app, dirs) {
  return _.map(dirs, templateDir => path.join(app.htmlPath, templateDir));
}

// -----------------------------------------------------------------------------
// Helper to determine if we should do a production build or not
// -----------------------------------------------------------------------------
function isProduction(stage) {
  return stage === 'production' || stage === 'staging';
}

function isNameRequired(options) {
  return !options.onlyPack && !options.rootOutput;
}

// -----------------------------------------------------------------------------
// Generates a path with the app name if needed
// -----------------------------------------------------------------------------
function withNameIfRequired(name, relativeOutput, options) {
  if (isNameRequired(options) && !options.appPerPort) {
    return utils.joinUrlOrPath(relativeOutput, name);
  }
  return relativeOutput;
}

// -----------------------------------------------------------------------------
// Generates the main paths used for output
// -----------------------------------------------------------------------------
function outputPaths(name, port, appPath, options) {

  const outName = options.name || name;

  let rootOutputPath = devOutput;
  let outputPath = isNameRequired(options) ? path.join(devOutput, outName) : devOutput;
  // Public path indicates where the assets will be served from. In dev this will likely be
  // localhost or a local domain. In production this could be a CDN. In development this will
  // point to whatever public url is serving dev assets.

  let publicPath;

  if (isProduction(options.stage)) {
    rootOutputPath = prodOutput;
    outputPath = isNameRequired(options) ? path.join(prodOutput, outName) : prodOutput;
    publicPath = utils.joinUrlOrPath(
      paths.prodAssetsUrl,
      withNameIfRequired(outName, paths.prodRelativeOutput, options)
    );
  } else {
    let devUrl = paths.devAssetsUrl;
    // Include the port if we are running on localhost
    if (_.find(['localhost', '0.0.0.0', '127.0.0.1'], d => _.includes(paths.devAssetsUrl, d))) {
      devUrl = `${paths.devAssetsUrl}:${port}`;
    }
    publicPath = utils.joinUrlOrPath(
      devUrl,
      withNameIfRequired(outName, paths.devRelativeOutput, options)
    );
  }

  // Make sure the public path ends with a / or fonts will not have the correct path
  if (!_.endsWith(publicPath, '/')) {
    publicPath = `${publicPath}/`;
  }

  return {
    rootOutputPath,
    outputPath,
    publicPath
  };
}

function getWebpackJson(path) {
  if (fs.existsSync(path)) {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  }
  return {};
}

function getWebpackJs(configPath) {
  try {
    return (require(configPath))();
  } catch (e) {
    return {};
  }
}

// -----------------------------------------------------------------------------
// Generate settings needed for webpack
// Allow for custom overrides to be placed in webpack.json
// -----------------------------------------------------------------------------
function webpackSettings(name, file, appPath, port, options) {

  const customWebpack = _.merge(
    {},
    getWebpackJson(`${appPath}/webpack.json`),
    getWebpackJs(`${appPath}/webpack.js`),
    getWebpackJson(`${configDir}/webpack.json`),
    getWebpackJs(`${configDir}/webpack.js`)
  );

  const production = isProduction(options.stage);

  return {
    name,
    file,
    path: appPath,
    shouldLint: options.shouldLint,
    stage: options.stage,
    production,
    buildSuffix,
    port,
    filename: production ? '[name]-[chunkhash]' : '[name]',
    chunkFilename: production ? '[id]-[chunkhash]' : '[id]',
    customWebpack
  };
}

// -----------------------------------------------------------------------------
// Generate all settings needed for a given application
// -----------------------------------------------------------------------------
function appSettings(name, port, options) {

  const appPath = path.join(paths.appsDir, name);
  const htmlPath = path.join(appPath, 'html');
  const staticPath = path.join(appPath, 'static');

  const customOptionsPath = `${appPath}/options.json`;
  let combinedOptions = options;
  if (fs.existsSync(customOptionsPath)) {
    const customOptions = JSON.parse(fs.readFileSync(customOptionsPath, 'utf8'));
    combinedOptions = _.merge({}, options, customOptions);
  }

  const app = _.merge({
    htmlPath,
    staticPath,
    templateData: templateData || {},
    templateMap: templateMap || {},
    htmlOptions,
    options: combinedOptions
  }, webpackSettings(name, 'app.jsx', appPath, port, combinedOptions),
     outputPaths(name, port, appPath, combinedOptions));

  if (themeTemplateDirs) {
    app.templateDirs = _.union(templateDirs(app, ['layouts']), themeTemplateDirs);
  } else {
    app.templateDirs = templateDirs(app, ['layouts']);
  }

  return {
    [name] : app
  };
}

// -----------------------------------------------------------------------------
// Iterate a given directory to generate app or webpack settings
// -----------------------------------------------------------------------------
function iterateDirAndPorts(dir, options, cb) {
  let port = options.port;
  const iteratedApps = fs.readdirSync(dir)
    .filter(file => fs.statSync(path.join(dir, file)).isDirectory())
    .reduce((result, appName) => {
      const app = cb(appName, port, options);
      port = options.appPerPort ? port + 1 : options.port;
      return _.merge(result, app);
    }, {});
  if (options.order && options.order.length > 0) {
    return iteratedApps.sort((a, b) =>
      (options.order.indexOf(a.name) > options.order.indexOf(b.name))
    );
  }
  return iteratedApps;
}

// -----------------------------------------------------------------------------
// Generates an app setting for all applications found in the client directory
// -----------------------------------------------------------------------------
function apps(options) {
  return iterateDirAndPorts(paths.appsDir, options, appSettings);
}

module.exports = {
  paths,
  outputPaths,
  apps,
  hotPort,
  isProduction
};
