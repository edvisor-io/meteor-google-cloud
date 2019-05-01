// Helper functions

import fs from 'fs';
import shell from 'shelljs';
import winston from 'winston';

export function initRepo() {
  const dirName = __dirname;

  const path = dirName.replace('/dist/lib', '/examples/');
  const dockerFile = 'Dockerfile';
  const app = 'app.yml';
  const settings = 'settings.json';

  shell.exec('mkdir -p deploy');
  const newFolderPath = `${process.cwd()}/deploy`;

  // Init app.yaml
  if (!fs.existsSync('./deploy/app.yml')) {
    shell.cp('-R', `${path}${app}`, newFolderPath);

    winston.info('app.yml created on deploy/ it has the default/minimum settings you need');
  } else {
    winston.error('app.yml already exists on deploy/');
  }

  // Init Dockerfile
  if (!fs.existsSync('./deploy/Dockerfile')) {
    shell.cp('-R', `${path}${dockerFile}`, newFolderPath);

    winston.info('Dockerfile created on deploy/');
  } else {
    winston.error('Dockerfile already exists on deploy/');
  }

  // Init settings
  if (!fs.existsSync('./deploy/settings.json')) {
    shell.cp('-R', `${path}${settings}`, newFolderPath);

    winston.info('Meteor settings file created on deploy/');
  } else {
    winston.error('settings.json already exists on deploy/');
  }
}
