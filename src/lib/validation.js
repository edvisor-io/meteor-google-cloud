// Validation methods

import fs from 'fs';
import jsonfile from 'jsonfile';
import yaml from 'js-yaml';
import winston from 'winston';
import nth from 'lodash.nth';
import dropRight from 'lodash.dropright';
import Joi from '@hapi/joi';
import commandExists from 'command-exists';

export function validateGCloud() {
  // Ensure gcloud CLI is installed
  winston.debug('check gcloud is installed');
  if (commandExists.sync('gcloud') === false) {
    throw new Error('gcloud is not installed');
  }
}

export function validateMeteor() {
  let release;

  // Ensure Meteor CLI is installed
  winston.debug('check Meteor is installed');
  if (commandExists.sync('meteor') === false) {
    throw new Error('Meteor is not installed');
  }

  // Determine current release/packages from '.meteor' directory
  try {
    release = fs.readFileSync('.meteor/release', 'utf8');
  } catch (error) {
    /* Abort the program if files are not found, this is a strong
       indication we may not be in the root project directory */
    throw new Error('You must be in a Meteor project directory');
  }

  // Determine major/minor version numbers by stripping non-numeric characters from release
  const versionNumbers = release.replace(/[^0-9.]/g, '').split('.');
  const majorVersion = Number.parseInt(versionNumbers[0], 10);
  const minorVersion = Number.parseInt(versionNumbers[1], 10);

  // Ensure current Meteor release is >= 1.4
  winston.debug('check current Meteor release >= 1.4');
  if (majorVersion < 1 || minorVersion < 4) {
    throw new Error('Meteor version must be >= 1.4');
  }
}

export function validateSettings(filePath) {
  let settingsFile;

  winston.info(`Validating settings file (${filePath})`);

  // Ensure valid json exists
  winston.debug('check valid json exists');
  try {
    settingsFile = jsonfile.readFileSync(filePath);
  } catch (error) {
    throw new Error(`Could not read settings file at '${filePath}'`);
  }

  // Define schema
  const meteorGoogleCloudConfig = Joi.object({
    project: Joi.string(),
  }).unknown(true);
  const schema = Joi.object({
    'meteor-google-cloud': meteorGoogleCloudConfig,
  }).unknown(true);

  // Ensure settings data follows schema
  winston.debug('check data follows schema');
  Joi.validate(settingsFile, schema, { presence: 'required' }, (error) => {
    if (error) {
      // Pull error from bottom of stack to get most specific/useful details
      const lastError = nth(error.details, -1);

      // Locate parent of non-compliant field, or otherwise mark as top level
      let pathToParent = 'top level';
      if (lastError.path.length > 1) {
        pathToParent = `"${dropRight(lastError.path).join('.')}"`;
      }

      // Report user-friendly error with relevant complaint/context to errors
      throw new Error(`Settings file (${filePath}): ${lastError.message} in ${pathToParent}`);
    }
  });

  return settingsFile;
}

export function validateApp(filePath) {
  let appFile;

  winston.info(`Validating app.yml file (${filePath})`);

  // Ensure valid json exists
  winston.debug('check app yaml exists');
  try {
    appFile = yaml.safeLoad(fs.readFileSync(filePath));
  } catch (error) {
    throw new Error(`Could not read app.yml file at '${filePath}'`);
  }

  // Define schema
  const schema = Joi.object({
    service: Joi.string(),
    runtime: Joi.string(),
    env: Joi.string(),
    threadsafe: Joi.boolean(),
    automatic_scaling: Joi.object({
      max_num_instances: Joi.number().min(1),
    }).optional().unknown(true),
    resources: Joi.object({
      cpu: Joi.number().min(1),
      memory_gb: Joi.number(),
      disk_size_gb: Joi.number().min(10),
    }).optional().unknown(true),
    network: Joi.object({
      session_affinity: Joi.boolean(),
    }),
  }).unknown(true);
  // allow unknown keys (at the top level) for extra settings
  // (https://cloud.google.com/appengine/docs/admin-api/reference/rest/v1/apps.services.versions)

  // Ensure settings app yaml follows schema
  winston.debug('check app yaml follows schema');
  Joi.validate(appFile, schema, { presence: 'required' }, (error) => {
    if (error) {
      // Pull error from bottom of stack to get most specific/useful details
      const lastError = nth(error.details, -1);

      // Locate parent of non-compliant field, or otherwise mark as top level
      let pathToParent = 'top level';
      if (lastError.path.length > 1) {
        pathToParent = `"${dropRight(lastError.path).join('.')}"`;
      }

      // Report user-friendly error with relevant complaint/context to errors
      throw new Error(`App.yaml file (${filePath}): ${lastError.message} in ${pathToParent}`);
    }
  });

  // Make sure threadsafe is always true otherwise Meteor will not work properly
  if (!appFile.threadsafe) {
    winston.debug('found threadsafe false, change threadsafe to true');

    Object.assign(appFile, {
      threadsafe: true,
    });
  }

  return appFile;
}

export function getDocker(filePath) {
  let dockerFile;

  winston.info(`Reading Dockerfile (${filePath})`);

  // Ensure file exists
  winston.debug('check dockerfile exists');
  try {
    dockerFile = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Could not read Dockerfile at '${filePath}'`);
  }

  return dockerFile;
}

export function validateEnv(settings, app) {
  winston.debug('check either settings.json or app.yaml contain the required env');
  const appSchema = Joi.object({
    env_variables: Joi.object({
      ROOT_URL: Joi.string(),
      MONGO_URL: Joi.string(),
    }).unknown(true),
  }).unknown(true);
  const settingsValidation = Joi.validate(settings, Joi.object({
    'meteor-google-cloud': appSchema,
  }).unknown(true), { presence: 'required' });
  const appValidation = Joi.validate(app, appSchema, { presence: 'required' });
  if (settingsValidation.error === null) {
    return settings['meteor-google-cloud'].env_variables;
  }
  if (appValidation.error === null) {
    return app.env_variables;
  }
  throw new Error('neither app.yaml, nor settings.json did contain the env_variables');
}
