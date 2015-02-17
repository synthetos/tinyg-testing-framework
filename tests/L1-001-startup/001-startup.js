/* L1-001-parameter */
/*jslint node: true */

//#############################################################################
//#### Preliminary Tests
//#############################################################################

describe("001-Startup tests", function () {
  var testData = yaml.safeLoad(fs.readFileSync('tests/L1-001-startup/001-startup.yml', 'utf8'));

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

// Load test data from YAML file
//var testData = yaml.safeLoad(fs.readFileSync('tests/L1-001-startup/001-startup.yml', 'utf8'));

var testData = yaml.safeLoad(fs.readFileSync('tests/L1-001-startup/001-startup.yml', 'utf8'));

// Uncomment to debug the testData:
// console.log("testData debug:\n", util.inspect(testData, { depth: null }));

// 1 to print all raw data coming back from the TinyG to the console (CHATTY!), 0 for quiet:
var DEBUG_RESPONSES = 0;

// ??? What does this do?
var portPath, dataportPath;

// Begin Mocha preconditions functions
before(function (done) {
        console.log("Setting precondition communication and system parameters");
        var promise = g.set(testData.precondition.setValues);

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

beforeEach(function () {
  var promise = g.set(testData.precondition.setValuesEach);
  return promise;
});

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

describe("Checks System Group Values", function () {
  //Check all sys values are present
  it('check all sys values are present @v8', function () {
    return g.get("sys").should.eventually.contain.keys(testData.sys.propertyList);
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

        // set() returns a promise. If we put a function in the promise.catch() it will 
        // give us a TinyGError object, with the full response object in the data member.
        //
        // It will only throw an error if the status is non-zero. If the status is zero
        // it will resolve with the value the TinyG sent back.
        var promise = g.set(p, v.value).catch(function (e) {

          // e.data contains our full response
          if (!e.data || !e.data.f || e.data.f[1] !== (v.status || 0)) {
            throw (new Error(util.format("Bad response, expected status (%d), got error \"%s\" for response: ", v.status, e, util.inspect(e.data))));
          }
        })

				// the following code interprets the .yml responses
        if (util.isArray(v.returns)) {
          promise = promise.should.eventually.be.within(v.returns[0], v.returns[1]);
        } else if (v.exists == true) {
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

  describe("writeWithPromise", function () {
    it(' works', function () {
      this.timeout(50000);

      return g.writeWithPromise(["g0x10", "g0x0", {sr:null}]).should.eventually.have.deep.property("sr").and.include({posx:0, vel:0, stat:3});
    });

    it(' works with G10', function () {
      this.timeout(5000);

      var arrayToSend = [
        "g10 l2 p1 x0 y0 z0 a0 b0 c0",
        "g10 l2 p2 x0 y0 z0 a0 b0 c0",
        "g10 l2 p3 x0 y0 z0 a0 b0 c0",
        "g10 l2 p4 x0 y0 z0 a0 b0 c0",
        "g10 l2 p5 x0 y0 z0 a0 b0 c0",
        "g10 l2 p6 x0 y0 z0 a0 b0 c0",
        "g92 x0 y0 z0 a0 b0 c0"
        ];

      var nextMatchIndex = 0;

      var promise = g.writeWithPromise(arrayToSend, function (r) {
          if (nextMatchIndex == arrayToSend.length-1) {
            return true;
          }
          return false;
        }).progress(function (r) {
          var stripped = g.stripGcode(arrayToSend[nextMatchIndex]);
          if (r && r['gc'] && r['gc'] == stripped) {
            nextMatchIndex += 1;
          }
        });

      return promise;
    });

  });
})
