// CLI setup

import program from 'commander';
import shell from 'shelljs';
import updateNotifier from 'update-notifier';
import winston from 'winston';
import pkg from '../../package.json';
import { validateGCloud, validateSettings, validateMeteor } from './validation';

// Notify user of available updates
updateNotifier({ pkg }).notify();

// Configure CLI
program
  .description(pkg.description)
  .version(`v${pkg.version}`, '-v, --version')
  .option('-s, --settings <path>', 'path to settings file (settings.json)', 'settings.json')
  .option('-c, --config <path>', 'path to GCP Deployment Manager config file', 'config.yml')
  .option('-d, --debug', 'enable debug mode')
  .option('-q, --quiet', 'enable quite mode')
  .parse(process.argv);

// Pretty print logs
winston.cli();

// Terminate on shelljs errors
shell.config.fatal = true;

// Toggle Quiet mode based on user preference
if (program.quiet === true) {
  winston.level = 'error';
  shell.config.silent = true;
}

// Toggle Debug mode based on user preference
if (program.debug === true) {
  winston.level = 'debug';
}

export default async function startup() {
  try {
    // Validate if gcloud is installed
    validateGCloud();

    // Validate Meteor version/packages
    validateMeteor();

    // Validate settings file(s)
    const settingsFilePath = program.settings;
    const settingsFile = validateSettings(program.settings);
  } catch (error) {
    winston.error(error.message);
    process.exit(1);
  }
}
