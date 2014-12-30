tinyg-testing-framework
=======================

This is the NodeJS testing framework for the TinyG CNC Motion Controller.

Installation:
Install nodeJS from here: http://nodejs.org/download/

Once its all downloaded and installed clone this repo like normal.
`git clone https://github.com/synthetos/tinyg-testing-framework.git`

Then cd into the tinyg-testing-framework/ directory
`cd tinyg-testing-framework/`

Then at the terminal run:
`npm install`

This will get everything you need now to run the test files.

After that is complete you should be able to run grunt at the command line and it will attempt to run the test in the `spec/core` folder.

Tags
====
Right now in ever `it()` function I put the `@v8` or `@v9` "tags" that allow us to say what we want to run at the command line.  Example:  `grunt --grep @v8` will run all tests that have teh `@v9` tag in the `it()` for every test.  If a test could / should be used for v8 and v9 then I just place `@v8 @v9` in the `it()` description.  There might be a better syntax for this.  However, for now this is the way its done.
====
Gotchas
Note that at this time the serial port is hard coded.

TODO: Make this a command line argument to grunt or have auto detection in the script.
