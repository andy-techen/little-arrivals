let profile = {};

const AVATAR_SEEDS = [
  "Lily","Amelia","Sofia","Mia","Ava",
  "Luna","Penelope","Chloe","Grace","Nora",
  "Ella","Audrey","Natalie","Iris","Flora",
  "Rose","Ivy","Daisy","Simone","Willow",
  "Aria","Bella","Clara","Elena","Celeste",
  "Vivienne","Isabella","Olivia","Sara","Laura"
];

function avatarUrl(seed) {
  return `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(seed)}&backgroundColor=fde8f2`;
}

function loadProfile() {
  try { profile = JSON.parse(localStorage.getItem("la-profile")||"{}"); } catch(e) { profile={}; }
}

function saveProfile() {
  localStorage.setItem("la-profile", JSON.stringify(profile));
}

function renderProfileAvatar() {
  const avatar = document.getElementById("profile-avatar");
  if(!avatar) return;
  if(profile.avatarSeed) {
    avatar.innerHTML = `<img src="${avatarUrl(profile.avatarSeed)}" style="width:100%;height:100%;object-fit:cover;">`;
  } else {
    avatar.innerHTML = `<svg width="40" height="40" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6.5" r="3.5" stroke="currentColor" stroke-width="1.5"/><path d="M2 16c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  }
}

function renderAvatarPicker() {
  const picker = document.getElementById("avatar-picker");
  if(!picker) return;
  picker.innerHTML = AVATAR_SEEDS.map(seed=>`
    <button class="avatar-option${profile.avatarSeed===seed?" sel":""}" onclick="selectAvatar('${seed}')">
      <img src="${avatarUrl(seed)}" loading="lazy" alt="${seed}">
    </button>
  `).join("");
}

function selectAvatar(seed) {
  profile.avatarSeed = seed;
  saveProfile();
  renderProfileAvatar();
  document.getElementById("avatar-picker").style.display = "none";
}

function toggleAvatarPicker() {
  const picker = document.getElementById("avatar-picker");
  const open = picker.style.display === "none";
  picker.style.display = open ? "grid" : "none";
  if(open) renderAvatarPicker();
}

function saveStartDate() {
  profile.startDate = document.getElementById("profile-start-input").value;
  saveProfile();
  renderTenure();
}

function renderTenure() {
  const el = document.getElementById("profile-tenure");
  if(!el) return;
  if(!profile.startDate) { el.textContent = ""; return; }
  const [fy, fm, fd] = profile.startDate.split("-").map(Number);
  const first = new Date(fy, fm - 1, fd);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const days = Math.floor((now - first) / (1000*60*60*24));
  el.textContent = `Catching babies for ${days} days`;
}

function openProfile() {
  renderProfileAvatar();
  if(!profile.startDate) {
    const first = Object.keys(data).sort()[0];
    if(first) { profile.startDate = first; saveProfile(); }
  }
  document.getElementById("profile-start-input").value = profile.startDate || "";
  renderTenure();
  document.getElementById("avatar-picker").style.display = "none";
  document.getElementById("profile-page").classList.add("open");
}

function closeProfile() {
  document.getElementById("profile-page").classList.remove("open");
}

async function exportData() {
  const bundle = {data, profile, shifts};
  const json = JSON.stringify(bundle, null, 2);
  const fileName = `little-arrivals-${todayKey()}.json`;
  const file = new File([json], fileName, {type:"application/json"});

  if(navigator.canShare && navigator.canShare({files:[file]})) {
    try {
      await navigator.share({files:[file], title:"Little Arrivals Backup"});
    } catch(e) {
      if(e.name !== "AbortError") alert("Export failed. Please try again.");
    }
    return;
  }

  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(input) {
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if(typeof imported !== "object" || Array.isArray(imported)) throw new Error();
      if(imported.data && typeof imported.data === "object") {
        data = imported.data;
        if(imported.profile && typeof imported.profile === "object") {
          profile = imported.profile;
          localStorage.setItem("la-profile", JSON.stringify(profile));
          renderProfileAvatar();
        }
        if(imported.shifts && typeof imported.shifts === "object") {
          shifts = imported.shifts;
          saveShifts();
        }
      } else {
        data = imported;
      }
      save();
      renderCal(); renderStrip(); renderDay();
      if(currentTab === 1) renderCharts();
      if(currentTab === 2) renderMachine();
      closeProfile();
    } catch(err) {
      alert("Invalid backup file. Please select a valid Little Arrivals export.");
    }
    input.value = "";
  };
  reader.readAsText(file);
}

// ── Shift management ──
function toggleShift(key) {
  if(shifts[key]) delete shifts[key];
  else shifts[key] = { note: "" };
  shiftNoteOpen = false;
  saveShifts();
  renderCal(); renderDay();
}

function toggleShiftNote() {
  shiftNoteOpen = !shiftNoteOpen;
  renderDay();
}

function saveShiftNote(key, note) {
  if(shifts[key]) { shifts[key].note = note; saveShifts(); }
}

function clearFutureShifts() {
  const today = todayKey();
  Object.keys(shifts).forEach(k => { if(k > today) delete shifts[k]; });
  saveShifts();
  renderCal(); renderDay();
}

// ── ICS import — shows a modal to optionally filter by keyword ──
function openICSModal() {
  document.getElementById("ics-modal-keyword").value = "";
  document.getElementById("ics-overlay").classList.add("open");
  document.getElementById("ics-modal").classList.add("open");
}

function closeICSModal() {
  document.getElementById("ics-overlay").classList.remove("open");
  document.getElementById("ics-modal").classList.remove("open");
}

function triggerICSImport() {
  document.getElementById("ics-input").click();
}

document.getElementById("ics-overlay").addEventListener("click", closeICSModal);

// Expand a RRULE forward from today up to `horizon` date.
// Handles FREQ=WEEKLY and FREQ=DAILY — the common cases for shift schedules.
function expandRRule(rruleStr, horizon) {
  const parts = {};
  rruleStr.trim().split(';').forEach(p => {
    const [k, v] = p.split('=');
    parts[k] = v;
  });

  const freq = parts['FREQ'];
  const interval = parseInt(parts['INTERVAL'] || '1', 10);

  let endDate = horizon;
  if(parts['UNTIL']) {
    const u = parts['UNTIL'];
    const until = new Date(u.slice(0,4), u.slice(4,6)-1, u.slice(6,8));
    if(until < endDate) endDate = until;
  }

  const dayMap = {SU:0,MO:1,TU:2,WE:3,TH:4,FR:5,SA:6};
  const dates = [];
  const cur = new Date();
  cur.setHours(0,0,0,0);
  cur.setDate(cur.getDate() + 1); // start from tomorrow

  if(freq === 'WEEKLY' && parts['BYDAY']) {
    const targetDays = parts['BYDAY'].split(',')
      .map(d => dayMap[d.replace(/[+\-\d]/g, '')])
      .filter(d => d !== undefined);
    while(cur <= endDate) {
      if(targetDays.includes(cur.getDay()))
        dates.push(`${cur.getFullYear()}-${p2(cur.getMonth()+1)}-${p2(cur.getDate())}`);
      cur.setDate(cur.getDate() + 1);
    }
  } else if(freq === 'DAILY') {
    while(cur <= endDate) {
      dates.push(`${cur.getFullYear()}-${p2(cur.getMonth()+1)}-${p2(cur.getDate())}`);
      cur.setDate(cur.getDate() + interval);
    }
  }

  return dates;
}

function importICSFile(input) {
  const file = input.files[0];
  if(!file) return;
  const keyword = document.getElementById("ics-modal-keyword").value.toLowerCase().trim();
  closeICSModal();
  const reader = new FileReader();
  reader.onload = function(e) {
    // Unfold RFC 5545 folded lines (newline + space/tab = line continuation)
    const text = e.target.result.replace(/\r?\n[ \t]/g, "");

    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 180); // expand recurring events 6 months forward

    const events = text.split("BEGIN:VEVENT");
    for(const ev of events.slice(1)) {
      if(keyword) {
        const summaryMatch = ev.match(/^SUMMARY[^:]*:(.*)/m);
        if(!summaryMatch || !summaryMatch[1].toLowerCase().includes(keyword)) continue;
      }

      const dtstart = ev.match(/^DTSTART[^:]*:(\d{8})/m);
      if(!dtstart) continue;
      const d = dtstart[1];
      const baseKey = `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`;

      const rruleMatch = ev.match(/^RRULE:(.*)/m);
      if(rruleMatch) {
        // Recurring event: expand from tomorrow forward
        expandRRule(rruleMatch[1], horizon).forEach(key => {
          if(!shifts[key]) shifts[key] = { note: "" };
        });
      } else {
        // Single instance — skip past dates and today
        if(baseKey > todayKey() && !shifts[baseKey]) shifts[baseKey] = { note: "" };
      }
    }

    saveShifts();
    renderCal(); renderDay();
    input.value = "";
  };
  reader.readAsText(file);
}
