# Building apps for Celo Terminal

For the most part, building a Celo Terminal app is as easy as building a simple website.
There are three key open source technologies used in Terminal:
* [Electron](https://www.electronjs.org/docs): Framework for building cross-platform desktop apps.
* [React](https://reactjs.org/docs/getting-started.html): Framework for building user interfaces.
* [Material-UI](https://material-ui.com/): Collection of UI components.

Building a Terminal app generally won't require interacting with the Electron framework directly. Thus,
an in-depth understanding is not required, but understanding the basics can always be helpful.

Basics of React framework and understanding of React Hooks are a pre-requisite to building a Terminal app:
* React Docs: [https://reactjs.org/docs/getting-started.html](https://reactjs.org/docs/getting-started.html)
* React Hooks: [https://reactjs.org/docs/hooks-intro.html](https://reactjs.org/docs/hooks-intro.html)

## Structure

All Apps are located in [src/renderer/apps](../src/renderer/apps) folder. Each App is a react component
that satisfies the [AppDefinition](../src/renderer/components/app-definition.ts) interface. Terminal provides
core libraries to help with fetching on-chain state and with running transactions.

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

TODO: Manual testing only, no automated testing available yet...

# Reviewing and integrating an app in Terminal

If you want to discuss plans for integrating your app in Celo Terminal, reach out to
`@zviad | WOTrust` on [Celo Discord](https://chat.celo.org), or by email: zviad@wotrust.us

Celo Terminal is still in very early stages of development, thus all initial app integrations
will be on more case-by-case basis until project reaches more maturatiy/stability.
