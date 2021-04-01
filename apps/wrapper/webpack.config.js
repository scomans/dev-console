'use strict';

const packageJsonPlugin = require('../../tools/ci/generate-package-json');

module.exports = packageJsonPlugin({
  project: 'frontend',
  filterDependencies: [
    'electron',
  ],
  implicitDependencies: [
    'reflect-metadata',
  ],
});
