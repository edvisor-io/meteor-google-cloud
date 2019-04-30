"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = compileBundle;

var _tmp = _interopRequireDefault(require("tmp"));

var _path = _interopRequireDefault(require("path"));

var _shelljs = _interopRequireDefault(require("shelljs"));

var _winston = _interopRequireDefault(require("winston"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Bundle compilation method
function compileBundle() {
  var workingDir = _tmp.default.dirSync().name;

  _winston.default.info('Compiling application bundle'); // Generate Meteor build


  _winston.default.debug(`generate meteor build at ${workingDir}`);

  _shelljs.default.exec(`rm -rf ${workingDir}`);

  _shelljs.default.exec(`meteor build ${workingDir} --directory --server-only --architecture os.linux.x86_64`); // Cleanup broken symlinks


  _winston.default.debug('checking for broken symlinks');

  _shelljs.default.find(_path.default.join(workingDir, 'bundle')).forEach(function (symlinkPath) {
    // Matches symlinks that do not exist
    if (_shelljs.default.test('-L', symlinkPath) && !_shelljs.default.test('-e', symlinkPath)) {
      // Delete file
      _shelljs.default.rm('-f', symlinkPath);

      _winston.default.debug(`deleted symlink at '${symlinkPath}'`);
    }
  });

  return {
    workingDir
  };
}