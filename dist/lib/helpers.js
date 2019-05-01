"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initRepo = initRepo;

var _fs = _interopRequireDefault(require("fs"));

var _shelljs = _interopRequireDefault(require("shelljs"));

var _winston = _interopRequireDefault(require("winston"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Helper functions
function initRepo() {
  var path = '../node_modules/meteor-google-cloud/examples/';
  var dockerFile = 'Dockerfile';
  var app = 'app.yml';
  var settings = 'settings.json'; // Init app.yaml

  if (!_fs.default.existsSync('./deploy/app.yml')) {
    _shelljs.default.cp('-R', `${path}${app}`, '.deploy/');

    _winston.default.info('app.yml created on .deploy/ it has the default/minimum settings you need');
  } else {
    _winston.default.info('app.yml already exists on .deploy/');
  } // Init Dockerfile


  if (!_fs.default.existsSync('./deploy/Dockerfile')) {
    _shelljs.default.cp('-R', `${path}${dockerFile}`, '.deploy/');

    _winston.default.info('Dockerfile created on .deploy/');
  } else {
    _winston.default.info('Dockerfile already exists on .deploy/');
  } // Init settings


  if (!_fs.default.existsSync('./deploy/settings.json')) {
    _shelljs.default.cp('-R', `${path}${settings}`, '.deploy/');

    _winston.default.info('Meteor settings file created on .deploy/');
  } else {
    _winston.default.info('settings.json already exists on .deploy/');
  }
}