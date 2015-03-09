module.exports = {
	"path": "./node_modules/nodetest/run.js",
	"args": {
		"path": "../../../nodesite",
		"autoWatch": true
	},
	"env": {
		"DEBUG": !true
	},
	"restartFiles": [
		"./node_modules/nodetest"
	],
	"log": !true
};