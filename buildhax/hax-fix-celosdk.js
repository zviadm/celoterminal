// EXTREMELY HAX SOLUTION ALERT!!!
// see: https://github.com/celo-org/developer-tooling/issues/195#issuecomment-2160985204
const fs = require("fs")
const path = require("path")

const toReplace = path.join("node_modules", "@celo", "wallet-base", "lib", "signing-utils.js")
const haxPath = path.join("buildhax", "signing-utils-haxfix.js")
console.info(`replacing: ${toReplace} with ${haxPath}`)
fs.copyFileSync(haxPath, toReplace)