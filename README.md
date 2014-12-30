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

Note that at this time the serial port is hard coded.

TODO: Make this a command line argument to grunt or have auto detection in the script.
