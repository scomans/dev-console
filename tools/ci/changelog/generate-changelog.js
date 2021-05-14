const conventionalChangelogCore = require('conventional-changelog-core');
const writerOpts = require('./writer-opts');

function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

function generateChangelog(project, version) {
  const changelogStream = conventionalChangelogCore({
    config: {
      writerOpts,
    },
    releaseCount: 1,
    skipUnstable: true,
    tagPrefix: `${ project }-`,
    // debug: console.debug.bind(console),
  }, {
    version,
  });
  return streamToString(changelogStream);
}

module.exports = { generateChangelog };
