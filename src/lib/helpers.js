// Helper functions

import fs from 'fs';
import shell from 'shelljs';
import winston from 'winston';

export function initRepo() {
  const path = '../node_modules/meteor-google-cloud/examples/';
  const dockerFile = 'Dockerfile';
  const app = 'app.yml';
  const settings = 'settings.json';

  // Init app.yaml
  if (!fs.existsSync('./deploy/app.yml')) {
    shell.cp('-R', `${path}${app}`, '.deploy/');

    winston.info('app.yml created on .deploy/ it has the default/minimum settings you need');
  } else {
    winston.info('app.yml already exists on .deploy/');
  }

  // Init Dockerfile
  if (!fs.existsSync('./deploy/Dockerfile')) {
    shell.cp('-R', `${path}${dockerFile}`, '.deploy/');

    winston.info('Dockerfile created on .deploy/');
  } else {
    winston.info('Dockerfile already exists on .deploy/');
  }

  // Init settings
  if (!fs.existsSync('./deploy/settings.json')) {
    shell.cp('-R', `${path}${settings}`, '.deploy/');

    winston.info('Meteor settings file created on .deploy/');
  } else {
    winston.info('settings.json already exists on .deploy/');
  }
}
