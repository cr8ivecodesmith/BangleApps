(function (back) {
  var settings = Object.assign({
    stepGoal: 10000,
    moveGoal: 30,
    standGoal: 6,

    hrm: 0,
    hrmMinConfidence: 80,

    idleEnabled: false,
    idleStartHour: 9,
    idleEndHour: 17,
    idleDND: false,
    idleDNDStartHour: 0,
    idleDNDEndHour: 8,
    idleNoMoveThresh: 100,

    sleepEnabled: false
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
      /*LANG*/"Idle alert": () => menuIdleMon(),
      /*LANG*/"Sleep monitor": () => menuSleepMon()
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

  function menuIdleMon() {
    E.showMenu({
      "": { title: /*LANG*/"Idle alert" },

      /*LANG*/"< Back": () => menuMain(),

      /*LANG*/"Enable": {
        value: settings.idleEnabled,
        onchange: v => {
          settings.idleEnabled = v;
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
        value: settings.idleEndHour,
        min: 0,
        max: 24,
        step: 1,
        onchange: v => {
          settings.idleEndHour = v;
          setSettings(settings);
        }
      },
      /*LANG*/"Advanced": () => menuIdleMonAdv()
    });
  }

  function menuIdleMonAdv() {
    E.showMenu({
      "": { title: /*LANG*/"Idle alert Advanced" },

      /*LANG*/"< Back": () => menuIdleMon(),

      /*LANG*/"Enable DND": {
        value: settings.idleDND,
        onchange: v => {
          settings.idleDND = v;
          setSettings(settings);
        }
      },

      /*LANG*/"DND Start hour": {
        value: settings.idleDNDStartHour,
        min: 0,
        max: 24,
        step: 1,
        onchange: v => {
          settings.idleDNDStartHour = v;
          setSettings(settings);
        }
      },

      /*LANG*/"DND End hour": {
        value: settings.idleDNDEndHour,
        min: 0,
        max: 24,
        step: 1,
        onchange: v => {
          settings.idleEndHour = v;
          setSettings(settings);
        }
      },

      /*LANG*/"No Movement Threshold": {
        value: settings.idleNoMoveThresh,
        min: 0,
        max: 500,
        step: 10,
        onchange: v => {
          settings.idleNoMoveThresh = v;
          setSettings(settings);
        }
      }
    });
  }

  function menuSleepMon() {
    E.showMenu({
      "": { title: /*LANG*/"Sleep monitor" },

      /*LANG*/"< Back": () => menuMain(),

      /*LANG*/"Enable": {
        value: settings.sleepEnabled,
        onchange: v => {
          settings.sleepEnabled = v;
          setSettings(settings);
        }
      },
      /*LANG*/"Advanced": () => menuSleepMonAdv()
    });
  }

  function menuSleepMonAdv() {
    E.showMenu({
      "": { title: /*LANG*/"Sleep monitor Advanced" },

      /*LANG*/"< Back": () => menuSleepMon()

    });
  }

  function setSettings(settings) {
    require("Storage").writeJSON("health.json", settings);
  }

  menuMain();
});
