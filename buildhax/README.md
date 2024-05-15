Known Build/Dependency issues and workarounds:

* @celo/cryptographic-utils:
** Fixed at v4.1.0. Later versions depend on tiny-secp256k1@2.x.x which doesn't package due to WASM modules

* ethereum-cryptography:
** See ./hax-fix-ec.js file for the workarounds.

* web3:
** web3 is fixed to same version as what @celo/connect & @celo/contractkit use

* resolutions:
** @celo/connect & @celo/contractkit must exist only as a single version in node_modules