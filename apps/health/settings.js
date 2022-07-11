(function (back) {
  var settings = Object.assign({
    stepGoal: 10000,
    moveGoal: 30,
    standGoal: 6,
    hrm: 0,
    hrmMinConfidence: 80,
    idleMon: false,
    idleStartHour: 9,
    idleEndHour: 17,
    sleepMon: false
  }, require("Storage").readJSON("health.json", true) || {});

  function menuMain() {
    E.showMenu({
      "": { title: /*LANG*/"Health Tracking" },

      /*LANG*/"< Back": () => back(),

      /*LANG*/"Daily Step Goal": {
        value: settings.stepGoal,
        min: 0,
        max: 20000,
        step: 250,
        onchange: v => {
          settings.stepGoal = v;
          setSettings(settings);
        }
      },

      /*LANG*/"Daily Move Goal": {
        value: settings.moveGoal,
        min: 0,
        max: 480,
        step: 10,
        format: v => (v > 1) ? v + " mins" : v,
        onchange: v => {
          settings.moveGoal = v;
          setSettings(settings);
        }
      },

      /*LANG*/"Daily Stand Goal": {
        value: settings.standGoal,
        min: 0,
        max: 24,
        step: 1,
        format: v => (v > 1) ? v + " hrs" : (v > 0) ? v + " hr" : v,
        onchange: v => {
          settings.moveGoal = v;
          setSettings(settings);
        }
      },

      /*LANG*/"Heart rate": () => menuHeartMonitor(),
      /*LANG*/"Idle alert": () => menuIdleMonitor(),
      /*LANG*/"Sleep monitor": () => menuSleepMonitor()
    });
  }

  function menuHeartMonitor() {
    E.showMenu({
      "": { title: /*LANG*/"Heart rate" },

      /*LANG*/"< Back": () => menuMain(),

      /*LANG*/"HRM Interval": {
        value: settings.hrm,
        min: 0,
        max: 3,
        format: v => [
          /*LANG*/"Off",
          /*LANG*/"3 mins",
          /*LANG*/"10 mins",
          /*LANG*/"Always"
        ][v],
        onchange: v => {
          settings.hrm = v;
          setSettings(settings);
        }
      },

      /*LANG*/"HRM Min Confidence": {
        value: settings.hrmMinConfidence,
        min: 0,
        max: 100,
        step: 5,
        format: v => v + "%",
        onchange: v => {
          settings.hrmMinConfidence = v;
          setSettings(settings);
        }
      }
    });
  }

  function menuIdleMonitor() {
    E.showMenu({
      "": { title: /*LANG*/"Idle alert" },

      /*LANG*/"< Back": () => menuMain(),

      /*LANG*/"Enable": {
        value: settings.idleMon,
        onchange: v => {
          settings.idleMon = v;
          setSettings(settings);
        }
      },

      /*LANG*/"Start hour": {
        value: settings.idleStartHour,
        min: 0,
        max: 24,
        step: 1,
        onchange: v => {
          settings.idleStartHour = v;
          setSettings(settings);
        }
      },

      /*LANG*/"End hour": {
        value: settings.idleStartHour,
        min: 0,
        max: 24,
        step: 1,
        onchange: v => {
          settings.idleEndHour = v;
          setSettings(settings);
        }
      }
    });
  }

  function menuSleepMonitor() {
    E.showMenu({
      "": { title: /*LANG*/"Sleep monitor" },

      /*LANG*/"< Back": () => menuMain(),

      /*LANG*/"Enable": {
        value: settings.sleepMon,
        onchange: v => {
          settings.sleepMon = v;
          setSettings(settings);
        }
      }
    });
  }

  function setSettings(settings) {
    require("Storage").writeJSON("health.json", settings);
  }

  menuMain();
});
