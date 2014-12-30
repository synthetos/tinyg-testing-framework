/* CORE TESTS -  */
var tinyg = require("tinyg")
var should = require("should")
var tg = new tinyg()
var sync = require("sync")
var serialport = require("serialport")
var SerialPort = serialport.SerialPort;

var PORTNAME = "/dev/cu.usbserial-DA00XCMV" //v8
  //var PORTNAME = "/dev/cu.usbmodem001"  //v9

var sp = new SerialPort(PORTNAME, {
  baudrate: 115200,
  parser: serialport.parsers.readline("\n")
}, false); //do not open right away


'use strict';

describe('Test Connections to TinyG and Initial Comms.', function () {

  it('Should have more than 1 serial port present.', function (done) {
    serialport.list(function (err, ports) {
      if (err) throw (err);
      ports.length.should.be.above(0);
      done()
    })
  });

  //################################################################ 
  it("Checks TinyG's USB Connection", function (done) {
    var openEvent = function (err, data) {
      if (err) {
        //console.log("Err: " + err);
        throw (err);
      } else {
        done(); //we opened the port successfully
      }

    };
    sp.open(openEvent); //we call open on the port now which will fire the call
    //back above.
  });
})




//################################################################################### 
describe("Checks firmware and hardware numbers for up to date values", function () {
  
  //Firmware build response test
  it('Checks firmware build number', function (done) {
    var fbcheck = function (data, err) {
      //console.log(data);
      sp.removeListener('data', fbcheck);
      r = JSON.parse(data).r
      should(r).have.property('fb')
      done();
    }
    sp.on('data', fbcheck);
    sp.write('{"fb":""}\n');
  });

  //Firmware Build Test
  it("Checks the min firmware build value", function () {
    r.fb.should.be.above(80);
  });

  //Hardware Value Test
  it('Checks Hardwave Value', function (done) {
    var hvcheck = function (data, err) {
      // sconsole.log(data);
      sp.removeListener('data', hvcheck);
      r = JSON.parse(data).r
      r.should.have.property('hv')
      done();
    }
    sp.on('data', hvcheck);
    sp.write('{"hv":""}\n');
  });

  //Hardware Min Value Test
  it("Checks the min hardware value is set", function () {
    r.hv.should.be.above(6);
  });
});




describe("Checks System Group Values", function () {
  //Check all sys values are present
  it('check all sys values are present @v8', function (done) {

    var sysGhetter = function (data, err) {
      sp.removeListener('data', sysGhetter);
      r = JSON.parse(data).r.sys
      should(r).have.property("fb")
      should(r).have.property("fv")
//      should(r).have.property("hp")
      should(r).have.property("hv")
      should(r).have.property("hv")
      should(r).have.property("ja")
      should(r).have.property("ct") 
//      should(r).have.property("sl")
      should(r).have.property("mt")
      should(r).have.property("ej")
      should(r).have.property("jv")
//      should(r).have.property("js")
      should(r).have.property("tv")
      should(r).have.property("qv")
      should(r).have.property("sv")
      should(r).have.property("si")
//      should(r).have.property("spi") //v9
      should(r).have.property("gpl")
      should(r).have.property("gun")
      should(r).have.property("gco")
      should(r).have.property("gpa")
      should(r).have.property("gdi")
      done();
    }
    //This fires THEN the callback sysGhetter will execute on data
    sp.on('data', sysGhetter);
    sp.write("{\"sys\":null}\n")
    
  });
});



describe("Check offset commands and homing functions", function(){
 it("Check manual homing op 28.2", function(done){
    //This is a bit more of involved test so I will explain what is going on here:
    //
   G28_3_TEST_COMMAND = '{"gc":"g28.3 X5 Y4 Z1.220"}\n'
   CLEAR_COMMAND = '{"gc":"g28.3 x0 y0 z0"}\n'
    var offsetCallback = function(data, err){
      
      _pdata = JSON.parse(data) //Lets parse this every time this callback fires
      //We will get other json data other than the {sr} so we put some logic below
      //that looks for the sr element before we try to parse the pos* values.
      
      if(_pdata.hasOwnProperty("sr")){
        if(_pdata.sr.posx == 5 && _pdata.sr.posy == 4 && _pdata.sr.posz == 1.220){
          done()
        }
      } //end if _pdata
    }//end offsetCallback()
    
    sp.write(CLEAR_COMMAND) //This clears us out to detect the change
    sp.on('data', offsetCallback) //We now subscribe to the data message callback
    sp.write(G28_3_TEST_COMMAND) //we fire off our true test command now
    
 })
  
});

