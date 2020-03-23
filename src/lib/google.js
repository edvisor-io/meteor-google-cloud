// Google methods

import omit from 'lodash.omit';
import shell from 'shelljs';
import winston from 'winston';
import yaml from 'js-yaml';
import fs from 'fs';

export default class AppEngineInstance {
  constructor({
    settingsFile,
    dockerFile,
    appFile,
    workingDir,
    ci,
    env,
    nodeVersion,
    npmVersion,
  }) {
    this.meteorSettings = omit(settingsFile, 'meteor-google-cloud');
    this.dockerFile = dockerFile;
    this.appSettings = appFile;
    this.workingDir = workingDir;
    this.googleCloudSettings = settingsFile['meteor-google-cloud'];
    this.ci = ci;
    this.env = env;
    this.nodeVersion = nodeVersion;
    this.npmVersion = npmVersion;
  }

  prepareBundle() {
    // We add the Meteor settings now to avoid it being compiled to YAML
    const compactSettings = JSON
      .stringify(this.meteorSettings || {}, null, 0)
      // It will remove all non-printable characters.
      // This are all characters NOT within the ASCII HEX space 0x20-0x7E.
      .replace(/[^\x20-\x7E]/gmi, '')
      .replace(/[\n\r]+/g, '');

    // make sure the env_variables are set
    this.appSettings.env_variables = this.env;
    // We will use shell sed command to replace the variables
    Object.assign(this.appSettings.env_variables, {
      METEOR_SETTINGS: '{{ METEOR_SETTINGS }}',
    });

    // Create app.yaml file
    const app = yaml.safeDump(this.appSettings);
    shell.exec(`echo '${app}' >${this.workingDir}/bundle/app.yaml`);
    shell.sed('-i', '{{ METEOR_SETTINGS }}', `'${compactSettings}'`, `${this.workingDir}/bundle/app.yaml`);
    const resultAppYaml = yaml.safeLoad(fs.readFileSync(`${this.workingDir}/bundle/app.yaml`));
    resultAppYaml.env_variables.MONGO_URL = '*****';
    resultAppYaml.env_variables.MONGO_OPLOG_URL = '*****';
    winston.debug(`the following app.yaml will be used:\n${JSON.stringify(resultAppYaml)}`);
    const nodeVersion = this.nodeVersion || shell.exec(
      `meteor node -v ${this.ci ? '--allow-superuser' : ''}`,
      { silent: true },
    ).stdout.trim();
    const npmVersion = this.npmVersion || shell.exec(
      `meteor npm -v ${this.ci ? '--allow-superuser' : ''}`,
      { silent: true },
    ).stdout.trim();
    winston.debug(`set Node to ${nodeVersion}`);
    winston.debug(`set NPM to ${npmVersion}`);

    // Create Dockerfile
    const docker = this.dockerFile
      .replace('{{ nodeVersion }}', nodeVersion)
      .replace('{{ npmVersion }}', npmVersion);

    shell.exec(`echo '${docker}' >${this.workingDir}/bundle/Dockerfile`);
    winston.debug(`the following Dockerfile will be used:\n${JSON.stringify(yaml.safeLoad(
      fs.readFileSync(`${this.workingDir}/bundle/Dockerfile`),
    ))}`);
  }

  async deployBundle() {
    winston.debug('deploy to App Engine');

    // Allow users to pass any option to gcloud app deploy
    const settings = this.googleCloudSettings;
    const flags = Object.keys(settings).map((key) => {
      if (key !== 'env_variables') {
        const value = settings[key];

        // Only some flags actually require a value (e.g. stop-previous-version)
        if (value) {
          return `--${key}=${settings[key]}`;
        }

        return `--${key}`;
      }
    }).join(' ');

    winston.debug(`set flags for deploy: ${flags}`);
    shell.exec(`cd ${this.workingDir}/bundle && gcloud app deploy -q ${flags}`);
  }
}
