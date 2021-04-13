const { exec } = require('child_process');
const { gt, prerelease } = require('semver');
const { createReadStream, statSync } = require('fs');
const { join, resolve, dirname, basename } = require('path');
const { run: generateAutoChangelog } = require('auto-changelog/src/run');
let { request } = require('@octokit/request');

const originalStdoutWrite = process.stdout.write.bind(process.stdout);
const TOKEN = process.env.TOKEN;
const [, , project, owner, repo] = process.argv;
const VERSION = require('../../versions.json')[project];

request = request.defaults({
  owner: owner,
  repo: repo,
  headers: {
    authorization: `token ${ TOKEN }`,
  },
});

const assetPath = resolve(join(dirname(__filename), '../..', 'dist/executables'));

async function main() {
  try {
    const result = await request('GET /repos/{owner}/{repo}/releases');

    if (prerelease(VERSION)) {
      const latestPreRelease = result.data.filter(release => release.prerelease && release.tag_name.startsWith(`${ project }-`))[0];

      if (latestPreRelease) {
        await request('DELETE /repos/{owner}/{repo}/releases/{release_id}', {
          release_id: latestPreRelease.id,
        });
        try {
          await request('DELETE /repos/{owner}/{repo}/git/refs/{ref}', {
            ref: `tags/${ latestPreRelease.tag_name }`,
          });
        } catch (e) {
          console.error(e);
        }
      }

      const newRelease = await request('POST /repos/{owner}/{repo}/releases', {
        tag_name: `${ project }-${ VERSION }`,
        name: `${ project } v${ VERSION }`,
        prerelease: true,
        draft: true,
        body: `This is a development build!\n\n[${ project }-setup-${ VERSION }.exe](https://github.com/${ owner }/${ repo }/releases/download/${ project }-${ VERSION }/${ project }-setup-${ VERSION }.exe)`,
      });

      await uploadAsset(newRelease, join(assetPath, `${ project }-setup-${ VERSION }.exe`));
      await uploadAsset(newRelease, join(assetPath, `${ project }-setup-${ VERSION }.exe.blockmap`));
      await uploadAsset(newRelease, join(assetPath, `beta.yml`));

      await request('PATCH /repos/{owner}/{repo}/releases/{release_id}', {
        release_id: newRelease.data.id,
        draft: false,
      });

      await exec('git fetch');

      const changelog = await generateChangelog();
      await request('PATCH /repos/{owner}/{repo}/releases/{release_id}', {
        release_id: newRelease.data.id,
        body: changelog,
      });

      console.log('DID PRERELEASE', VERSION);
    } else {
      const latestRelease = result.data.filter(release => !release.prerelease && release.tag_name.startsWith(`${ project }-`))[0];
      const releaseVersion = latestRelease ? latestRelease.tag_name.replace(`${ project }-`, '') : '0.0.0';

      if (gt(VERSION, releaseVersion)) {

        const newRelease = await request('POST /repos/{owner}/{repo}/releases', {
          tag_name: `${ project }-${ VERSION }`,
          name: `${ project } v${ VERSION }`,
          draft: true,
          body: `[${ project }-setup-${ VERSION }.exe](https://github.com/${ owner }/${ repo }/releases/download/${ project }-${ VERSION }/${ project }-setup-${ VERSION }.exe)`,
        });

        await uploadAsset(newRelease, join(assetPath, `${ project }-setup-${ VERSION }.exe`));
        await uploadAsset(newRelease, join(assetPath, `${ project }-setup-${ VERSION }.exe.blockmap`));
        await uploadAsset(newRelease, join(assetPath, `latest.yml`));

        await request('PATCH /repos/{owner}/{repo}/releases/{release_id}', {
          release_id: newRelease.data.id,
          draft: false,
        });

        await exec('git fetch');

        const changelog = await generateChangelog();
        await request('PATCH /repos/{owner}/{repo}/releases/{release_id}', {
          release_id: newRelease.data.id,
          body: changelog,
        });

        console.log(`DID RELEASE for ${ project }: ${ VERSION }`);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

async function generateChangelog() {
  process.stdout.write = (chunk) => result += chunk;
  let result = '';
  await generateAutoChangelog([
    process.argv[0],
    process.argv[1],
    '--starting-version',
    project + '-' + VERSION,
  ]);
  process.stdout.write = originalStdoutWrite;
  return result;
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
