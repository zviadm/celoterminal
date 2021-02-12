#!/usr/bin/env node
const { execSync } = require("child_process");
const { existsSync, readFileSync } = require("fs");

/**
 * Logs to the console
 */
const log = (msg) => console.log(`\n${msg}`);

/**
 * Exits the current process with an error code and message
 */
const exit = (msg) => {
	console.error(msg);
	process.exit(1);
};

/**
 * Executes the provided shell command and redirects stdout/stderr to the console
 */
const run = (cmd) => execSync(cmd, { encoding: "utf8", stdio: "inherit"});

/**
 * Determines the current operating system (one of ["mac", "windows", "linux"])
 */
const getPlatform = () => {
	switch (process.platform) {
		case "darwin":
			return "mac";
		case "win32":
			return "windows";
		default:
			return "linux";
	}
};

/**
 * Returns the value for an environment variable (or `null` if it's not defined)
 */
const getEnv = (name) => process.env[name.toUpperCase()] || null;

/**
 * Sets the specified env variable if the value isn't empty
 */
const setEnv = (name, value) => {
	if (value) {
		process.env[name.toUpperCase()] = value.toString();
	}
};

const semVerRegex = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/**
 * Installs NPM dependencies and builds/releases the Electron app
 */
const runAction = () => {
	const platform = getPlatform();
	const maxAttempts = Number(getEnv("MAX_ATTEMPTS") || "1");
	const publish = getEnv("PUBLISH") || false

	// Make sure `package.json` file exists
	if (!existsSync("./package.json")) {
		exit(`\`package.json\` file not found!"`);
	}

	const packageJSON = JSON.parse(readFileSync("./package.json"))
	const tags = execSync("git tag --list --sort=version:refname").toString()
		.split("\n").map((t) => t.trim()).filter((t) => t.match(semVerRegex))
	const matchingTag = tags.find((v) => v === "v" + packageJSON.version)
	if (publish && matchingTag) {
		exit(`Version ${packageJSON.version} already published as ${matchingTag}!`)
	}
	const range = tags.length === 0 ? "" : `${tags[tags.length-1]}..HEAD`
	const commits = execSync(`git log ${range} --pretty=format:%s --no-merges`).toString().trim()
	console.info(`COMMITS (since: ${tags[tags.length-1]}):\n${commits}`)

	// Require code signing certificate and password if building for macOS. Export them to environment
	// variables (required by `electron-builder`)
	if (platform === "mac") {
		setEnv("CSC_LINK", getEnv("OSX_CSC_LINK"));
		setEnv("CSC_KEY_PASSWORD", getEnv("OSX_CSC_KEY_PASSWORD"));
	} else if (platform === "windows") {
		setEnv("CSC_LINK", getEnv("WIN_CSC_LINK"));
		setEnv("CSC_KEY_PASSWORD", getEnv("WIN_CSC_KEY_PASSWORD"));
	}

	// Disable console advertisements during install phase
	setEnv("ADBLOCK", true);
	run("yarn config set network-timeout 600000 -g")
	run("yarn");
	if (platform === "mac") {
		// run faster tests first.
		run("yarn lint");
		run("yarn test");
	}
	run("yarn compile");
	if (platform === "mac") {
		// run full UI regression test suite.
		run("yarn test:spectron-all");
	}

	log(`Building the Electron app...`);
	if (publish) {
		setEnv("EP_PRE_RELEASE", "true");
	}
	for (let i = 0; i < maxAttempts; i += 1) {
		try {
			run(
				`yarn electron-builder --${platform} ${publish ?
					"--publish always"
					:
					"--publish never"}`);
			break;
		} catch (err) {
			if (i < maxAttempts - 1) {
				log(`Attempt ${i + 1} failed:`);
				log(err);
			} else {
				throw err;
			}
		}
	}
};

runAction();