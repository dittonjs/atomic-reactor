#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2));

const configDir = argv.configDir;
const settings = require('./build/settings')(configDir);

const apps = require('./build/apps')(settings);
const log = require('./build/log');

const stage = argv.release ? 'production' : 'development';
const port = parseInt(process.env.ASSETS_PORT, 10) || 8080;
const options = {
  port,
  stage,
  onlyPack: argv.onlyPack,
  noClean: argv.noClean,
  rootOutput: argv.rootOutput
};

apps.buildAppsForOneServer(options).webpackCompiler.run((err) => {
  if (err) {
    log.error(err);
  }
});
