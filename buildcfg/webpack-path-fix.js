const path = require("path")
const fs = require("fs")

if (!fs.existsSync(path.join(".webpack", "main"))) {
	for (const d of ["renderer", "main"]) {
		fs.renameSync(
			path.join(".webpack", process.arch, d),
			path.join(".webpack", d))
	}
	fs.rmdirSync(path.join(".webpack", process.arch))
}