/* CORE TESTS -  */
/*jslint node: true */
/*jshint -W097 */

var should = require("should");
var sync = require("sync");

var TinyG = require("tinyg");
var g = new TinyG();

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

function testForValue(v, done, test) {
  var configChanged = function (r) {
    if (v in r) {
      // Remove the listener *first*
      g.removeListener('configChanged', configChanged);

      try {
        test(r[v]);
        done();
      } catch(e) {
        done(e);
      }
    }
  }

  g.on('configChanged', configChanged);

  g.write('{'+v+':n}\n');
}


function testResultOf(cmd, done, test) {
  var configChanged = function (r) {
    if (v in r) {
      // Remove the listener *first*
      g.removeListener('configChanged', configChanged);

      try {
        test(r);
        done();
      } catch(e) {
        done(e);
      }
    }
  }

  g.on('configChanged', configChanged);

  g.write(cmd+'\n');
}
//#############################################################################

describe("Check firmware and hardware numbers for up to date values", function () {

	//Firmware build response test
	it('Checks firmware build number @v8 @v9', function (done) {
    testForValue("fb", done, function(v) { v.should.be.above(80); });
	});

  //Hardware Value Test
  it('Checks Hardwave Value @v8 @v9', function (done) {
    testForValue("hv", done, function(v) { v.should.be.above(6); });
	});

  describe("Checks System Group Values", function () {
    //Check all sys values are present
    it('check all sys values are present @v8', function (done) {
      testForValue("sys", done, function(r) {
        should(r).have.property("fb");
        should(r).have.property("fv");
        // should(r).have.property("hp");
        should(r).have.property("hv");
        should(r).have.property("hv");
        should(r).have.property("ja");
        should(r).have.property("ct");
        //  should(r).have.property("sl");
        should(r).have.property("mt");
        should(r).have.property("ej");
        should(r).have.property("jv");
        //  should(r).have.property("js");
        should(r).have.property("tv");
        should(r).have.property("qv");
        should(r).have.property("sv");
        should(r).have.property("si");
        //  should(r).have.property("spi"); //v9
        should(r).have.property("gpl");
        should(r).have.property("gun");
        should(r).have.property("gco");
        should(r).have.property("gpa");
        should(r).have.property("gdi");
      });
    });
  });

});
