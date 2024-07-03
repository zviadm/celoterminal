const { execSync } = require('child_process');

function sign(configuration) {
	console.log("Requested signing for ", configuration.path);

	// Only proceed if the versioned exe file is in the configuration path - skip signing everything else
	if (!configuration.path.includes("Celo Terminal")) {
		console.log("Configuration path does not include the versioned exe, signing skipped.");
		return true;
	}

	const scriptPath = process.env.CODE_SIGN_SCRIPT_PATH;

	try {
		// Execute the sign script synchronously
		process.env["INPUT_FILE_PATH"] = configuration.path
		const output = execSync(`node "${scriptPath}"`).toString();
		console.log(`Script output: ${output}`);
	} catch (error) {
		console.error(`Error executing script: ${error.message}`);
		if (error.stdout) {
			console.log(`Script stdout: ${error.stdout.toString()}`);
		}
		if (error.stderr) {
			console.error(`Script stderr: ${error.stderr.toString()}`);
		}
		return false;
	}

	return true; // Return true at the end of successful signing
}
