#!/bin/bash

#
#	blam.sh - Beautify Lint and Minify JS files
#

# Get parameters, defaults below
minify=0		    	    # Do we create a compressed minified version, to enable: "-c"
replace=0		        	# Do we replace the file with the beautified version, to enable: "-r"
quiet=0			    	    # Do we supress displaying errors and exit quietly (useful for build scripts), to enable: "-q"
fullpathonerror=0   	    # Do we show the full file path and name on errors
document=0			        # Do we run the documentation toole (Natural docs) - disabled for now
docprojdir=./tmp/proj	    # Directory to put/read Naturaldocs project from
docoutdir=./tmp/doc         # Directory to put Naturaldocs documentation
lintcfg=./lint.cfg.js       # File to read lint CFG from, (only applied if test file does not have one)
beautycfg=./beauty.cfg.js   # File to read beauty CFG from
lintconfigure=0             # Do we add a lint config if one is not found?

while getopts "cdfmrqi:b:l:p:o:" option
do
	case $option in
		i) inputfile=$OPTARG;;
        b) beautycfg=$OPTARG;;
        l) lintcfg=$OPTARG;;
		p) docprojdir=$OPTARG;;
		o) docoutdir=$OPTARG;;
        c) lintconfigure=1;;
		f) fullpathonerror=1;;
		m) minify=1;;
		r) replace=1;;
		d) document=1;;
		q) quiet=1;;
	esac
done

# Make sure we have required variables

if [ ! -n "$inputfile" ]; then
	if [ $quiet == 0 ]; then
		echo
		echo "Usage: `basename $0` -i FILENAME [-rcq]"
		echo
		echo "Options"
		echo "	-i FILENAME"
		echo "		Lint a beautified version of FILENAME"
		echo "	-b FILENAME"
		echo "		Beautification config file (defaults to beauty.cfg.js"
		echo "	-c"
		echo "		Add lint config at the top of the file, if no config found"
		echo "	-l FILENAME"
        echo "		Lint config file to optionally use if no lint cfg in file (defaults to lint.cfg.js, must use -c option)"
		echo "	-r"
		echo "		Replace the input file with the beautified version"
		echo "	-m"
		echo "		Create a minified version, (YUI Compressor), the output will be BASEFILENAME.min.js"
		echo "	-d"
		echo "		Create documentation (NaturalDocs)"
		echo "	-p"
        echo "		NaturalDocs project directory (optional - see Natural docs documentation for details)"
		echo "	-o"
        echo "		NaturalDocs output directory (optional - see Natural docs documentation for details)"
		echo "	-q"
		echo "		Suppress displaying errors and exit quietly, only setting the errorlevel (useful for build scripts)"
		echo "	-f"
		echo "		Shows full file path and name on error (default shows just the file name)"
		echo
	fi
	exit 1
fi
if [[ ! -f "$inputfile" ]]; then
	if [ $quiet == 0 ]; then
		echo "File not found: $inputfile"
	fi
	exit 1
fi

# Internal variables
# Temporary beautified file, and base name of file for minification
tmpfile="./tmp/js.tmp"
tmpinputfile="./tmp/inputjs.tmp"
filebasename=${inputfile%.*}
filenameonly=`basename "$inputfile"`
runtimeerror=0
haslintcfg=0
iscygwin=`uname|grep CYGWIN`
lintfile=./tmp/lint.js
beautfile=./tmp/beaut.js

# Setup our customised version of beautify and lint
# Note: beautify.js and fulljslint.js are unmodified versions of each file

# Add a space at the end of the file, due to spidermonkey readline bug (misses last char?).
cp "$inputfile" "$tmpinputfile"
echo -e " " >> "$tmpinputfile"

# Create Beauty file
cp ./lib/beautify.js "$beautfile"
echo -e "var beauty_options = " >> "$beautfile"
cat "$beautycfg" >> "$beautfile"
echo -e ";" >> "$beautfile"
cat ./lib/spidermonkey_beaut.js >> "$beautfile"

# Create lint file
cp ./lib/fulljslint.js "$lintfile"
cat ./lib/spidermonkey_lint.js >> "$lintfile"

if [[ $iscygwin != "" ]]; then
    # Use couch compiled spidermonkey
	jscmd="./lib/couch_js.exe -f "
