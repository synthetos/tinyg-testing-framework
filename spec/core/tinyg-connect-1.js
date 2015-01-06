/* CORE TESTS -  */
/*jslint node: true */
/*jshint -W097 */

var util = require("util");
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();

var sync = require("sync");
var Q = require('Q');
// Q.longStackSupport = true;

var TinyG = require("tinyg");
var g = new TinyG();

var testData = require("./tinyg-connect-1.json");

var portPath, dataportPath;

'use strict';

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

      g.open(portPath, {dataPortPath : dataportPath, dontSetup: true});
      g.on('open', function (err) {
        if (err) { done(err); }
        g.set(testData.precondition.setValues).finally(function () {
          done();
        });
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


after(function(done) {
  g.on('close', function (err) {
    done(err);
  })
  g.close();
});

/*

sp.on('data', reader);
sp.write('g92 x0 y0 z0\n');
sp.write('{"js":1}\n');

*/

// DEBUG:
// g.on('data', function (v) {
//   console.log(v);
// });

//#############################################################################

describe("Check firmware and hardware numbers for up to date values", function () {

	//Firmware build response test
	it('Checks firmware build number @v8 @v9', function () {
    return g.get("fb").should.eventually.be.above(testData.min_fb);
	});

  //Hardware Value Test
  it('Checks Hardwave Value @v8 @v9', function () {
    return g.get("hv").should.eventually.be.above(testData.min_hv);
	});

  describe("Checks System Group Values", function () {
    //Check all sys values are present
    it('check all sys values are present @v8', function () {
      return g.get("sys").should.eventually.contain.keys(testData.sys.propertyList);
    });
  });

});
