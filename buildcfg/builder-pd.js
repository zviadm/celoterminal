#!/usr/bin/env node
const path = require("path")
let pd = path.join("out", `celoterminal-${process.platform}-${process.arch}`)
if (process.platform === "darwin") {
	pd = path.join(pd, "celoterminal.app")
}
console.log(pd)