const osxNotarize = () => {
	if (!process.env.OSX_NOTARIZE) {
		return undefined
	}
	return {
		appBundleId: "com.celoterminal",
		appleId: process.env.APPLE_ID,
		appleIdPassword: process.env.APPLE_ID_PASSWORD,
	}
}

const config = {
	packagerConfig: {
		name: "Celo Terminal",
		executableName: "celo-terminal",
		appBundleId: "com.celoterminal",
		appCategoryType: "public.app-category.finance",
		osxSign: {
			"identity": "Developer ID Application: Zviad Metreveli",
			"hardened-runtime": true,
			"gatekeeper-assess": false,
			"entitlements": "./static/entitlements.plist",
			"entitlements-inherit": "./static/entitlements.plist",
			"signature-flags": "library",
		},
		osxNotarize: osxNotarize(),
	},
	"makers": [
		{
			"name": "@electron-forge/maker-squirrel",
			"config": {
				"name": "Celo Terminal"
			}
		},
		{
			"name": "@electron-forge/maker-zip",
			"platforms": [
				"darwin"
			]
		},
		{
			"name": "@electron-forge/maker-deb",
			"config": {}
		},
		{
			"name": "@electron-forge/maker-rpm",
			"config": {}
		},
	],
	"publishers": [
		{
			"name": "@electron-forge/publisher-github",
			"config": {
				"repository": {
					"owner": "zviadm",
					"name": "celoterminal"
				},
				"prerelease": true,
				"draft": true,
			}
		}
	],
	"plugins": [
		[
			"@electron-forge/plugin-webpack",
			{
				"mainConfig": "./webpack.main.config.js",
				"renderer": {
					"config": "./webpack.renderer.config.js",
					"entryPoints": [
						{
							"html": "./src/index.html",
							"js": "./src/renderer.ts",
							"name": "main_window"
						}
					]
				}
			}
		]
	]
}

module.exports = config;