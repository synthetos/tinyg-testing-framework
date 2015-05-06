/* L1-001-parameter */
/*jslint node: true */

var path = require("path");

var readline = require('readline'),
rl = readline.createInterface(process.stdin, process.stdout);


tinyg_tester_init();

describe("001-arc tests", function () {
  var testData = yaml.safeLoad(fs.readFileSync('spec/005-Arcs/001-arcTests.yml', 'utf8'));

  tinyg_tester_setup(testData);

  describe("test arcs", function () {

    testData.tests.forEach(function (v) {
      v.timeout = replace_tokens(v.timeout, testData);
      v.testResult.stat = replace_tokens(v.testResult.stat, testData);

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

        it("(auto)", function (done) {
          if (stopTesting) {
            pending("Skipped");
          }

          var testString = v.testString || fs.readFileSync(path.resolve(__dirname, v.testFile)).join("\n");

          var gcode = replace_tokens(testString, testData);

          var storedFooter = [];

          var promise = g.writeWithPromise(gcode, function (r) {
            if (r && r.sr) {
              for (k in r.sr) {
                storedStatusReports[k] = r.sr[k];
              }
            } else if (r && r.f) {
              storedFooter = r.f;
            }

            if (r.sr && r.sr.stat && r.sr.stat == v.testResult.stat) {
              return true;
            }

            return false;
          }).then(function () {
            if (v.testResult.endPosition && typeof v.testResult.endPosition === 'object') {
              var shouldBe = {};
              var actuallyIs = {};
              for (k in v.testResult.endPosition) {
                // shouldBe["pos"+k] = v.testResult.endPosition[k];
                actuallyIs[k] = storedStatusReports["pos"+k];
              }
              expect(actuallyIs).toEqual(v.testResult.endPosition, "wrong end position" );
            }

            if (v.testResult.stat) {
              expect(storedStatusReports["stat"]).toEqual(parseInt(v.testResult.stat, "wrong end stat"));
            }

            if (v.testResult.status) {
              expect(storedFooter[1]).toEqual(parseInt(v.testResult.status, "wrong status"));
            }
          });

          return promise.catch(function (error) {expect(error).toBeUndefined()}).finally(function() {done();});
        }, v.timeout ? v.timeout * 1000 : 10000000); // it

        it("(manual check)", function (done) {
          if (stopTesting) {
            pending("Skipped");
          }

          var deferred = Q.defer();
          var question = replace_tokens(v.testResult.text || v.testName, testData);

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
        }, 10000000 /* never timeout */); // it
      }); // describe

    }); // forEach

  }); // describe
}) // describe
