/* L1-001-parameter */
/*jslint node: true */

var path = require("path");

//#############################################################################
//#### Preliminary Tests
//#############################################################################

describe("002-gcode tests", function () {
  var testData = yaml.safeLoad(fs.readFileSync('tests/L1-002-gcode/002-gcode.yml', 'utf8'));

  tinyg_tester_setup(testData);

  describe("verify gcode end conditions", function () {
    testData.sendGcodeTests.forEach(function (v) {
      if (v.tests === undefined) {
        v.parameters = {status:3};
      } else if (v.tests.status === undefined) {
        if (v.tests.stat !== undefined) {
          console.log("Warning: You used tests.stat instead of tests.status, please adjust this!!");
          v.tests.status = v.tests.stat;
        }
        v.tests.status = 3;
      }

      if (v.description === undefined) {
        v.description = "NO DESCRIPTION PROVIDED -- PLEASE FIX THIS";
      }

      if (v.setup !== undefined) {
        before(function() {
          if (v.setup_timeout !== undefined) {
            this.timeout(v.setup_timeout);
          }

          var gcode = [];
          var promiseChain = Q.fcall(function () {}); // Create a dummy promise to start the cahin.
          v.setup.forEach(function (s) {
            if (typeof s === 'string' ) {
              // It's gcode. Add it to the gcode string
              gcode.push(s);
            } else {
              // it's not gcode. If there's gcode to send, then send it and wait.
              if (gcode.length > 0) {
                promiseChain = promiseChain.then(function() {
                  return g.writeWithPromise(gcode);
                });
              }

              promiseChain = promiseChain.then(function() {
                return g.set(s);
              });
            }
          }); // forEach
          return promiseChain;
        }); // before
      }

      it(v.description, function () {
        if (v.timeout !== undefined) {
          this.timeout(v.timeout);
        }

        var arrayToSend = v.gcode || fs.readFileSync(path.resolve(__dirname, v.gcode_file)).join("\n");
        var collectedValues = {};

        var promise = g.writeWithPromise(arrayToSend, function (r) {
          if (r && r.sr && r.sr.stat && r.sr.stat == v.tests.status) {
            return true;
          }

          return false;
        }).progress(function (r) {
          if (r && r.sr) {
            for (k in r.sr) {
              collectedValues[k] = v;
            }
          }
        }).then(function () {
          if (v.tests.position && typeof v.tests.position === 'object') {
            for (k in v.tests.positon) {
              collectedValues["pos"+k].should.equal(v.tests.positon.k);
            }
          }
        });

        return promise;
      }); // it
    }); // forEach
  }); // describe
}) // describe
