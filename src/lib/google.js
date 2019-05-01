// Google methods

import omit from 'lodash.omit';
import shell from 'shelljs';
import winston from 'winston';
import yaml from 'js-yaml';

export default class AppEngineInstance {
  constructor({
    settingsFile,
    dockerFile,
    appFile,
    workingDir,
  }) {
    this.meteorSettings = omit(settingsFile, 'meteor-google-cloud');
    this.dockerFile = dockerFile;
    this.appSettings = appFile;
    this.workingDir = workingDir;
  }

  prepareBundle() {
    // We add the Meteor settings now to avoid it being compiled to YAML
    const compactSettings = JSON
      .stringify(this.meteorSettings || {}, null, 0)
      // It will remove all non-printable characters.
      // This are all characters NOT within the ASCII HEX space 0x20-0x7E.
      .replace(/[^\x20-\x7E]/gmi, '')
      .replace(/[\n\r]+/g, '');

    // We will use shell sed command to replace the variables
    Object.assign(this.appSettings.env_variables, {
      METEOR_SETTINGS: '{{ METEOR_SETTINGS }}',
    });

    // Create app.yaml file
    const app = yaml.safeDump(this.appSettings);
    shell.exec(`echo '${app}' >${this.workingDir}/bundle/app.yaml`);
    shell.sed('-i', '{{ METEOR_SETTINGS }}', `'${compactSettings}'`, `${this.workingDir}/bundle/app.yaml`);

    const nodeVersion = shell.exec('meteor node -v', { silent: true }).stdout.trim();
    const npmVersion = shell.exec('meteor npm -v', { silent: true }).stdout.trim();
    winston.debug(`set Node to ${nodeVersion}`);
    winston.debug(`set NPM to ${npmVersion}`);

    // Create Dockerfile
    const docker = this.dockerFile
      .replace('{{ nodeVersion }}', nodeVersion)
      .replace('{{ npmVersion }}', npmVersion);

    shell.exec(`echo '${docker}' >${this.workingDir}/bundle/Dockerfile`);
  }

  async deployBundle() {
    winston.debug('deploy to App Engine');

    const settings = this.meteorSettings['meteor-google-cloud'];
    const flags = Object.keys(settings).map(key => `${key}=${settings[key]}`).join(' ');

    winston.debug(`set flags for deploy: ${flags}`);
    shell.exec(`cd ${this.workingDir}/bundle && gcloud app deploy -q ${flags}`);
  }
}
