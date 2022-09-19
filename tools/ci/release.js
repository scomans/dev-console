let { request } = require('@octokit/request');
const { gt, prerelease } = require('semver');
const { createReadStream, statSync } = require('fs');
const { join, resolve, dirname, basename } = require('path');
const simpleGit = require('simple-git');

const project = require('../../package.json');
const VERSION = project.version;
const TOKEN = process.env.TOKEN;

const owner = project.author;
const repo = project.name;

request = request.defaults({
  owner,
  repo,
  headers: {
    authorization: `token ${ TOKEN }`,
  },
});

const assetPath = resolve(join(dirname(__filename), '../..', 'dist/executables'));

async function main() {
  try {
    const result = await request('GET /repos/{owner}/{repo}/releases');
    const latestRelease = result.data[0];
    const releaseVersion = latestRelease.tag_name;

    if (gt(VERSION, releaseVersion)) {
      const pre = !!prerelease(VERSION);
      const commits = await simpleGit().log({ from: 'HEAD', to: releaseVersion });
      let body = '## Changelog\n\n';
      body += commits.all
        .reverse()
        .map(c => `* ${ c.message } ([${ c.hash.substring(0, 7) }](https://github.com/${ owner }/${ repo }/commit/${ c.hash }))`)
        .join('\n');
      body += '\n\n## Download\n\n';
      body += `* [dev-console-setup-${ VERSION }.exe](https://github.com/${ owner }/${ repo }/releases/download/${ VERSION }/dev-console-setup-${ VERSION }.exe)`;

      const newRelease = await request('POST /repos/{owner}/{repo}/releases', {
        tag_name: VERSION,
        name: `v${ VERSION }`,
        prerelease: pre,
        draft: true,
        body,
      });

      await uploadAsset(newRelease, join(assetPath, `dev-console-setup-${ VERSION }.exe`));
      await uploadAsset(newRelease, join(assetPath, `dev-console-setup-${ VERSION }.exe.blockmap`));
      await uploadAsset(newRelease, join(assetPath, pre ? 'beta.yml' : 'latest.yml'));

      await request('PATCH /repos/{owner}/{repo}/releases/{release_id}', {
        release_id: newRelease.data.id,
        draft: false,
      });

      console.log(`DID ${ pre ? 'PRE' : '' }RELEASE`, VERSION);
    }
  } catch (err) {
    console.error(err);
  }
}

async function uploadAsset(release, filePath) {
  const releaseFileSize = statSync(filePath);
  let fileStream = createReadStream(filePath);
  return await request('POST ' + release.data.upload_url, {
    headers: {
      'content-length': releaseFileSize.size,
      'Content-Type': 'application/octet-stream',
    },
    release_id: release.data.id,
    name: basename(filePath),
    data: fileStream,
  });
}

void main();
