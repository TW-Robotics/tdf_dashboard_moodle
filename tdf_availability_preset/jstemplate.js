/* Digital Factory Lab – robot availability: counts, labels and expired bookings. */
(function () {
  function txt(el) { return el ? el.textContent.trim() : ""; }
  function parseDate(s) {
    var m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/) || null, d;
    if (m) { d = new Date(+m[3], +m[2] - 1, +m[1]); }
    else if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) { d = new Date(+m[1], +m[2] - 1, +m[3]); }
    return d && !isNaN(d) ? d : null;
  }
  function run() {
    var cards = document.querySelectorAll(".tdf-card");
    if (!cards.length) { return; }
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var counts = { Free: 0, Busy: 0, Occupied: 0 };
    Array.prototype.forEach.call(cards, function (c) {
      var st = txt(c.querySelector(".tdf-status"));
      if (!counts.hasOwnProperty(st)) { st = "Free"; }
      c.classList.remove("tdf-Free", "tdf-Busy", "tdf-Occupied");
      c.classList.add("tdf-" + st);
      var pill = c.querySelector(".tdf-pill"); if (pill) { pill.classList.add("tdf-" + st); }
      counts[st]++;

      var who = c.querySelector(".tdf-who"), person = c.querySelector(".tdf-person"), until = c.querySelector(".tdf-until");
      var note = c.querySelector(".tdf-note");
      if (st === "Free") {
        if (who) { who.textContent = "Available"; who.style.color = "#1b1f24"; who.style.fontWeight = "400"; }
        if (note) { note.textContent = ""; }
        return;
      }
      if (person && txt(person)) { person.insertAdjacentText("afterbegin", "@ "); }
      else if (person) { person.textContent = st === "Busy" ? "@ Unknown" : ""; }
      if (until && txt(until)) {
        var d = parseDate(txt(until));
        until.insertAdjacentText("afterbegin", " until ");
        if (d && d < today) {
          var f = document.createElement("span");
          f.className = "tdf-expired-flag";
          f.textContent = "Booking ended – please release or extend";
          until.parentNode.appendChild(f);
        }
      }
    });
    Object.keys(counts).forEach(function (k) {
      var b = document.querySelector('[data-count="' + k + '"]');
      if (b) { b.textContent = counts[k]; }
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
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", run); } else { run(); }
})();
