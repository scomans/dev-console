const readFile = require('fs').readFileSync;
const resolve = require('path').resolve;
const gitmojis = require('./gitmoji.json').gitmojis;

const template = readFile(resolve(__dirname, './templates/template.hbs'), 'utf-8');
const header = readFile(resolve(__dirname, './templates/header.hbs'), 'utf-8');
const commit = readFile(resolve(__dirname, './templates/commit.hbs'), 'utf-8');

module.exports = {
  transform: (commit) => {
    if (commit.header.includes(':bookmark:')) {
      return;
    }

    commit.shortHash = commit.hash.substring(0, 7);

    commit.header = commit.header.replace(/:\w+:/gm, substring => {
      const gitmoji = gitmojis.find(g => g.code === substring);
      if (gitmoji) {
        return gitmoji.emoji;
      }
      return substring;
    });

    return commit;
  },

  commitGroupsSort: 'title',
  commitsSort: ['header'],
  mainTemplate: template,
  headerPartial: header,
  commitPartial: commit,
};
