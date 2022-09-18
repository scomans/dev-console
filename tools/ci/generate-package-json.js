'use strict';

const CopyPlugin = require('copy-webpack-plugin');
const fs = require('fs');
const path = require('path');
const util = require('util');
const { builtinModules } = require('module');
const packageJson = require('../../package.json');

function packageJsonPlugin(options) {
  return (config, context) => {
    // Extract output path from context
    const outputPath = context.normalizedOptions?.outputPath;

    // Install additional plugins
    config.plugins = config.plugins || [];
    config.plugins.push(...extractRelevantNodeModules(outputPath, options));

    return config;
  };
}

/**
 * This repository only contains one single package.json file that lists the dependencies
 * of all its frontend and backend applications. When a frontend application is built,
 * its external dependencies (aka Node modules) are bundled in the resulting artifact.
 * However, it is not the case for a backend application (for various valid reasons).
 * Installing all the production dependencies would dramatically increase the size of the
 * artifact. Instead, we need to extract the dependencies which are actually used by the
 * backend application. We have implemented this behavior by complementing the default
 * Webpack configuration with additional plugins.
 *
 * @param {String} outputPath The path to the bundle being built
 * @param {PackageJsonPlugin} options
 * @returns {Array} An array of Webpack plugins
 */
function extractRelevantNodeModules(outputPath, options) {
  return [
    copyPnpmLockFile(outputPath),
    generatePackageJson(options),
  ];
}

/**
 * Copy the Yarn lock file to the bundle to make sure that the right dependencies are
 * installed when running `yarn install`.
 *
 * @param {String} outputPath The path to the bundle being built
 * @returns {*} A Webpack plugin
 */
function copyPnpmLockFile(outputPath) {
  return new CopyPlugin({
    patterns: [
      { from: 'pnpm-lock.yaml', to: path.join(outputPath, 'pnpm-lock.yaml') },
    ],
  });
}

/**
 * Generate a package.json file that contains only the dependencies which are actually
 * used in the code.
 *
 * @param {PackageJsonPlugin} options
 * @returns {*} A Webpack plugin
 */
function generatePackageJson(options) {
  const dependencies = (options.implicitDependencies ?? []).reduce((acc, dep) => {
    acc[dep] = packageJson.dependencies[dep];
    return acc;
  }, {});
  const basePackageJson = {
    name: options.name ?? packageJson.name,
    productName: options.productName ?? packageJson.productName,
    author: packageJson.author,
    description: packageJson.description,
    version: packageJson.version,
    private: true,
    scripts: options.scripts,
    dependencies,
  };
  return new GeneratePackageJsonPlugin(basePackageJson, {
    filterDependencies: options.filterDependencies ?? [],
  });
}

/// #############################################################################################################
/// ################################## GeneratePackageJsonPlugin ################################################
/// #############################################################################################################

let debugMode = false;

const isWebpack5 = false; // Number(wpVersion.split('.')[0]) >= 5;
const pluginName = 'GeneratePackageJsonPlugin';
const pluginPrefix = '( Generate Package Json Webpack Plugin ): ';

function GeneratePackageJsonPlugin(
  basePackage = {
    name: '',
    version: '0.0.1',
  }, {
    debug = false,
    extraSourcePackageFilenames = [],
    sourcePackageFilenames = [],
    additionalDependencies = {},
    useInstalledVersions = true,
    resolveContextPaths,
    filterDependencies,
  } = {},
) {
  if (debug) {
    console.log(`GeneratePackageJsonPlugin: Debugging mode activated!`);
    debugMode = true;
  }

  /*
  TODO for future - accept a string and load the base.package.json directly
  if (typeof otherPackageValues === "string") {
    otherPackageValues = JSON.parse(fs.readFileSync(path.join(__dirname, filename)).toString());
  }*/

  const sourcePackagesDependencyVersionMap = {};

  const allSourcePackageFilenames = [...extraSourcePackageFilenames, ...sourcePackageFilenames];

  if (allSourcePackageFilenames.length > 0) {
    logIfDebug(`GPJWP: Received ${ allSourcePackageFilenames.length } extra package.json file${ allSourcePackageFilenames.length > 1 ? 's' : '' } from which to source versions (later takes preference):`);
    allSourcePackageFilenames.reverse();
    let fileIndex = 1;

    for (const filename of allSourcePackageFilenames) {
      logIfDebug(`${ fileIndex++ } : ${ filename }`);
      const extraSourcePackage = JSON.parse(fs.readFileSync(filename).toString());
      Object.assign(sourcePackagesDependencyVersionMap, extraSourcePackage.dependencies ? extraSourcePackage.dependencies : {});
    }
  }

  logIfDebug(`GPJWP: Final map of dependency versions to be used if encountered in bundle:\n`, sourcePackagesDependencyVersionMap);

  Object.assign(this, {
    basePackage,
    dependencyVersionMap: sourcePackagesDependencyVersionMap,
    additionalDependencies,
    useInstalledVersions,
    resolveContextPaths,
    filterDependencies,
  });
}

