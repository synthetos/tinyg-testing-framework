/* L1-001-parameter */
/*jslint node: true */

var path = require("path");

var readline = require('readline'),
rl = readline.createInterface(process.stdin, process.stdout);


tinyg_tester_init();

describe("001-arc tests", function () {

  testData = tinyg_tester_setup("spec/005-Arcs/001-arcTests.yml");
  // console.log(require('util').inspect(testData, { depth: null }));

  var storedStatusReports = {};
  testData.timeout = testData.timeout ? testData.timeout * 1000 : 1000000;

  run_tests(testData, storedStatusReports);

}) // describe 001-arc tests


function run_tests(testData, storedStatusReports) {
  testData.tests.forEach(function (v) {
    v.timeout = v.timeout ? v.timeout * 1000 : testData.timeout;

    if (v.endCondition === undefined) {
      v.endCondition = testData.endCondition || { stat: 3 };
    }

    if (v.endCondition.stat === undefined && v.endCondition.rc === undefined) {
      v.endCondition.stat = 3;
    }

    // console.log("v: " + util.inspect(v));


    if (v.name === undefined) {
      v.name = "NO DESCRIPTION PROVIDED -- PLEASE FIX THIS";
    }

    describe(v.name, function () {

      if (v.tests) {
        tinyg_tester_before_all(v, storedStatusReports);
        tinyg_tester_before_each(v, storedStatusReports);

        return run_tests(v, storedStatusReports);
      }

      var auto_func = function (done) {
        if (stopTesting) {
          pending("Skipped");
        }

        // For debugging
        // console.log("storedStatusReports: " + util.inspect(storedStatusReports));

        var gcode = v.gcode || fs.readFileSync(path.resolve(__dirname, v.gcodeFile)).join("\n");
        var storedFooter = [];

        function updateStoredSRs(r) {
          if (r && r.sr) {
            for (k in r.sr) {
              storedStatusReports[k] = r.sr[k];
            }
          } else if (r && r.f) {
            storedStatusReports.r.f = r.f;
          }
        }

        var promise = g.writeWithPromise(gcode, function (r, f) {
          // For debugging
          // console.log("updateStoredSRs: " + util.inspect(r, f));

          updateStoredSRs(r);

          if (v.endCondition.stat && r.sr && r.sr.stat && r.sr.stat == v.endCondition.stat) {
            return true;
          } else if (v.endCondition.rc && f && f.length > 1 && f[1] == v.endCondition.rc) {
            return true;
          }

          return false;

        }).progress(function (r) {
          updateStoredSRs(r);

        }).then(function () {
          if (v.endState && typeof v.endState === 'object') {
            var actuallyIs = {};
            var shouldBe = {};
            for (k in v.endState) {
              if (k == 'rc') {
                actuallyIs[k] = storedStatusReports.f[0];
              } else {
                actuallyIs[k] = storedStatusReports[k];
              }
              shouldBe[k] = v.endState[k];

              // var X = v.endState[k];
              // if (!isNaN(parseFloat(X))) {
              //   X = parseFloat(X);
              // }
              // shouldBe[k] = X;
            }

            expect(actuallyIs).toEqual(shouldBe, "wrong end state (result -> expected result)" );
          }
          //
          // if (storedFooter.length > 0) {
          //   expect(storedFooter[1]).toEqual(parseInt(v.status) || 0, "wrong status");
          // }
        });

        return promise.finally(function() {done();});
      };

      if (v.focus) {
        // Focused
        fit("(auto)", auto_func, v.timeout ? v.timeout * 1000 : 10000000);
      } else {
        it("(auto)", auto_func, v.timeout);
      }

      if (v.manualPrompt) {
        var manual_func = function (done) {
          if (stopTesting) {
            pending("Skipped");
          }

          var deferred = Q.defer();
          var question = v.manualPrompt;
          if (question === true) {
            question = v.name;
          }

          function _ask() {
            rl.question(question + ' (y/n/q) ', function(answer) {
              if (answer.match(/^y(es)?$/i)) {
                deferred.resolve();
              } else if (answer.match(/^no?$/i)) {
                deferred.reject(new Error("User said it failed!"));
              } else if (answer.match(/^q(uit)?$/i)) {
                stopTesting = true;
                deferred.reject(new Error("User quit testing!"));
              } else {
                _ask();
              }
            });
          }

          _ask();

          return deferred.promise.catch(function (error) {expect(error).toBeUndefined()}).finally(function() {done();});
        }

        if (v.focus) {
          // Focused
          fit("(manual check)", manual_func, 10000000 /* "never" timeout */);
        } else {
          it("(manual check)", manual_func, 10000000 /* "never" timeout */);
        }
      } // if (v.manualPrompt)

    }); // describe v.name
  }); // forEach v
}
