// CLI setup

import program from 'commander';
import shell from 'shelljs';
import tmp from 'tmp';
import updateNotifier from 'update-notifier';
import winston from 'winston';
import pkg from '../../package.json';
import {
  validateGCloud, validateSettings, validateMeteor, validateApp, getDocker, validateEnv,
} from './validation';
import compileBundle from './bundle';
import AppEngineInstance from './google';
import { initRepo } from './helpers';

// Notify user of available updates
updateNotifier({ pkg }).notify();

// Configure CLI
program
  .description(pkg.description)
  .version(`v${pkg.version}`, '-v, --version')
  .option('-i, --init', 'init necessary files on your repo')
  .option('-b, --build-only', 'build bundle only')
  .option('-s, --settings <path>', 'path to settings file (settings.json)')
  .option('-c, --app <path>', 'path to app.yaml config file')
  .option('-d, --docker <path>', 'path to Dockerfile file')
  .option('-p, --project <path>', 'path of the directory of your Meteor project')
  .option('-v, --verbose', 'enable verbose mode')
  .option('-q, --quiet', 'enable quite mode')
  .option('-ci, --ci', 'add --allow-superuser flag in meteor commands for running in CI')
  .option('-o, --output-dir <path>', 'build files output directory')
  .option('-k, --keep-output-dir', 'do not remove the output directory before start')
  .option('--node-version <version>', 'set custom node version')
  .option('--npm-version <version', 'set custom npm version')
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
if (program.verbose === true) {
  winston.level = 'debug';
}

export default async function startup() {
  try {
    // If it's init, we will stop here
    if (program.init === true) {
      initRepo();

      process.exit(0);
      return;
    }

    if (!program.buildOnly) {
      // Validate if gcloud is installed (Only when it requires deployment)
      validateGCloud();
    }

    // Validate Meteor version/packages
    validateMeteor();

    // Validate settings file(s)
    const settingsFile = validateSettings(program.settings);
    const appFile = validateApp(program.app);
    const dockerFile = getDocker(program.docker);
    const { outputDir } = program;
    /*
     Validate that either settingsFile[meteor-google-cloud].env_variables
     or appFile.env_variables contains the needed variables
     */
    const env = validateEnv(settingsFile, appFile);
    // Create Meteor bundle
    const { workingDir } = compileBundle({
      dir: program.project,
      workingDir: outputDir,
      ci: program.ci,
      keep: program.keepOutputDir,
    });

    // Set up GCP App Engine instance
    const appEngine = new AppEngineInstance({
      settingsFile,
      appFile,
      dockerFile,
      workingDir,
      ci: program.ci,
      env,
      nodeVersion: program.nodeVersion,
      npmVersion: program.npmVersion,
    });

    appEngine.prepareBundle();

    // If --build-only flag was passed, exit
    if (program.buildOnly === true) {
      process.exit(0);
      return;
    }

    appEngine.deployBundle();

    process.exit(0);
  } catch (error) {
    tmp.setGracefulCleanup();

    winston.error(error.message);
    process.exit(1);
  }
}
