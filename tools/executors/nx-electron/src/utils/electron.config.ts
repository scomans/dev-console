import { workspaceRoot } from 'nx/src/utils/workspace-root';
import * as TerserPlugin from 'terser-webpack-plugin';
import { Configuration } from 'webpack';
import { merge } from 'webpack-merge';
import * as nodeExternals from 'webpack-node-externals';
import { BuildElectronBuilderOptions } from '../executors/build/executor';
import { getBaseWebpackPartial } from './config';


function getElectronPartial(options: BuildElectronBuilderOptions): Configuration {
  const webpackConfig: Configuration = {
    output: {
      libraryTarget: 'commonjs',
    },
    target: 'electron-main',
    node: false,
  };

  if (options.optimization) {
    webpackConfig.optimization = {
      minimize: false,
      concatenateModules: false,
    };
  }

  if (options.obfuscate) {
    const obfuscationOptimization: typeof webpackConfig.optimization = {
      minimize: true,
      minimizer: [
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        new TerserPlugin({
          // Exclude uglification for the `vendor` chunk
          // chunkFilter: (chunk) => chunk.name !== 'vendor', // use test/include/exclude options instead
          parallel: true,
          terserOptions: {
            mangle: true,
            keep_fnames: false,
            toplevel: true,
            output: {
              comments: false,
            },
          },
        }),
      ],
    };

    if (webpackConfig.optimization) {
      webpackConfig.optimization = Object.assign(webpackConfig.optimization, obfuscationOptimization);
    } else {
      webpackConfig.optimization = obfuscationOptimization;
    }
  }

  if (options.externalDependencies === 'all') {
    const modulesDir = `${ workspaceRoot }/node_modules`;
    webpackConfig.externals = [nodeExternals({ modulesDir })];
  } else if (Array.isArray(options.externalDependencies)) {
    webpackConfig.externals = [
      // eslint-disable-next-line @typescript-eslint/ban-types
      function (context, callback: Function) {
        if (options.externalDependencies.includes(context.request)) {
          // not bundled
          return callback(null, `commonjs ${ context.request }`);
        }
        // bundled
        callback();
      },
    ];
  }
  return webpackConfig;
}

export function getElectronWebpackConfig(options: BuildElectronBuilderOptions) {
  return merge([getBaseWebpackPartial(options), getElectronPartial(options)]);
}
