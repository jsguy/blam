
// Append this to full js lint file - http://www.jslint.com/fulljslint.js, and run via Rhino
// Run the beautifier on the file passed as the first argument. 
var passed = JSLINT( readFile( arguments[0] ));
//print( "contents of " + arguments[0] );
//print( readFile( arguments[0] ) );
if( passed ) {
	print( 'true' );
	
	var t = '';
	var d = JSLINT.data().unused;
	for( var x in d ) {
		for( var y in d[x] ) {
			t += y + d[x][y] + '\n';// + ': ' + JSLINT[x] + '\n';
		}
	}
	print( t );
	
	
	//var myReport = JSLINT.report();
	//print( myReport );
	
} else {
	/*	JSLINT.errors is an array of objects containing these members:
		{
			line      : The line (relative to 0) at which the lint was found
			character : The character (relative to 0) at which the lint was found
			reason    : The problem
			evidence  : The text line in which the problem occurred
			raw       : The raw message before the details were inserted
			a         : The first detail
			b         : The second detail
			c         : The third detail
			d         : The fourth detail
		}
	*/
	var errtxt = "";
	for( var i in JSLINT.errors ) {
		var err = JSLINT.errors[i];
		if( err !== null ) {
			errtxt += err.evidence + " pos " + err.line + ":" + err.character + " " + err.reason + "\n";
		}
	}
	print( errtxt );
}
