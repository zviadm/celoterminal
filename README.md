# Celo Terminal

Desktop app to manage accounts and interact with the decentralized apps on the Celo blockchain.

MacOS, Windows and Linux versions available:
* https://celoterminal.com

Docs: https://docs.celoterminal.com

## App Platform

Celo Terminal is not just a wallet. Celo Terminal is an extensible platform to build secure and easy to use DApp UIs.
It simplifies the development process for the builders and improves usability for the users. If you are developing a
smart-contract based protocol or a system on top of the Celo network, you can utilize Celo Terminal platform to
develop and distribute your DApp UI.

Learn more about how to develop apps for Celo Terminal: [docs/developing-apps.md](./docs/developing-apps.md).

## Security & Privacy

Celo Terminal is built from the start with an emphasis on security and privacy. At its core, Celo Terminal only interacts
with the blockchain node. It doesn't collect any analytics, and it doesn't even send out any debug logs. While Celo Terminal
provides support for the built-in software upgrades, it never installs those upgrades without explicit user action.

Non-core DApps might require interacting with external servers other than the blockchain node, but
those interactions only happen when DApp is in active use. As Celo Terminal evolves, it will provide clearer
guidelines and indicators when any of the DApps interact with the external servers.

### Network Endpoints

Out-of-the box, Celo Terminal communicates with the following services:
* Celo Blockchain: https://forno.celo.org (can be changed to any other client node).
* Celo WalletConnect Relay: wss://walletconnect.celo.org
* Github: https://api.github.com/... (for checking and downloading Celo Terminal upgrades).

## Need Help? Have Questions?

If you run into a bug, please [file a Bug Report](https://github.com/zviadm/celoterminal/issues/new/choose) on GitHub.

If you have questions or need help, you can ask in `#celo-terminal` channel in [Celo Discord](https://chat.celo.org).
Make sure to tag `@zviad | WOTrust`. Alternatively, you can email at: support@celoterminal.com.

