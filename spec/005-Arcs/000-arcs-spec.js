/* L1-001-parameter */
/*jslint node: true */

var path = require("path");

var readline = require('readline'),
rl = readline.createInterface(process.stdin, process.stdout);


tinyg_tester_init();

describe("001-arc tests", function () {
  // var testData = yaml.safeLoad(fs.readFileSync('spec/005-Arcs/001-arcTests.yml', 'utf8'));

  testData = tinyg_tester_setup("spec/005-Arcs/001-arcTests.yml");
  // console.log(require('util').inspect(testData, { depth: null }));

  describe("test arcs", function () {

    testData.tests.forEach(function (v) {
      if (v.testResult === undefined) {
        v.testResult = {status:3};
      } else if (v.testResult.stat === undefined) {
        v.testResult.stat = 3;
      }

      if (v.testName === undefined) {
        v.testName = "NO DESCRIPTION PROVIDED -- PLEASE FIX THIS";
      }

      describe(v.testName, function () {

        var storedStatusReports = {};
        tinyg_tester_before_each(testData, storedStatusReports);

        var auto_func = function (done) {
          if (stopTesting) {
            pending("Skipped");
          }

          // For debugging
          // console.log("storedStatusReports: " + util.inspect(storedStatusReports));

          var testString = v.testString || fs.readFileSync(path.resolve(__dirname, v.testFile)).join("\n");

          var gcode = testString;

          var storedFooter = [];

          function updateStoredSRs(r) {
            if (r && r.sr) {
              for (k in r.sr) {
                storedStatusReports[k] = r.sr[k];
              }
            } else if (r && r.f) {
              storedFooter = r.f;
            }
          }

          var promise = g.writeWithPromise(gcode, function (r) {
            updateStoredSRs(r);

            if (r.sr && r.sr.stat && r.sr.stat == (v.doneStat || 3)) {
              return true;
            }

            return false;

          }).progress(function (r) {
            updateStoredSRs(r);

          }).then(function () {
            if (v.testResult.endStatus && typeof v.testResult.endStatus === 'object') {
              var actuallyIs = {};
              var shouldBe = {};
              for (k in v.testResult.endStatus) {
                actuallyIs[k] = storedStatusReports[k];

                var X = v.testResult.endStatus[k];
                if (!isNaN(parseFloat(X))) {
                  X = parseFloat(X);
                }
                shouldBe[k] = X;
              }
              expect(actuallyIs).toEqual(shouldBe, "wrong end status" );
            }

            if (storedFooter.length > 0) {
              expect(storedFooter[1]).toEqual(parseInt(v.testResult.status) || 0, "wrong status");
            }
          });

          return promise.finally(function() {done();});
        };

        if (v.focus) {
          // Focused
          fit("(auto)", auto_func, v.timeout ? v.timeout * 1000 : 10000000);
        } else {
          it("(auto)", auto_func, v.timeout ? v.timeout * 1000 : 10000000);
        }

        if (v.manualPrompt) {
          var manual_func = function (done) {
            if (stopTesting) {
              pending("Skipped");
            }

            var deferred = Q.defer();
            var question = v.manualPrompt;
            if (question === true) {
              question = v.testName;
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

      }); // describe

    }); // forEach

  }); // describe
}) // describe
