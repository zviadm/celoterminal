#!/usr/bin/env node
const { execSync } = require("child_process");
const { existsSync } = require("fs");

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

/**
 * Installs NPM dependencies and builds/releases the Electron app
 */
const runAction = () => {
	const platform = getPlatform();
	const maxAttempts = Number(getEnv("MAX_ATTEMPTS") || "1");
	const PUBLISH = getEnv("PUBLISH") || false

	// Make sure `package.json` file exists
	if (!existsSync("./package.json")) {
		exit(`\`package.json\` file not found!"`);
	}

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
	run("yarn");
	run("yarn test");
	run("yarn compile");

	// Run NPM build script if it exists
	log(`Building the Electron app...`);
	for (let i = 0; i < maxAttempts; i += 1) {
		try {
			run(`yarn electron-builder --${platform} ${PUBLISH ? "--publish always" : ""}`);
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