const platform = require("os").platform();
const { notarize } = require("electron-notarize");
const chalk = require("chalk");

require("dotenv").config();
require("debug").enable("electron-notarize");

const info = str => {
  console.log(chalk.blue(str));
};

async function notarizeApp(context) {
  if (platform !== "darwin" || !process.env.OSX_NOTARIZE) {
    info(`OS: ${platform}, skipping notarization.`);
    return;
  }

  info(
    "Don't mind electron-builder error 'Cannot find module 'buildcfg/notarize.js', it definitively found me",
  );

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