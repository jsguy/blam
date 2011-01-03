
// Append this to beautifier file - http://jsbeautifier.org/beautify.js, and run via Rhino
// Run the beautifier on the file, plus any options (eval, as it's a string). 

//	Disabled passing options for now - it's easier to set the options here
//var options = eval('(' + arguments[1] + ')');
//	Just the way we like it, and so does lint
var options = {
	space_after_anon_function: true,
	preserve_newlines: true,
	max_preserve_newlines: 2,
	indent_size: 1,
	indent_char: "\t"
};

print( js_beautify( readFile( arguments[0] ), options ) );
