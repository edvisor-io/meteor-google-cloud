'use strict';

require('core-js/modules/es.string.replace');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.validateGCloud = validateGCloud;
exports.validateMeteor = validateMeteor;
exports.validateSettings = validateSettings;
exports.validateApp = validateApp;
exports.getDocker = getDocker;

let _fs = _interopRequireDefault(require('fs'));

let _jsonfile = _interopRequireDefault(require('jsonfile'));

let _jsYaml = _interopRequireDefault(require('js-yaml'));

let _winston = _interopRequireDefault(require('winston'));

let _lodash = _interopRequireDefault(require('lodash.nth'));

let _lodash2 = _interopRequireDefault(require('lodash.dropright'));

let _joi = _interopRequireDefault(require('@hapi/joi'));

let _commandExists = _interopRequireDefault(require('command-exists'));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Validation methods
function validateGCloud() {
  // Ensure gcloud CLI is installed
  _winston.default.debug('check gcloud is installed');

  if (_commandExists.default.sync('gcloud') === false) {
    throw new Error('gcloud is not installed');
  }
}

function validateMeteor() {
  let release; // Ensure Meteor CLI is installed

  _winston.default.debug('check Meteor is installed');

  if (_commandExists.default.sync('meteor') === false) {
    throw new Error('Meteor is not installed');
  } // Determine current release/packages from '.meteor' directory


  try {
    release = _fs.default.readFileSync('.meteor/release', 'utf8');
  } catch (error) {
    /* Abort the program if files are not found, this is a strong
       indication we may not be in the root project directory */
    throw new Error('You must be in a Meteor project directory');
  } // Determine major/minor version numbers by stripping non-numeric characters from release


  let versionNumbers = release.replace(/[^0-9]/g, '');
  let majorVersion = Number.parseInt(versionNumbers.charAt(0), 10);
  let minorVersion = Number.parseInt(versionNumbers.charAt(1), 10); // Ensure current Meteor release is >= 1.4

  _winston.default.debug('check current Meteor release >= 1.4');

  if (majorVersion < 1 || minorVersion < 4) {
    throw new Error('Meteor version must be >= 1.4');
  }
}

function validateSettings(filePath) {
  let settingsFile;

  _winston.default.info(`Validating settings file (${filePath})`); // Ensure valid json exists


  _winston.default.debug('check valid json exists');

  try {
    settingsFile = _jsonfile.default.readFileSync(filePath);
  } catch (error) {
    throw new Error(`Could not read settings file at '${filePath}'`);
  } // Define schema


  let meteorGoogleCloudConfig = _joi.default.object({});

  let schema = _joi.default.object({
    'meteor-google-cloud': meteorGoogleCloudConfig,
  }).unknown(true); // Ensure settings data follows schema


  _winston.default.debug('check data follows schema');

  _joi.default.validate(settingsFile, schema, {
    presence: 'required',
  }, (error) => {
    if (error) {
      // Pull error from bottom of stack to get most specific/useful details
      var lastError = (0, _lodash.default)(error.details, -1); // Locate parent of non-compliant field, or otherwise mark as top level

      var pathToParent = 'top level';

      if (lastError.path.length > 1) {
        pathToParent = `"${(0, _lodash2.default)(lastError.path).join('.')}"`;
      } // Report user-friendly error with relevant complaint/context to errors


      throw new Error(`Settings file (${filePath}): ${lastError.message} in ${pathToParent}`);
    }
  });

  return settingsFile;
}

function validateApp(filePath) {
  let appFile;

  _winston.default.info(`Validating app.yml file (${filePath})`); // Ensure valid json exists


  _winston.default.debug('check app yml exists');

  try {
    appFile = _jsYaml.default.safeLoad(_fs.default.readFileSync(filePath));
  } catch (error) {
    throw new Error(`Could not read app.yml file at '${filePath}'`);
  } // Define schema


  let schema = _joi.default.object({
    runtime: _joi.default.string(),
    env: _joi.default.string(),
    threadsafe: _joi.default.boolean(),
    automatic_scaling: _joi.default.object({
      max_num_instances: _joi.default.number().min(1),
    }).optional().unknown(true),
    network: _joi.default.object({
      session_affinity: _joi.default.boolean(),
    }),
    env_variables: _joi.default.object({
      ROOT_URL: _joi.default.string(),
      MONGO_URL: _joi.default.string(),
    }).unknown(true),
  }).unknown(true); // allow unknown keys (at the top level) for extra settings
  // (https://cloud.google.com/appengine/docs/admin-api/reference/rest/v1/apps.services.versions)
  // Ensure settings data follows schema


  _winston.default.debug('check data follows schema');

  _joi.default.validate(appFile, schema, {
    presence: 'required',
  }, (error) => {
    if (error) {
      // Pull error from bottom of stack to get most specific/useful details
      var lastError = (0, _lodash.default)(error.details, -1); // Locate parent of non-compliant field, or otherwise mark as top level

      var pathToParent = 'top level';

      if (lastError.path.length > 1) {
        pathToParent = `"${(0, _lodash2.default)(lastError.path).join('.')}"`;
      } // Report user-friendly error with relevant complaint/context to errors


      throw new Error(`App.yml file (${filePath}): ${lastError.message} in ${pathToParent}`);
    }
  });

  return appFile;
}

function getDocker(filePath) {
  let dockerFile;

  _winston.default.info(`Reading Dockerfile (${filePath})`); // Ensure file exists


  _winston.default.debug('check dockerfile exists');

  try {
    dockerFile = _fs.default.readFileSync(filePath);
  } catch (error) {
    throw new Error(`Could not read Dockerfile at '${filePath}'`);
  }

  return dockerFile;
}
