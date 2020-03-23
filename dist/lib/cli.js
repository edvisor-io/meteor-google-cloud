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

var _tmp = _interopRequireDefault(require("tmp"));

var _updateNotifier = _interopRequireDefault(require("update-notifier"));

var _winston = _interopRequireDefault(require("winston"));

var _package = _interopRequireDefault(require("../../package.json"));

var _validation = require("./validation");

var _bundle = _interopRequireDefault(require("./bundle"));

var _google = _interopRequireDefault(require("./google"));

var _helpers = require("./helpers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

// Notify user of available updates
(0, _updateNotifier.default)({
  pkg: _package.default
}).notify(); // Configure CLI

_commander.default.description(_package.default.description).version(`v${_package.default.version}`, '-v, --version').option('-i, --init', 'init necessary files on your repo').option('-b, --build-only', 'build bundle only').option('-s, --settings <path>', 'path to settings file (settings.json)').option('-c, --app <path>', 'path to app.yaml config file').option('-d, --docker <path>', 'path to Dockerfile file').option('-p, --project <path>', 'path of the directory of your Meteor project').option('-v, --verbose', 'enable verbose mode').option('-q, --quiet', 'enable quite mode').option('-ci, --ci', 'add --allow-superuser flag in meteor commands for running in CI').option('-o, --output-dir <path>', 'build files output directory').option('-k, --keep-output-dir', 'do not remove the output directory before start').option('--node-version <version>', 'set custom node version').option('--npm-version <version', 'set custom npm version').parse(process.argv); // Pretty print logs


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
    var settingsFile, appFile, dockerFile, outputDir, env, _compileBundle, workingDir, appEngine;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

            if (!(_commander.default.init === true)) {
              _context.next = 5;
              break;
            }

            (0, _helpers.initRepo)();
            process.exit(0);
            return _context.abrupt("return");

          case 5:
            if (!_commander.default.buildOnly) {
              // Validate if gcloud is installed (Only when it requires deployment)
              (0, _validation.validateGCloud)();
            } // Validate Meteor version/packages


            (0, _validation.validateMeteor)(); // Validate settings file(s)

            settingsFile = (0, _validation.validateSettings)(_commander.default.settings);
            appFile = (0, _validation.validateApp)(_commander.default.app);
            dockerFile = (0, _validation.getDocker)(_commander.default.docker);
            outputDir = _commander.default.outputDir;
            /*
             Validate that either settingsFile[meteor-google-cloud].env_variables
             or appFile.env_variables contains the needed variables
             */

            env = (0, _validation.validateEnv)(settingsFile, appFile); // Create Meteor bundle

            _compileBundle = (0, _bundle.default)({
              dir: _commander.default.project,
              workingDir: outputDir,
              ci: _commander.default.ci,
              keep: _commander.default.keepOutputDir
            }), workingDir = _compileBundle.workingDir; // Set up GCP App Engine instance

            appEngine = new _google.default({
              settingsFile,
              appFile,
              dockerFile,
              workingDir,
              ci: _commander.default.ci,
              env,
              nodeVersion: _commander.default.nodeVersion,
              npmVersion: _commander.default.npmVersion
            });
            appEngine.prepareBundle(); // If --build-only flag was passed, exit

            if (!(_commander.default.buildOnly === true)) {
              _context.next = 18;
              break;
            }

            process.exit(0);
            return _context.abrupt("return");

          case 18:
            appEngine.deployBundle();
            process.exit(0);
            _context.next = 27;
            break;

          case 22:
            _context.prev = 22;
            _context.t0 = _context["catch"](0);

            _tmp.default.setGracefulCleanup();

            _winston.default.error(_context.t0.message);

            process.exit(1);

          case 27:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[0, 22]]);
  }));
  return _startup.apply(this, arguments);
}