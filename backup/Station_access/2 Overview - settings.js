/* Station overview – SETTINGS ONLY. The program itself is loaded from the "Station access"
   database, so future updates only need to be pasted there. Fill in the d= numbers below. */
window.TDF = {
  page: "overview",
  ACCESS_DB: 2338,            // d= of "Station access" (the program lives there) – required
  AVAIL_DB: 0,             // d= of "Robot availability"; 0 = not used
  ONLY_MY_STATIONS: true,  // true = show only the stations you may book; false = show all
  OPEN: 8, CLOSE: 18, MAX_HOURS: 10,
  DAYS: [1, 2, 3, 4, 5],   // bookable weekdays, 1 = Monday
  // one line per station: "db" = d= of that station's booking database
  STATIONS: {
     "Bin Picking Station": {"db": 2320, "location": "C0.1", "room": "", "art": "bin_picking_station"},
    "MiR with UR5": {"db": 2321, "location": "C0.1", "room": "", "art": "mir_ur5"},
    "Taurob - Sieglinde": {"db": 2322, "location": "C0.1", "room": "", "art": "taurob"},
    "3D Measuring Machine": {"db": 2324, "location": "C0.1", "room": "", "art": "3d_measuring_machine"},
    "ABB CRB 15000-5/0.95 (GoFa)": {"db": 2325, "location": "C0.1", "room": "", "art": "abb_gofa"},
    "High-rack Warehouse": {"db": 2326, "location": "C0.1", "room": "", "art": "high_rack_warehouse"},
    "3D Printing Farm": {"db": 2327, "location": "C1.1", "room": "", "art": "3d_printing_farm"}
  }
};

/* ---- load the program from the "Station access" database (don't change) ---- */
(function () {
  var s = document.createElement("script");
  s.src = "js.php?d=" + window.TDF.ACCESS_DB;
  s.onerror = function () { console.error("Station booking: couldn't load the program from js.php?d=" + window.TDF.ACCESS_DB); };
  (document.head || document.documentElement).appendChild(s);
})();
