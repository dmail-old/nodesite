module.exports = {
	"path": "./node_modules/node-test/run.js",
	"args": {
		"path": "../../../nodesite"
	},
	"env": {
		"DEBUG": !true
	},
	"restartFiles": [
		"./node_modules/node-test"
	],
	"log": !true
};