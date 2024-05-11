#!/usr/bin/env node
const path = require("path")
const pd = path.join("out", `celoterminal-${process.platform}-${process.arch}`)
console.log(pd)