function logIfDebug(something, object = '') {
  if (debugMode) {
    if (object) {
      console.log(something, util.inspect(object, { depth: 3 }));
    } else {
      console.log(something);
    }
  }
}

function getNameFromPortableId(raw) {
  let cut = raw.substring(raw.indexOf('"') + 1, raw.lastIndexOf('"'));

  let slashCount = (cut.match(/\//g) || []).length;

  while ((cut.indexOf('@') === -1 && slashCount > 0) || slashCount > 1) {
    cut = cut.substring(0, cut.lastIndexOf('\/'));
    slashCount -= 1;
  }

  return cut;
}

GeneratePackageJsonPlugin.prototype.apply = function (compiler) {

  const computePackageJson = (compilation) => {
    const dependencyTypes = ['dependencies', 'devDependencies', 'peerDependencies'];

    const modules = Object.assign({}, this.additionalDependencies);

    const getInstalledVersionForModuleName = (moduleName, context) => {
      let modulePackageFile;
      const resolveFile = path.join(moduleName, './package.json');

      try {
        modulePackageFile = require.resolve(resolveFile, context ? {
          paths: [context],
        } : this.resolveContextPaths ? {
          paths: this.resolveContextPaths,
        } : undefined);
        // modulePackageFile = path.join(modulePath, "./package.json");
      } catch (e) {
        logIfDebug(`GPJWP: Ignoring module without a found package.json: ${ moduleName } ("${ resolveFile }" couldn't resolve)`);
        return undefined;
      }

      let version;
      try {
        version = JSON.parse(fs.readFileSync(modulePackageFile).toString()).version;
      } catch (e) {
        throw new Error(`Can't parse package.json file: ${ modulePackageFile }`);
      }

      if (!version) {
        throw new Error(`Missing package.json version: ${ modulePackageFile }`);
      }

      return version;
    };

    const processModule = (module) => {
      const portableId = module.portableId ? module.portableId : module.identifier();

      if (portableId.indexOf('external') === -1) {
        logIfDebug(`GPJWP: Found module: ${ portableId }`);
        return;
      }

      logIfDebug(`GPJWP: Found external module: ${ portableId }`);
      const moduleName = getNameFromPortableId(portableId);

      if (builtinModules.indexOf(moduleName) !== -1) {
        logIfDebug(`GPJWP: Native node.js module detected: ${ portableId }`);
        return;
      }

      if (this.filterDependencies.indexOf(moduleName) !== -1) {
        return;
      }

      if (!this.useInstalledVersions) {
        const dependencyVersion = this.dependencyVersionMap[moduleName];
        if (dependencyVersion) {
          modules[moduleName] = dependencyVersion;
        }

        return;
      }

      const moduleIssuer = isWebpack5
        ? compilation.moduleGraph.getIssuer(module)
        : module.issuer;
      const context = moduleIssuer && moduleIssuer.context;

      modules[moduleName] = getInstalledVersionForModuleName(moduleName, context);
      /*let modulePackageFile;
      try {
        modulePackageFile = require.resolve(`${moduleName}/package.json`, context ? {
          paths: [context],
        } : undefined);
      } catch (e) {
        logIfDebug(`GPJWP: Ignoring module without package.json: ${portableId}`);
        return;
      }

      let version;
      try {
        version = JSON.parse(fs.readFileSync(modulePackageFile).toString()).version;
      } catch (e) {
        throw new Error(`Can't parse package.json file: ${modulePackageFile}`);
      }

      if (!version) {
        throw new Error(`Missing package.json version: ${modulePackageFile}`);
      }

      modules[moduleName] = version;*/
    };

    if (isWebpack5) {
      for (const module of compilation.modules) {
        processModule(module);
      }
    } else {
      compilation.chunks.forEach((chunk) => {
        if (typeof chunk.modulesIterable !== 'undefined') { // webpack 4
          for (const module of chunk.modulesIterable) {
            processModule(module);
          }
        } else if (typeof chunk.forEachModule !== 'undefined') { // webpack 3
          chunk.forEachModule((module) => {
            processModule(module);
          });
        } else { // webpack 2
          for (let i = 0; i < chunk.modules.length; i += 1) {
            const module = chunk.modules[i];
            processModule(module);
          }
        }
      });
    }

    const basePackageValues = Object.assign({}, this.basePackage);

    for (const dependencyType of dependencyTypes) {

      // Overwrite modules or set new module dependencies for those that have been
      // deliberately set in " basePackageValues.[dependencyType] "
      // This mechanism ensures that dependencies declared in the basePackageValues
      // take precedence over the found dependencies
      if (basePackageValues && basePackageValues[dependencyType]) {
        const nonWebpackModuleNames = Object.keys(basePackageValues[dependencyType]);

        for (let k = 0; k < nonWebpackModuleNames.length; k += 1) {
          const moduleName = nonWebpackModuleNames[k];

          let useVersionMap = !this.useInstalledVersions;

          if (basePackageValues[dependencyType] && basePackageValues[dependencyType][moduleName] && basePackageValues[dependencyType][moduleName].length > 0) {
            logIfDebug(`GPJWP: Adding deliberate module in "${ dependencyType }" with version set deliberately: ${ moduleName } -> ${ basePackageValues[dependencyType][moduleName] }`);
            if (dependencyType === 'dependencies') {
              modules[moduleName] = basePackageValues[dependencyType][moduleName];
            }
          } else if (this.useInstalledVersions) {
            const version = getInstalledVersionForModuleName(moduleName);
            if (version != null) {
              if (dependencyType !== 'dependencies') {
                basePackageValues[dependencyType][moduleName] = version;
                delete modules[moduleName];
              } else {
                modules[moduleName] = version;
              }
            } else {
              console.warn(`${ pluginPrefix }Couldn't find installed version for module "${ moduleName }" - falling back to extra source package version map (if provided)`);
              useVersionMap = true;
            }
          }

          if (useVersionMap) {
            if (this.dependencyVersionMap[moduleName] != null) {
              logIfDebug(`GPJWP: Adding deliberate module in "${ dependencyType }" with version found in sources: ${ moduleName } -> ${ this.dependencyVersionMap[moduleName] }`);
              if (dependencyType !== 'dependencies') {
                basePackageValues[dependencyType][moduleName] = this.dependencyVersionMap[moduleName];
                delete modules[moduleName];
              } else {
                modules[moduleName] = this.dependencyVersionMap[moduleName];
              }
            } else {
              console.warn(`${ pluginPrefix }You have set a module in "${ dependencyType }" to be included deliberately with name: "${ moduleName }" - but there is no version specified in any source files, or found to be installed (if you used the option useInstalledVersions)!`);
            }
          }
        }
      }
    }

    logIfDebug(`GPJWP: Modules to be used in generated package.json`, modules);

    const finalPackageValues = Object.assign({}, basePackageValues, { dependencies: orderKeys(modules) });
    return JSON.stringify(finalPackageValues, this.replacer ? this.replacer : null, this.space ? this.space : 2);
  };

  const emitPackageJsonOld = (compilation, callback) => { // webpack 2-4
    const json = computePackageJson(compilation);
    compilation.assets['package.json'] = {
      source: function () {
        return json;
      },
      size: function () {
        return json.length;
      },
    };
    callback();
  };

  // const emitPackageJson = (compilation) => {
  //   const json = computePackageJson(compilation);
  //   compilation.emitAsset('package.json', new sources.RawSource(json));
  // };

  // if (isWebpack5) {
  //   compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
  //     compilation.hooks.processAssets.tap(
  //       { name: pluginName, stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL },
  //       () => emitPackageJson(compilation),
  //     );
  //   });
  // } else {
  if (typeof compiler.hooks !== 'undefined') { // webpack 4
    compiler.hooks.emit.tapAsync(pluginName, emitPackageJsonOld);
  } else { // webpack 2-3
    compiler.plugin('emit', emitPackageJsonOld);
  }
  // }
};

function orderKeys(obj) {
  const keys = Object.keys(obj).sort(function keyOrder(k1, k2) {
    if (k1 < k2) return -1;
    else if (k1 > k2) return +1;
    else return 0;
  });

  let i, after = {};
  for (i = 0; i < keys.length; i++) {
    after[keys[i]] = obj[keys[i]];
    delete obj[keys[i]];
  }

  for (i = 0; i < keys.length; i++) {
    obj[keys[i]] = after[keys[i]];
  }
  return obj;
}

module.exports = packageJsonPlugin;
