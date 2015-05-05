/* L1-001-parameter */
/*jslint node: true */

var path = require("path");

var readline = require('readline'),
rl = readline.createInterface(process.stdin, process.stdout);

//#############################################################################
//#### Preliminary Tests
//#############################################################################

describe("001-arc tests", function () {
  var testData = yaml.safeLoad(fs.readFileSync('tests/005-Arcs/001-arcTests.yml', 'utf8'));

  tinyg_tester_setup(testData);

  describe("test arcs", function () {
    testData.tests.forEach(function (v) {
      v.testResult.status = fix_gcode(v.testResult.status, testData);

      if (v.testResult === undefined) {
        v.testResult = {status:3};
      } else if (v.testResult.status === undefined) {
        v.testResult.status = 3;
      }

      if (v.testName === undefined) {
        v.testName = "NO DESCRIPTION PROVIDED -- PLEASE FIX THIS";
      }

      describe(v.testName, function () {

        tinyg_tester_before_each(testData);

        it("(auto)", function () {
          if (v.timeout !== undefined) {
            this.timeout(v.timeout * 1000);
          }

          var testString = v.testString || fs.readFileSync(path.resolve(__dirname, v.testFile)).join("\n");

          var gcode = fix_gcode(testString, testData);

          var collectedValues = {};

          var promise = g.writeWithPromise(gcode, function (r) {
            if (r && r.sr) {
              for (k in r.sr) {
                collectedValues[k] = r.sr[k];
              }
            }

            if (r.sr && r.sr.stat && r.sr.stat == v.testResult.status) {
              return true;
            }

            return false;
          }).then(function () {

            if (v.testResult.endPosition && typeof v.testResult.endPosition === 'object') {
              var shouldBe = {};
              var actuallyIs = {};
              for (k in v.testResult.endPosition) {
                // shouldBe["pos"+k] = v.testResult.endPosition[k];
                actuallyIs[k] = collectedValues["pos"+k];
              }
              actuallyIs.should.deep.eql(v.testResult.endPosition, "wrong end position" );
            }

            if (v.testResult.status) {
              collectedValues["stat"].should.equal(parseInt(v.testResult.status, "wrong end status"));
            }

          });

          return promise;
        }); // it

        it("(manual check)", function () {
          this.timeout(0);

          var deferred = Q.defer();
          var question = fix_gcode(v.testResult.text || v.testName, testData);

          function _ask() {
            rl.question(question + ' (y/n) ', function(answer) {
              if (answer.match(/^y(es)?$/i)) {
                deferred.resolve();
              } else if (answer.match(/^no?$/i)) {
                deferred.reject(new Error("User said it failed!"));
              } else {
                _ask();
              }
            });
          }

          _ask();

          return deferred.promise;
        }); // it
      }); // describe

    }); // forEach
  }); // describe
}) // describe
