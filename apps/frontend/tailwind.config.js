const { guessProductionMode } = require('@ngneat/tailwind');
const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('path');
const defaultConfig = require('../../tailwind.config');

process.env.TAILWIND_MODE = guessProductionMode() ? 'build' : 'watch';

module.exports = {
  ...defaultConfig,
  content: [
    join(
      __dirname,
      'src/**/!(*.stories|*.spec).{html,ts,css,scss,sass,less,styl}',
    ),
    ...createGlobPatternsForDependencies(
      __dirname,
      '/**/!(*.stories|*.spec).{html,ts,css,scss,sass,less,styl}',
    ),
  ],
};
