/**
 * Heart rate monitoring
 *
 */
(function(){
  var settings = require("Storage").readJSON("health.json",1)||{};
  var hrm = 0|settings.hrm;
  var hrmMinConfidence = settings.hrmMinConfidence;
  if (hrm == 1 || hrm == 2) {
   function onHealth() {
     Bangle.setHRMPower(1, "health");
     setTimeout(()=>Bangle.setHRMPower(0, "health"),hrm*60000); // give it 1 minute detection time for 3 min setting and 2 minutes for 10 min setting
     if (hrm == 1){
       for (var i = 1; i <= 2; i++){
         setTimeout(()=>{
           Bangle.setHRMPower(1, "health");
           setTimeout(()=>{
             Bangle.setHRMPower(0, "health");
           }, (i * 200000) + 60000);
         }, (i * 200000));
       }
     }
   }
   Bangle.on("health", onHealth);
   Bangle.on("HRM", h => {
     if (h.confidence>=hrmMinConfidence) Bangle.setHRMPower(0, "health");
   });
   if (Bangle.getHealthStatus().bpmConfidence >= hrmMinConfidence) return;
   onHealth();
  } else Bangle.setHRMPower(hrm!=0, "health");
})();


/**
 * Idle alert monitoring
 *
 */
(function () {
  const settings = require("Storage").readJSON("health.json",1)||{};

  let enabled = settings.idleEnabled;
  let startHour = settings.idleStartHour;
  let endHour = settings.idleEndHour;

  let dndEnabled = settings.idleDND;
  let dndStartHour = settings.idleDNDStartHour;
  let dndEndHour = settings.idleDNDEndHour;

  let pollInterval = settings.idlePollInterval;
  let noMoveThresh = settings.idleNoMoveThresh;
  let minActiveMins = settings.idleMinActiveMins;
  let minSteps = settings.idleMinSteps;

  // load variable before defining functions cause it can trigger a ReferenceError
  const lib = require("health");
  let idle_data = lib.idlLoadData();

  if (idle_data.firstLoad) {
      idle_data.firstLoad = false;
      lib.idlSaveData(idle_data);
  }

  function run() {
    if (isNotWorn()) return;
    let now = new Date();
    let h = now.getHours();

    if (isDuringAlertHours(h)) {
      let health = Bangle.getHealthStatus("day");
      // TODO: Include minActiveMins as well
      if (health.steps - idle_data.stepsOnDate >= minSteps // more steps made than needed
          || health.steps < idle_data.stepsOnDate) { // new day or reboot of the watch
        idle_data.stepsOnDate = health.steps;
        idle_data.stepsDate = now;
        lib.idlSaveData(idle_data);
      }

      if (lib.idlMustAlert(idle_data, settings)) {
        g.clear();
        lib.vibrate();
        E.showMessage("Time to move a little!", {
            title: "Idle alert!"
        });
        setTimeout(load, 5000);
      }
    }
  }

  function isNotWorn() {
    let h = Bangle.getHealthStatus();
    return Bangle.isCharging() || h.movement <= noMoveThresh;
  }

  function isDuringAlertHours(h) {
    let isDND = false;

    if (dndEnabled) {
      if (dndStartHour < dndEndHour) { // not passing through midnight
        isDND = (h >= dndStartHour && h < dndEndHour);
      } else { // passing through midnight
        isDND = (h >= dndStartHour || h < dndEndHour);
      }
    }

    if (!isDND) {
      if (startHour < endHour) { // not passing through midnight
        return (h >= startHour && h < endHour);
      } else { // passing through midnight
        return (h >= startHour || h < endHour);
      }
    }
  }

  Bangle.on('midnight', function () {
    /*
    Usefull trick to have the app working smothly for people using it at night 
    */
    let now = new Date();
    let h = now.getHours();
    if (enabled && isDuringAlertHours(h)) {
      // updating only the steps and keeping the original stepsDate on purpose 
      idle_data.stepsOnDate = 0;
      lib.idlSaveData(idle_data);
    }
  });

  if (enabled) {
    setInterval(run, pollInterval * 60000);
  }
})();


/**
 * Health data recording
 *
 */
Bangle.on("health", health => {
  // ensure we write health info for *last* block
  var d = new Date(Date.now() - 590000);

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
  function getRecordData(health) {
    return String.fromCharCode(
      health.steps>>8,health.steps&255, // 16 bit steps
      health.bpm, // 8 bit bpm
      Math.min(health.movement / 8, 255)); // movement
  }

  var rec = getRecordIdx(d);
  var fn = getRecordFN(d);
  var f = require("Storage").read(fn);
  if (f) {
    var dt = f.substr(DB_HEADER_LEN+(rec*DB_RECORD_LEN), DB_RECORD_LEN);
    if (dt!="\xFF\xFF\xFF\xFF") {
      print("HEALTH ERR: Already written!");
      return;
    }
  } else {
    require("Storage").write(fn, "HEALTH1\0", 0, DB_FILE_LEN); // header
  }
  var recordPos = DB_HEADER_LEN+(rec*DB_RECORD_LEN);
  require("Storage").write(fn, getRecordData(health), recordPos, DB_FILE_LEN);
  if (rec%DB_RECORDS_PER_DAY != DB_RECORDS_PER_DAY-2) return;
  // we're at the end of the day. Read in all of the data for the day and sum it up
  var sumPos = recordPos + DB_RECORD_LEN; // record after the current one is the sum
  if (f.substr(sumPos, DB_RECORD_LEN)!="\xFF\xFF\xFF\xFF") {
    print("HEALTH ERR: Daily summary already written!");
    return;
  }
  health = { steps:0, bpm:0, movement:0, movCnt:0, bpmCnt:0};
  var records = DB_RECORDS_PER_HR*24;
  for (var i=0;i<records;i++) {
    var dt = f.substr(recordPos, DB_RECORD_LEN);
    if (dt!="\xFF\xFF\xFF\xFF") {
      health.steps += (dt.charCodeAt(0)<<8)+dt.charCodeAt(1);
      health.movement += dt.charCodeAt(2);
      health.movCnt++;
      var bpm = dt.charCodeAt(2);
      health.bpm += bpm;
      if (bpm) health.bpmCnt++;
    }
    recordPos -= DB_RECORD_LEN;
  }
  if (health.bpmCnt)
    health.bpm /= health.bpmCnt;
  if (health.movCnt)
    health.movement /= health.movCnt;
  require("Storage").write(fn, getRecordData(health), sumPos, DB_FILE_LEN);
});
