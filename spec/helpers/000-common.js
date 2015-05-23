/* L1-001-parameter */
/*jslint node: true */

//#############################################################################
//### Libraries and dependencies ##############################################
//#############################################################################

// Built-in libraries:
var util = require("util");
var fs = require('fs');
var path = require('path');

// Chai and Chai-as-promised
// var chai = require("chai");
// var chaiAsPromised = require("chai-as-promised");
// chai.use(chaiAsPromised);
// chai.should();

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


// global.chai =  chai;
global.yaml = yaml;
global.util = util;
global.fs = fs;
global.g = g;
global.Q = Q;

global.stopTesting = false;

//var DEBUG_RESPONSES = 0;
var DEBUG_RESPONSES = 1;

// Variables used to hold the path to the TinyG devices
var portPath, dataportPath;

global.replace_tokens = function (gcode, testData) {
  if (typeof gcode !== "string") {
    return gcode;
  }

  var retGcode = gcode.replace(/\$\{?\s*([a-zA-Z_.]+)\s*\}?/g, function (x, full_key) {
    var keys = full_key.split('.');
    var v = testData.variables;
    for (var i = 0; i < keys.length; i++) {
      if (v[ keys[i] ]) {
        v = v[ keys[i] ];
      } else {
        return "";
      }
    }

    return v;
  });

  return retGcode;
};

function _deepReplace(data, dataPath, topLevelData) {
  if (topLevelData === undefined) {
    topLevelData = data;
  }

  if (data === undefined || data === null) {
    return data;
  }

  if (data.hasOwnProperty('include')) {
    var baseDir = path.dirname(dataPath);
    var newPath = path.resolve(baseDir, data.include);

    newData = yaml.safeLoad(fs.readFileSync( newPath ));
    delete data['include'];

    if (util.isArray(newData)) {
      return _deepReplace(newData, newPath, topLevelData);
    }
    else if (typeof newData === 'object') {
      // merge in the new data:
      for (var subkey in newData) {
        data[subkey] = newData[subkey];
      }
    }

    data = _deepReplace(data, newPath, topLevelData);
  }

  var parentIsArray = util.isArray(data);
  var arrayElementsToExpand = [];

  for (var key in data) {
    if (typeof data[key] === 'object') {
      var wasArray = util.isArray(data[key]);
      data[key] = _deepReplace(data[key], dataPath, topLevelData);
      if (parentIsArray && !wasArray && util.isArray(data[key])) {
        arrayElementsToExpand.push(key);
      }
    } else if (typeof data[key] === 'string') {
      var newValue = replace_tokens(data[key], topLevelData);
      var numValue = parseInt(newValue);

      if (!isNaN(numValue) && numValue == newValue) {
        newValue = numValue;
      }

      data[key] = newValue;
    }
  }

  if (parentIsArray) {
    var nextToExpand = arrayElementsToExpand.shift();
    var newArray = [];

    for (var i = 0; i < data.length; i++) {
      if (i == nextToExpand) {
        nextToExpand = arrayElementsToExpand.shift();
        for (var j = 0; j < data[i].length; j++) {
          newArray.push(data[i][j]);
        }
      } else {
        newArray.push(data[i]);
      }
    }

    return newArray;
  }

  return data;
}

global.loadData = function (dataPath) {
  return _deepReplace(yaml.safeLoad(fs.readFileSync(dataPath, 'utf8')), dataPath);
}

global.tinyg_tester_init = function() {

  beforeAll(function (done) {
    if (stopTesting) {
      pending("skipped at user's request");
    }

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

  afterAll(function (done) {
    g.on('close', function (err) {
      done(err);
    })
    g.close();
  });

  // DEBUG:
  if (DEBUG_RESPONSES === 1) {
    g.on('data', function (v) {
      console.log("<" + v);
    });
    g.on('sentRaw', function (v) {
      console.log(">" + v);
    });

  }
};

global.tinyg_tester_setup = function (dataPath) {

  var testData = loadData(dataPath);

  // console.log("TestData: " + util.inspect(testData));

  if (testData.precondition) {
    console.log("\nTest parameters:")
    console.log("  " + new Date());

    if (testData.precondition.reportParameters) {
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

    tinyg_tester_before_all(testData.precondition);
    tinyg_tester_before_each(testData.precondition);
  }

  return testData;
}


global.tinyg_tester_before_all = function (testData, storedStatus) {
  if (storedStatus === undefined) {
    storedStatus = {};
  }

  function _handleProgress(r, f) {
    if (r && r.sr) {
      for (k in r.sr) {
        storedStatus[k] = r.sr[k];
      }
    }
  }

  beforeAll(function (done) {
    if (stopTesting) {
      pending("skipped at user's request");
    }

    var promise = Q.fcall(function () {});
    if (testData.setValues) {
      promise = promise.then(function () {
        return g.set(testData.setValues).progress(_handleProgress); // writeWithPromise
      });
    }
    if (testData.beforeAll) {
      var gcode = replace_tokens(testData.beforeAll, testData);
      promise = promise.then(function () {
        // Warning, lines that won't result in a response will jam this!!
        // Empty lines and commnt-only lines are okay.
        // var gcodeLines = gcode.split(/(?:\n(?:\s*\n|\s*;[^\n]*\n)?)+/);
        var gcodeLines = gcode.split(/(?:\r?\n)+/);
        var lineCount = gcodeLines.length;

        return g.writeWithPromise(gcodeLines, function (r) {
          lineCount--;
          if (0 == lineCount) {
            return true;
          }
          // console.log("lineCount: " + lineCount);

          return false;
        }).progress(_handleProgress); // writeWithPromise
      });
    }

    promise = promise.then(function () {
      // console.log("--\n")
    }).finally(function () {
      done();
    });

    return promise;
  }, 10000000 /* never timeout */);
}

global.tinyg_tester_before_each = function (testData, storedStatus) {
  if (storedStatus === undefined) {
    storedStatus = {};
  }

  function _handleProgress(r) {
    if (r && r.sr) {
      for (k in r.sr) {
        storedStatus[k] = r.sr[k];
      }
    }
  }

  beforeEach(function (done) {
    // console.log("++\n")

    if (stopTesting) {
      pending("skipped at user's request");
    }

    var promise = Q.fcall(function () {});
    if (testData.setValuesEach) {
      promise = promise.then(function () {
        return g.set(testData.setValuesEach).progress(_handleProgress); // writeWithPromise
      });
    }
    if (testData.beforeEach) {
      var gcode = replace_tokens(testData.beforeEach, testData);
      promise = promise.then(function () {
        return g.writeWithPromise(gcode).progress(_handleProgress); // writeWithPromise
      });
    }

    promise = promise.then(function () {
      // console.log("--\n")
    }).finally(function () {
      done();
    });

    return promise;
  }, 10000000 /* never timeout */);
}
