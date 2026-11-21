/* Station "Bin Picking Station" – SETTINGS ONLY. The program itself is loaded from the "Station access"
   database, so future updates only need to be pasted there. Fill in the d= numbers below. */
window.TDF = {
  page: "station",
  ACCESS_DB: 2338,            // d= of "Station access" (the program lives there) – required
  OVERVIEW_DB: 2330          // d= of the Overview (for the "All stations" link); 0 = no link
  AVAIL_DB: 0,             // d= of "Robot availability"; 0 = not used
  STATION: "Bin Picking Station",
  LOCATION: "C0.1", ROOM: "",
  art: "bin_picking_station",          // which picture to show
  OPEN: 8, CLOSE: 18, MAX_HOURS: 10,
  DAYS: [1, 2, 3, 4, 5]
};

/* ---- load the program from the "Station access" database (don't change) ---- */
(function () {
  var s = document.createElement("script");
  s.src = "js.php?d=" + window.TDF.ACCESS_DB;
  s.onerror = function () { console.error("Station booking: couldn't load the program from js.php?d=" + window.TDF.ACCESS_DB); };
  (document.head || document.documentElement).appendChild(s);
})();
