// Bundle compilation method

import tmp from 'tmp';
import path from 'path';
import shell from 'shelljs';
import winston from 'winston';

export default function compileBundle({ dir } = {}) {
  const workingDir = tmp.dirSync().name;
  const customMeteorProjectDirShellEx = `cd ${dir} &&`;

  winston.info('Compiling application bundle');

  // Generate Meteor build
  winston.debug(`generate meteor build at ${workingDir}`);
  shell.exec(`rm -rf ${workingDir}`);
  shell.exec(`${dir ? customMeteorProjectDirShellEx : ''} meteor build ${workingDir} --directory --server-only --architecture os.linux.x86_64`);

  // Cleanup broken symlinks
  winston.debug('checking for broken symlinks');
  shell.find(path.join(workingDir, 'bundle')).forEach((symlinkPath) => {
    // Matches symlinks that do not exist
    if (shell.test('-L', symlinkPath) && !shell.test('-e', symlinkPath)) {
      // Delete file
      shell.rm('-f', symlinkPath);
      winston.debug(`deleted symlink at '${symlinkPath}'`);
    }
  });

  return { workingDir };
}
