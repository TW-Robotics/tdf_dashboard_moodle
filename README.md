# Digital Factory Lab – Booking system (Moodle)

Three Moodle Database activities work together:

| Database | What it does |
|---|---|
| **Robot Bookings** | Book robots by the hour (Mon–Fri, 08:00–18:00, max. 10 h) |
| **Station bookings** | Book stations by the hour (same rules) |
| **Station access** | Who may book what: Leader → Supervisors → Students |

A robot and a station can be **linked** (e.g. *MiR with UR5* ↔ *MiR with UR5*, *Wittmann W818-2058* ↔ *3D Printing Farm*). A booking on one side then blocks the same time on the other side.

> **Golden rule:** a name must be spelled **exactly the same** everywhere (capitals, spaces, brackets). "MiR with UR5" and "MIR with UR5" are two different things.

---

## 1. First-time setup

1. **Editor:** Preferences → Editor preferences → **Plain text area**. Otherwise Moodle's editor breaks the templates.
2. **Station bookings:** add a Database activity, then Presets → Import `station_bookings.zip`. Note its `d=` number (from the URL).
3. **Robot Bookings:** add a Database activity, then Presets → Import `robot_bookings.zip`. Note its `d=` number (from the URL).
4. **Access:** add a Database activity, then Presets → Import `station_access.zip`. Note its `d=` number (from the URL).
5. **Link the two databases:**
   - Robot Bookings JavaScript: `var LINK_DB = <d= of Station bookings>;`
   - Station bookings JavaScript: `var LINK_DB = <d= of Robot Bookings>;`
6. **Both JavaScript files:** set `var ACCESS_DB = <d= of Station access>;` (currently `2338`).
7. **Station access stays as it is.** The Leader ids are set in its List header (`data-leaders="…"`).

### Settings at the top of each JavaScript file

| Setting | Meaning |
|---|---|
| `OPEN`, `CLOSE`, `MAX_HOURS` | Opening hours and the longest booking |
| `DAYS` | Bookable weekdays (1 = Monday) |
| `LINK_DB` | `d=` of the other booking database (0 = no link) |
| `LINKED` | Which robot belongs to which station |
| `ACCESS_DB` | `d=` of Station access (0 = everyone may book) |
| `ALL_ROBOTS_NEED_ACCESS` | `true` = every item needs an access-list entry |
| `ONLY_MY_ROBOTS` | `true` = people only see what they may book (the Leader sees all) |
| `ROBOTS` | The tiles: name, location, maker/room, picture |

---

## 2. Adding things

### A. New robot (normal, not linked)
1. **Robot Bookings → Fields → "robot":** add the name on a new line.
2. **Robot Bookings → JavaScript template**, in `var ROBOTS = { … }`, add:
   ```
   "New Robot X": {"cell": "FLOOR", "maker": "Acme", "img": ""},
   ```
3. **Station access → Fields → "station":** add the same name.
4. **Station access:** add a Supervisor for it. The Supervisor then adds the students.

### B. New station (normal, not linked)
1. **Station bookings → Fields → "station":** add the name.
2. **Station bookings → JavaScript template**, in `var ROBOTS = { … }`, add:
   ```
   "New Station Y": {"cell": "C0.1", "maker": "", "img": ""},
   ```
   `cell` = location, `maker` = room (may be empty).
3. **Station access → Fields → "station":** add the same name.
4. **Station access:** add a Supervisor for it.

### C. Link a robot and a station
Both must already exist (A and B). Then add one line to `var LINKED = { … }` in each JavaScript file:

- **Robot Bookings:** `"New Robot X": "New Station Y",`
- **Station bookings:** `"New Station Y": "New Robot X",`

The names may be the same or different. A linked robot uses the **station's** access list, so give access once, on the station.

### D. Unlink, or leave it normal
- **Leave normal:** don't add it to `LINKED`.
- **Unlink:** delete its line from `LINKED` in **both** files.

### E. Remove a robot or station
Delete its name from the field options, its `ROBOTS` line, and any `LINKED` lines. Existing bookings for it stay in the list.

---

## 3. Pictures

- **Built-in pictures** use `"art": "key"`. They are stored in `function pictures()` at the very end of the JavaScript file.
- **New pictures:** upload the photo somewhere in the course that students can see (e.g. a Page). Right-click the image → *Copy image address*, then paste it:
  ```
  "img": "https://moodle.technikum-wien.at/…/photo.jpg"
  ```

---

## 4. Who can do what

| Role | Can do |
|---|---|
| **Leader** (id in `data-leaders`) | Sees and books everything; adds Supervisors to robots/stations |
| **Supervisor** | Books their own robots/stations; adds or removes **their own** students there |
| **Student** | Books only the robots/stations they were added to |

Entries in Station access count only if the right person wrote them:
- a Supervisor row counts only if the Leader added it;
- a Student row counts only if the Leader or that station's Supervisor added it.

---

## 5. Troubleshooting

| Problem | Check |
|---|---|
| Page looks broken / tiles gone after an edit | Commas in `ROBOTS` / `LINKED`: each entry ends with `,` except the last. Quotes `"` around every name. |
| Booking on one side doesn't block the other | Each file's `LINK_DB` must be the **other** database's `d=`. Both files need the `LINKED` line. The names must match exactly. |
| Robot Bookings JavaScript contains `STATION_DBS` | That's the old version. Paste `Robot Bookings - JavaScript v28.js` again. |
| "You need to be on its access list" | Add the person in Station access (by the Leader or that station's Supervisor). |
| New robot/station not in the access dropdown | Add its name to the "station" field of Station access. |
| Templates suddenly look different | The editor rewrote them. Switch to Plain text area and paste the template again. |
| Need Moodle's own controls (search, export…) | Click **⚙ Show Moodle controls** at the bottom of the page. |

---
© Dr. Kannan Peesapati – Digital Factory Lab, FH Technikum Wien
