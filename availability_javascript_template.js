/* Digital Factory Lab – robot availability (Moodle Database JavaScript template):
   counts, labels, expired bookings, and slot bookings from the "Robot bookings" database. */
(function () {
  /* ======== settings ======== */
  var BOOKINGS_DB = 0;   // id of the "Robot bookings" database (the number after d= in its URL); 0 = don't show slot bookings
  /* ========================== */

  var MONTHS = { january: 1, jan: 1, januar: 1, "jänner": 1, february: 2, feb: 2, februar: 2, "feber": 2, march: 3, mar: 3, "märz": 3, "mär": 3,
    april: 4, apr: 4, may: 5, mai: 5, june: 6, jun: 6, juni: 6, july: 7, jul: 7, juli: 7, august: 8, aug: 8, september: 9, sep: 9, sept: 9,
    october: 10, oct: 10, oktober: 10, okt: 10, november: 11, nov: 11, december: 12, dec: 12, dezember: 12, dez: 12 };
  var WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  var slots = [];
  function txt(el) { return el ? el.textContent.replace(/\s+/g, " ").trim() : ""; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function iso(y, m, d) { return y + "-" + pad(m) + "-" + pad(d); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function parseDMY(s) {
    var m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/); if (m) { return new Date(+m[3], +m[2] - 1, +m[1]); }
    m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/); if (m) { return new Date(+m[1], +m[2] - 1, +m[3]); }
    return null;
  }
  function parseShown(s) {
    var m = s.toLowerCase().match(/(\d{1,2})\.?\s*([a-zäö]+)\.?,?\s*(\d{4})/);
    if (m && MONTHS[m[2]]) { return iso(+m[3], MONTHS[m[2]], +m[1]); }
    m = s.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/); return m ? iso(+m[3], +m[2], +m[1]) : "";
  }
  function hour(s) { var m = String(s).match(/(\d{1,2})/); return m ? +m[1] : NaN; }
  function todayIso() { var d = new Date(); return iso(d.getFullYear(), d.getMonth() + 1, d.getDate()); }
  function when(b) { var p = b.date.split("-"), d = new Date(+p[0], +p[1] - 1, +p[2]);
    return (b.date === todayIso() ? "today" : WD[(d.getDay() + 6) % 7] + ", " + p[2] + "." + p[1] + ".") + " " + pad(b.from) + ":00–" + pad(b.to) + ":00"; }

  function run() {
    var cards = document.querySelectorAll(".tdf-card");
    if (!cards.length) { return; }
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var t = todayIso(), h = new Date().getHours();
    var counts = { Free: 0, Busy: 0, Occupied: 0 };
    Array.prototype.forEach.call(cards, function (c) {
      // remember the original field values once, so run() can be repeated
      if (!c.hasAttribute("data-st")) {
        c.setAttribute("data-st", txt(c.querySelector(".tdf-status")));
        c.setAttribute("data-person", txt(c.querySelector(".tdf-person")));
        c.setAttribute("data-until", txt(c.querySelector(".tdf-until")));
        c.setAttribute("data-note", txt(c.querySelector(".tdf-note")));
      }
      Array.prototype.forEach.call(c.querySelectorAll(".tdf-js"), function (x) { x.remove(); });
      var st = c.getAttribute("data-st"); if (!counts.hasOwnProperty(st)) { st = "Free"; }
      var name = txt(c.querySelector(".tdf-name"));
      var mine = slots.filter(function (b) { return b.robot === name && (b.date > t || (b.date === t && b.to > h)); })
        .sort(function (a, b) { return (a.date + pad(a.from)).localeCompare(b.date + pad(b.from)); });
      var now = st === "Free" && mine[0] && mine[0].date === t && mine[0].from <= h ? mine[0] : null;
      var eff = now ? "Busy" : st;
      c.classList.remove("tdf-Free", "tdf-Busy", "tdf-Occupied"); c.classList.add("tdf-" + eff);
      var pill = c.querySelector(".tdf-pill");
      if (pill) { pill.classList.remove("tdf-Free", "tdf-Busy", "tdf-Occupied"); pill.classList.add("tdf-" + eff); }
      var stEl = c.querySelector(".tdf-status"); if (stEl) { stEl.textContent = now ? "Booked now" : st; }
      counts[eff]++;

      var who = c.querySelector(".tdf-who"), note = c.querySelector(".tdf-note");
      var person = c.getAttribute("data-person"), until = c.getAttribute("data-until");
      if (who) {
        if (now) { who.innerHTML = 'Slot booked · <span class="tdf-person">' + esc(now.user) + '</span> <span class="tdf-until">until ' + pad(now.to) + ':00</span>'; }
        else if (st === "Free") { who.innerHTML = '<span class="tdf-avail">Available</span>'; }
        else {
          var d = parseDMY(until);
          who.innerHTML = '<span class="tdf-person">@ ' + esc(person || (st === "Busy" ? "Unknown" : "")) + '</span>' +
            (until ? ' <span class="tdf-until">until ' + esc(until) + '</span>' : "") +
            (d && d < today ? '<span class="tdf-expired-flag">Booking ended – please release or extend</span>' : "");
          if (!person && st === "Occupied") { who.querySelector(".tdf-person").textContent = ""; }
        }
      }
      if (note) { note.textContent = st === "Free" ? "" : c.getAttribute("data-note"); }
      var next = mine.filter(function (b) { return b !== now; })[0];
      var foot = c.querySelector(".tdf-foot");
      if (next && st === "Free") {
        var n = document.createElement("div"); n.className = "tdf-next tdf-js";
        n.textContent = "Next slot: " + when(next) + " · " + next.user;
        foot ? c.insertBefore(n, foot) : c.appendChild(n);
      }
      if (BOOKINGS_DB && st === "Free" && foot) {
        var a = document.createElement("a"); a.className = "tdf-book tdf-js";
        a.href = "edit.php?d=" + BOOKINGS_DB + "&robot=" + encodeURIComponent(name); a.textContent = "Book a slot →";
        c.insertBefore(a, foot);
      }
    });
    Object.keys(counts).forEach(function (k) {
      var b = document.querySelector('[data-count="' + k + '"]'); if (b) { b.textContent = counts[k]; }
    });
    // Moodle shows 10 entries per page by default: offer a link that shows every robot.
    var hint = document.getElementById("tdf-pagehint");
    if (hint && document.querySelector(".pagination, .paging")) {
      var u = new URL(window.location.href);
      u.searchParams.set("perpage", "100"); u.searchParams.delete("page");
      hint.innerHTML = 'Some robots are on other pages, so the totals above only count this page. <a href="' +
        u.toString().replace(/"/g, "&quot;") + '">Show all robots on one page</a>.';
      hint.hidden = false;
    }
  }
  function loadSlots() {
    if (!BOOKINGS_DB || !document.querySelector(".tdf-card")) { return; }
    fetch("view.php?d=" + BOOKINGS_DB + "&perpage=1000", { credentials: "same-origin" })
      .then(function (r) { if (!r.ok) { throw new Error(r.status); } return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        slots = Array.prototype.map.call(doc.querySelectorAll(".bk-e"), function (e) {
          return { id: +e.getAttribute("data-id") || 0, robot: txt(e.querySelector(".bk-robot")), date: parseShown(txt(e.querySelector(".bk-date"))),
            from: hour(txt(e.querySelector(".bk-from"))), to: hour(txt(e.querySelector(".bk-to"))), user: txt(e.querySelector(".bk-user")) };
        }).filter(function (b) { return b.date && !isNaN(b.from) && !isNaN(b.to) && b.to > b.from; });
        // a booking that clashes with an earlier one is marked "Problem" in the bookings list – ignore it here
        slots = slots.filter(function (b) {
          return !slots.some(function (e) { return e.id < b.id && e.robot === b.robot && e.date === b.date && e.from < b.to && b.from < e.to; });
        });
        run();
      }).catch(function () {});
  }
  function start() { run(); loadSlots(); }
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", start); } else { start(); }
})();
