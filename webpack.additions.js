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
	}

	// SVG is already configured for `url-loader` so insert @svgr/webpack loader
	// at the beginning of the rules list to apply after url-loader.
	config.module.rules.unshift({
		test: /\.svg$/,
		use: ['@svgr/webpack'],
	})
	return config
}