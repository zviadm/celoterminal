const { execSync } = require('child_process');

function sign(configuration) {
	console.log("Requested signing for ", configuration.path);

	// Only proceed if the versioned exe file is in the configuration path - skip signing everything else
	if (!configuration.path.includes("Celo Terminal")) {
		console.log("Configuration path does not include the versioned exe, signing skipped.");
		return true;
	}


	try {
		// Execute the sign script synchronously
		const scriptPath = process.env.CODE_SIGN_SCRIPT_PATH;
		process.env["INPUT_COMMAND"] = "sign"
		process.env["INPUT_FILE_PATH"] = configuration.path
		process.env["INPUT_OVERRIDE"] = "true"
		process.env["INPUT_MALWARE_BLOCK"] = "false"
		process.env["INPUT_CLEAN_LOGS"] = "false"
		process.env["INPUT_JVM_MAX_MEMORY"] = "1024M"
		process.env["INPUT_ENVIRONMENT_NAME"] = "PROD"
		process.env["INPUT_USERNAME"] = process.env.CODE_SIGN_SSLCOM_USERNAME
		process.env["INPUT_PASSWORD"] = process.env.CODE_SIGN_SSLCOM_PASSWORD
		process.env["INPUT_TOTP_SECRET"] = process.env.CODE_SIGN_SSLCOM_TOTP_SECRET
		process.env["INPUT_CREDENTIAL_ID"] = process.env.CODE_SIGN_SSLCOM_CREDENTIAL_ID

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

exports.default = sign;