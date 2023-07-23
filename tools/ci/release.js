const { Octokit } = require('@octokit/rest');
const { gt, prerelease } = require('semver');
const { join, resolve, dirname, basename } = require('path');
const simpleGit = require('simple-git');
const { readFile } = require('fs/promises');

const VERSION = require('../../package.json').version;
const TOKEN = process.env.GITHUB_TOKEN;
const LANGUAGE = 'en-US';

const owner = 'scomans';
const repo = 'dev-console';


const octokit = new Octokit({ auth: TOKEN });


const assetPath = resolve(join(dirname(__filename), '../..', 'dist/apps/wrapper/release/bundle'));

async function main() {
  try {
    const result = await octokit.repos.listReleases({ owner, repo });
    const latestRelease = result.data[0];
    const releaseVersion = latestRelease.tag_name;

    if (gt(VERSION, releaseVersion)) {
      const pre = !!prerelease(VERSION);
      const commits = await simpleGit().log({ from: 'HEAD', to: releaseVersion });
      let body = '## Changelog\n\n';
      body += commits.all
        .map(c => `* ${c.message} ([${c.hash.substring(0, 7)}](https://github.com/${owner}/${repo}/commit/${c.hash}))`)
        .reverse()
        .join('\n');
      body += '\n\n## Download\n\n';
      body += `* [DevConsole_${VERSION}_x64_${LANGUAGE}.msi.zip](https://github.com/${owner}/${repo}/releases/download/${VERSION}/DevConsole_${VERSION}_x64_${LANGUAGE}.msi.zip)`;

      const newRelease = await octokit.repos.createRelease({
        owner,
        repo,
        tag_name: VERSION,
        name: `v${VERSION}`,
        prerelease: pre,
        draft: true,
        body,
      });

      await uploadAsset(newRelease, join(assetPath, 'msi', `DevConsole_${VERSION}_x64_${LANGUAGE}.msi.zip`));
      await uploadAsset(newRelease, join(assetPath, 'msi', `DevConsole_${VERSION}_x64_${LANGUAGE}.msi.zip.sig`));
      await generateLatestJson(join(assetPath, 'msi', `DevConsole_${VERSION}_x64_${LANGUAGE}.msi.zip.sig`), VERSION, newRelease);

      await octokit.repos.updateRelease({
        owner,
        repo,
        release_id: newRelease.data.id,
        draft: false,
      });

      console.log(`DID ${pre ? 'PRE' : ''}RELEASE`, VERSION);
    }
  } catch (err) {
    console.error(err);
  }
}

/**
 *
 * @param path string
 * @param version string
 * @param release
 * @returns {Promise<void>}
 */
async function generateLatestJson(path, version, release) {
  const signature = await readFile(path, 'utf-8');
  const content = {
    version,
    notes: `DevConsole v${version}`,
    pub_date: new Date().toISOString(),
    platforms: {
      'windows-x86_64': {
        signature,
        'url': `https://github.com/${owner}/${repo}/releases/download/v${version}/DevConsole_${VERSION}_x64_${LANGUAGE}.msi.zip`,
      },
    },
  };

  await octokit.rest.repos.uploadReleaseAsset({
    owner,
    repo,
    release_id: release.data.id,
    name: 'latest.json',
    data: Buffer.from(JSON.stringify(content)),
  });
}

async function uploadAsset(release, filePath) {
  /**
   * @type {Buffer}
   */
  const fileData = await readFile(filePath);
  await octokit.rest.repos.uploadReleaseAsset({
    owner,
    repo,
    release_id: release.data.id,
    name: basename(filePath),
    data: fileData,
  });
}

void main();
