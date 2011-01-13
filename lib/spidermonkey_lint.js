
// Append this to full js lint file - http://www.jslint.com/fulljslint.js, and run via Rhino
// Run the beautifier on the file passed as the first argument. 
//	http://www.stanford.edu/class/cs242/spidermonkey/

(function(a) {

	var failUnused = false,			//	Fail on unused variables?
	//input="", line="", blankcount = 0;


	input="", line="", blankcount = 0, uniqueEndString = "***ENDOFFILE***";
	
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
	
	function rtrim(str) {
		return str.replace(/\s+$/,"");
	}	

    function ltrim(str) {
        return str.replace(/^\s+/,"");
    }
    
	var passed = JSLINT( input ), passString = "true";
	if( passed ) {
		
		//	Get any unused lines - the online version complains about this...
		var unusedtxt = [];
		var d = JSLINT.data().unused;
		for( var x in d ) {
			unusedtxt.push( d[x].line + ':? Unused variable: ' + d[x].name );
		}
		if( failUnused && unusedtxt.length > 0) {
			print(unusedtxt.join("\n"));
		} else {
			print(passString);
		}
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
		var errtxt = [], ignoreWhitespaceErrors = true, errEvidence;
		for( var i in JSLINT.errors ) {
			var err = JSLINT.errors[i];
			if( err !== null && err.reason ) {
                errEvidence = '';
                if( err.evidence ) {
                    errEvidence = ltrim(err.evidence);
                }
                //  Ignore whitespace errors as beautifying takes care of that.
                if( ignoreWhitespaceErrors ) {
                    if( err.reason != "Mixed spaces and tabs." && 
                        err.reason.indexOf( "Missing space after" ) == -1 && 
                        err.reason.indexOf( "Unexpected space after" ) == -1 &&
                        err.reason.indexOf( "to have an indentation at" ) == -1 ) {
                        errtxt.push( err.line + ":" + err.character + " " + err.reason + " - " + errEvidence );
                    }
                } else {
                    errtxt.push( err.line + ":" + err.character + " " + err.reason + " - " + errEvidence );
                }
			}
		}
        if( errtxt.length > 0 ) {
            print( errtxt.join("\n") );
            
            //	Get any unused variables - the online version complains about this...
            var unusedtxt = [];
            var d = JSLINT.data().unused;
            for( var x in d ) {
                unusedtxt.push( d[x].line + ':? Unused variable: ' + d[x].name );
            }
            print( unusedtxt.join("\n") );
        } else {
			print(passString);
        }
        
		
	}
	quit();
})(arguments);
