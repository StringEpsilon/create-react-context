module.exports = {
	presets: [
		[
			"@babel/env",
			{
				"loose": true,
				"targets": {
					"browsers": [
						"last 2 versions",
						"ie >= 9"
					]
				}
			}
		],
		"@babel/react",
		"@babel/typescript"
	],
	"plugins": [
		"@babel/plugin-proposal-class-properties",
	]
}