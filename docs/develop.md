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

## Build & Test

Celo Terminal uses the following technologies:

* [Typescript](https://www.typescriptlang.org/docs/)
* [Yarn](https://classic.yarnpkg.com/en/docs/): Package manager.
* [Electron](https://www.electronjs.org/docs): Framework for developing cross-platform desktop apps.
* [electron-builder](https://www.electron.build/): System for building and packaging Electron apps.
* [electron-webpack](https://webpack.electron.build/): [Webpack](https://webpack.js.org/) integration with electron-builder.
* [Jest](https://jestjs.io/): Testing framework.
