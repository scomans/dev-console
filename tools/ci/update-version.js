'use strict';

let { request } = require('@octokit/request');
const { inc } = require('semver');
const { writeFile, readFile } = require('fs/promises');
const { join } = require('path');
const project = require('../../package.json');
const cliArgs = process.argv.slice(2);

const version = project.version;
const owner = project.author;
const repo = project.name;


async function updateVersion() {
  const TOKEN = process.env.TOKEN_GITHUB;
  request = request.defaults({
    owner,
    repo,
    headers: {
      authorization: `token ${ TOKEN }`,
    },
  });
  const result = await request('GET /repos/{owner}/{repo}/releases');

  const latestRelease = result.data.filter(release => !release.prerelease)[0];
  const latestVersion = latestRelease.tag_name;
  let newVersion = inc(latestVersion, cliArgs[0].toLowerCase());

  let packageJsonContent = await readFile(join(__dirname, '../../package.json'), 'utf-8');
  packageJsonContent = packageJsonContent.replace(`"version": "${ version }",`, `"version": "${ newVersion }",`);
  await writeFile(join(__dirname, '../../package.json'), packageJsonContent);

  console.log(`Set version to ${ newVersion }`);
}

void updateVersion();
