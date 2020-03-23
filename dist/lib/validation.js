"use strict";

require("core-js/modules/es.object.assign");

require("core-js/modules/es.string.replace");

require("core-js/modules/es.string.split");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateGCloud = validateGCloud;
exports.validateMeteor = validateMeteor;
exports.validateSettings = validateSettings;
exports.validateApp = validateApp;
exports.getDocker = getDocker;
exports.validateEnv = validateEnv;

var _fs = _interopRequireDefault(require("fs"));

var _jsonfile = _interopRequireDefault(require("jsonfile"));

var _jsYaml = _interopRequireDefault(require("js-yaml"));

var _winston = _interopRequireDefault(require("winston"));

var _lodash = _interopRequireDefault(require("lodash.nth"));

var _lodash2 = _interopRequireDefault(require("lodash.dropright"));

var _joi = _interopRequireDefault(require("@hapi/joi"));

var _commandExists = _interopRequireDefault(require("command-exists"));

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
  var release; // Ensure Meteor CLI is installed

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


  var versionNumbers = release.replace(/[^0-9.]/g, '').split('.');
  var majorVersion = Number.parseInt(versionNumbers[0], 10);
  var minorVersion = Number.parseInt(versionNumbers[1], 10); // Ensure current Meteor release is >= 1.4

  _winston.default.debug('check current Meteor release >= 1.4');

  if (majorVersion < 1 || minorVersion < 4) {
    throw new Error('Meteor version must be >= 1.4');
  }
}

function validateSettings(filePath) {
  var settingsFile;

  _winston.default.info(`Validating settings file (${filePath})`); // Ensure valid json exists


  _winston.default.debug('check valid json exists');

  try {
    settingsFile = _jsonfile.default.readFileSync(filePath);
  } catch (error) {
    throw new Error(`Could not read settings file at '${filePath}'`);
  } // Define schema


  var meteorGoogleCloudConfig = _joi.default.object({
    project: _joi.default.string()
  }).unknown(true);

  var schema = _joi.default.object({
    'meteor-google-cloud': meteorGoogleCloudConfig
  }).unknown(true); // Ensure settings data follows schema


  _winston.default.debug('check data follows schema');

  _joi.default.validate(settingsFile, schema, {
    presence: 'required'
  }, function (error) {
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
  var appFile;

  _winston.default.info(`Validating app.yml file (${filePath})`); // Ensure valid json exists


  _winston.default.debug('check app yaml exists');

  try {
    appFile = _jsYaml.default.safeLoad(_fs.default.readFileSync(filePath));
  } catch (error) {
    throw new Error(`Could not read app.yml file at '${filePath}'`);
  } // Define schema


  var schema = _joi.default.object({
    service: _joi.default.string(),
    runtime: _joi.default.string(),
    env: _joi.default.string(),
    threadsafe: _joi.default.boolean(),
    automatic_scaling: _joi.default.object({
      max_num_instances: _joi.default.number().min(1)
    }).optional().unknown(true),
    resources: _joi.default.object({
      cpu: _joi.default.number().min(1),
      memory_gb: _joi.default.number(),
      disk_size_gb: _joi.default.number().min(10)
    }).optional().unknown(true),
    network: _joi.default.object({
      session_affinity: _joi.default.boolean()
    })
  }).unknown(true); // allow unknown keys (at the top level) for extra settings
  // (https://cloud.google.com/appengine/docs/admin-api/reference/rest/v1/apps.services.versions)
  // Ensure settings app yaml follows schema


  _winston.default.debug('check app yaml follows schema');

  _joi.default.validate(appFile, schema, {
    presence: 'required'
  }, function (error) {
    if (error) {
      // Pull error from bottom of stack to get most specific/useful details
      var lastError = (0, _lodash.default)(error.details, -1); // Locate parent of non-compliant field, or otherwise mark as top level

      var pathToParent = 'top level';

      if (lastError.path.length > 1) {
        pathToParent = `"${(0, _lodash2.default)(lastError.path).join('.')}"`;
      } // Report user-friendly error with relevant complaint/context to errors


      throw new Error(`App.yaml file (${filePath}): ${lastError.message} in ${pathToParent}`);
    }
  }); // Make sure threadsafe is always true otherwise Meteor will not work properly


  if (!appFile.threadsafe) {
    _winston.default.debug('found threadsafe false, change threadsafe to true');

    Object.assign(appFile, {
      threadsafe: true
    });
  }

  return appFile;
}

function getDocker(filePath) {
  var dockerFile;

  _winston.default.info(`Reading Dockerfile (${filePath})`); // Ensure file exists


  _winston.default.debug('check dockerfile exists');

  try {
    dockerFile = _fs.default.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Could not read Dockerfile at '${filePath}'`);
  }

  return dockerFile;
}

function validateEnv(settings, app) {
  _winston.default.debug('check either settings.json or app.yaml contain the required env');

  var appSchema = _joi.default.object({
    env_variables: _joi.default.object({
      ROOT_URL: _joi.default.string(),
      MONGO_URL: _joi.default.string()
    }).unknown(true)
  }).unknown(true);

  var settingsValidation = _joi.default.validate(settings, _joi.default.object({
    'meteor-google-cloud': appSchema
  }).unknown(true), {
    presence: 'required'
  });

  var appValidation = _joi.default.validate(app, appSchema, {
    presence: 'required'
  });

  if (settingsValidation.error === null) {
    return settings['meteor-google-cloud'].env_variables;
  }

  if (appValidation.error === null) {
    return app.env_variables;
  }

  throw new Error('neither app.yaml, nor settings.json did contain the env_variables');
}