# Developing apps for Celo Terminal

For the most part, developing a Celo Terminal app is as easy as developing a simple website.
There are four key open source technologies used in Terminal:
* [Typescript](https://www.typescriptlang.org/docs/)
* [Electron](https://www.electronjs.org/docs): Framework for developing cross-platform desktop apps.
* [React](https://reactjs.org/docs/getting-started.html): Framework for developing user interfaces.
* [Material-UI](https://material-ui.com/): Collection of UI components.

Developing a Terminal app generally won't require interacting with the Electron framework directly. Thus,
an in-depth understanding is not required, but understanding the basics can always be helpful.

Basics of React framework and understanding of React Hooks are a pre-requisite to develop a Terminal app:
* React Docs: [https://reactjs.org/docs/getting-started.html](https://reactjs.org/docs/getting-started.html)
* React Hooks: [https://reactjs.org/docs/hooks-intro.html](https://reactjs.org/docs/hooks-intro.html)

Checkout general [development guide](./develop.md) for instructions on how to build, test and
develop Celo Terminal locally.

## Structure

All Apps are located in [src/renderer/apps](../src/renderer/apps) folder. Each App is a react component
that satisfies the [AppDefinition](../src/renderer/components/app-definition.ts) interface. Terminal provides
core libraries to help with running transactions and fetching on-chain state.

Code structure relevant for App development:
```
 src/renderer/apps/<app id> - Application code, tests and assets
 src/renderer/state         - Reusable React hooks for state management
 src/renderer/components    - Shared/reusable UI components
 src/lib                    - Shared/reusable non-UI libraries
```

Core libraries:
* Running TXs: [src/renderer/components/app-definition.ts](../src/renderer/components/app-definition.ts)
* Fetching on-chain state: [src/renderer/state/onchain-state.ts](../src/renderer/state/onchain-state.ts)
* Storing configuration: [src/renderer/state/localstorage-state.ts](../src/renderer/state/localstorage-state.ts)
* Caching: TODO: not yet available...

## Error handling

By default, there is already a catch-all error handler that handles all uncaught errors from
event handlers and async routines. There is a simple UI that displays errors as a non-intrusive
pop-up.

More customized apps can always implement more complex erorr handling and its UI inside the App itself.

## Testing

For regular, non-UI testing, you can write tests that will be run using Jest. In general, if you have large
amounts of non-UI code, it is recommended to have them in a separate npm package. You can add the package as 
a dependency and import it in your Celo Terminal application code. 

TODO: For UI testing, only manual testing is possible right now. Stay tuned for automatic testing support...

# Reviewing and integrating an app in Terminal

If you want to discuss plans for integrating your app in Celo Terminal, reach out to
`@zviad | WOTrust` on [Celo Discord](https://chat.celo.org), or by email: support@celoterminal.com

Celo Terminal is still in very early stages of development, thus all initial app integrations
will be on more case-by-case basis until project reaches more maturatiy/stability.
