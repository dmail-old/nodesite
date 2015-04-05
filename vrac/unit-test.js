/*


*/

function execAssertion(){}

var Test = [
	function parseAllAssertions(fn){ return Array; }, // A BESOIN DE MODULE, l'argument fn n'est pas suffisant
	function execAllAssertions(assertions){ return Task.serie(assertions, execAssertion); }
];

function loadTestFile(){ return Object; };
function parseFileTests(){ return Array; };

var ModuleTest = [
	function findFilePaths(modulePath){ return Array; },
	function loadFilePaths(files){ return Task.serie(files, loadTestFile); },
	function parseFiles(files){ return Task.serie(files, parseFileTests); },
	function loadModule(modulePath){ return Object; },
	function execTests(tests){ return Task.serie(tests, execAllAssertions); }
];


var FolderTest = [
	function findModules(directoryPath){}
	function loadTests(){ return Task.serie(modulePaths, moduleTest.loadTests);	},
	function filterModules(){},
	function sortModules(){}
];