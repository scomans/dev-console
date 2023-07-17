const { writeFile, readFile } = require('fs/promises');
const { join } = require('path');
const version = require('../../package.json').version;
const cliArgs = process.argv.slice(2);


async function updateVersion() {
  let newVersion = cliArgs[0].toLowerCase();

  let packageJsonContent = await readFile(join(__dirname, '../../package.json'), 'utf-8');
  const packageJson = JSON.parse(packageJsonContent);
  packageJson.version = newVersion;
  packageJsonContent = JSON.stringify(packageJson);
  await writeFile(join(__dirname, '../../package.json'), packageJsonContent);

  let tauriConfJsonContent = await readFile(join(__dirname, '../../apps/wrapper/tauri.conf.json'), 'utf-8');
  const tauriConfJson = JSON.parse(tauriConfJsonContent);
  tauriConfJson.package.version = newVersion;
  tauriConfJsonContent = JSON.stringify(tauriConfJson);
  await writeFile(join(__dirname, '../../apps/wrapper/tauri.conf.json'), tauriConfJsonContent);

  let cargoTomlContent = await readFile(join(__dirname, '../../apps/wrapper/Cargo.toml'), 'utf-8');
  cargoTomlContent = cargoTomlContent.replace(/version = "0\.0\.0"/gm, 'version = "' + version + '"');
  await writeFile(join(__dirname, '../../apps/wrapper/Cargo.toml'), cargoTomlContent);

  console.log(`Set version to ${newVersion}`);
}

void updateVersion();
