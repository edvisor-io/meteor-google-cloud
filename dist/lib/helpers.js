"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initRepo = initRepo;

var _fs = _interopRequireDefault(require("fs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Helper functions
function initRepo() {
  // Init app.yaml
  if (!_fs.default.existsSync('./deploy/app.yaml')) {} // Init Dockerfile


  if (!_fs.default.existsSync('./deploy/Dockerfile')) {}
}