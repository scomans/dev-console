'use strict';

let { request } = require('@octokit/request');
const { prerelease, inc } = require('semver');
const { writeFile } = require('fs/promises');
const { join } = require('path');
const versions = require('../../versions.json');

const [, , project, owner, repo] = process.argv;

async function updateVersion() {
  if (prerelease(versions[project])) {
    const TOKEN = process.env.TOKEN;
    request = request.defaults({
      owner: owner,
      repo: repo,
      headers: {
        authorization: `token ${ TOKEN }`,
      },
    });

    const result = await request('GET /repos/{owner}/{repo}/releases');
    const latestPreRelease = result.data.filter(release => release.prerelease && release.tag_name.startsWith(`${ project }-`))[0];
    const latestVersion = latestPreRelease.tag_name.replace(`${ project }-`, '');
    versions[project] = inc(latestVersion, 'prerelease', 'beta');
    await writeFile(join(__dirname, '../../versions.json'), JSON.stringify(versions, null, 2) + '\n');

    console.log(`Set version of ${ project } to ${ versions[project] }`);
  }
}

void updateVersion();
