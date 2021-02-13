#!/usr/bin/env node
const { execSync } = require("child_process");
const { readFileSync } = require("fs");

const semVerRegex = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

const runAction = () => {
	const packageJSON = JSON.parse(readFileSync("./package.json"))
	const tags = execSync("git tag --list --sort=version:refname").toString()
		.split("\n").map((t) => t.trim()).filter((t) => t.match(semVerRegex))
	const matchingTag = tags.find((v) => v === "v" + packageJSON.version)
	if (matchingTag) {
		console.error(`Version ${packageJSON.version} already published as ${matchingTag}!`)
		process.exit(1)
	}
	const range = tags.length === 0 ? "" : `${tags[tags.length-1]}..HEAD`
	const commits = execSync(`git log ${range} --pretty=format:%s --no-merges`).toString().trim()
	console.info(`COMMITS (since: ${tags[tags.length-1]}):\n${commits}`)
};

runAction();