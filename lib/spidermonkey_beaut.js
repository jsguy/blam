//  Beautify the file, beauty_options to be set seperately first.
//  see: http://www.stanford.edu/class/cs242/spidermonkey/
(function(a) {

	var input="", line="", blankcount = 0, uniqueEndString = "***ENDOFFILE***";
	
	while (blankcount < 50) {
		line=readline();
		if (line=="")blankcount++;
		else blankcount=0;
		
		//if (line=="END") break;  
		input += line;
		input += "\n";
	}
	input += uniqueEndString;
	input = input.substring(0, input.indexOf(uniqueEndString) - blankcount);
	
	print( js_beautify( input, beauty_options ) );
	
})(arguments);
