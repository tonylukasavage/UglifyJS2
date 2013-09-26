var ugly = require('uglify-js');

var debug = false;
var printAst = false;
var green = function(s) { return '\x1B[32m' + s + '\x1B[39m'; }
var red = function(s) { return '\x1B[31m' + s + '\x1B[39m'; }
var tests = [
	'@class("ClassName", NSObject, [], {' +
		'name:"arg1", returnType:"void", argument:[], action: function(){}' +
	'});',
	'@compiler({ foo: "bar" });',
	'@import("foo/bar");',
	'@memory(1024);'
];

process.argv.forEach(function(arg) {
	if (arg === '--stack') debug = true;
	if (arg === '--ast') printAst = true;
});

for (var i = 0; i < tests.length; i++) {
	process.stdout.write((i+1) + ') ' + tests[i] + ' ');
	try {
		var ast = ugly.parse(tests[i]);
		console.log(green('OK'));
		printAst && console.log(ast);
	} catch (e) {
		console.log(red('FAIL'));
		console.log(red('%s:%s:%s %s'), e.line, e.col, e.pos, e.message);
		debug && console.log(red(e.stack));
	}
}

