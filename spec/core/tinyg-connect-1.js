/* CORE TESTS -  */
/*jslint node: true */
/*jshint -W097 */

var should = require("should");
var sync = require("sync");

describe("OUTER", function () {

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

  //#############################################################################

  describe("XXX Check firmware and hardware numbers for up to date values", function () {

  	//Firmware build response test
  	it('Checks firmware build number @v8 @v9', function (done) {
      function configChanged1(r) {
        if ("fb" in r) {
          r.fb.should.be.above(80);
          g.removeListener('configChanged', configChanged1);
          done();
        }
      }

      g.on('configChanged', configChanged1);

      g.write('{"fb":n}\n');
  	});

    //Hardware Value Test
    it('Checks Hardwave Value @v8 @v9', function (done) {
      function configChanged(r) {
        if ("hv" in r) {
          r.hv.should.be.above(6);

          g.removeListener('configChanged', configChanged);
          done();
        } else {
          console.log("NOO! ", r);
        }
      }

      g.on('configChanged', configChanged);

      g.write('{"hv":n}\n');
  	});

  });

});
