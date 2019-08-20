"use strict";

require("core-js/modules/es.array.map");

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

var _shelljs = _interopRequireDefault(require("shelljs"));

var _winston = _interopRequireDefault(require("winston"));

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
        workingDir = _ref.workingDir,
        ci = _ref.ci;

    _classCallCheck(this, AppEngineInstance);

    this.meteorSettings = (0, _lodash.default)(settingsFile, 'meteor-google-cloud');
    this.dockerFile = dockerFile;
    this.appSettings = appFile;
    this.workingDir = workingDir;
    this.googleCloudSettings = settingsFile['meteor-google-cloud'];
    this.ci = ci;
  }

  _createClass(AppEngineInstance, [{
    key: "prepareBundle",
    value: function prepareBundle() {
      // We add the Meteor settings now to avoid it being compiled to YAML
      var compactSettings = JSON.stringify(this.meteorSettings || {}, null, 0) // It will remove all non-printable characters.
      // This are all characters NOT within the ASCII HEX space 0x20-0x7E.
      .replace(/[^\x20-\x7E]/gmi, '').replace(/[\n\r]+/g, ''); // We will use shell sed command to replace the variables

      Object.assign(this.appSettings.env_variables, {
        METEOR_SETTINGS: '{{ METEOR_SETTINGS }}'
      }); // Create app.yaml file

      var app = _jsYaml.default.safeDump(this.appSettings);

      _shelljs.default.exec(`echo '${app}' >${this.workingDir}/bundle/app.yaml`);

      _shelljs.default.sed('-i', '{{ METEOR_SETTINGS }}', `'${compactSettings}'`, `${this.workingDir}/bundle/app.yaml`);

      var nodeVersion = _shelljs.default.exec(`meteor node -v ${this.ci ? '--allow-superuser' : ''}`, {
        silent: true
      }).stdout.trim();

      var npmVersion = _shelljs.default.exec(`meteor npm -v${this.ci ? '--allow-superuser' : ''}`, {
        silent: true
      }).stdout.trim();

      _winston.default.debug(`set Node to ${nodeVersion}`);

      _winston.default.debug(`set NPM to ${npmVersion}`); // Create Dockerfile


      var docker = this.dockerFile.replace('{{ nodeVersion }}', nodeVersion).replace('{{ npmVersion }}', npmVersion);

      _shelljs.default.exec(`echo '${docker}' >${this.workingDir}/bundle/Dockerfile`);
    }
  }, {
    key: "deployBundle",
    value: function () {
      var _deployBundle = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee() {
        var settings, flags;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _winston.default.debug('deploy to App Engine'); // Allow users to pass any option to gcloud app deploy


                settings = this.googleCloudSettings;
                flags = Object.keys(settings).map(function (key) {
                  var value = settings[key]; // Only some flags actually require a value (e.g. stop-previous-version)

                  if (value) {
                    return `--${key}=${settings[key]}`;
                  }

                  return `--${key}`;
                }).join(' ');

                _winston.default.debug(`set flags for deploy: ${flags}`);

                _shelljs.default.exec(`cd ${this.workingDir}/bundle && gcloud app deploy -q ${flags}`);

              case 5:
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