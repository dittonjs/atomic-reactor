const build = require('../build');
const output = require('friendly-errors-webpack-plugin/src/output');

class HtmlBuilderPlugin {
  constructor(app, options) {
    this.app = app;
    this.options = options;
    this.shouldBuild = true;
    this.tries = 0;
  }

  buildAppParts() {
    if (!this.options.onlyPack) {
      const result = build.build(this.app, (...args) => output.title(...args));
      output.title('info', 'BUILD', `Built ${result.pages.length} html pages for ${this.app.name}.`);
    }
  }

  safeBuildAppParts() {
    if (this.shouldBuild) {
      try {
        this.buildAppParts();
        this.shouldBuild = false;
        output.title('success', 'DONE', `Finished compiling html for ${this.app.name}`);
      } catch (err) {
        // HACK. This build process relies on the webpack assets plugin finishing. Even though
        // we tie into the 'done' event from webpack it's not a guarantee that the webpack assets
        // plugin is done writing files. If we are unable to parse the json we just try again
        // in a few milliseconds.
        if (err.message.indexOf('Unexpected end of JSON input') >= 0 && this.tries < 10) {
          this.tries != 1;
          setTimeout(() => {
            output.title('info', 'RETRY', `Retrying html build for ${this.app.name}`);
            this.safeBuildAppParts();
          }, 10);
        } else {
          output.title('error', 'ERROR', err);
        }
      }
    }
  }

  apply(compiler) {
    const compileHtml = (stats) => {
      // we kick off the initial build but then handle the watching and
      // rebuilding of the html ourselves
      this.safeBuildAppParts();
    };

    if (compiler.hooks) {
      var plugin = { name: 'HtmlBuilderPlugin' }
      compiler.hooks.done.tapAsync(plugin, compileHtml)
    } else {
      compiler.plugin('done', compileHtml)
    }
  }
}

module.exports = HtmlBuilderPlugin;
