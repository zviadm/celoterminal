# Celo Terminal Development

Quick Start
```
> yarn
> yarn dev:baklava
```

```
NOTE: if you are getting `Module XXX was compiled against a different Node.js version XXX` error 
messages, you need to manually run `postinstall` script.

> yarn postinstall
```

# Build & Test

Celo Terminal uses the following technologies:

* [Typescript](https://www.typescriptlang.org/docs/)
* [Yarn](https://classic.yarnpkg.com/en/docs/): Package manager.
* [Electron](https://www.electronjs.org/docs): Framework for developing cross-platform desktop apps.
* [electron-builder](https://www.electron.build/): System for building and packaging Electron apps.
* [electron-webpack](https://webpack.electron.build/): [Webpack](https://webpack.js.org/) integration with electron-builder.
* [Jest](https://jestjs.io/): Testing framework.
* [Spectron](https://www.electronjs.org/spectron): Electron testing framework.
  * [WebDriverIO](https://webdriver.io/): UI automation testing framework, part of Spectron.
* [celo-devchain](https://github.com/zviadm/celo-devchain): Locally runnable blockchain with core celo contracts for full integration testing.

## Iterative Development

When you start Celo Terminal in the development mode, it is automatically setup with the HMR (hot-module-reloading) so you 
can make code changes and have it show up in the app automatically within few seconds. 

Iterative development setup should be mostly self-explanatory. Two commands you can use for starting Celo Terminal in dev mode:
```
> yarn dev:baklava # To connect to a Baklave node
> yarn dev:mainnet # To connect to a Mainnet node
```

## End-2-end/Integration/UI Testing

TODO(zviadm): clean this up. 

Tests are placed in: `.../apps/<app id>/spectron-tests/<test name>.test.ts`

Example tests:
* [send-receive app tests](../src/renderer/apps/send-receive/spectron-tests/send-receive.test.ts)
* [locker app tests](../src/renderer/apps/locker/spectron-tests/locker.test.ts)

Each test file is run in a completely clean environment both for the app state and for the celo-devchain state. Because of this, each test 
file has a significant overhead. You should treat single test file as a one big testing scenario with multiple sub-tests as individual 
steps that depend on each other. Checkout [locker app tests](../src/renderer/apps/locker/spectron-tests/locker.test.ts) for an example

To run tests:
```
# `yarn compile` is necessary to run after you make changes to your application code.
# it isn't necessary to run `yarn compile` if you are only changing the test itself and not the application.
# You can also run more specific:
# > yarn compile main
# > yarn compile renderer
# This can speed up recompilation if you are only changing code in main or renderer processes.
> yarn compile
> yarn test:spectron <path to test>
```

### Debugging issues

* Running spectron tests should work on both MacOs and Linux, it has never been tested on Windows.
* Don't forget to run `yarn compile` before running spectron tests. Unlike Dev mode, there is no auto recompilation.
* After certain OS upgrades it might be necessary to reinstall all `node_modules`. It is unclear exactly what is causing this, but reinstalling node modules should resolve any weird issues.
```
> rm -rf ./node_modules
> yarn
> yarn compile
> yarn test:spectron ...
```



