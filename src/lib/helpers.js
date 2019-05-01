// Helper functions

import fs from 'fs';

export function initRepo() {
  // Init app.yaml
  if (!fs.existsSync('./deploy/app.yaml')) {

  }

  // Init Dockerfile
  if (!fs.existsSync('./deploy/Dockerfile')) {

  }
}
