#!/usr/bin/env node
const { execSync } = require("child_process");
const { readFileSync } = require("fs");
const { Octokit } = require("octokit");

const semVerRegex = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

const runAction = async () => {
	const packageJSON = JSON.parse(readFileSync("./package.json").toString())
	const tags = execSync("git tag --list --sort=version:refname").toString()
		.split("\n").map((t) => t.trim()).filter((t) => t.match(semVerRegex))
	const range = tags.length === 0 ? "" : `${tags[tags.length-1]}..HEAD`
	const commits = execSync(`git log ${range} --pretty=format:%s --no-merges`).toString().trim()
	console.info(`COMMITS: ${commits}`)

	const octokit = new Octokit({auth: process.env.GITHUB_TOKEN})
	const releases = await octokit.request('GET /repos/{owner}/{repo}/releases', {
		owner: 'zviadm',
		repo: 'celoterminal',
	})
	const release = releases.data.find((r) => r.name === packageJSON.version)
	if (!release) {
		console.error(`Release note found: ${packageJSON.version}!`)
		process.exit(1)
	}
	if (!release.draft) {
		console.error(`Release: ${packageJSON.version} is no longer a draft! Not updating...`)
		process.exit(1)
	}
	console.info(`Updating release: ${release.id} - ${release.name}...`)
	await octokit.request('PATCH /repos/{owner}/{repo}/releases/{release_id}', {
		owner: 'zviadm',
		repo: 'celoterminal',
		release_id: release.id,
		tag_name: "v" + packageJSON.version,
		body: commits,
		draft: false,
		prerelease: true,
	})
};

runAction();