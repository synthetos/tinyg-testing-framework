/* L1-001-parameter */
/*jslint node: true */

//#############################################################################
//### Libraries and dependencies ##############################################
//#############################################################################

// Built-in libraries:
var util = require("util");
var fs = require('fs');

// Chai and Chai-as-promised
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();

var Q = require('Q');           // Q for promises
// Q.longStackSupport = true;

var yaml = require('js-yaml');  // YAML, for loading test data
var TinyG = require("tinyg");   // And last but not least, TinyG

'use strict';

//#############################################################################
//#### Setup for testing ######################################################
//#############################################################################

// Setup or re-use USB connection to TinyG
var g = new TinyG();


// Export the globals for use everywhere...
global.chai = chai;
global.yaml = yaml;
global.util = util;
global.fs = fs;
global.g = g;
global.Q = Q;


// Load test data from YAML file
//var testData = yaml.safeLoad(fs.readFileSync('tests/L1-001-startup/001-startup.yml', 'utf8'));

// var testData = yaml.safeLoad(fs.readFileSync('tests/000-common.yml', 'utf8'));
// var testData = yaml.safeLoad(fs.readFileSync('tests/L1-001-startup/001-startup_BUG-01.yml', 'utf8'));

// Uncomment to debug the testData:
// console.log("testData debug:\n", util.inspect(testData, { depth: null }));

// 1 to print all raw data coming back from the TinyG to the console (CHATTY!), 0 for quiet:
var DEBUG_RESPONSES = 0;

// ??? What does this do?
var portPath, dataportPath;

// Begin Mocha preconditions functions
before(function (done) {
  g.list(function (err, results) {
    if (err) {
      done(err);
    }

    if (results.length == 1) {
      portPath = results[0].path;
      if (results[0].dataPortPath) {
        dataportPath = results[0].dataPortPath;
      }

      g.open(portPath, {
        dataPortPath: dataportPath,
        dontSetup: true
      });
      g.on('open', function (err) {
        if (err) {
          done(err);
        }
//         console.log("Setting precondition communication and system parameters");
//         var promise = g.set(testData.precondition.setValues);
//
// //        promise = promise.then(function () {
// //          console.log("\nTest parameters:")
// //        });
//         console.log("\nTest parameters:")
//         console.log("  " + new Date());
//
//         testData.precondition.reportParameters.forEach(function (p) {
//           promise = promise.then(function () {
//             return g.get(p).then(
//               function (v) {
//                 console.log("  " + p + "=" + v);
//               },
//               function (e) {
//                 console.log("  " + p + "=null");
//                 return Q.fcall(function () {}); // Return an empty promise to "ignore the error"
//               }
//             );
//           });
//         });
//
//         promise = promise.then(function () {
//           console.log("--\n")
//         }).finally(function () {
//           done();
//         });
//
        // return promise;
        done();
      });

    } else if (results.length > 1) {
      for (var i = 0; i < results.length; i++) {
        var item = results[i];
        if (item.dataPortPath) {
          console.log("Found command port: '%s' with data port '%s'.", item.path, item.dataPortPath);
        } else {
          console.log("Found port: '%s'.", item.path);
        }
      }
      done("Too many ports found .. chose one");
    } else {
      done("No ports found")
    }
  });
});

after(function (done) {
  g.on('close', function (err) {
    done(err);
  })
  g.close();
});

// DEBUG:
if (DEBUG_RESPONSES === 1) {
  g.on('data', function (v) {
    console.log(v);
  });
}

global.tinyg_tester_begin = function (testData) {
    // Begin Mocha preconditions functions
    before(function (done) {
      console.log("Setting precondition communication and system parameters");
      var promise = g.set(testData.precondition.setValues);

      console.log("\nTest parameters:")
      console.log("  " + new Date());

      if (testData.precondition && testData.precondition.reportParameters) {
        testData.precondition.reportParameters.forEach(function (p) {
          promise = promise.then(function () {
            return g.get(p).then(
              function (v) {
                console.log("  " + p + "=" + v);
              },
              function (e) {
                console.log("  " + p + "=null");
                return Q.fcall(function () {}); // Return an empty promise to "ignore the error"
              }
            );
          });
        });
      }

      promise = promise.then(function () {
        console.log("--\n")
      }).finally(function () {
        done();
      });

      return promise;
    });

    beforeEach(function () {
      if (testData.precondition && testData.precondition.setValuesEach) {
        var promise = g.set(testData.precondition.setValuesEach);
        return promise;
      }
    });
}
