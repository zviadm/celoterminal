module.exports = (config) => {
	for (const rule of config.module.rules) {
		if (".scss".match(rule.test)) {
			// Need to use `resolve-url-loader` to get
			// @import "~@fontsource/roboto" to work in `styles.scss`.
			const use = [
				'style-loader',
				'css-loader',
				'resolve-url-loader',
				'sass-loader',
			]
			console.info(`WEBPACK[custom]: for: ${rule.test}, ${rule.use} -> ${use}`)
			rule.use = use
		}

		if (rule.use && rule.use.loader === "babel-loader") {
			// see: https://material-ui.com/guides/minimizing-bundle-size/#option-2
			// for more information on @material-ui import transforms.
			rule.use.options.plugins.push(
				[
					'babel-plugin-transform-imports',
					{
						'@material-ui/core': {
							'transform': '@material-ui/core/esm/${member}',
							'preventFullImport': true
						},
						'@material-ui/icons': {
							'transform': '@material-ui/icons/esm/${member}',
							'preventFullImport': true
						}
					}
				],
			)
		}
	}

	// SVG is already configured for `url-loader` so insert @svgr/webpack loader
	// at the beginning of the rules list to apply after url-loader.
	config.module.rules.unshift({
		test: /\.svg$/,
		use: ['@svgr/webpack'],
	})
	return config
}