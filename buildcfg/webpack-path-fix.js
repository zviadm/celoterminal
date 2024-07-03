const path = require("path")
const fs = require("fs")

const arch = process.argv.length >= 3 ? process.argv[2] : process.arch

if (!fs.existsSync(path.join(".webpack", "main"))) {
	for (const d of ["renderer", "main"]) {
		fs.renameSync(
			path.join(".webpack", arch, d),
			path.join(".webpack", d))
	}
	fs.rmdirSync(path.join(".webpack", arch))
}
