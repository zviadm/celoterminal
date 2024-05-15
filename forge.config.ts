import type { ForgeConfig } from '@electron-forge/shared-types';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';


const config: ForgeConfig = {
  // electron-forge packager is only used for building binaries for E2E testing.
  // electorn-builder is used for building actual distributables, including code signing
  // and auto updating features.
  packagerConfig: {
    asar: true,
    name: "Celo Terminal - E2ETest",
  },
  rebuildConfig: {},
  makers: [],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      devContentSecurityPolicy: "connect-src 'self' * 'unsafe-eval'",
      devServer: {
        client: {
          overlay: {
            runtimeErrors: false,
          },
        },
      },
      renderer: {
        config: rendererConfig,
        nodeIntegration: true,
        entryPoints: [
          {
            name: 'main_window',
            js: './src/renderer/index.ts',
            html: './src/renderer/index.html',
          },
          {
            name: 'splash_window',
            js: './src/splash/index.ts',
            html: './src/splash/index.html',
          },
        ],
      },
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
