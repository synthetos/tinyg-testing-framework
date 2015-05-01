/* L1-001-parameter */
/*jslint node: true */

//#############################################################################
//#### Preliminary Tests
//#############################################################################

describe("001-Startup tests", function () {
  var testData = yaml.safeLoad(fs.readFileSync('tests/L1-001-startup/001-startup.yml', 'utf8'));

  // Begin Mocha preconditions functions
  tinyg_tester_setup(testData);

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
