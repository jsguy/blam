@echo off
REM
REM		BLAM - Beautify Lint And Minify JS files
REM
REM		Blam for eclipse - create an external Tools Configuration with the following argument (note the double quotes):
REM
REM			"${selected_resource_loc}"
REM
REM		Set the location and working directory to the directory this file is in
REM		Be sure to adjust the cygwin path below
REM

echo Starting Cygwin

SET CYGWIN=nodosfilewarning
SET path=./lib/cygwin;%path%
REM Perl pathes
SET path=./lib/perl/perl/site/bin;./lib/perl/bin;./lib/perl/c/bin;%path%
SET TERM=dumb
bash blam.sh %*
