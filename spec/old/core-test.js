/* CORE TESTS -  */
/*jslint node: true */
/*jshint -W097 */

//var describe;     // these blow up mocha for some reason
//var console;
//var it;
var require;
var r;

// see https://www.npmjs.com/package/should
var should = require("should");
var sync = require("sync");
var serialport = require("serialport");
var SerialPort = serialport.SerialPort;

//var PORTNAME = "/dev/cu.usbserial-DA00XCML"; //v8 alden/CNC3040
var PORTNAME = "/dev/cu.usbserial-DA00XKGQ"; //v8 alden/Shapeoko2
//var PORTNAME = "/dev/cu.usbserial-DA00XCMV" //v8 riley
//var PORTNAME = "/dev/cu.usbmodem001"  //v9

var sp = new SerialPort(PORTNAME, {
  baudrate: 115200,
  parser: serialport.parsers.readline("\n")
}, false); //do not open right away


'use strict';

//A little function to print out the json responses coming back.  Only accepts JSON
var debugJS = function(msg){
  console.log("<<DEBUG>> " + JSON.stringify(msg))
}

describe('hooks', function () {
  before(function () { // runs before all tests in this block
    console.log("STARTING TESTS");
  });

  after(function () { // runs after all tests in this block
  })

  beforeEach(function () { // runs before each test in this block
  })

  afterEach(function () { // runs after each test in this block
  })

  // test cases

describe('Test Connections to TinyG and Initial Comms.', function () {
  it('Should have 1 or more serial port present. @v8 @v9 @debug', function (done) {
    serialport.list(function (err, ports) {
      if (err) {
        throw (err);
      }
      ports.length.should.be.above(0);
      done();
    });
  });

  it("Check TinyG's USB Connection @v8 @v9 @debug", function (done) {
    sp.open(done); //we call open on the port now which will fire the callback above.
  });
});

//#############################################################################

describe("Set configuration preconditions", function () {

  var commands = ['{ej:1}', '{jv:5}',
                  'g92 x0 y0 z0',
                  '{"fb":n}']   //LAST COMMAND TRIPS done() (NOTE THE QUOTES @ALDEN)

  it("Set configuration preconditions @v8 @v9", function (done) {

    //### Start callback ###
    var reader = function (data, err) {
      //console.log(data);
      var r = JSON.parse(data);
      if (r && r.r && r.r.fb) {
        sp.removeListener("data",reader)
        done();
//      } else {
        debugJS(r)
      }
    }; //end reader

    sp.on('data', reader); // subscribe to the data message callback
    for (var i in commands) {
      debugJS(commands[i]+"\n")
      sp.write(commands[i]+"\n");
    }
  }); // end it
}); // end Set configuration preconditions


//#############################################################################

describe("Check firmware and hardware numbers for up to date values", function () {

  //Firmware build response test
  it('Checks firmware build number @v8 @v9', function (done) {
    var reader = function (data, err) {
      //			console.log(data);
      sp.removeListener('data', reader);
      r = JSON.parse(data).r;
      should(r).have.property('fb');
      done();
    };
    sp.on('data', reader);
    sp.write('{"fb":n}\n');
  });

  //Firmware Build Test
  it("Checks the min firmware build value @v8 @v9", function () {
    r.fb.should.be.above(80);
  });

  //Hardware Value Test
  it('Checks Hardwave Value @v8 @v9', function (done) {
    var reader = function (data, err) {
      //			console.log(data);
      sp.removeListener('data', reader);
      r = JSON.parse(data).r;
      r.should.have.property('hv');
      done();
    };
    sp.on('data', reader);
    sp.write('{"hv":n}\n');
  });

  //Hardware Min Value Test
  it("Checks the min hardware value is set @v8 @v9", function () {
    r.hv.should.be.above(6);
  });
});

//############################################################################

describe("Checks System Group Values", function () {
  //Check all sys values are present
  it('check all sys values are present @v8', function (done) {
    var reader = function (data, err) {
      sp.removeListener('data', reader);
      r = JSON.parse(data).r.sys;
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
      done();
    };
    //This fires THEN the callback sysGhetter will execute on data
    sp.on('data', reader);
    sp.write('{"sys":null}\n');
  });
});

//############################################################################

describe("Checks System Group Values", function () {
  //Check all sys values are present
  it('check all sys values are present @v9', function (done) {

    var reader = function (data, err) {
      //        console.log(data);
      sp.removeListener('data', reader);
      r = JSON.parse(data).r.sys;
      should(r).have.property("fb");
      should(r).have.property("fv");
      should(r).have.property("hp");
      should(r).have.property("hv");
      should(r).have.property("hv");
      should(r).have.property("ja");
      should(r).have.property("ct");
      should(r).have.property("sl");
      should(r).have.property("mt");
      should(r).have.property("ej");
      should(r).have.property("jv");
      should(r).have.property("js");
      should(r).have.property("tv");
      should(r).have.property("qv");
      should(r).have.property("sv");
      should(r).have.property("si");
      should(r).have.property("spi"); //v9
      should(r).have.property("gpl");
      should(r).have.property("gun");
      should(r).have.property("gco");
      should(r).have.property("gpa");
      should(r).have.property("gdi");
      done();
    };

    //This fires THEN the callback sysGhetter will execute on data
    sp.on('data', reader);
    sp.write('{"sys":null}\n');
  });
});

//############################################################################

describe("Check G28.3 Set Machine Origins", function () {
  // Explanation:
  //  - The commands to send are defined as an array
  //  - A reader callback is defined that intercepts all responses from the board
  //  - sp.on registers this callback
  //  - Commands are executed until the last comamnd is detected, or a timeout occurs

  var commands = ['g28.3 x0 y0 z0',
                    'g28.3 X5 Y4 Z1.220'] // this comamnd trips done()

  it("Check G28.3 Set Machine Origins @v8 @v9", function (done) {

    //### Start callback ###
    var reader = function (data, err) {
      var r = JSON.parse(data);
      debugJS(r)
      if (r.sr) {
        if (r.sr.posx === 0 && r.sr.posy === 0 && r.sr.posz === 0) {
          sp.removeListener("data",reader)
          done();
        }
      }
    }; //end reader

    sp.on('data', reader);      // subscribe to the data message callback
    for (var i in commands) {
      sp.write(commands[i]+"\n");
    }
  }); // it
}); // describe

}); // hooks
