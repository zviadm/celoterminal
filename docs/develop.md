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
* [Electron-Forge](https://www.electronforge.io/): Configures WebPack for compiling and bundling Electron apps.
* [Electron-Builder](https://www.electron.build/): Turns bundles into platform specific distributables. Also provides hooks for code signing and auto updates.
* [Jest](https://jestjs.io/): Testing framework for unit tests.
* [WebDriverIO](https://webdriver.io/): UI automation testing framework.
* [celo-devchain](https://github.com/terminal-fi/celo-devchain): Locally runnable blockchain with core celo contracts for full integration testing.

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

Tests are placed in: `test/specs/<app id>.test.ts`

Example tests:
* [send-receive app tests](.../test/specs/send-receive.test.ts)
* [locker app tests](.../test/specs/locker.test.ts)

Each test file is run in a completely clean environment both for the app state and for the celo-devchain state. Because of this, each test
file has a significant overhead. You should treat single test file as a one big testing scenario with multiple sub-tests as individual
steps that depend on each other. Checkout [locker app tests](.../test/spec/locker.test.ts) for an example

To run tests:
```
# `yarn compile` is necessary to run after you make changes to your application code.
# it isn't necessary to run `yarn compile` if you are only changing the test itself and not the application.
> yarn compile
> yarn wdio --spec <path to test>
```

### Debugging issues

* Running E2E tests should work on both MacOs and Linux, it has never been tested on Windows.
* Don't forget to run `yarn compile` before running end-2-end tests. Unlike Dev mode, there is no auto recompilation.
* After certain OS upgrades it might be necessary to reinstall all `node_modules`. It is unclear exactly what is causing this, but reinstalling node modules should resolve any weird issues.
```
> rm -rf ./node_modules
> yarn
> yarn compile
> yarn wdio ...
```



