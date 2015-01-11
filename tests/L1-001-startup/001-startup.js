/* L1-001-parameter */
/*jslint node: true */

//### Libraries and dependencies ###

// Built-in libraries:
var util = require("util");
var fs = require('fs');

// Chai and Chai-as-promised
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();

var Q = require('Q'); // Q for promises
// Q.longStackSupport = true;

// YAML, for loading test data
var yaml = require('js-yaml');

// And last but not least, TinyG
var TinyG = require("tinyg");

'use strict';

//#############################################################################
//#### Setup for testing ######################################################
//#############################################################################

// Setup or re-use USB connection to TinyG
var g = new TinyG();

// Load test data from YAML file
var testData = yaml.safeLoad(fs.readFileSync('tests/L1-001-startup/001-startup.yml', 'utf8'));
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
        console.log("Setting precondition communication and system parameters");
        var promise = g.set(testData.precondition.setValues);

//        promise = promise.then(function () {
//          console.log("\nTest parameters:")
//        });
        console.log("\nTest parameters:")
        console.log("  " + new Date());

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

        promise = promise.then(function () {
          console.log("--\n")
        }).finally(function () {
          done();
        });

        return promise;
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


beforeEach(function () {
  var promise = g.set(testData.precondition.setValuesEach);
  return promise;
})

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

//#############################################################################
//#### Preliminary Tests
//#############################################################################

describe("Check for up-to-date firmware and hardware", function () {

  //Firmware build response test
  it('Checks firmware build number @v8 @v9', function () {
    return g.get("fb").should.eventually.be.above(testData.min_fb);
  });

  //Hardware Value Test
  it('Checks hardware version @v8 @v9', function () {
    return g.get("hv").should.eventually.be.above(testData.min_hv);
  });
});

describe("Setup system parameters for testing", function () {

  // Set parameter tests
  testData.setParameterTests.forEach(function (v) {
    if (v.parameters === undefined) {
      v.parameters = [v.parameter];
    }
    if (v.status === undefined) {
      v.status = 0;
    }

    v.parameters.forEach(function (p) {
      var description = 'Setting ' + p + ' to ' + util.inspect(v.value) + ' does what we expect @v8 @v9';
      if (v.description) {
        description = util.format(v.description, p);
      }
      it(description, function () {
        // set() returns a promise. If we put a function in the promise.catch(),
        // it will give us a TinyGError object, with the full response object in
        // the data member.
        // It will only throw an error if the status is non-zero. If the status is
        // zero, it will resolve with the value the TinyG sent back.
        var promise = g.set(p, v.value).catch(function (e) {
          // e.data contains our full response
          if (!e.data || !e.data.f || e.data.f[1] !== (v.status || 0)) {
            throw (new Error(util.format("Bad response, expected status (%d), got error \"%s\" for response: ", v.status, e, util.inspect(e.data)) ));
          }
        })

        if (util.isArray(v.returns)) {
          promise = promise.should.eventually.be.within(v.returns[0], v.returns[1]);
        } else if (v.exists === true) {
          promise = promise.should.eventually.exist;
        } else if (v.returns === undefined || v.returns === null) {
          // If we have a *Keys, then we actually implicitly check for exists.
          if (!v.exactKeys && !v.exactKeys) {
            promise = promise.should.eventually.not.exist;
          }
        } else {
          promise = promise.should.eventually.eql(v.returns);
        }

        if (util.isArray(v.exactKeys)) {
          promise = promise.should.eventually.have.keys(v.exactKeys);
        } else if (util.isArray(v.hasKeys)) {
          promise = promise.should.eventually.include.keys(v.hasKeys);
        }

        return promise;
      });
    });
  });

});

describe("Checks System Group Values", function () {
  //Check all sys values are present
  it('check all sys values are present @v8', function () {
    return g.get("sys").should.eventually.contain.keys(testData.sys.propertyList);
  });
});
