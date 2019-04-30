"use strict";

require("core-js/modules/es.symbol");

require("core-js/modules/es.symbol.description");

require("core-js/modules/es.object.to-string");

require("core-js/modules/es.promise");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = startup;

require("regenerator-runtime/runtime");

var _commander = _interopRequireDefault(require("commander"));

var _shelljs = _interopRequireDefault(require("shelljs"));

var _updateNotifier = _interopRequireDefault(require("update-notifier"));

var _winston = _interopRequireDefault(require("winston"));

var _package = _interopRequireDefault(require("../../package.json"));

var _validation = require("./validation");

var _bundle = _interopRequireDefault(require("./bundle"));

var _google = _interopRequireDefault(require("./google"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

// Notify user of available updates
(0, _updateNotifier.default)({
  pkg: _package.default
}).notify(); // Configure CLI

_commander.default.description(_package.default.description).version(`v${_package.default.version}`, '-v, --version').option('-s, --settings <path>', 'path to settings file (settings.json)', '../examples/settings.json').option('-c, --app <path>', 'path to app.yaml config file').option('-d, --docker <path>', 'path to Dockerfile fle', '../examples/Dockerfile').option('-v, --verbose', 'enable verbose mode').option('-q, --quiet', 'enable quite mode').parse(process.argv); // Pretty print logs


_winston.default.cli(); // Terminate on shelljs errors


_shelljs.default.config.fatal = true; // Toggle Quiet mode based on user preference

if (_commander.default.quiet === true) {
  _winston.default.level = 'error';
  _shelljs.default.config.silent = true;
} // Toggle Debug mode based on user preference


if (_commander.default.verbose === true) {
  _winston.default.level = 'debug';
}

function startup() {
  return _startup.apply(this, arguments);
}

function _startup() {
  _startup = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee() {
    var settingsFile, appFile, dockerFile, appEngine;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            try {
              // Validate if gcloud is installed
              (0, _validation.validateGCloud)(); // Validate Meteor version/packages

              (0, _validation.validateMeteor)(); // Validate settings file(s)

              settingsFile = (0, _validation.validateSettings)(_commander.default.settings);
              appFile = (0, _validation.validateApp)(_commander.default.app);
              dockerFile = (0, _validation.getDocker)(_commander.default.docker); // Create Meteor bundle

              (0, _bundle.default)(); // Set up GCP App Engine instance

              appEngine = new _google.default({
                settingsFile,
                appFile,
                dockerFile
              });
              appEngine.prepareBundle();
              appEngine.deployBundle();
            } catch (error) {
              _winston.default.error(error.message);

              process.exit(1);
            }

          case 1:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _startup.apply(this, arguments);
}