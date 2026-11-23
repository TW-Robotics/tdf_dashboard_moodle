/* Digital Factory Lab – station booking PROGRAM. © Dr. Kannan Peesapati
   This is the Custom JavaScript of the "Station access" database. The Overview and the 7 station
   databases only hold their settings and load this program from here – so an update means
   pasting THIS file only. Nothing to fill in here (the Leader id is in the List template header). */
(function () {
  var IMGS = images();          // station pictures – at the very end of this file
  var page = (window.TDF || {}).page;
  if (page === "overview") {
/* Digital Factory Lab – Station overview (Moodle Database JavaScript template).
   Shows every station as a tile for the chosen date and time window: Free / Booked / Not bookable,
   and whether YOU may book it (Moodle role "Station booker" in that station's database). */
(function () {
  /* ======== settings ======== */
  // One line per station. "db" = the number after d= in the address bar on that station's Templates or Presets page.
  var STATIONS = {};
  var IMG = IMGS;            // pictures by "art" key: image address or data: image
  var ACCESS_DB = 2338;               // d= number of the "Station access" database; 0 = use Moodle permissions (groups) instead
  var AVAIL_DB = 0;                // d= number of the "Robot availability" database; 0 = don't use the availability board
  var ROBOT_DB = 2318;                // d= number of the "Robot Bookings" database (all robots in one list); 0 = not linked
  var ROBOT_NAMES = {};            // only if a station has a different name there, e.g. { "MiR with UR5": "MiR UR5" }
  var OPEN = 8, CLOSE = 18, MAX_HOURS = 10;
  var DAYS = [1, 2, 3, 4, 5];      // bookable weekdays, 1 = Monday
  var ONLY_MY_STATIONS = true;     // true = show only the stations you may book (teachers still see all); false = show every station
  /* ========================== */

  var T = window.TDF || {};
  if (T.STATIONS !== undefined) { STATIONS = T.STATIONS; }
  if (T.ACCESS_DB !== undefined) { ACCESS_DB = T.ACCESS_DB; }
  if (T.AVAIL_DB !== undefined) { AVAIL_DB = T.AVAIL_DB; }
  if (T.ROBOT_DB !== undefined) { ROBOT_DB = T.ROBOT_DB; }
  if (T.ROBOT_NAMES !== undefined) { ROBOT_NAMES = T.ROBOT_NAMES; }
  if (T.OPEN !== undefined) { OPEN = T.OPEN; }
  if (T.CLOSE !== undefined) { CLOSE = T.CLOSE; }
  if (T.MAX_HOURS !== undefined) { MAX_HOURS = T.MAX_HOURS; }
  if (T.DAYS !== undefined) { DAYS = T.DAYS; }
  if (T.ONLY_MY_STATIONS !== undefined) { ONLY_MY_STATIONS = T.ONLY_MY_STATIONS; }

  var MONTHS = { january: 1, jan: 1, januar: 1, "jänner": 1, february: 2, feb: 2, februar: 2, "feber": 2, march: 3, mar: 3, "märz": 3, "mär": 3,
    april: 4, apr: 4, may: 5, mai: 5, june: 6, jun: 6, juni: 6, july: 7, jul: 7, juli: 7, august: 8, aug: 8, september: 9, sep: 9, sept: 9,
    october: 10, oct: 10, oktober: 10, okt: 10, november: 11, nov: 11, december: 12, dec: 12, dezember: 12, dez: 12 };
  var WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  function txt(el) { return el ? el.textContent.replace(/\s+/g, " ").trim() : ""; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function iso(y, m, d) { return y + "-" + pad(m) + "-" + pad(d); }
  function today() { var d = new Date(); return iso(d.getFullYear(), d.getMonth() + 1, d.getDate()); }
  function dow(s) { var p = s.split("-"); return (new Date(+p[0], +p[1] - 1, +p[2]).getDay() + 6) % 7 + 1; }
  function nice(s) { var p = s.split("-"); return WD[dow(s) - 1] + ", " + p[2] + "." + p[1] + "." + p[0]; }
  function hh(h) { return pad(h) + ":00"; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function parseShown(s) {
    var m = s.toLowerCase().match(/(\d{1,2})\.?\s*([a-zäö]+)\.?,?\s*(\d{4})/);
    if (m && MONTHS[m[2]]) { return iso(+m[3], MONTHS[m[2]], +m[1]); }
    m = s.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/); if (m) { return iso(+m[3], +m[2], +m[1]); }
    m = s.match(/(\d{4})-(\d{2})-(\d{2})/); return m ? m[0] : "";
  }
  function hour(s) { var m = String(s).match(/(\d{1,2})/); return m ? +m[1] : NaN; }
  function overlaps(a, b) { return a.date === b.date && a.from < b.to && b.from < a.to; }
  function get(url) {
    return fetch(url, { credentials: "same-origin" })
      .then(function (r) { if (!r.ok) { throw new Error(r.status); } return r.text(); })
      .then(function (h) { return new DOMParser().parseFromString(h, "text/html"); });
  }
  function readAll(doc) {
    var all = Array.prototype.map.call(doc.querySelectorAll(".bk-e"), function (e) {
      var ua = e.querySelector(".bk-user a"), m = ua ? (ua.getAttribute("href") || "").match(/[?&]id=(\d+)/) : null;
      var ed = e.querySelector('.bk-actions a[href*="edit.php"]'), de = e.querySelector('.bk-actions a[href*="delete="]');
      return { id: +e.getAttribute("data-id") || 0, date: parseShown(txt(e.querySelector(".bk-date"))),
        from: hour(txt(e.querySelector(".bk-from"))), to: hour(txt(e.querySelector(".bk-to"))), user: txt(e.querySelector(".bk-user")),
        uid: m ? +m[1] : 0, note: txt(e.querySelector(".bk-note")), robot: txt(e.querySelector(".bk-robot")),
        edit: ed ? ed.getAttribute("href") : "", del: de ? de.getAttribute("href") : "" };
    }).filter(function (b) { return b.date && b.to > b.from; });
    all.forEach(function (o) { o.lost = all.some(function (e) { return e.id < o.id && overlaps(e, o); }); });   // earlier booking wins
    return all;
  }
  function readBookings(all) { return all.filter(function (b) { return !b.lost; }); }
  /* who is logged in: Moodle puts the user id on the notification bell in the page header */
  function whoAmI() {
    var el = document.querySelector("#nav-notification-popover-container[data-userid], #nav-message-popover-container[data-userid], [data-region='popover-region-notifications'][data-userid], .popover-region[data-userid]");
    if (el && +el.getAttribute("data-userid")) { return Promise.resolve({ id: +el.getAttribute("data-userid"), name: "" }); }
    var root = (window.M && M.cfg && M.cfg.wwwroot) || "";
    return get(root + "/user/profile.php").then(function (doc) {      // fallback: name from your own profile page
      var h = doc.querySelector(".page-header-headings h1, .page-header-headings h2, #page-header h1, h1");
      return { id: 0, name: txt(h) };
    }).catch(function () { return { id: 0, name: "" }; });
  }
  /* ---------- Station access list (who may book which station) ----------
     Rules: the Leader (Moodle user ids in data-leaders on the "Station access" list header)
     adds Supervisors; a Supervisor adds Students for HIS stations only. Entries added by
     anyone else are ignored. Moodle saves who wrote each entry, so this can't be faked. */
  function acNorm(s) { return String(s || "").toLowerCase().replace(/\s+/g, " ").trim(); }
  /* "Simon Huber (id 123)" -> {name: "Simon Huber", id: 123}; a name without id still works */
  function acPerson(s) { var m = String(s || "").match(/^(.*?)\s*\(id\s*(\d+)\)\s*$/i); return m ? { name: m[1].trim(), id: +m[2] } : { name: String(s || "").trim(), id: 0 }; }
  function acGet(url) {
    return fetch(url, { credentials: "same-origin" })
      .then(function (r) { if (!r.ok) { throw new Error(r.status); } return r.text(); })
      .then(function (h) { return new DOMParser().parseFromString(h, "text/html"); });
  }
  function readAccess(doc) {
    var cfg = doc.querySelector(".ac-config");
    var leaders = cfg ? (cfg.getAttribute("data-leaders") || "").split(/[^0-9]+/).filter(Boolean).map(Number) : [];
    var rows = Array.prototype.map.call(doc.querySelectorAll(".ac-e"), function (e) {
      var ua = e.querySelector(".ac-by a"), m = ua ? (ua.getAttribute("href") || "").match(/[?&]id=(\d+)/) : null;
      var ed = e.querySelector('.ac-actions a[href*="edit.php"]'), de = e.querySelector('.ac-actions a[href*="delete="]');
      var pp = acPerson(txt(e.querySelector(".ac-person")));
      return { id: +e.getAttribute("data-id") || 0, station: txt(e.querySelector(".ac-station")), person: pp.name, pid: pp.id,
        role: /super/i.test(txt(e.querySelector(".ac-role"))) ? "Supervisor" : "Student", note: txt(e.querySelector(".ac-note")),
        by: txt(e.querySelector(".ac-by")), byId: m ? +m[1] : 0, edit: ed ? ed.getAttribute("href") : "", del: de ? de.getAttribute("href") : "" };
    });
    var sup = {}, stu = {};
    // a person is matched by Moodle id when the entry has one, otherwise by name
    function put(map, st, r) { (map[st] = map[st] || {})[r.pid ? "#" + r.pid : acNorm(r.person)] = true; }
    function has(map, st, u) { var m = map[st]; return !!(m && u && ((u.id && m["#" + u.id]) || (u.name && m[acNorm(u.name)]))); }
    rows.forEach(function (r) {
      if (r.role !== "Supervisor") { return; }
      r.ok = leaders.indexOf(r.byId) >= 0;
      if (r.ok) { put(sup, r.station, r); } else { r.why = "only the Leader can add supervisors"; }
    });
    rows.forEach(function (r) {
      if (r.role !== "Student") { return; }
      r.ok = leaders.indexOf(r.byId) >= 0 || has(sup, r.station, { id: r.byId, name: r.by });
      if (r.ok) { put(stu, r.station, r); } else { r.why = r.by + " is not a supervisor of " + r.station; }
    });
    return {
      leaders: leaders, rows: rows,
      viewAsOff: !!cfg && /^(off|no|false|0)$/i.test(cfg.getAttribute("data-viewas") || ""),   // data-viewas="off" switches the preview off
      isLeader: function (u) { return !!u && !!u.id && leaders.indexOf(u.id) >= 0; },
      isSupervisor: function (u, st) { return has(sup, st, u); },
      supervisors: function (st) { return rows.filter(function (r) { return r.ok && r.role === "Supervisor" && r.station === st; }).map(function (r) { return r.person; }); },
      may: function (u, st) { return !!u && ((!!u.id && leaders.indexOf(u.id) >= 0) || has(sup, st, u) || has(stu, st, u)); }
    };
  }
  /* the logged-in user: id from the page header, full name from your own profile page */
  function whoAmIFull() {
    var el = document.querySelector("#nav-notification-popover-container[data-userid], #nav-message-popover-container[data-userid], [data-region='popover-region-notifications'][data-userid], .popover-region[data-userid]");
    var id = el ? +el.getAttribute("data-userid") || 0 : 0, root = (window.M && M.cfg && M.cfg.wwwroot) || "";
    return acGet(root + "/user/profile.php" + (id ? "?id=" + id : "")).then(function (doc) {
      var h = doc.querySelector(".page-header-headings h1, .page-context-header h1, .page-header-headings h2, #page-header h1, h1");
      return { id: id, name: txt(h) };
    }).catch(function () { return { id: id, name: "" }; });
  }
  /* course participants (name + Moodle id) from the Participants page – for picking people in the form */
  function loadParticipants() {
    var cm = (document.body.className.match(/\bcourse-(\d+)\b/) || [])[1] || (window.M && M.cfg && M.cfg.courseId), root = (window.M && M.cfg && M.cfg.wwwroot) || "";
    if (!cm) { return Promise.reject(new Error("no course id")); }
    return acGet(root + "/user/index.php?id=" + cm + "&perpage=5000").then(function (doc) {
      var seen = {}, out = [];
      Array.prototype.forEach.call(doc.querySelectorAll('#participants a[href*="/user/view.php"], table.generaltable a[href*="/user/view.php"]'), function (a) {
        var m = (a.getAttribute("href") || "").match(/[?&]id=(\d+)/); if (!m || seen[m[1]]) { return; }
        var c = a.cloneNode(true); Array.prototype.forEach.call(c.querySelectorAll(".userinitials, img, .sr-only, .visually-hidden"), function (x) { x.remove(); });
        var name = txt(c); if (!name) { return; }
        seen[m[1]] = 1; out.push({ id: +m[1], name: name });
      });
      if (!out.length) { throw new Error("no participants visible"); }
      return out.sort(function (a, b) { return a.name.localeCompare(b.name); });
    });
  }
  function loadAccess(db) {
    return acGet("view.php?d=" + db + "&perpage=1000").then(function (doc) {
      if (!doc.querySelector(".ac-config")) { throw new Error("not the access list"); }
      return readAccess(doc);
    });
  }
  /* ---------- "View as" preview (Leaders only) ----------
     The Leader picks a person on the Station access page; every booking page then behaves as for
     that person. Only for looking: anything saved is still saved under the Leader's own name. */
  /* open the current page again as a normal visit (a reload would make Firefox ask to resend a form) */
  function acReopen() {
    var m = location.search.match(/[?&](d|id)=(\d+)/), hid = document.querySelector('form input[name="d"]');
    if (m) { location.href = location.pathname + location.search; }
    else if (hid && hid.value) { location.href = "view.php?d=" + hid.value; }      // page reached by saving a form: no d= in the address
    else { location.href = location.pathname; }
  }
  function getViewAs() { try { return JSON.parse(sessionStorage.getItem("st-viewas") || "null"); } catch (e) { return null; } }
  function setViewAs(u) { try { if (u) { sessionStorage.setItem("st-viewas", JSON.stringify(u)); } else { sessionStorage.removeItem("st-viewas"); } } catch (e) {} }
  function viewAs(acc, me) {
    var v = getViewAs();
    if (!v || !acc || !me || !acc.isLeader(me) || acc.viewAsOff) { return me; }       // only a real Leader can preview (unless switched off)
    var u = { id: v.id || 0, name: v.name || "", real: me, preview: true };
    previewBanner(u, acc);
    return u;
  }
  function previewBanner(u, acc) {
    if (document.getElementById("st-preview")) { return; }
    var what = acc && acc.isLeader(u) ? "Leader" : acc && acc.rows.some(function (r) { return r.ok && r.role === "Supervisor" && acc.isSupervisor(u, r.station); }) ? "supervisor" : "student";
    var d = document.createElement("div"); d.id = "st-preview"; d.className = "st-preview";
    d.innerHTML = "👁 <b>Preview</b> – you see this page as <b>" + String(u.name).replace(/[&<>"]/g, "") + "</b> (" + what + "). Anything you save is still saved as you. " +
      '<button type="button" class="btn btn-sm btn-secondary">Stop preview</button>';
    d.querySelector("button").onclick = function () { setViewAs(null); acReopen(); };
    var root = document.querySelector(".bk") || document.body.firstElementChild;
    if (root && root.parentNode) { root.parentNode.insertBefore(d, root); } else { document.body.insertBefore(d, document.body.firstChild); }
  }
  /* styles for the preview banner and the name pickers (added from here, so the CSS template needn't change) */
  (function () {
    if (document.getElementById("ac-style")) { return; }
    var st = document.createElement("style"); st.id = "ac-style";
    st.textContent = ".st-preview{background:#fff4d6;border:1px solid #b7860b;border-radius:8px;padding:8px 14px;margin:0 0 12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}" +
      ".ac-pick{position:absolute;z-index:50;left:0;right:0;top:100%;background:#fff;border:1px solid #d9dee5;border-radius:6px;box-shadow:0 6px 18px rgba(0,0,0,.12);max-height:320px;overflow:auto}" +
      ".ac-pick[hidden]{display:none}.ac-pick button{display:block;width:100%;text-align:left;border:0;background:#fff;padding:7px 12px}" +
      ".ac-pick button:hover,.ac-pick button:first-child{background:#eef3fb}.ac-id{color:#5b6472}" +
      ".ac-viewas{border:1px dashed #b7860b;background:#fffaf0;border-radius:8px;padding:10px 14px;margin:-4px 0 12px}.ac-hint{color:#5b6472;font-size:.85rem}" +
      ".ac-vrow{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px}.ac-vwrap{position:relative;display:inline-block;width:300px;max-width:100%}.ac-vwrap input{width:100%}" +
      ".ac-vq-btn{border:1px solid #d9dee5;background:#fff;border-radius:999px;padding:2px 10px;font-size:.85rem}.ac-vq-btn:hover{background:#eef3fb}" +
      ".bk-manage{display:flex;justify-content:flex-end;margin:0 0 10px}.ac-group{margin:16px 0 0;font-size:1.05rem;color:#5b6472}";
    (document.head || document.documentElement).appendChild(st);
  })();

  function readBoard(doc) {
    var out = {};
    Array.prototype.forEach.call(doc.querySelectorAll(".tdf-card"), function (c) {
      var u = txt(c.querySelector(".tdf-until")).match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
      out[txt(c.querySelector(".tdf-name"))] = { status: txt(c.querySelector(".tdf-status")), person: txt(c.querySelector(".tdf-person")).replace(/^@\s*/, ""), until: u ? iso(+u[3], +u[2], +u[1]) : "" };
    });
    return out;
  }
  function firstOpenDay() {
    var d = new Date(), h = d.getHours();
    for (var i = 0; i < 14; i++) {
      var s = iso(d.getFullYear(), d.getMonth() + 1, d.getDate());
      if (DAYS.indexOf(dow(s)) >= 0 && !(i === 0 && h >= CLOSE - 1)) { return s; }
      d.setDate(d.getDate() + 1);
    }
    return today();
  }

  function overview(root) {
    var names = Object.keys(STATIONS);
    var st = { date: firstOpenDay(), from: 9, to: 12, loc: "", q: "", filter: "all" };
    if (st.date === today()) { st.from = Math.min(Math.max(OPEN, new Date().getHours() + 1), CLOSE - 1); }
    st.to = Math.min(st.from + 3, CLOSE);
    var data = {};      // name -> {bookings:[], all:[], access:true/false/null, error:bool}
    names.forEach(function (n) { data[n] = { bookings: null, all: [], access: null, error: false }; });
    var me = null, bk = { tab: "upcoming", who: "mine", q: "" }, robotList = [], acc = null, accErr = false;
    /* this station's own bookings + bookings of the same robot in "Robot Bookings"; the earlier booking wins */
    function merge(n) {
      var rn = ROBOT_NAMES[n] || n, ext = robotList.filter(function (b) {     // robot bookings count only if that person may book this station
        return b.robot === rn && !(ACCESS_DB && (accErr || (acc && !acc.may({ id: b.uid, name: b.user }, n))));
      });
      // bookings by people who are not on the station's access list don't count
      data[n].own.forEach(function (b) { b.na = !!(ACCESS_DB && (accErr || (acc && !acc.may({ id: b.uid, name: b.user }, n)))); });
      var both = data[n].own.filter(function (b) { return !b.na; }).concat(ext);
      data[n].own.forEach(function (o) { o.lost = false; });
      both.forEach(function (o) { o.lost = both.some(function (e) { return e.id < o.id && overlaps(e, o); }); });
      data[n].all = data[n].own;
      data[n].bookings = both.filter(function (b) { return !b.lost; });
    }
    function isMine(b) { return me && ((me.id && b.uid === me.id) || (!me.id && me.name && b.user === me.name)); }
    /* bookings list underneath the tiles – same look as "Bookings" on a station page */
    function bookingsHtml(loading) {
      var t = today(), h = new Date().getHours(), q = bk.q.toLowerCase(), items = [];
      names.forEach(function (n) { if (ONLY_MY_STATIONS && data[n].access !== true) { return; } data[n].all.forEach(function (b) {
        var phase = b.date < t || (b.date === t && b.to <= h) ? "past" : b.date === t && b.from <= h ? "now" : "upcoming";
        items.push({ n: n, r: STATIONS[n], b: b, phase: phase });
      }); });
      var pool = items.filter(function (x) { return bk.who === "all" || isMine(x.b); });
      var up = pool.filter(function (x) { return x.phase !== "past"; }).length, now = pool.filter(function (x) { return x.phase === "now"; }).length;
      var bad = pool.filter(function (x) { return (x.b.lost || x.b.na) && x.phase !== "past"; }).length;
      var show = pool.filter(function (x) {
        var okTab = bk.tab === "all" || (bk.tab === "past" ? x.phase === "past" : bk.tab === "today" ? x.b.date === t : x.phase !== "past");
        return okTab && (!q || (x.n + " " + x.b.user + " " + x.b.note).toLowerCase().indexOf(q) >= 0);
      });
      var asc = bk.tab !== "past";
      show.sort(function (a, c) { var k = (a.b.date + pad(a.b.from)).localeCompare(c.b.date + pad(c.b.from)); return asc ? k : -k; });
      var last = "", cards = "";
      show.forEach(function (x) {
        var b = x.b;
        if (b.date !== last) { cards += '<h4 class="bk-dayhead">' + (b.date === t ? "Today · " : "") + nice(b.date) + "</h4>"; last = b.date; }
        var badge = b.na ? '<span class="bk-badge bad">Not allowed</span>' : b.lost ? '<span class="bk-badge bad">Problem</span>' : x.phase === "now" ? '<span class="bk-badge now">Now</span>' : x.phase === "past" ? '<span class="bk-badge">Past</span>' : '<span class="bk-badge ok">Confirmed</span>';
        cards += '<div class="bk-e bk-' + x.phase + (b.lost || b.na ? " bk-bad" : "") + '">' +
          '<div class="bk-e-top"><span class="bk-when">' + hh(b.from) + "–" + hh(b.to) + "</span>" + badge + "</div>" +
          '<div class="bk-robot">' + esc(x.n) + "</div>" +
          (x.r && (x.r.location || x.r.room) ? '<div class="bk-loc">' + esc([x.r.location, x.r.room].filter(Boolean).join(" · ")) + "</div>" : "") +
          '<div class="bk-user">' + (b.uid ? '<a href="' + ((window.M && M.cfg && M.cfg.wwwroot) || "") + "/user/profile.php?id=" + b.uid + '">' + esc(b.user) + "</a>" : esc(b.user)) + "</div>" + (b.note ? '<div class="bk-note">' + esc(b.note) + "</div>" : "") +
          (b.na ? '<div class="bk-problems"><div>' + esc(b.user) + " is not on the access list for this station – this booking doesn't count.</div></div>" :
            b.lost ? '<div class="bk-problems"><div>Overlaps an earlier booking – please change or delete it.</div></div>' : "") +
          '<div class="bk-actions">' + (b.edit ? '<a href="' + esc(b.edit) + '" title="Change">✎</a>' : "") + (b.del ? '<a href="' + esc(b.del) + '" title="Delete">🗑</a>' : "") + "</div></div>";
      });
      var empty = loading && !pool.length ? "Loading…" : bk.who === "mine" && !me ? "Loading…" :
        bk.tab === "upcoming" ? (bk.who === "mine" ? "You have no upcoming bookings." : "No upcoming bookings.") : "No bookings match these filters.";
      return '<div class="bk-top bk-top2"><div><h3 class="bk-h">' + (bk.who === "mine" ? "My bookings" : "All bookings") + '</h3><p class="bk-sub"><b>' + up + "</b> upcoming · <b>" + now + "</b> running now" +
          (bad ? ' · <span class="bad">' + bad + " with a problem</span>" : "") + "</p></div></div>" +
        '<div class="bk-bar"><div class="bk-tabs" role="group" aria-label="Whose bookings">' +
          '<button type="button" data-w="mine" aria-pressed="' + (bk.who === "mine") + '">Mine</button><button type="button" data-w="all" aria-pressed="' + (bk.who === "all") + '">Everyone</button></div>' +
          '<div class="bk-tabs" role="group" aria-label="Show">' + [["upcoming", "Upcoming"], ["today", "Today"], ["past", "Past"], ["all", "All"]].map(function (c) {
            return '<button type="button" data-t="' + c[0] + '" aria-pressed="' + (bk.tab === c[0]) + '">' + c[1] + "</button>"; }).join("") + "</div>" +
          '<input id="bkQ" type="search" placeholder="Search station, name, note" value="' + esc(bk.q) + '"></div>' +
        '<div class="bk-list">' + (cards || '<p class="bk-empty">' + empty + "</p>") + "</div>";
    }
    var board = null;
    var locs = names.map(function (n) { return STATIONS[n].location; }).filter(function (c, i, a) { return c && a.indexOf(c) === i; }).sort();
    function hours(a, b, v) { var o = ""; for (var x = a; x <= b; x++) { o += '<option value="' + x + '"' + (x === v ? " selected" : "") + ">" + hh(x) + "</option>"; } return o; }

    function stateOf(n) {
      var s = st.date, d = data[n], bl = board && board[n];
      if (!STATIONS[n].db) { return { k: "blocked", info: "Booking database not linked yet" }; }
      if (d.error) { return { k: "blocked", info: "No access to this station's bookings" }; }
      if (DAYS.indexOf(dow(s)) < 0) { return { k: "blocked", info: "Lab closed on this day" }; }
      if (bl && (bl.status === "Busy" || bl.status === "Occupied") && !(bl.until && s > bl.until)) {
        return { k: "blocked", info: (bl.status === "Occupied" ? "Out of service" : "Assigned to " + (bl.person || "someone")) + (bl.until ? " until " + nice(bl.until) : "") };
      }
      var day = (d.bookings || []).filter(function (b) { return b.date === s; }).sort(function (a, b) { return a.from - b.from; });
      var hit = day.filter(function (b) { return b.from < st.to && st.from < b.to; });
      if (hit.length) { return { k: "booked", info: hit.map(function (b) { return hh(b.from) + "–" + hh(b.to) + " · " + esc(b.user) + (b.ext ? " (Robot Bookings)" : ""); }).join("<br>") }; }
      var next = day.filter(function (b) { return b.from >= st.to; })[0];
      return { k: "free", info: "Free " + hh(st.from) + "–" + hh(st.to) + (next ? " · next booking " + hh(next.from) : "") };
    }
    var K = { free: ["ok", "Free"], booked: ["now", "Booked"], blocked: ["bad", "Not bookable"] };

    function draw() {
      var q = st.q.toLowerCase(), loading = names.some(function (n) { return STATIONS[n].db && data[n].bookings === null && !data[n].error; });
      var all = names.filter(function (n) {
        var r = STATIONS[n];
        if (ONLY_MY_STATIONS && data[n].access !== true) { return false; }
        return (!st.loc || r.location === st.loc) && (!q || (n + " " + (r.location || "") + " " + (r.room || "")).toLowerCase().indexOf(q) >= 0);
      }).map(function (n) { return { name: n, r: STATIONS[n], s: stateOf(n), access: data[n].access }; });
      var checking = ONLY_MY_STATIONS && names.some(function (n) { return STATIONS[n].db && data[n].access === null; });
      var count = function (k) { return k === "all" ? all.length : k === "mine" ? all.filter(function (x) { return x.access; }).length : all.filter(function (x) { return x.s.k === k; }).length; };
      var shown = all.filter(function (x) { return st.filter === "all" || (st.filter === "mine" ? x.access : x.s.k === st.filter); });
      var open = DAYS.indexOf(dow(st.date)) >= 0;
      // Leader and supervisors: a way into the Station access list (it can be hidden from the course page)
      var manage = ACCESS_DB && acc && me && (acc.isLeader(me) || acc.rows.some(function (r) { return r.ok && r.role === "Supervisor" && acc.isSupervisor(me, r.station); }));
      root.innerHTML =
        (manage ? '<div class="bk-manage"><a class="btn btn-secondary" href="view.php?d=' + ACCESS_DB + '">👥 Manage station access</a></div>' : "") +
        '<div class="bk-filters">' +
          '<label>Date<input type="date" id="ovDate" value="' + st.date + '" min="' + today() + '"></label>' +
          '<label>From<select id="ovFrom">' + hours(OPEN, CLOSE - 1, st.from) + "</select></label>" +
          '<label>To<select id="ovTo">' + hours(OPEN + 1, CLOSE, st.to) + "</select></label>" +
          '<label>Location<select id="ovLoc"><option value="">All locations</option>' + locs.map(function (c) { return "<option" + (c === st.loc ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") + "</select></label>" +
          '<label>Search<input type="search" id="ovQ" placeholder="Station, location, room" value="' + esc(st.q) + '"></label>' +
        "</div>" +
        '<div class="bk-ovbar"><div class="bk-chips">' + (ONLY_MY_STATIONS ? [["all", "All"], ["free", "Free"], ["booked", "Booked"], ["blocked", "Not bookable"]] : [["all", "All"], ["mine", "My stations"], ["free", "Free"], ["booked", "Booked"], ["blocked", "Not bookable"]]).map(function (c) {
          return '<button type="button" class="bk-chip" data-f="' + c[0] + '" aria-pressed="' + (st.filter === c[0]) + '">' + c[1] + " (" + count(c[0]) + ")</button>"; }).join("") + "</div>" +
          '<div class="bk-legend"><span class="bk-badge ok">● Free</span><span class="bk-badge now">● Booked in this window</span><span class="bk-badge bad">● Not bookable</span></div></div>' +
        '<p class="bk-freeinfo">' + (loading ? "Loading bookings…" : !open ? "The lab is closed on " + nice(st.date) + " – choose a weekday." :
          "<b>" + count("free") + " of " + all.length + "</b> stations free on " + nice(st.date) + ", " + hh(st.from) + "–" + hh(st.to)) + "</p>" +
        '<div class="bk-tiles">' + shown.map(function (x) {
          var k = K[x.s.k], img = x.r.img || IMG[x.r.art], place = [x.r.location, x.r.room].filter(function (v) { return v; }).join(" · ");
          var href = "edit.php?d=" + x.r.db + "&date=" + st.date + "&from=" + st.from + "&to=" + Math.min(st.to, st.from + MAX_HOURS);
          var action = "";
          if (x.s.k === "free" && !loading) {
            action = x.access ? '<a class="btn btn-primary bk-t-btn" href="' + href + '">Book</a>'
              : x.access === false ? '<div class="bk-t-noaccess">No booking access – ask ' + (acc && acc.supervisors(x.name).length ? esc(acc.supervisors(x.name).join(" or ")) : "the station supervisor") + "</div>" : "";
          }
          return '<article class="bk-tile bk-t-' + x.s.k + (x.access ? " bk-t-mine" : "") + '">' +
            '<div class="bk-t-head"><div><div class="bk-t-name">' + esc(x.name) + "</div>" + (place ? '<div class="bk-t-place">' + esc(place) + "</div>" : "") + "</div>" +
              '<span class="bk-badge ' + k[0] + '">● ' + k[1] + "</span></div>" +
            '<div class="bk-t-img">' + (img ? '<img src="' + img + '" alt="">' : "") + "</div>" +
            '<div class="bk-t-info">' + (x.s.k === "booked" ? x.s.info : esc(x.s.info)) + "</div>" + action +
            (x.r.db ? '<a class="bk-t-link" href="view.php?d=' + x.r.db + '">All bookings for this station →</a>' : "") +
          "</article>";
        }).join("") + "</div>" + (shown.length ? "" : '<p class="bk-empty">' + (checking ? "Loading your stations…" : accErr ? "Couldn't load the station access list – please reload the page." : ONLY_MY_STATIONS && !all.length && !st.q && !st.loc ? "You don't have access to any station yet – ask your station supervisor." : "No station matches these filters.") + "</p>") + bookingsHtml(loading);

      var set = function () {
        st.date = document.getElementById("ovDate").value || st.date;
        st.from = +document.getElementById("ovFrom").value; st.to = +document.getElementById("ovTo").value;
        if (st.to <= st.from) { st.to = Math.min(st.from + 1, CLOSE); }
        st.loc = document.getElementById("ovLoc").value; draw();
      };
      ["ovDate", "ovFrom", "ovTo", "ovLoc"].forEach(function (id) { document.getElementById(id).onchange = set; });
      var qi = document.getElementById("ovQ");
      qi.oninput = function () { st.q = qi.value; var p = qi.selectionStart; draw(); var x = document.getElementById("ovQ"); x.focus(); x.setSelectionRange(p, p); };
      Array.prototype.forEach.call(root.querySelectorAll(".bk-chip"), function (b) { b.onclick = function () { st.filter = b.getAttribute("data-f"); draw(); }; });
      Array.prototype.forEach.call(root.querySelectorAll("[data-t]"), function (b) { b.onclick = function () { bk.tab = b.getAttribute("data-t"); draw(); }; });
      Array.prototype.forEach.call(root.querySelectorAll("[data-w]"), function (b) { b.onclick = function () { bk.who = b.getAttribute("data-w"); draw(); }; });
      var bq = document.getElementById("bkQ");
      bq.oninput = function () { bk.q = bq.value; var p = bq.selectionStart; draw(); var x = document.getElementById("bkQ"); x.focus(); x.setSelectionRange(p, p); };
    }

    draw();
    var realMe = null;
    function applyAccess() {
      if (!ACCESS_DB || (!acc && !accErr) || !realMe) { return; }
      me = viewAs(acc, realMe);        // "View as" preview for Leaders
      names.forEach(function (n) { data[n].access = !accErr && acc.may(me, n); if (data[n].own) { merge(n); } });
      draw();
    }
    if (ACCESS_DB) {
      whoAmIFull().then(function (u) { realMe = u; me = u; applyAccess(); draw(); });
      loadAccess(ACCESS_DB).then(function (a) { acc = a; applyAccess(); }).catch(function () { accErr = true; applyAccess(); });
    } else {
      whoAmI().then(function (u) { me = u; draw(); });
    }
    names.forEach(function (n) {
      var db = STATIONS[n].db; if (!db) { return; }
      get("view.php?d=" + db + "&perpage=1000").then(function (doc) { data[n].own = readAll(doc); merge(n); draw(); })
        .catch(function () { data[n].error = true; data[n].bookings = []; draw(); });
      if (ACCESS_DB) { return; }     // with the access list, it decides who may book (see applyAccess)
      // You may book a station if Moodle shows you its booking form.
      get("edit.php?d=" + db).then(function (doc) { data[n].access = !!doc.querySelector(".bk-sform"); draw(); })
        .catch(function () { data[n].access = false; draw(); });
    });
    if (AVAIL_DB) { get("view.php?d=" + AVAIL_DB + "&perpage=1000").then(function (doc) { board = readBoard(doc); draw(); }).catch(function () {}); }
    if (ROBOT_DB) {
      get("view.php?d=" + ROBOT_DB + "&perpage=1000").then(function (doc) {
        robotList = readAll(doc).map(function (b) { b.ext = true; return b; });
        names.forEach(function (n) { if (data[n].own) { merge(n); } }); draw();
      }).catch(function () {});
    }
  }

  // ---- Embedded mode: when this page is shown inside an iframe on the course page,
  // hide everything Moodle draws around the dashboard and open links in the full window.
  // ---- Normal page for students: hide the database controls (List view / Actions bar,
  // Entries per page, Search, Sort, Advanced search, Save settings, paging) so only the
  // dashboard is left under Moodle's normal header. Editors (who see Fields/Templates)
  // keep everything; add &tidy=1 to the address to preview the student look.
  function tidy(root) {
    var editor = document.querySelector("a[href*='/mod/data/templates.php'], a[href*='/mod/data/field.php'], a[href*='/mod/data/preset.php']");
    if (editor && !/[?&]tidy=1/.test(location.search)) { return; }
    var stop = document.getElementById("region-main") || document.querySelector("[role='main']");
    if (!stop) { return; }
    var n = root, head = document.querySelector(".bk-top");
    if (head) { while (n.parentElement && !n.contains(head)) { n = n.parentElement; } }
    if (!stop.contains(n)) { return; }
    n.classList.add("st-keep2");
    for (var a = n.parentElement; a && a !== stop.parentElement; a = a.parentElement) { a.classList.add("st-p2"); }
    document.documentElement.classList.add("st-tidy");
    var css = document.createElement("style");
    css.textContent =
      "html.st-tidy .st-p2>:not(.st-p2):not(.st-keep2):not(script):not(style){display:none!important}" +
      "html.st-tidy .tertiary-navigation{display:none!important}";
    document.head.appendChild(css);
  }

  function embedded(root) {
    var framed = false;
    try { framed = window.self !== window.top; } catch (e) { framed = true; }
    if (!framed && !/[?&]embed=1/.test(location.search)) { tidy(root); return; }
    document.documentElement.classList.add("st-embed");
    var base = document.createElement("base"); base.target = "_top"; document.head.appendChild(base);
    var css = document.createElement("style");
    css.textContent =
      "html.st-embed nav.navbar,html.st-embed #page-header,html.st-embed .secondary-navigation," +
      "html.st-embed .tertiary-navigation,html.st-embed #page-footer,html.st-embed .drawer," +
      "html.st-embed .drawer-toggles,html.st-embed .activity-header,html.st-embed .activity-information," +
      "html.st-embed #course-index,html.st-embed .btn-footer-popover,html.st-embed footer," +
      "html.st-embed .breadcrumb,html.st-embed #user-notifications{display:none!important}" +
      "html.st-embed body{padding-top:0!important;background:transparent!important}" +
      "html.st-embed #page,html.st-embed #page-wrapper,html.st-embed #topofscroll," +
      "html.st-embed #region-main,html.st-embed #region-main-box,html.st-embed .main-inner{" +
      "margin:0!important;padding:0!important;max-width:none!important;border:0!important;box-shadow:none!important;" +
      "position:static!important;overflow:visible!important}";
    document.head.appendChild(css);
    // Keep only the dashboard: mark it and every element above it, hide everything else
    // (works whatever the theme calls its header, menus, drawers or footer – also for
    // elements Moodle adds later).
    var n = root, head = document.querySelector(".bk-top");
    if (head) { while (n.parentElement && !n.contains(head)) { n = n.parentElement; } }
    n.classList.add("st-keep");
    for (var a = n.parentElement; a; a = a.parentElement) { a.classList.add("st-path"); }
    css.textContent +=
      "html.st-embed .st-path>:not(.st-path):not(.st-keep):not(script):not(style){display:none!important}" +
      "html.st-embed .st-path{margin:0!important;padding:0!important;max-width:none!important;width:auto!important;" +
      "border:0!important;box-shadow:none!important;transform:none!important;position:static!important;" +
      "overflow:visible!important;min-height:0!important;background:transparent!important}" +
      "html.st-embed .st-keep{margin:0!important;padding:12px!important;max-width:none!important}" +
      "html.st-embed body{margin:0!important;padding:0!important}";
  }

  function run() { var root = document.getElementById("st-overview"); if (root) { embedded(root); overview(root); } }
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", run); } else { run(); }
})();

  } else if (page === "station") {
/* Digital Factory Lab – booking database for ONE station (Moodle Database JavaScript template).
   List page: station header, "Book this station", bookings grouped by day, conflict flags.
   Add/Edit page: checks the time against the other bookings of this station before saving.
   Who may book is decided by Moodle permissions (role "Station booker"), not by this script. */
(function () {
  /* ======== settings ======== */
  var STATION = "";          // name shown on this page (also used by the overview)
  var LOCATION = "", ROOM = "";
  var OVERVIEW_DB = 0;             // "Station overview": the number after d= on its Templates or Presets page; 0 = no back link
  var ACCESS_DB = 0;               // "Station access" list: its d= number; 0 = use Moodle permissions (groups) instead
  var AVAIL_DB = 0;                // "Robot availability": the number after d= on its Templates or Presets page; 0 = don't check it
  var OPEN = 8, CLOSE = 18, MAX_HOURS = 4;
  var DAYS = [1, 2, 3, 4, 5];      // bookable weekdays, 1 = Monday
  var ROBOT_DB = 0;                // "Robot Bookings" database (all robots in one list): its d= number; 0 = not linked
  var ROBOT_NAME = "";       // this station's name in the Robot Bookings list (bookings of that robot block this station too)
  var IMG = "";               // picture of the station: image address or data: image ("" = none)
  /* ========================== */

  var T = window.TDF || {};
  if (T.STATION !== undefined) { STATION = T.STATION; }
  if (T.LOCATION !== undefined) { LOCATION = T.LOCATION; }
  if (T.ROOM !== undefined) { ROOM = T.ROOM; }
  if (T.OVERVIEW_DB !== undefined) { OVERVIEW_DB = T.OVERVIEW_DB; }
  if (T.ACCESS_DB !== undefined) { ACCESS_DB = T.ACCESS_DB; }
  if (T.AVAIL_DB !== undefined) { AVAIL_DB = T.AVAIL_DB; }
  if (T.OPEN !== undefined) { OPEN = T.OPEN; }
  if (T.CLOSE !== undefined) { CLOSE = T.CLOSE; }
  if (T.MAX_HOURS !== undefined) { MAX_HOURS = T.MAX_HOURS; }
  if (T.DAYS !== undefined) { DAYS = T.DAYS; }
  if (T.ROBOT_DB !== undefined) { ROBOT_DB = T.ROBOT_DB; }
  ROBOT_NAME = T.ROBOT_NAME !== undefined ? T.ROBOT_NAME : STATION;
  IMG = T.IMG !== undefined ? T.IMG : (IMGS[T.art] || "");

  var MONTHS = { january: 1, jan: 1, januar: 1, "jänner": 1, february: 2, feb: 2, februar: 2, "feber": 2, march: 3, mar: 3, "märz": 3, "mär": 3,
    april: 4, apr: 4, may: 5, mai: 5, june: 6, jun: 6, juni: 6, july: 7, jul: 7, juli: 7, august: 8, aug: 8, september: 9, sep: 9, sept: 9,
    october: 10, oct: 10, oktober: 10, okt: 10, november: 11, nov: 11, december: 12, dec: 12, dezember: 12, dez: 12 };
  var WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  function txt(el) { return el ? el.textContent.replace(/\s+/g, " ").trim() : ""; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function iso(y, m, d) { return y + "-" + pad(m) + "-" + pad(d); }
  function today() { var d = new Date(); return iso(d.getFullYear(), d.getMonth() + 1, d.getDate()); }
  function dow(s) { var p = s.split("-"); return (new Date(+p[0], +p[1] - 1, +p[2]).getDay() + 6) % 7 + 1; }
  function nice(s) { var p = s.split("-"); return WD[dow(s) - 1] + ", " + p[2] + "." + p[1] + "." + p[0]; }
  function hh(h) { return pad(h) + ":00"; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function parseShown(s) {   /* "18 November 2026" (English) or "18. November 2026" (German) */
    var m = s.toLowerCase().match(/(\d{1,2})\.?\s*([a-zäö]+)\.?,?\s*(\d{4})/);
    if (m && MONTHS[m[2]]) { return iso(+m[3], MONTHS[m[2]], +m[1]); }
    m = s.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/); if (m) { return iso(+m[3], +m[2], +m[1]); }
    m = s.match(/(\d{4})-(\d{2})-(\d{2})/); return m ? m[0] : "";
  }
  function hour(s) { var m = String(s).match(/(\d{1,2})/); return m ? +m[1] : NaN; }
  function param(n) { var m = location.search.match(new RegExp("[?&]" + n + "=([^&]*)")); return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : ""; }
  function selfQuery() { return param("d") ? "d=" + param("d") : "id=" + param("id"); }
  function overlaps(a, b) { return a.date === b.date && a.from < b.to && b.from < a.to; }

  function readBookings(root) {
    return Array.prototype.map.call(root.querySelectorAll(".bk-e"), function (e) {
      return { el: e, id: +e.getAttribute("data-id") || 0, date: parseShown(txt(e.querySelector(".bk-date"))),
        from: hour(txt(e.querySelector(".bk-from"))), to: hour(txt(e.querySelector(".bk-to"))),
        user: txt(e.querySelector(".bk-user")), note: txt(e.querySelector(".bk-note")),
        uid: (function (a) { var m = a ? (a.getAttribute("href") || "").match(/[?&]id=(\d+)/) : null; return m ? +m[1] : 0; })(e.querySelector(".bk-user a")) };
    });
  }
  /* ---------- Station access list (who may book which station) ----------
     Rules: the Leader (Moodle user ids in data-leaders on the "Station access" list header)
     adds Supervisors; a Supervisor adds Students for HIS stations only. Entries added by
     anyone else are ignored. Moodle saves who wrote each entry, so this can't be faked. */
  function acNorm(s) { return String(s || "").toLowerCase().replace(/\s+/g, " ").trim(); }
  /* "Simon Huber (id 123)" -> {name: "Simon Huber", id: 123}; a name without id still works */
  function acPerson(s) { var m = String(s || "").match(/^(.*?)\s*\(id\s*(\d+)\)\s*$/i); return m ? { name: m[1].trim(), id: +m[2] } : { name: String(s || "").trim(), id: 0 }; }
  function acGet(url) {
    return fetch(url, { credentials: "same-origin" })
      .then(function (r) { if (!r.ok) { throw new Error(r.status); } return r.text(); })
      .then(function (h) { return new DOMParser().parseFromString(h, "text/html"); });
  }
  function readAccess(doc) {
    var cfg = doc.querySelector(".ac-config");
    var leaders = cfg ? (cfg.getAttribute("data-leaders") || "").split(/[^0-9]+/).filter(Boolean).map(Number) : [];
    var rows = Array.prototype.map.call(doc.querySelectorAll(".ac-e"), function (e) {
      var ua = e.querySelector(".ac-by a"), m = ua ? (ua.getAttribute("href") || "").match(/[?&]id=(\d+)/) : null;
      var ed = e.querySelector('.ac-actions a[href*="edit.php"]'), de = e.querySelector('.ac-actions a[href*="delete="]');
      var pp = acPerson(txt(e.querySelector(".ac-person")));
      return { id: +e.getAttribute("data-id") || 0, station: txt(e.querySelector(".ac-station")), person: pp.name, pid: pp.id,
        role: /super/i.test(txt(e.querySelector(".ac-role"))) ? "Supervisor" : "Student", note: txt(e.querySelector(".ac-note")),
        by: txt(e.querySelector(".ac-by")), byId: m ? +m[1] : 0, edit: ed ? ed.getAttribute("href") : "", del: de ? de.getAttribute("href") : "" };
    });
    var sup = {}, stu = {};
    // a person is matched by Moodle id when the entry has one, otherwise by name
    function put(map, st, r) { (map[st] = map[st] || {})[r.pid ? "#" + r.pid : acNorm(r.person)] = true; }
    function has(map, st, u) { var m = map[st]; return !!(m && u && ((u.id && m["#" + u.id]) || (u.name && m[acNorm(u.name)]))); }
    rows.forEach(function (r) {
      if (r.role !== "Supervisor") { return; }
      r.ok = leaders.indexOf(r.byId) >= 0;
      if (r.ok) { put(sup, r.station, r); } else { r.why = "only the Leader can add supervisors"; }
    });
    rows.forEach(function (r) {
      if (r.role !== "Student") { return; }
      r.ok = leaders.indexOf(r.byId) >= 0 || has(sup, r.station, { id: r.byId, name: r.by });
      if (r.ok) { put(stu, r.station, r); } else { r.why = r.by + " is not a supervisor of " + r.station; }
    });
    return {
      leaders: leaders, rows: rows,
      viewAsOff: !!cfg && /^(off|no|false|0)$/i.test(cfg.getAttribute("data-viewas") || ""),   // data-viewas="off" switches the preview off
      isLeader: function (u) { return !!u && !!u.id && leaders.indexOf(u.id) >= 0; },
      isSupervisor: function (u, st) { return has(sup, st, u); },
      supervisors: function (st) { return rows.filter(function (r) { return r.ok && r.role === "Supervisor" && r.station === st; }).map(function (r) { return r.person; }); },
      may: function (u, st) { return !!u && ((!!u.id && leaders.indexOf(u.id) >= 0) || has(sup, st, u) || has(stu, st, u)); }
    };
  }
  /* the logged-in user: id from the page header, full name from your own profile page */
  function whoAmIFull() {
    var el = document.querySelector("#nav-notification-popover-container[data-userid], #nav-message-popover-container[data-userid], [data-region='popover-region-notifications'][data-userid], .popover-region[data-userid]");
    var id = el ? +el.getAttribute("data-userid") || 0 : 0, root = (window.M && M.cfg && M.cfg.wwwroot) || "";
    return acGet(root + "/user/profile.php" + (id ? "?id=" + id : "")).then(function (doc) {
      var h = doc.querySelector(".page-header-headings h1, .page-context-header h1, .page-header-headings h2, #page-header h1, h1");
      return { id: id, name: txt(h) };
    }).catch(function () { return { id: id, name: "" }; });
  }
  /* course participants (name + Moodle id) from the Participants page – for picking people in the form */
  function loadParticipants() {
    var cm = (document.body.className.match(/\bcourse-(\d+)\b/) || [])[1] || (window.M && M.cfg && M.cfg.courseId), root = (window.M && M.cfg && M.cfg.wwwroot) || "";
    if (!cm) { return Promise.reject(new Error("no course id")); }
    return acGet(root + "/user/index.php?id=" + cm + "&perpage=5000").then(function (doc) {
      var seen = {}, out = [];
      Array.prototype.forEach.call(doc.querySelectorAll('#participants a[href*="/user/view.php"], table.generaltable a[href*="/user/view.php"]'), function (a) {
        var m = (a.getAttribute("href") || "").match(/[?&]id=(\d+)/); if (!m || seen[m[1]]) { return; }
        var c = a.cloneNode(true); Array.prototype.forEach.call(c.querySelectorAll(".userinitials, img, .sr-only, .visually-hidden"), function (x) { x.remove(); });
        var name = txt(c); if (!name) { return; }
        seen[m[1]] = 1; out.push({ id: +m[1], name: name });
      });
      if (!out.length) { throw new Error("no participants visible"); }
      return out.sort(function (a, b) { return a.name.localeCompare(b.name); });
    });
  }
  function loadAccess(db) {
    return acGet("view.php?d=" + db + "&perpage=1000").then(function (doc) {
      if (!doc.querySelector(".ac-config")) { throw new Error("not the access list"); }
      return readAccess(doc);
    });
  }
  /* ---------- "View as" preview (Leaders only) ----------
     The Leader picks a person on the Station access page; every booking page then behaves as for
     that person. Only for looking: anything saved is still saved under the Leader's own name. */
  /* open the current page again as a normal visit (a reload would make Firefox ask to resend a form) */
  function acReopen() {
    var m = location.search.match(/[?&](d|id)=(\d+)/), hid = document.querySelector('form input[name="d"]');
    if (m) { location.href = location.pathname + location.search; }
    else if (hid && hid.value) { location.href = "view.php?d=" + hid.value; }      // page reached by saving a form: no d= in the address
    else { location.href = location.pathname; }
  }
  function getViewAs() { try { return JSON.parse(sessionStorage.getItem("st-viewas") || "null"); } catch (e) { return null; } }
  function setViewAs(u) { try { if (u) { sessionStorage.setItem("st-viewas", JSON.stringify(u)); } else { sessionStorage.removeItem("st-viewas"); } } catch (e) {} }
  function viewAs(acc, me) {
    var v = getViewAs();
    if (!v || !acc || !me || !acc.isLeader(me) || acc.viewAsOff) { return me; }       // only a real Leader can preview (unless switched off)
    var u = { id: v.id || 0, name: v.name || "", real: me, preview: true };
    previewBanner(u, acc);
    return u;
  }
  function previewBanner(u, acc) {
    if (document.getElementById("st-preview")) { return; }
    var what = acc && acc.isLeader(u) ? "Leader" : acc && acc.rows.some(function (r) { return r.ok && r.role === "Supervisor" && acc.isSupervisor(u, r.station); }) ? "supervisor" : "student";
    var d = document.createElement("div"); d.id = "st-preview"; d.className = "st-preview";
    d.innerHTML = "👁 <b>Preview</b> – you see this page as <b>" + String(u.name).replace(/[&<>"]/g, "") + "</b> (" + what + "). Anything you save is still saved as you. " +
      '<button type="button" class="btn btn-sm btn-secondary">Stop preview</button>';
    d.querySelector("button").onclick = function () { setViewAs(null); acReopen(); };
    var root = document.querySelector(".bk") || document.body.firstElementChild;
    if (root && root.parentNode) { root.parentNode.insertBefore(d, root); } else { document.body.insertBefore(d, document.body.firstChild); }
  }
  /* styles for the preview banner and the name pickers (added from here, so the CSS template needn't change) */
  (function () {
    if (document.getElementById("ac-style")) { return; }
    var st = document.createElement("style"); st.id = "ac-style";
    st.textContent = ".st-preview{background:#fff4d6;border:1px solid #b7860b;border-radius:8px;padding:8px 14px;margin:0 0 12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}" +
      ".ac-pick{position:absolute;z-index:50;left:0;right:0;top:100%;background:#fff;border:1px solid #d9dee5;border-radius:6px;box-shadow:0 6px 18px rgba(0,0,0,.12);max-height:320px;overflow:auto}" +
      ".ac-pick[hidden]{display:none}.ac-pick button{display:block;width:100%;text-align:left;border:0;background:#fff;padding:7px 12px}" +
      ".ac-pick button:hover,.ac-pick button:first-child{background:#eef3fb}.ac-id{color:#5b6472}" +
      ".ac-viewas{border:1px dashed #b7860b;background:#fffaf0;border-radius:8px;padding:10px 14px;margin:-4px 0 12px}.ac-hint{color:#5b6472;font-size:.85rem}" +
      ".ac-vrow{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px}.ac-vwrap{position:relative;display:inline-block;width:300px;max-width:100%}.ac-vwrap input{width:100%}" +
      ".ac-vq-btn{border:1px solid #d9dee5;background:#fff;border-radius:999px;padding:2px 10px;font-size:.85rem}.ac-vq-btn:hover{background:#eef3fb}" +
      ".bk-manage{display:flex;justify-content:flex-end;margin:0 0 10px}.ac-group{margin:16px 0 0;font-size:1.05rem;color:#5b6472}";
    (document.head || document.documentElement).appendChild(st);
  })();

  /* access list + who I am (only when ACCESS_DB is set) */
  var ACC = { acc: null, me: null, err: false, ready: !ACCESS_DB };
  var accessJob = null;      // started in run(), once the page header (with your user id) exists
  function startAccess() {
    accessJob = !ACCESS_DB ? Promise.resolve() : Promise.all([loadAccess(ACCESS_DB), whoAmIFull()])
      .then(function (r) { ACC.acc = r[0]; ACC.me = viewAs(r[0], r[1]); }).catch(function () { ACC.err = true; })
      .then(function () { ACC.ready = true; });
  }
  function notAllowed(b) { return !!(ACCESS_DB && ACC.acc && !ACC.acc.may({ id: b.uid, name: b.user }, STATION)); }
  function iMayBook() { return !ACCESS_DB || (!ACC.err && !!ACC.acc && ACC.acc.may(ACC.me, STATION)); }
  function askWhom() { var s = ACC.acc ? ACC.acc.supervisors(STATION) : []; return s.length ? s.join(" or ") : "the station supervisor"; }
  function readBoard(root) {
    var out = null;
    Array.prototype.forEach.call(root.querySelectorAll(".tdf-card"), function (c) {
      if (txt(c.querySelector(".tdf-name")) !== STATION) { return; }
      var u = txt(c.querySelector(".tdf-until")).match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
      out = { status: txt(c.querySelector(".tdf-status")), person: txt(c.querySelector(".tdf-person")).replace(/^@\s*/, ""), until: u ? iso(+u[3], +u[2], +u[1]) : "" };
    });
    return out;
  }
  function fetchPage(query) {
    return fetch("view.php?" + query + "&perpage=1000", { credentials: "same-origin" })
      .then(function (r) { if (!r.ok) { throw new Error(r.status); } return r.text(); })
      .then(function (h) { return new DOMParser().parseFromString(h, "text/html"); });
  }
  /* bookings of the same robot made in the "Robot Bookings" database */
  function fetchRobot() {
    if (!ROBOT_DB) { return Promise.resolve([]); }
    return fetchPage("d=" + ROBOT_DB).then(function (doc) {
      return Array.prototype.filter.call(doc.querySelectorAll(".bk-e"), function (e) { return txt(e.querySelector(".bk-robot")) === ROBOT_NAME; })
        .map(function (e) { var b = readBookings({ querySelectorAll: function () { return [e]; } })[0]; b.el = null; b.robot = true; return b; })
        .filter(function (b) { return b.date && b.to > b.from; });
    }).catch(function () { return []; });
  }
  function winners(list) { return list.filter(function (o) { return !list.some(function (e) { return e.id < o.id && overlaps(e, o); }); }); }
  function problems(b, others, board) {
    var p = [];
    if (!b.date) { p.push("Choose a date."); return p; }
    if (isNaN(b.from) || isNaN(b.to)) { p.push("Choose a start and end time."); return p; }
    if (b.to <= b.from) { p.push("The end time must be after the start time."); }
    else if (b.to - b.from > MAX_HOURS) { p.push("A booking can be at most " + MAX_HOURS + " hours."); }
    if (b.from < OPEN || b.to > CLOSE) { p.push("Bookings are possible between " + hh(OPEN) + " and " + hh(CLOSE) + "."); }
    if (DAYS.indexOf(dow(b.date)) < 0) { p.push("The lab is closed on " + nice(b.date) + "."); }
    if (board && (board.status === "Busy" || board.status === "Occupied") && !(board.until && b.date > board.until)) {
      p.push(STATION + " is " + (board.status === "Occupied" ? "out of service" : "assigned to " + (board.person || "someone")) + (board.until ? " until " + nice(board.until) : "") + " (availability board).");
    }
    others.forEach(function (o) { if (overlaps(b, o)) { p.push("Already booked " + hh(o.from) + "–" + hh(o.to) + " by " + (o.user || "someone") + (o.robot ? " (Robot Bookings)" : "") + "."); } });
    return p;
  }
  function header() {
    var el = document.getElementById("st-head"); if (!el) { return; }
    var place = [LOCATION, ROOM].filter(function (v) { return v; }).join(" · ");
    el.innerHTML = (IMG ? '<div class="st-img"><img src="' + IMG + '" alt=""></div>' : "") +
      '<div class="st-headtxt"><h3 class="bk-h">' + esc(STATION) + "</h3>" + (place ? '<p class="bk-sub">' + esc(place) + "</p>" : "") +
      '<p class="bk-sub">Bookable ' + WD[DAYS[0] - 1] + "–" + WD[DAYS[DAYS.length - 1] - 1] + ", " + hh(OPEN) + "–" + hh(CLOSE) + ", max. " + MAX_HOURS + " h per booking.</p></div>";
    var back = document.getElementById("st-back");
    if (back) { if (OVERVIEW_DB) { back.href = "view.php?d=" + OVERVIEW_DB; } else { back.style.display = "none"; } }
  }

  /* ---------------- list page ---------------- */
  function listPage(list) {
    header();
    var all = readBookings(document), t = today(), h = new Date().getHours(), board = null, linked = [];
    var state = { tab: "upcoming", q: "" };
    var phase = function (b) { return !b.date ? "upcoming" : b.date < t || (b.date === t && b.to <= h) ? "past" : b.date === t && b.from <= h ? "now" : "upcoming"; };
    function draw() {
      Array.prototype.forEach.call(list.querySelectorAll(".bk-js"), function (x) { x.remove(); });
      all.forEach(function (b) {
        b.phase = phase(b);
        b.na = notAllowed(b);
        var pr = b.na ? [(b.user || "This person") + " is not on the access list for this station – this booking doesn't count."]
          : problems(b, all.concat(linked).filter(function (o) { return o !== b && o.id < b.id && !notAllowed(o); }), board);
        b.el.className = "bk-e bk-" + b.phase + (pr.length ? " bk-bad" : "");
        b.el.querySelector(".bk-flag").innerHTML = b.na ? '<span class="bk-badge bad">Not allowed</span>' : pr.length ? '<span class="bk-badge bad">Problem</span>' : b.phase === "now" ? '<span class="bk-badge now">Now</span>' : b.phase === "past" ? '<span class="bk-badge">Past</span>' : '<span class="bk-badge ok">Confirmed</span>';
        var pe = b.el.querySelector(".bk-problems");
        if (!pe) { pe = document.createElement("div"); pe.className = "bk-problems"; b.el.insertBefore(pe, b.el.querySelector(".bk-actions")); }
        pe.innerHTML = pr.map(function (x) { return "<div>" + esc(x) + "</div>"; }).join("") + (pr.length ? "<div><b>Please change or delete this booking.</b></div>" : "");
      });
      var show = all.filter(function (b) {
        var okTab = state.tab === "all" || (state.tab === "past" ? b.phase === "past" : state.tab === "today" ? b.date === t : b.phase !== "past");
        return okTab && (!state.q || (b.user + " " + b.note).toLowerCase().indexOf(state.q) >= 0);
      });
      var asc = state.tab !== "past";
      show.sort(function (a, b) { var k = (a.date + pad(a.from)).localeCompare(b.date + pad(b.from)); return asc ? k : -k; });
      all.forEach(function (b) { b.el.style.display = "none"; });
      var last = "";
      show.forEach(function (b) {
        if (b.date !== last) { var hd = document.createElement("h4"); hd.className = "bk-dayhead bk-js"; hd.textContent = (b.date === t ? "Today · " : "") + (b.date ? nice(b.date) : "No date"); list.appendChild(hd); last = b.date; }
        b.el.style.display = ""; list.appendChild(b.el);
      });
      if (!show.length) { var e = document.createElement("p"); e.className = "bk-empty bk-js"; e.textContent = state.tab === "upcoming" ? "No upcoming bookings for this station." : "No bookings match these filters."; list.appendChild(e); }
      var up = all.filter(function (b) { return b.phase !== "past"; }).length, now = all.filter(function (b) { return b.phase === "now"; }).length;
      var bad = all.filter(function (b) { return /bk-bad/.test(b.el.className) && b.phase !== "past"; }).length;
      document.getElementById("bk-summary").innerHTML = "<b>" + up + "</b> upcoming · <b>" + now + "</b> running now" + (bad ? ' · <span class="bad">' + bad + " with a problem</span>" : "");
      Array.prototype.forEach.call(document.querySelectorAll(".bk-tabs button"), function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-t") === state.tab); });
    }
    var qi = document.getElementById("bk-q"); if (qi) { qi.oninput = function () { state.q = qi.value.toLowerCase().trim(); draw(); }; }
    Array.prototype.forEach.call(document.querySelectorAll(".bk-tabs button"), function (b) { b.onclick = function () { state.tab = b.getAttribute("data-t"); draw(); }; });
    var add = document.getElementById("bk-add"); if (add) { add.href = "edit.php?" + selfQuery(); }
    if (document.querySelector(".pagination, .paging")) {
      var hint = document.getElementById("bk-pagehint");
      hint.innerHTML = 'Some bookings are on other pages. <a href="view.php?' + selfQuery() + '&perpage=1000">Show all bookings on one page</a>.'; hint.hidden = false;
    }
    draw();
    if (AVAIL_DB) { fetchPage("d=" + AVAIL_DB).then(function (doc) { board = readBoard(doc); draw(); }).catch(function () {}); }
    fetchRobot().then(function (l) { linked = l; if (l.length) { draw(); } });
    if (ACCESS_DB) {
      if (add) { add.style.visibility = "hidden"; }
      accessJob.then(function () {
        var head = document.querySelector(".st-headtxt");
        if (head && ACC.acc) { head.insertAdjacentHTML("beforeend", '<p class="bk-sub">Supervisor: ' + esc(ACC.acc.supervisors(STATION).join(", ") || "not set yet") + "</p>"); }
        if (add) {
          if (iMayBook()) { add.style.visibility = ""; }
          else { add.insertAdjacentHTML("afterend", '<span class="bk-t-noaccess">' + (ACC.err ? "Couldn't load the access list" : "You can't book this station – ask " + esc(askWhom())) + "</span>"); add.remove(); }
        }
        draw();
      });
    }
  }

  /* ---------------- add / edit page ---------------- */
  function formPage(form) {
    var t = document.getElementById("st-formtitle"); if (t) { t.textContent = "Book: " + STATION; }
    var fromSel = form.querySelector(".bkf-from select"), toSel = form.querySelector(".bkf-to select");
    var dsel = function (part) { return form.querySelector('.bkf-date select[name$="_' + part + '"]'); };
    var box = document.getElementById("bk-check"), others = null, board = null, linked = [], rid = +param("rid") || 0;
    var pd = param("date").match(/^(\d{4})-(\d{2})-(\d{2})$/), pf = +param("from"), pt = +param("to");
    var setSel = function (sel, fn) { if (sel) { Array.prototype.forEach.call(sel.options, function (o) { if (fn(o)) { sel.value = o.value; } }); } };
    if (pd && !rid) { setSel(dsel("year"), function (o) { return +o.value === +pd[1]; }); setSel(dsel("month"), function (o) { return +o.value === +pd[2]; }); setSel(dsel("day"), function (o) { return +o.value === +pd[3]; }); }
    if (pf && !rid) { setSel(fromSel, function (o) { return hour(o.text) === pf; }); }
    if (pt && !rid) { setSel(toSel, function (o) { return hour(o.text) === pt; }); }
    function current() {
      var y = dsel("year"), m = dsel("month"), d = dsel("day");
      return { date: y && m && d ? iso(+y.value, +m.value, +d.value) : "",
        from: hour(fromSel ? fromSel.options[fromSel.selectedIndex].text : ""), to: hour(toSel ? toSel.options[toSel.selectedIndex].text : "") };
    }
    function check(final) {
      var b = current(), p = problems(b, others || [], board);
      if (ACCESS_DB && ACC.ready && !iMayBook()) { p.unshift(ACC.err ? "Couldn't load the station access list – please reload the page." : "You are not on the access list for " + STATION + ". Ask " + askWhom() + " to add you."); }
      if (b.date && (b.date < today() || (b.date === today() && b.from < new Date().getHours()))) { p.unshift("That time has already passed."); }
      var day = others && b.date ? others.filter(function (o) { return o.date === b.date; }).sort(function (a, c) { return a.from - c.from; }) : [];
      var dayTxt = day.length ? "<div class='bk-dayline'>Other bookings on " + nice(b.date) + ": " + day.map(function (o) { return hh(o.from) + "–" + hh(o.to) + " (" + esc(o.user) + ")"; }).join(", ") + "</div>" : "";
      if (others === null || !ACC.ready) { box.className = "bk-checkbox wait"; box.innerHTML = "Checking existing bookings…"; return p; }
      if (p.length) { box.className = "bk-checkbox bad"; box.innerHTML = "<b>" + (final ? "Not saved: " : "") + "please fix this first</b>" + p.map(function (x) { return "<div>" + esc(x) + "</div>"; }).join("") + dayTxt; }
      else if (b.date && !isNaN(b.from)) { box.className = "bk-checkbox ok"; box.innerHTML = "<b>✓ " + esc(STATION) + " is free on " + nice(b.date) + ", " + hh(b.from) + "–" + hh(b.to) + ".</b>" + dayTxt; }
      else { box.className = "bk-checkbox"; box.innerHTML = "Choose a date and time."; }
      return p;
    }
    [fromSel, toSel, dsel("day"), dsel("month"), dsel("year")].forEach(function (s) {
      if (s) { s.addEventListener("change", function () {
        var toH = toSel ? hour(toSel.options[toSel.selectedIndex].text) : NaN, frH = hour(fromSel.options[fromSel.selectedIndex].text);
        if (s === fromSel && toSel && (isNaN(toH) || toH <= frH)) { setSel(toSel, function (o) { return hour(o.text) === frH + 1; }); }
        check(false);
      }); }
    });
    var f = form.closest("form");
    if (f) { f.addEventListener("submit", function (ev) {
      if (ev.submitter && /cancel/i.test(ev.submitter.name || "")) { return; }
      if (ACCESS_DB && !ACC.ready) { ev.preventDefault(); return; }      // wait until the access list is checked
      if (others === null) { return; }
      if (check(true).length) { ev.preventDefault(); box.scrollIntoView({ behavior: "smooth", block: "center" }); }
    }); }
    check(false);
    var jobs = [fetchPage(selfQuery()).then(function (doc) {
      var all = readBookings(doc);   // a booking that clashes with an earlier one is marked "Problem" – it doesn't block others
      others = all.filter(function (o) { return o.id !== rid; });
    }), fetchRobot().then(function (l) { linked = l; })];
    if (AVAIL_DB) { jobs.push(fetchPage("d=" + AVAIL_DB).then(function (doc) { board = readBoard(doc); }).catch(function () {})); }
    jobs.push(accessJob);
    Promise.all(jobs).then(function () { others = winners(others.concat(linked.filter(function (o) { return o.id !== rid; })).filter(function (o) { return !notAllowed(o); })); check(false); }).catch(function () {
      others = []; check(false);
      box.insertAdjacentHTML("beforeend", "<div class='bk-dayline'>Couldn't load the other bookings – conflicts will be flagged on the list page.</div>");
    });
  }

  function run() {
    startAccess();
    var list = document.querySelector(".bk-list"); if (list) { listPage(list); }
    var form = document.querySelector(".bk-sform"); if (form) { formPage(form); }
    if (!list && !form && document.getElementById("st-head")) { header(); }
  }
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", run); } else { run(); }
})();

  } else {
/* Digital Factory Lab – Station access (Moodle Database JavaScript template).
   Who may book which station: the Leader adds Supervisors, a Supervisor adds Students to HIS stations.
   The Leader's Moodle user id goes into the List template header: data-leaders="…" (comma-separated). */
(function () {
  /* ======== settings ======== */
  var STATIONS = ["Taurob - Sieglinde", "MiR with UR5", "3D Measuring Machine", "ABB CRB 15000-5/0.95 (GoFa)", "High-rack Warehouse", "3D Printing Farm", "Bin Picking Station"];   // must be written exactly like the station names on the overview
  /* ========================== */

  function txt(el) { return el ? el.textContent.replace(/\s+/g, " ").trim() : ""; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function param(n) { var m = location.search.match(new RegExp("[?&]" + n + "=([^&]*)")); return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : ""; }
  function selfQuery() { return param("d") ? "d=" + param("d") : "id=" + param("id"); }
  /* ---------- Station access list (who may book which station) ----------
     Rules: the Leader (Moodle user ids in data-leaders on the "Station access" list header)
     adds Supervisors; a Supervisor adds Students for HIS stations only. Entries added by
     anyone else are ignored. Moodle saves who wrote each entry, so this can't be faked. */
  function acNorm(s) { return String(s || "").toLowerCase().replace(/\s+/g, " ").trim(); }
  /* "Simon Huber (id 123)" -> {name: "Simon Huber", id: 123}; a name without id still works */
  function acPerson(s) { var m = String(s || "").match(/^(.*?)\s*\(id\s*(\d+)\)\s*$/i); return m ? { name: m[1].trim(), id: +m[2] } : { name: String(s || "").trim(), id: 0 }; }
  function acGet(url) {
    return fetch(url, { credentials: "same-origin" })
      .then(function (r) { if (!r.ok) { throw new Error(r.status); } return r.text(); })
      .then(function (h) { return new DOMParser().parseFromString(h, "text/html"); });
  }
  function readAccess(doc) {
    var cfg = doc.querySelector(".ac-config");
    var leaders = cfg ? (cfg.getAttribute("data-leaders") || "").split(/[^0-9]+/).filter(Boolean).map(Number) : [];
    var rows = Array.prototype.map.call(doc.querySelectorAll(".ac-e"), function (e) {
      var ua = e.querySelector(".ac-by a"), m = ua ? (ua.getAttribute("href") || "").match(/[?&]id=(\d+)/) : null;
      var ed = e.querySelector('.ac-actions a[href*="edit.php"]'), de = e.querySelector('.ac-actions a[href*="delete="]');
      var pp = acPerson(txt(e.querySelector(".ac-person")));
      return { id: +e.getAttribute("data-id") || 0, station: txt(e.querySelector(".ac-station")), person: pp.name, pid: pp.id,
        role: /super/i.test(txt(e.querySelector(".ac-role"))) ? "Supervisor" : "Student", note: txt(e.querySelector(".ac-note")),
        by: txt(e.querySelector(".ac-by")), byId: m ? +m[1] : 0, edit: ed ? ed.getAttribute("href") : "", del: de ? de.getAttribute("href") : "" };
    });
    var sup = {}, stu = {};
    // a person is matched by Moodle id when the entry has one, otherwise by name
    function put(map, st, r) { (map[st] = map[st] || {})[r.pid ? "#" + r.pid : acNorm(r.person)] = true; }
    function has(map, st, u) { var m = map[st]; return !!(m && u && ((u.id && m["#" + u.id]) || (u.name && m[acNorm(u.name)]))); }
    rows.forEach(function (r) {
      if (r.role !== "Supervisor") { return; }
      r.ok = leaders.indexOf(r.byId) >= 0;
      if (r.ok) { put(sup, r.station, r); } else { r.why = "only the Leader can add supervisors"; }
    });
    rows.forEach(function (r) {
      if (r.role !== "Student") { return; }
      r.ok = leaders.indexOf(r.byId) >= 0 || has(sup, r.station, { id: r.byId, name: r.by });
      if (r.ok) { put(stu, r.station, r); } else { r.why = r.by + " is not a supervisor of " + r.station; }
    });
    return {
      leaders: leaders, rows: rows,
      viewAsOff: !!cfg && /^(off|no|false|0)$/i.test(cfg.getAttribute("data-viewas") || ""),   // data-viewas="off" switches the preview off
      isLeader: function (u) { return !!u && !!u.id && leaders.indexOf(u.id) >= 0; },
      isSupervisor: function (u, st) { return has(sup, st, u); },
      supervisors: function (st) { return rows.filter(function (r) { return r.ok && r.role === "Supervisor" && r.station === st; }).map(function (r) { return r.person; }); },
      may: function (u, st) { return !!u && ((!!u.id && leaders.indexOf(u.id) >= 0) || has(sup, st, u) || has(stu, st, u)); }
    };
  }
  /* the logged-in user: id from the page header, full name from your own profile page */
  function whoAmIFull() {
    var el = document.querySelector("#nav-notification-popover-container[data-userid], #nav-message-popover-container[data-userid], [data-region='popover-region-notifications'][data-userid], .popover-region[data-userid]");
    var id = el ? +el.getAttribute("data-userid") || 0 : 0, root = (window.M && M.cfg && M.cfg.wwwroot) || "";
    return acGet(root + "/user/profile.php" + (id ? "?id=" + id : "")).then(function (doc) {
      var h = doc.querySelector(".page-header-headings h1, .page-context-header h1, .page-header-headings h2, #page-header h1, h1");
      return { id: id, name: txt(h) };
    }).catch(function () { return { id: id, name: "" }; });
  }
  /* course participants (name + Moodle id) from the Participants page – for picking people in the form */
  function loadParticipants() {
    var cm = (document.body.className.match(/\bcourse-(\d+)\b/) || [])[1] || (window.M && M.cfg && M.cfg.courseId), root = (window.M && M.cfg && M.cfg.wwwroot) || "";
    if (!cm) { return Promise.reject(new Error("no course id")); }
    return acGet(root + "/user/index.php?id=" + cm + "&perpage=5000").then(function (doc) {
      var seen = {}, out = [];
      Array.prototype.forEach.call(doc.querySelectorAll('#participants a[href*="/user/view.php"], table.generaltable a[href*="/user/view.php"]'), function (a) {
        var m = (a.getAttribute("href") || "").match(/[?&]id=(\d+)/); if (!m || seen[m[1]]) { return; }
        var c = a.cloneNode(true); Array.prototype.forEach.call(c.querySelectorAll(".userinitials, img, .sr-only, .visually-hidden"), function (x) { x.remove(); });
        var name = txt(c); if (!name) { return; }
        seen[m[1]] = 1; out.push({ id: +m[1], name: name });
      });
      if (!out.length) { throw new Error("no participants visible"); }
      return out.sort(function (a, b) { return a.name.localeCompare(b.name); });
    });
  }
  function loadAccess(db) {
    return acGet("view.php?d=" + db + "&perpage=1000").then(function (doc) {
      if (!doc.querySelector(".ac-config")) { throw new Error("not the access list"); }
      return readAccess(doc);
    });
  }
  /* ---------- "View as" preview (Leaders only) ----------
     The Leader picks a person on the Station access page; every booking page then behaves as for
     that person. Only for looking: anything saved is still saved under the Leader's own name. */
  /* open the current page again as a normal visit (a reload would make Firefox ask to resend a form) */
  function acReopen() {
    var m = location.search.match(/[?&](d|id)=(\d+)/), hid = document.querySelector('form input[name="d"]');
    if (m) { location.href = location.pathname + location.search; }
    else if (hid && hid.value) { location.href = "view.php?d=" + hid.value; }      // page reached by saving a form: no d= in the address
    else { location.href = location.pathname; }
  }
  function getViewAs() { try { return JSON.parse(sessionStorage.getItem("st-viewas") || "null"); } catch (e) { return null; } }
  function setViewAs(u) { try { if (u) { sessionStorage.setItem("st-viewas", JSON.stringify(u)); } else { sessionStorage.removeItem("st-viewas"); } } catch (e) {} }
  function viewAs(acc, me) {
    var v = getViewAs();
    if (!v || !acc || !me || !acc.isLeader(me) || acc.viewAsOff) { return me; }       // only a real Leader can preview (unless switched off)
    var u = { id: v.id || 0, name: v.name || "", real: me, preview: true };
    previewBanner(u, acc);
    return u;
  }
  function previewBanner(u, acc) {
    if (document.getElementById("st-preview")) { return; }
    var what = acc && acc.isLeader(u) ? "Leader" : acc && acc.rows.some(function (r) { return r.ok && r.role === "Supervisor" && acc.isSupervisor(u, r.station); }) ? "supervisor" : "student";
    var d = document.createElement("div"); d.id = "st-preview"; d.className = "st-preview";
    d.innerHTML = "👁 <b>Preview</b> – you see this page as <b>" + String(u.name).replace(/[&<>"]/g, "") + "</b> (" + what + "). Anything you save is still saved as you. " +
      '<button type="button" class="btn btn-sm btn-secondary">Stop preview</button>';
    d.querySelector("button").onclick = function () { setViewAs(null); acReopen(); };
    var root = document.querySelector(".bk") || document.body.firstElementChild;
    if (root && root.parentNode) { root.parentNode.insertBefore(d, root); } else { document.body.insertBefore(d, document.body.firstChild); }
  }
  /* styles for the preview banner and the name pickers (added from here, so the CSS template needn't change) */
  (function () {
    if (document.getElementById("ac-style")) { return; }
    var st = document.createElement("style"); st.id = "ac-style";
    st.textContent = ".st-preview{background:#fff4d6;border:1px solid #b7860b;border-radius:8px;padding:8px 14px;margin:0 0 12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}" +
      ".ac-pick{position:absolute;z-index:50;left:0;right:0;top:100%;background:#fff;border:1px solid #d9dee5;border-radius:6px;box-shadow:0 6px 18px rgba(0,0,0,.12);max-height:320px;overflow:auto}" +
      ".ac-pick[hidden]{display:none}.ac-pick button{display:block;width:100%;text-align:left;border:0;background:#fff;padding:7px 12px}" +
      ".ac-pick button:hover,.ac-pick button:first-child{background:#eef3fb}.ac-id{color:#5b6472}" +
      ".ac-viewas{border:1px dashed #b7860b;background:#fffaf0;border-radius:8px;padding:10px 14px;margin:-4px 0 12px}.ac-hint{color:#5b6472;font-size:.85rem}" +
      ".ac-vrow{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px}.ac-vwrap{position:relative;display:inline-block;width:300px;max-width:100%}.ac-vwrap input{width:100%}" +
      ".ac-vq-btn{border:1px solid #d9dee5;background:#fff;border-radius:999px;padding:2px 10px;font-size:.85rem}.ac-vq-btn:hover{background:#eef3fb}" +
      ".bk-manage{display:flex;justify-content:flex-end;margin:0 0 10px}.ac-group{margin:16px 0 0;font-size:1.05rem;color:#5b6472}";
    (document.head || document.documentElement).appendChild(st);
  })();

  /* stations vs. robots (display only – the saved value stays the plain name).
     Stations = the built-in list + any names in data-stations="A;B" on the List template header. */
  function isStation(n) {
    var cfg = document.querySelector(".ac-config"), extra = cfg ? (cfg.getAttribute("data-stations") || "").split(";").map(function (x) { return x.trim(); }) : [];
    return STATIONS.indexOf(n) >= 0 || extra.indexOf(n) >= 0;
  }
  function label(n) { return isStation(n) && !/\bstation\b/i.test(n) ? "Station " + n : n; }   // "Bin Picking Station" stays as it is
  /* who may change/remove an entry: the Leader any entry; a supervisor only the students he added to his own stations */
  function canManage(acc, me, r) {
    if (acc.isLeader(me)) { return true; }
    var own = r.byId && me.id ? r.byId === me.id : acNorm(r.by) === acNorm(me.name);    // Moodle lets you change only entries you wrote
    return r.role === "Student" && acc.isSupervisor(me, r.station) && own;
  }
  function chip(r, extra, manage) {
    return '<span class="ac-chip' + (r.ok ? "" : " ac-bad") + '"><b>' + esc(r.person) + "</b>" + (extra || "") +
      (manage && r.edit ? ' <a href="' + esc(r.edit) + '" title="Change">✎</a>' : "") + (manage && r.del ? ' <a href="' + esc(r.del) + '" title="Remove">🗑</a>' : "") + "</span>";
  }

  /* ---------------- list page ---------------- */
  function listPage(view) {
    var acc = readAccess(document), raw = document.querySelector(".ac-raw"), q = "";
    if (raw) { raw.style.display = "none"; }
    // Moodle may move the entries out of the hidden box – hide every raw entry line itself
    Array.prototype.forEach.call(document.querySelectorAll(".ac-e"), function (e) { e.style.display = "none"; });
    var stations = STATIONS.concat(acc.rows.map(function (r) { return r.station; }).filter(function (s, i, a) { return s && STATIONS.indexOf(s) < 0 && a.indexOf(s) === i; }));
    function draw(me) {
      var lead = acc.isLeader(me), mine = stations.filter(function (s) { return acc.isSupervisor(me, s); });
      var book = stations.filter(function (s) { return acc.may(me, s); });
      var who = lead ? "<b>Leader</b> – you add supervisors (and may add students anywhere)" :
        mine.length ? "<b>Supervisor</b> of " + esc(mine.join(", ")) + " – you add students to these stations" :
        book.length ? "You may book: " + esc(book.join(", ")) : "You are not on the access list yet – ask a station supervisor";
      document.getElementById("ac-me").innerHTML = (me.preview ? "Previewing as" : "You") + ": <b>" + esc(me.name || "?") + "</b>" + (me.id ? ' <span class="ac-id">(Moodle id ' + me.id + ")</span>" : "") + " · " + who +
        (acc.leaders.length ? "" : '<div class="ac-warn"><b>No Leader set yet.</b> A teacher must open <b>Templates → List template header</b> and write the Leader\'s Moodle id into <code>data-leaders=""</code>' +
          (me.id ? ", e.g. <code>data-leaders=\"" + me.id + "\"</code> if that's you" : "") + ". Several Leaders: <code>data-leaders=\"12,34\"</code>.</div>");
      var add = document.getElementById("ac-add");
      if (add) { add.href = "edit.php?" + selfQuery(); add.textContent = lead ? "+ Add supervisor or student" : "+ Add student"; add.style.display = lead || mine.length ? "" : "none"; }
      var ql = q.toLowerCase();
      // Leader: all stations; everyone else: only the stations they belong to
      var shown = lead ? stations : stations.filter(function (s) { return mine.indexOf(s) >= 0 || book.indexOf(s) >= 0; });
      function cardsFor(list) { return list.map(function (s) {
        var rows = acc.rows.filter(function (r) { return r.station === s && r.ok && (!ql || (s + " " + r.person + " " + r.by).toLowerCase().indexOf(ql) >= 0); });
        if (ql && !rows.length && s.toLowerCase().indexOf(ql) < 0) { return ""; }
        var sups = rows.filter(function (r) { return r.role === "Supervisor"; }), studs = rows.filter(function (r) { return r.role === "Student"; });
        return '<section class="ac-card' + (mine.indexOf(s) >= 0 ? " ac-mine" : "") + '"><h4>' + esc(label(s)) + "</h4>" +
          '<div class="ac-row"><span class="ac-lbl">Supervisor</span>' + (sups.map(function (r) { return chip(r, "", canManage(acc, me, r)); }).join("") || '<span class="ac-none">none yet</span>') + "</div>" +
          '<div class="ac-row"><span class="ac-lbl">Students</span>' + (studs.map(function (r) { return chip(r, lead ? ' <span class="ac-by2">added by ' + esc(r.by) + "</span>" : "", canManage(acc, me, r)); }).join("") || '<span class="ac-none">none yet</span>') + "</div></section>";
      }).join(""); }
      var stCards = cardsFor(shown.filter(isStation)), roCards = cardsFor(shown.filter(function (s) { return !isStation(s); }));
      var cards = (stCards ? '<h4 class="ac-group">Stations</h4><div class="ac-grid">' + stCards + "</div>" : "") +
        (roCards ? '<h4 class="ac-group">Robots</h4><div class="ac-grid">' + roCards + "</div>" : "");
      var bad = lead ? acc.rows.filter(function (r) { return !r.ok; }) : [];      // only the Leader sees ignored entries
      view.innerHTML = '<div class="bk-bar"><input id="ac-q" type="search" placeholder="Search station or name" value="' + esc(q) + '"></div>' +
        (cards || '<p class="bk-empty">' + (shown.length ? "Nothing matches." : "You don't belong to any station yet.") + "</p>") +
        (bad.length ? '<div class="ac-ignored"><h4>Ignored entries (' + bad.length + ")</h4>" + bad.map(function (r) {
          return '<div class="ac-irow">' + chip(r, " · " + esc(r.role) + " of " + esc(r.station) + ' <span class="ac-by2">by ' + esc(r.by) + "</span>", true) + ' <span class="bad">– ' + esc(r.why) + "</span></div>";
        }).join("") + "</div>" : "");
      var qi = document.getElementById("ac-q");
      qi.oninput = function () { q = qi.value; var p = qi.selectionStart; draw(me); var x = document.getElementById("ac-q"); x.focus(); x.setSelectionRange(p, p); };
    }
    document.getElementById("ac-me").textContent = "Checking who you are…";
    whoAmIFull().then(function (real) {
      var me = viewAs(acc, real);
      draw(me);
      if (acc.isLeader(real) && !acc.viewAsOff) { viewAsControl(real, me); }
    });
    /* Leaders: "View as" – pick a person, then every booking page behaves as for them (preview only) */
    function viewAsControl(real, me) {
      var box = document.createElement("div"); box.className = "ac-viewas";
      var seen = {}, quick = acc.rows.filter(function (r) { var k = r.pid || acNorm(r.person); if (!r.ok || seen[k]) { return false; } seen[k] = 1; return true; })
        .sort(function (a, b) { return (a.role === b.role ? 0 : a.role === "Supervisor" ? -1 : 1) || a.person.localeCompare(b.person); }).slice(0, 16);
      box.innerHTML = '<b>👁 View as</b> <span class="ac-hint">– see the overview, station pages and this list exactly as another person sees them (preview only)</span>' +
        '<div class="ac-vrow"><span class="ac-vwrap"><input id="ac-vq" type="search" autocomplete="off" placeholder="Type a name…"><div class="ac-pick" hidden></div></span>' +
        (me.preview ? ' <button type="button" class="btn btn-sm btn-secondary" id="ac-vstop">Stop preview</button>' : "") + "</div>" +
        (quick.length ? '<div class="ac-vrow">' + quick.map(function (r, i) {
          return '<button type="button" class="ac-vq-btn" data-i="' + i + '">' + esc(r.person) + ' <span class="ac-by2">' + (r.role === "Supervisor" ? "supervisor" : "student") + "</span></button>"; }).join("") + "</div>" : "");
      var meBox = document.getElementById("ac-me"); meBox.parentNode.insertBefore(box, meBox.nextSibling);
      function go(u) { setViewAs({ id: u.id || 0, name: u.name }); acReopen(); }
      Array.prototype.forEach.call(box.querySelectorAll(".ac-vq-btn"), function (b) { b.onclick = function () { var r = quick[+b.getAttribute("data-i")]; go({ id: r.pid, name: r.person }); }; });
      var stop = document.getElementById("ac-vstop"); if (stop) { stop.onclick = function () { setViewAs(null); acReopen(); }; }
      var input = document.getElementById("ac-vq"), pick = box.querySelector(".ac-pick"), people = null;
      input.addEventListener("focus", function () { if (!people) { loadParticipants().then(function (l) { people = l; show(); }).catch(function () { people = []; }); } });
      input.addEventListener("input", show);
      input.addEventListener("blur", function () { setTimeout(function () { pick.hidden = true; }, 150); });
      function show() {
        var words = acNorm(input.value).split(" ").filter(Boolean);
        var hits = (people || []).filter(function (u) { var n = acNorm(u.name); return words.every(function (w) { return n.indexOf(w) >= 0; }); }).slice(0, 12);
        if (!words.length || !hits.length) { pick.hidden = true; return; }
        pick.innerHTML = hits.map(function (u) { return '<button type="button" data-id="' + u.id + '">' + esc(u.name) + ' <span class="ac-id">id ' + u.id + "</span></button>"; }).join("");
        pick.hidden = false;
        Array.prototype.forEach.call(pick.querySelectorAll("button"), function (b) {
          b.onmousedown = function (ev) { ev.preventDefault(); go(people.filter(function (u) { return u.id === +b.getAttribute("data-id"); })[0]); };
        });
      }
    }
  }

  /* ---------------- add / edit page ---------------- */
  function formPage(form) {
    var stSel = form.querySelector(".acf-station select"), roleSel = form.querySelector(".acf-role select"), person = form.querySelector(".acf-person input");
    /* dropdown: two groups, "Stations" (shown as "Station …") and "Robots" – the saved value doesn't change */
    if (stSel) {
      var opts = Array.prototype.slice.call(stSel.options), keep = stSel.value;
      var gS = document.createElement("optgroup"), gR = document.createElement("optgroup"); gS.label = "Stations"; gR.label = "Robots";
      opts.forEach(function (o) { if (!o.value) { return; } if (isStation(o.value)) { o.text = label(o.value); gS.appendChild(o); } else { gR.appendChild(o); } });
      if (gS.children.length) { stSel.appendChild(gS); }
      if (gR.children.length) { stSel.appendChild(gR); }
      stSel.value = keep;
    }
    var box = document.getElementById("ac-check"), acc = null, me = null, rid = +param("rid") || 0, people = null, peopleErr = false;
    if (person) { person.setAttribute("autocomplete", "off"); person.placeholder = "Type a name, e.g. simon – then click the person"; }
    /* search box: type part of a name, click the person (from the course's Participants list) */
    var pick = document.createElement("div"); pick.className = "ac-pick"; pick.hidden = true;
    if (person) { person.parentNode.style.position = "relative"; person.parentNode.appendChild(pick); }
    function showPick() {
      if (!people || !person) { pick.hidden = true; return; }
      var words = acNorm(acPerson(person.value).name).split(" ").filter(Boolean);
      var hits = people.filter(function (u) { var n = acNorm(u.name); return words.every(function (w) { return n.indexOf(w) >= 0; }); }).slice(0, 12);
      if (!words.length || !hits.length || (hits.length === 1 && acPerson(person.value).id === hits[0].id)) { pick.hidden = true; return; }
      pick.innerHTML = hits.map(function (u) { return '<button type="button" data-id="' + u.id + '">' + esc(u.name) + ' <span class="ac-id">id ' + u.id + "</span></button>"; }).join("");
      pick.hidden = false;
      Array.prototype.forEach.call(pick.querySelectorAll("button"), function (b) {
        b.onmousedown = function (ev) { ev.preventDefault(); var u = people.filter(function (x) { return x.id === +b.getAttribute("data-id"); })[0];
          person.value = u.name + " (id " + u.id + ")"; pick.hidden = true; check(false); };
      });
    }
    function val(sel) { return sel && sel.selectedIndex >= 0 ? (sel.options[sel.selectedIndex].value || "") : ""; }
    function check(final) {
      if (!acc || !me || (!people && !peopleErr)) { box.className = "bk-checkbox wait"; box.innerHTML = "Checking your rights…"; return ["wait"]; }
      var lead = acc.isLeader(me), st = val(stSel), role = /super/i.test(val(roleSel)) ? "Supervisor" : val(roleSel) ? "Student" : "", p = [];
      var who = acPerson(person ? person.value : ""), name = who.name;
      if (acc.empty) { lead = true; }
      var editing = rid ? acc.rows.filter(function (r) { return r.id === rid; })[0] : null;
      if (editing && !acc.empty && !canManage(acc, me, editing)) { p.push("You can't change this entry – only the Leader or the supervisor who added this student can."); }   // first entry: can't check yet – it only counts if you are a Leader in data-leaders
      var allSt = STATIONS.concat(stSel ? Array.prototype.map.call(stSel.options, function (o) { return o.value; }).filter(Boolean) : []);   // new stations: just add them to the "station" field
      if (!lead && !allSt.some(function (s) { return acc.isSupervisor(me, s); })) { p.push("Only the Leader and station supervisors can give access."); }
      else {
        if (!st) { p.push("Choose a station."); }
        if (!name) { p.push(people ? "Type a name and click the person in the list." : "Write the person's full name."); }
        else if (people && !people.some(function (u) { return u.id === who.id; })) { p.push("Click the person in the list (type part of the name first)."); }
        if (!role) { p.push("Choose a role."); }
        if (role === "Supervisor" && !lead) { p.push("Only the Leader can add supervisors."); }
        if (st && !lead && !acc.isSupervisor(me, st)) { p.push("You are not a supervisor of " + st + "."); }
        if (st && name && role && acc.rows.some(function (r) { return r.ok && r.id !== rid && r.station === st && r.role === role && (who.id && r.pid ? r.pid === who.id : acNorm(r.person) === acNorm(name)); })) {
          p.push(name + " is already " + (role === "Supervisor" ? "a supervisor" : "a student") + " of " + st + ".");
        }
      }
      if (p.length) { box.className = "bk-checkbox bad"; box.innerHTML = "<b>" + (final ? "Not saved: " : "") + "please fix this first</b>" + p.map(function (x) { return "<div>" + esc(x) + "</div>"; }).join(""); }
      else { box.className = "bk-checkbox ok"; box.innerHTML = "<b>✓ " + esc(name) + " will be able to book " + esc(st) + ".</b>" +
        (acc.empty ? "<div class='bk-dayline'>This is the first entry, so your Leader rights can't be checked yet – it only counts if your Moodle id (" + (me.id || "?") + ") is in data-leaders.</div>" : "") +
        (who.id ? "" : "<div class='bk-dayline'>" + (peopleErr ? "Couldn't load the Participants list, so the name is typed by hand – it" : "The name") + " must match the Moodle name exactly, otherwise it has no effect.</div>"); }
      return p;
    }
    [stSel, roleSel].forEach(function (s) { if (s) { s.addEventListener("change", function () { check(false); }); } });
    if (person) {
      person.addEventListener("input", function () { showPick(); check(false); });
      person.addEventListener("focus", showPick);
      person.addEventListener("blur", function () { setTimeout(function () { pick.hidden = true; }, 150); });
      person.addEventListener("keydown", function (ev) { var b = pick.querySelector("button"); if (ev.key === "Enter" && !pick.hidden && b) { ev.preventDefault(); b.onmousedown(ev); } });
    }
    var f = form.closest("form");
    if (f) { f.addEventListener("submit", function (ev) {
      if (ev.submitter && /cancel/i.test(ev.submitter.name || "")) { return; }
      if (check(true).length) { ev.preventDefault(); box.scrollIntoView({ behavior: "smooth", block: "center" }); }
    }); }
    check(false);
    loadParticipants().then(function (l) { people = l; check(false); }).catch(function () { peopleErr = true; check(false); });
    Promise.all([acGet("view.php?" + selfQuery() + "&perpage=1000").then(function (doc) {
      var a = readAccess(doc); a.empty = !doc.querySelector(".ac-config"); return a;      // empty list: Moodle shows "No entries yet", without our header
    }), whoAmIFull()]).then(function (r) {
      acc = r[0]; me = acc.empty ? r[1] : viewAs(acc, r[1]);
      if (!acc.empty && !acc.isLeader(me)) {      // supervisors: only their stations, only the role Student
        if (stSel) { Array.prototype.forEach.call(stSel.options, function (o) { if (o.value && !acc.isSupervisor(me, o.value)) { o.disabled = true; } }); }
        if (roleSel) { Array.prototype.forEach.call(roleSel.options, function (o) { if (/super/i.test(o.value)) { o.disabled = true; } else if (/student/i.test(o.value) && !val(roleSel)) { roleSel.value = o.value; } }); }
      }
      check(false);
    }).catch(function () { box.className = "bk-checkbox bad"; box.innerHTML = "Couldn't load the access list – please reload the page."; });
  }

  function run() {
    var view = document.getElementById("ac-view"); if (view) { listPage(view); }
    var form = document.querySelector(".ac-form"); if (form) { formPage(form); }
  }
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", run); } else { run(); }
})();

  }
  function images() { return {"taurob": "data:image/webp;base64,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", "mir_ur5": "data:image/webp;base64,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", "3d_measuring_machine": "data:image/webp;base64,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", "abb_gofa": "data:image/webp;base64,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", "high_rack_warehouse": "data:image/webp;base64,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", "3d_printing_farm": "data:image/webp;base64,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", "bin_picking_station": "data:image/webp;base64,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"}; }
})();