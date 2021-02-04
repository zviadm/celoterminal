module.exports = (config) => {
	// SVG is already configured for `url-loader` so insert @svgr/webpack loader
	// at the beginning of the rules list to apply after url-loader.
	config.module.rules.unshift({
		test: /\.svg$/,
		use: ['@svgr/webpack'],
	})
	return config
}