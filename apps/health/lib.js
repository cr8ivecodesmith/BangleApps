const DB_RECORD_LEN = 4;
const DB_RECORDS_PER_HR = 6;
const DB_RECORDS_PER_DAY = DB_RECORDS_PER_HR*24 + 1/*summary*/;
const DB_RECORDS_PER_MONTH = DB_RECORDS_PER_DAY*31;
const DB_HEADER_LEN = 8;
const DB_FILE_LEN = DB_HEADER_LEN + DB_RECORDS_PER_MONTH*DB_RECORD_LEN;

function getRecordFN(d) {
  return "health-"+d.getFullYear()+"-"+(d.getMonth()+1)+".raw";
}
function getRecordIdx(d) {
  return (DB_RECORDS_PER_DAY*(d.getDate()-1)) +
         (DB_RECORDS_PER_HR*d.getHours()) +
         (0|(d.getMinutes()*DB_RECORDS_PER_HR/60));
}

// Read all records from the given month
exports.readAllRecords = function(d, cb) {
  var fn = getRecordFN(d);
  var f = require("Storage").read(fn);
  if (f===undefined) return;
  var idx = DB_HEADER_LEN;
  for (var day=0;day<31;day++) {
    for (var hr=0;hr<24;hr++) { // actually 25, see below
      for (var m=0;m<DB_RECORDS_PER_HR;m++) {
        var h = f.substr(idx, DB_RECORD_LEN);
        if (h!="\xFF\xFF\xFF\xFF") {
          cb({
            day:day+1, hr : hr, min:m*10,
            steps : (h.charCodeAt(0)<<8) | h.charCodeAt(1),
            bpm : h.charCodeAt(2),
            movement : h.charCodeAt(3)
          });
        }
        idx += DB_RECORD_LEN;
      }
    }
    idx += DB_RECORD_LEN; // +1 because we have an extra record with totals for the end of the day
  }
};

// Read daily summaries from the given month
exports.readDailySummaries = function(d, cb) {
  var rec = getRecordIdx(d);
  var fn = getRecordFN(d);
  var f = require("Storage").read(fn);
  if (f===undefined) return;
  var idx = DB_HEADER_LEN + (DB_RECORDS_PER_DAY-1)*DB_RECORD_LEN; // summary is at the end of each day
  for (var day=0;day<31;day++) {
    var h = f.substr(idx, DB_RECORD_LEN);
    if (h!="\xFF\xFF\xFF\xFF") {
      cb({
        day:day+1,
        steps : (h.charCodeAt(0)<<8) | h.charCodeAt(1),
        bpm : h.charCodeAt(2),
        movement : h.charCodeAt(3)
      });
    }
    idx += DB_RECORDS_PER_DAY*DB_RECORD_LEN;
  }
};

// Read all records from the given month
exports.readDay = function(d, cb) {
  var rec = getRecordIdx(d);
  var fn = getRecordFN(d);
  var f = require("Storage").read(fn);
  if (f===undefined) return;
  var idx = DB_HEADER_LEN + (DB_RECORD_LEN*DB_RECORDS_PER_DAY*(d.getDate()-1));
  for (var hr=0;hr<24;hr++) {
    for (var m=0;m<DB_RECORDS_PER_HR;m++) {
      var h = f.substr(idx, DB_RECORD_LEN);
      if (h!="\xFF\xFF\xFF\xFF") {
        cb({
          hr : hr, min:m*10,
          steps : (h.charCodeAt(0)<<8) | h.charCodeAt(1),
          bpm : h.charCodeAt(2),
          movement : h.charCodeAt(3)
        });
      }
      idx += DB_RECORD_LEN;
    }
  }
};


/**
 * Utils
 *
 */
exports.vibrate = function() {
  Bangle.buzz(80).then(()=>{setTimeout(()=>{
    Bangle.buzz(100).then(()=>{setTimeout(()=>{
      Bangle.buzz(80);
      }, 400);});
    }, 200);
  });
};


/**
 * Idle alert monitoring
 *
 */
exports.idlSaveData = function (data) {
  require("Storage").writeJSON("health.idle.data.json", data);
};

exports.idlLoadData = function () {
  let health = Bangle.getHealthStatus("day");
  let data = Object.assign({
    firstLoad: true,
    stepsDate: new Date(),
    stepsOnDate: health.steps,
    okDate: new Date(1970),
    dismissDate: new Date(1970),
    pauseDate: new Date(1970),
  },
  require("Storage").readJSON("health.idle.data.json") || {});

  if(typeof(data.stepsDate) == "string")
    data.stepsDate = new Date(data.stepsDate);
  if(typeof(data.okDate) == "string")
    data.okDate = new Date(data.okDate);
  if(typeof(data.dismissDate) == "string")
    data.dismissDate = new Date(data.dismissDate);
  if(typeof(data.pauseDate) == "string")
    data.pauseDate = new Date(data.pauseDate);

  return data;
};

exports.idlMustAlert = function(idle_data, idle_settings) {
  // We'll alert if there has been no activity within the hour.
  let now = new Date();
  let maxInactiveMins = idle_settings.maxInactiveMins || 60;
  if ((now - idle_data.stepsDate) / 60000 > maxInactiveMins) { // inactivity detected
    return true;
  }
  return false;
};
