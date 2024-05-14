const platform = require("os").platform();
const { notarize } = require("@electron/notarize");
const chalk = require("chalk");

require("dotenv").config();
require("debug").enable("@electron/notarize");

process.on('unhandledRejection', error => {
  console.log('unhandledRejection', error.message);
	process.exit(1);
});

async function notarizeApp(context) {
  if (platform !== "darwin" || !process.env.OSX_NOTARIZE) {
    console.log(`OS: ${platform}, skipping notarization.`);
    return;
  }

  const { OSX_APPLE_ID, OSX_APPLE_ID_PASSWORD } = process.env;
  if (!OSX_APPLE_ID || !OSX_APPLE_ID_PASSWORD) {
    throw new Error("OSX_APPLE_ID and OSX_APPLE_ID_PASSWORD env variables are required for notarization.");
  }

  const { appOutDir } = context;
  const appName = context.packager.appInfo.productFilename;
  const path = `${appOutDir}/${appName}.app`;
  await notarize({
    appBundleId: "com.celoterminal",
    appPath: path,
    appleId: OSX_APPLE_ID,
    appleIdPassword: OSX_APPLE_ID_PASSWORD,
  });
}

exports.default = notarizeApp;