else
	jscmd="./lib/js -f "
fi

# Run beautify and lint - if it passes lint, we overwrite the original file

# Beauty - output to tmp file
if [ $quiet == 0 ]; then
	echo "Beautifying"
fi

# Create beautified tmp file
cat "$tmpinputfile" | $jscmd $beautfile > "$tmpfile"

# testing...
# cp "$tmpfile" ./tmp/bea.txt

# Create backup of file
cp "$tmpfile" "$tmpinputfile"

# Add default lint parameters from lint config file, if we cannot find "/*jslint" on first or 2nd line of file
if [ $lintconfigure == 1 ]; then
    haslintcfg=`cat "$tmpinputfile" |grep -c "/*jslint"`

    if [[ $haslintcfg != 1 && $haslintcfg != 2 ]]; then
        # Add the lint cfg at the start of the file
        if [ $quiet == 0 ]; then
            echo "Adding lint cfg"
        fi

        # Add to original file
        cat "$lintcfg" "$inputfile" > "$tmpinputfile"
        cp "$tmpinputfile" "$inputfile"

        # Add to test file
        cat "$lintcfg" "$tmpfile" > "$tmpinputfile"
    fi
fi


if [ $quiet == 0 ]; then
	echo "Linting"
fi

# Lint file - capture response
if [[ $iscygwin != "" ]]; then
    # cygwin needs to remove ^M using d2u)
	passlint=`cat "$tmpinputfile" | $jscmd $lintfile |d2u`
else
	passlint=`cat "$tmpinputfile" | $jscmd $lintfile`
fi

if [ "$passlint" == "true" ]; then
	# If lint passes, and the file is different to the beautified version we replace it with the beautified version
	if [[ `diff -s "$inputfile" "$tmpinputfile" |grep -c "Files $inputfile and $tmpinputfile are identical"` == "1" ]]; then
		if [ $quiet == 0 ]; then
			echo "Lint passed on beautified file - file unchanged"
		fi
	else
		if [ $replace == 1 ]; then
			cp "$tmpinputfile" "$inputfile"
			if [ $quiet == 0 ]; then
				echo "Lint passed - file replaced with beautified version"
			fi
		else
			if [ $quiet == 0 ]; then
				echo "Lint passed - file not replaced; add -r argument to do so"
			fi
		fi
	fi
	if [ $minify == 1 ]; then
		if [ $quiet == 0 ]; then
			echo "YUI minified file"
		fi
		# YUI compress
		java -jar lib/yuicompressor-2.4.2.jar -o "$filebasename.min.js" "$inputfile"
	fi
	if [ $document == 1 ]; then
        # TODO: Figure out how to specify where to put documentation
        if [ ! -d $docprojdir ]; then
            mkdir $docprojdir
        fi
        
        if [ ! -d $docoutdir ]; then
            mkdir $docoutdir
        fi

        mkdir ./tmp/out
        cp "$tmpinputfile" "./tmp/out/$filenameonly"

		if [ $quiet == 0 ]; then
			echo "Documenting"
			perl ./lib/naturaldocs/NaturalDocs -ro -i ./tmp/out -o html "$docoutdir" -p "$docprojdir"
		else
			# perl ./lib/naturaldocs/NaturalDocs -q -r -i "$docoutdir" -o html ./tmp -p "$docprojdir"
			perl ./lib/naturaldocs/NaturalDocs -q -ro -i ./tmp/out -o html "$docoutdir" -p "$docprojdir"
		fi

		#rm "./tmp/out/$filenameonly"
		#rmdir ./tmp/out
	fi
else
	# Return lint error from original file
	if [ $quiet == 0 ]; then
		if [ $fullpathonerror == 1 ]; then
			echo "Lint failed $inputfile, error(s):"
		else
			echo "Lint failed $filenameonly, error(s):"
		fi
		
		cp "$inputfile" "$tmpinputfile"
		echo -e " " >> "$tmpinputfile"
		
        cat "$tmpinputfile" | $jscmd $lintfile
	fi
	runtimeerror=1
fi
rm "$tmpfile"
rm "$tmpinputfile"

if [ $runtimeerror == 1 ]; then
	exit 1
fi
