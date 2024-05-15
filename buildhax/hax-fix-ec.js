// EXTREMELY HAX SOLUTION ALERT!!!
// ethereum-cryptography@ both 1.x and 2.x versions have issues when packaged as a non ESM module
// with webpack.
// To solve this issue we copy over the fixed version of the problematic files inside node_modules/**
const fs = require("fs")
const path = require("path")

const searchDirs = ["node_modules"]
const fixedPath_1_2_0 = path.join("buildhax", "ec-utils-1.2.0.js")
const fixedPath_2_1_2 = path.join("buildhax", "ec-utils-2.1.2.js")

console.info(`replacing: "ethereum-cryptography/utils.js" with ${fixedPath_2_1_2}`)
fs.copyFileSync(fixedPath_2_1_2, path.join("node_modules", "ethereum-cryptography", "utils.js"))
console.info(`replacing: "**/ethereum-cryptography/utils.js" with ${fixedPath_1_2_0}:`)
while (searchDirs.length > 0) {
	const dir = searchDirs.pop()
	const files = fs.readdirSync(dir)
	for (const file of files) {
		const filePath = path.join(dir, file)
		const fileStat = fs.statSync(filePath)

    if (fileStat.isDirectory()) {
			searchDirs.push(filePath)
    } else if (
			path.dirname(dir) !== "node_modules" &&
			path.basename(dir) === "ethereum-cryptography" &&
			file === "utils.js") {
			console.info(`${filePath}`)
			fs.copyFileSync(fixedPath_1_2_0, filePath)
    }
	}
}