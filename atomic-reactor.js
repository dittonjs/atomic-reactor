#!/usr/bin/env node

const exec = require('child_process').exec;
const argv = require('minimist')(process.argv.slice(2));

// Generate a new application by cloning the latest starter app from github
exec(`git clone https://www.github.com/atomicjolt/react_client_starter_app ${argv.name}`);
