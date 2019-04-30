"use strict";

require("core-js/modules/es.object.assign");

require("core-js/modules/es.object.to-string");

require("core-js/modules/es.promise");

require("core-js/modules/es.string.replace");

require("core-js/modules/es.string.trim");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("regenerator-runtime/runtime");

var _lodash = _interopRequireDefault(require("lodash.omit"));

var _tmp = _interopRequireDefault(require("tmp"));

var _shelljs = _interopRequireDefault(require("shelljs"));

var _winston = _interopRequireDefault(require("winston"));

var _jsonpack = _interopRequireDefault(require("jsonpack"));

var _jsYaml = _interopRequireDefault(require("js-yaml"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var AppEngineInstance =
/*#__PURE__*/
function () {
  function AppEngineInstance(_ref) {
    var settingsFile = _ref.settingsFile,
        dockerFile = _ref.dockerFile,
        appFile = _ref.appFile,
        workingDir = _ref.workingDir;

    _classCallCheck(this, AppEngineInstance);

    this.meteorSettings = (0, _lodash.default)(settingsFile, 'meteor-google-cloud');
    this.dockerFile = dockerFile;
    this.appSettings = appFile;
    this.workingDir = workingDir;
  }

  _createClass(AppEngineInstance, [{
    key: "prepareBundle",
    value: function prepareBundle() {
      // If no METEOR_SETTINGS was defined in the app.yaml, we set the one we have
      if (!this.appSettings.env_variables.METEOR_SETTINGS) {
        Object.assign(this.appSettings.env_variables, {
          METEOR_SETTINGS: _jsonpack.default.pack(this.meteorSettings || {})
        });
      } // Create app.yaml file


      var app = _jsYaml.default.safeDump(this.appSettings);

      _shelljs.default.exec(`echo '${app}' >${this.workingDir}/app.yaml`); // Create Dockerfile


      var nodeVersion = _shelljs.default.exec('meteor node -v', {
        silent: true
      }).stdout.trim();

      var npmVersion = _shelljs.default.exec('meteor npm -v', {
        silent: true
      }).stdout.trim();

      _winston.default.debug(`set Node to ${nodeVersion}`);

      _winston.default.debug(`set NPM to ${npmVersion}`);

      var docker = this.dockerFile.replace('{{ nodeVersion }}', nodeVersion).replace('{{ npmVersion }}', npmVersion);

      _shelljs.default.exec(`echo '${docker}' >${this.workingDir}/Dockerfile`);
    }
  }, {
    key: "deployBundle",
    value: function () {
      var _deployBundle = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _winston.default.debug('deploy to App Engine');

                _shelljs.default.exec(`cd ${this.workingDir}`);

                _shelljs.default.exec('gcloud app deploy -q');

              case 3:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function deployBundle() {
        return _deployBundle.apply(this, arguments);
      }

      return deployBundle;
    }()
  }]);

  return AppEngineInstance;
}();

exports.default = AppEngineInstance;