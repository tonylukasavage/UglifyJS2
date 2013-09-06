var uglify = require("uglify-js"),
	inspect = require('util').inspect;

var consoleError = console.error;
console.error = function(m) {
	consoleError('\033[31m[ERROR] ' + m + '\033[0m');
};

var tests = [
	{
		code: "@import('UIKit/UIApplication')",
		expected: "",
		imports: ['UIKit/UIApplication']
	},
	{
		code: "@import('UIKit/UIApplication');",
		expected: "",
		imports: ['UIKit/UIApplication'] },
	{
		code: "foo();@import('UIKit/UIApplication');",
		expected: "foo();",
		imports: ['UIKit/UIApplication']
	},
	{
		code: "@import('UIKit/UIApplication');@import('UIKit/UIButton');",
		expected: "",
		imports: ['UIKit/UIApplication','UIKit/UIButton']
	},
	{
		code: "foo('@import(\"something\")');",
		expected: "foo('@import(\"something\")');",
		imports: []
	},

	// Fails with actual, should we only allow @import at the top-level?
	{
		code: "if(123===321){@import('package/module');}else{@import('package/module2');}",
		expected: "if(123===321){@import('package/module');}else{@import('package/module2');}",
		imports: []
	}
];

function same(arr1, arr2) {
	if (arr1.length !== arr2.length) { return false; }
	for (var i = 0; i < arr1.length; i++) {
		if (arr1[i] !== arr2[i]) { return false; }
	}
	return true;
}

var passed = 0;
var testCount = 0;
tests.forEach(function(test) {
	testCount++;
	var imports = [];
	try {
		var ast = uglify.parse(test.code);
		//console.log(inspect(ast, false, null));
		var transformer = new uglify.TreeTransformer(
			function(node, descend) {
				if (node.value instanceof uglify.AST_HyperloopClass) {
					imports.push(toValue(node.value.args[0]));
				}

				if (node instanceof uglify.AST_SimpleStatement) {
					if (node.body instanceof uglify.AST_HyperloopImport) {
						imports.push(node.body.args[0].value);
						return new uglify.AST_EmptyStatement();
					} else if (node.body instanceof uglify.AST_HyperloopCompiler) {
						compilers.push(toValue(node.body.args[0]));
						return new uglify.AST_EmptyStatement();
					}
				}
			}
		);
		var new_ast = ast.transform(transformer);

		// validate ast against expected results
		var failed = false;
		var strActual = new_ast.print_to_string();
		if (strActual !== test.expected) {
			console.error('test #' + testCount + ': "' + strActual + '" did not equal "' +
				test.expected + '"');
			failed = true;
		}
		if (!same(imports, test.imports)) {
			console.error('test #' + testCount + ': "' + JSON.stringify(imports) +
				'" did not equal "' + JSON.stringify(test.imports) + '"');
			failed = true;
		}
		if (!failed) {
			passed++;
		}
	} catch (e) {
		console.error('FAILED TEST #' + testCount);
		console.error(e.message + ' (' + e.line + ':' + e.col + ':' + e.pos + ')');
		console.error(e.stack);
	}
});

console.log('Passed ' + passed + ' out of ' + testCount + ' tests');