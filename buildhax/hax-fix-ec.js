// EXTREMELY HAX SOLUTION ALERT!!!
// ethereum-cryptography@1.2.0 version package doesn't package/build properly with webpack5.
// Unfortunately, @celo/XXX packages depend on some older versions of web3 utils which depend
// on this version of ethereum-cryptography.
// Thus, to solve this problem we copy over the fixed version of the problematic file for
// ethereum-cryptography@1.2.0 library.
const fs = require("fs")
const path = require("path")

const ec_1_2_0 = [
	"node_modules/@ethereumjs/util/node_modules/ethereum-cryptography/utils.js",
	"node_modules/@celo/wallet-ledger/node_modules/ethereum-cryptography/utils.js",
	"node_modules/@celo/utils/node_modules/ethereum-cryptography/utils.js",
	"node_modules/@celo/cryptographic-utils/node_modules/ethereum-cryptography/utils.js",
	"node_modules/@celo/governance/node_modules/ethereum-cryptography/utils.js",
]

for (const f of ec_1_2_0) {
	const _f = path.join(...f.split("/"))
	fs.copyFileSync(path.join("buildhax", "ec-utils-1.2.0.js"), _f)
}