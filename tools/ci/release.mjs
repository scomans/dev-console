import { Octokit } from '@octokit/rest';
import { gt, prerelease } from 'semver';
import { basename, join, resolve } from 'path';
import simpleGit from 'simple-git';
import { readFile } from 'fs/promises';
import packageJson from '../../package.json' assert { type: 'json' };

const TOKEN = process.env.GITHUB_TOKEN;
const LANGUAGE = 'en-US';

const owner = 'scomans';
const repo = 'dev-console';


const octokit = new Octokit({ auth: TOKEN });

const __dirname = import.meta.dirname;
const assetPath = resolve(join(__dirname, '../..', 'dist/apps/wrapper/release/bundle'));

async function main() {
  try {
    const result = await octokit.repos.listReleases({ owner, repo });
    const latestRelease = result.data[0];
    const releaseVersion = latestRelease.tag_name;

    if (gt(packageJson.version, releaseVersion)) {
      const pre = !!prerelease(packageJson.version);
      const commits = await simpleGit().log({ from: 'HEAD', to: releaseVersion });
      let body = '## Changelog\n\n';
      body += commits.all
        .map(c => `* ${c.message} ([${c.hash.substring(0, 7)}](https://github.com/${owner}/${repo}/commit/${c.hash}))`)
        .reverse()
        .join('\n');
      body += '\n\n## Download\n\n';
      body += `* [DevConsole_${packageJson.version}_x64_${LANGUAGE}.msi.zip](https://github.com/${owner}/${repo}/releases/download/${packageJson.version}/DevConsole_${packageJson.version}_x64_${LANGUAGE}.msi.zip)`;

      const newRelease = await octokit.repos.createRelease({
        owner,
        repo,
        tag_name: packageJson.version,
        name: `v${packageJson.version}`,
        prerelease: pre,
        draft: true,
        body,
      });

      await uploadAsset(newRelease, join(assetPath, 'msi', `DevConsole_${packageJson.version}_x64_${LANGUAGE}.msi.zip`));
      await uploadAsset(newRelease, join(assetPath, 'msi', `DevConsole_${packageJson.version}_x64_${LANGUAGE}.msi.zip.sig`));
      await generateLatestJson(join(assetPath, 'msi', `DevConsole_${packageJson.version}_x64_${LANGUAGE}.msi.zip.sig`), packageJson.version, newRelease);

      await octokit.repos.updateRelease({
        owner,
        repo,
        release_id: newRelease.data.id,
        draft: false,
      });

      console.log(`DID ${pre ? 'PRE' : ''}RELEASE`, packageJson.version);
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
        'url': `https://github.com/${owner}/${repo}/releases/download/${version}/DevConsole_${packageJson.version}_x64_${LANGUAGE}.msi.zip`,
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
