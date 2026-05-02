// timer.js — patient timer management

var timerRefreshInterval = null;
var timerDelCallback = null;
var addPatientEditId = null;    // null = new, string id = editing
var addTimerPatientId = null;
var selectedTimerType = "temperature";
var selectedTimerIntervalMs = 14400000;
var expandedTimerHistories = {};
var collapsedPatients = {};

var TIMER_TYPES = [
  { id: "temperature", label: "Temperature", icon: "🌡️" },
  { id: "epidural",    label: "Epidural",    icon: "💉" },
  { id: "mag",         label: "Mag",         icon: "🧪" },
  { id: "glucose",     label: "Glucose",     icon: "🩸" },
  { id: "cytotec",     label: "Cytotec",     icon: "💊" },
  { id: "custom",      label: "Custom",      icon: "⏱️" }
];

// null = no preset (user must pick)
var TIMER_PRESETS = {
  temperature: 14400000,
  epidural:    14400000,
  mag:         14400000,
  glucose:     null,
  cytotec:     7200000
};

var TIMER_INTERVALS = [
  { label: "15m", ms: 900000   },
  { label: "30m", ms: 1800000  },
  { label: "1h",  ms: 3600000  },
  { label: "2h",  ms: 7200000  },
  { label: "3h",  ms: 10800000 },
  { label: "4h",  ms: 14400000 }
];

// ── Sheet helpers ──

function sheetOpen(overlayId, sheetId) {
  document.getElementById(overlayId).classList.add("open");
  document.getElementById(sheetId).classList.add("open");
}
function sheetClose(overlayId, sheetId) {
  document.getElementById(overlayId).classList.remove("open");
  document.getElementById(sheetId).classList.remove("open");
}

// ── Timer page ──

function openTimerPage() {
  renderTimerPage();
  document.getElementById("timer-page").classList.add("open");
  timerRefreshInterval = setInterval(function() {
    renderTimerPage();
    updateTimerFabBadge();
  }, 30000);
}

function closeTimerPage() {
  clearInterval(timerRefreshInterval);
  timerRefreshInterval = null;
  document.getElementById("timer-page").classList.remove("open");
}

// ── Render ──

function renderTimerPage() {
  var list = document.getElementById("timer-patients-list");
  if (!timerPatients.length) {
    list.innerHTML = '<div class="timer-empty"><div class="timer-empty-icon">⏱️</div><div class="timer-empty-title">No patients yet</div></div>';
    return;
  }
  list.innerHTML = timerPatients.map(renderPatientCard).join("");
}

function renderPatientCard(patient) {
  var now = Date.now();
  var overdue = (patient.timers || []).filter(function(t) { return t.nextDueAt && now >= t.nextDueAt; }).length;
  var badge = overdue > 0 ? '<span class="patient-overdue-badge">' + overdue + '</span>' : "";
  var collapsed = !!collapsedPatients[patient.id];
  var chevron = '<svg class="patient-chevron' + (collapsed ? "" : " open") + '" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var body = collapsed ? "" :
    (patient.timers || []).map(function(t) { return renderTimerRow(patient.id, t); }).join("") +
    '<button class="add-timer-btn" onclick="openAddTimerSheet(\'' + patient.id + '\')">' +
      '<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 2v9M2 6.5h9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg> Add timer' +
    '</button>';

  return '<div class="patient-card" id="pc-' + patient.id + '">' +
    '<div class="patient-card-header" onclick="togglePatientCollapse(\'' + patient.id + '\')">' +
      '<div class="patient-card-label">' + esc(patient.label) + badge + '</div>' +
      '<div class="patient-card-actions">' +
        '<button class="patient-action-btn" onclick="event.stopPropagation();openPatientSheet(\'' + patient.id + '\')">' +
          '<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M10.5 2.5L12.5 4.5L5 12H3V10L10.5 2.5Z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>' +
        '<button class="patient-action-btn delete" onclick="event.stopPropagation();deletePatient(\'' + patient.id + '\')">' +
          '<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 1.5l10 10M11.5 1.5l-10 10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' +
        '</button>' +
        chevron +
      '</div>' +
    '</div>' +
    body +
  '</div>';
}

function togglePatientCollapse(patientId) {
  collapsedPatients[patientId] = !collapsedPatients[patientId];
  renderTimerPage();
}

function renderTimerRow(patientId, timer) {
  var typeInfo = TIMER_TYPES.find(function(t) { return t.id === timer.type; }) || TIMER_TYPES[4];
  var label = timer.type === "custom" ? (timer.customLabel || "Custom") : typeInfo.label;
  var isOverdue = timer.nextDueAt && Date.now() >= timer.nextDueAt;
  var history = timer.history || [];
  var expanded = !!expandedTimerHistories[timer.id];

  var historyFooter = history.length
    ? '<button class="timer-history-toggle' + (expanded ? " open" : "") + '" onclick="toggleTimerHistory(\'' + timer.id + '\')">' +
        (expanded ? "▴" : "▾") + " " + history.length + " done" +
      '</button>'
    : "";

  var historyList = (expanded && history.length)
    ? '<div class="timer-history-list">' +
        history.map(function(e) {
          return '<div class="timer-history-entry">' +
            '<span class="timer-history-dot"></span>' +
            '<span class="timer-history-time">' + formatTimestamp(e.completedAt) + '</span>' +
          '</div>';
        }).join("") +
      '</div>'
    : "";

  return '<div class="timer-row' + (isOverdue ? " overdue" : "") + '" id="tr-' + timer.id + '">' +
    '<div class="timer-row-main">' +
      '<div class="timer-row-left">' +
        '<span class="timer-type-icon">' + typeInfo.icon + '</span>' +
        '<div class="timer-row-info">' +
          '<div class="timer-row-label">' + esc(label) + '</div>' +
          '<div class="timer-row-sub">Every ' + formatIntervalLabel(timer.intervalMs) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="timer-row-right">' +
        '<div class="timer-countdown' + (isOverdue ? " overdue" : "") + '">' + formatCountdown(timer.nextDueAt) + '</div>' +
        '<button class="timer-done-btn" id="done-' + timer.id + '" onclick="markTimerDone(\'' + patientId + '\',\'' + timer.id + '\')">Done</button>' +
        '<button class="timer-delete-btn" onclick="deleteTimer(\'' + patientId + '\',\'' + timer.id + '\')">' +
          '<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 1.5l8 8M9.5 1.5l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' +
        '</button>' +
      '</div>' +
    '</div>' +
    (historyFooter ? '<div class="timer-row-footer">' + historyFooter + '</div>' : "") +
    historyList +
  '</div>';
}

function toggleTimerHistory(timerId) {
  expandedTimerHistories[timerId] = !expandedTimerHistories[timerId];
  renderTimerPage();
}

// ── Formatting ──

function formatCountdown(nextDueAt) {
  if (!nextDueAt) return "—";
  var diff = nextDueAt - Date.now();
  if (diff <= 0) {
    var over = -diff;
    if (over < 60000) return "DUE NOW";
    if (over < 3600000) return Math.floor(over / 60000) + "m overdue";
    var oh = Math.floor(over / 3600000), om = Math.floor((over % 3600000) / 60000);
    return oh + "h" + (om ? " " + om + "m" : "") + " overdue";
  }
  if (diff < 60000) return "< 1m";
  if (diff < 3600000) return "in " + Math.floor(diff / 60000) + "m";
  var h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000);
  return "in " + h + "h" + (m ? " " + m + "m" : "");
}

function formatIntervalLabel(ms) {
  if (ms < 3600000) return (ms / 60000) + "m";
  return (ms / 3600000) + "h";
}

function formatTimestamp(ts) {
  var d = new Date(ts), now = new Date();
  var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var h = d.getHours(), m = d.getMinutes();
  var time = (h % 12 || 12) + ":" + (m < 10 ? "0" : "") + m + " " + (h >= 12 ? "PM" : "AM");
  if (d >= todayStart) return "Today · " + time;
  if (d >= new Date(todayStart - 86400000)) return "Yesterday · " + time;
  return MS[d.getMonth()] + " " + d.getDate() + " · " + time;
}

// ── Done / badge ──

function markTimerDone(patientId, timerId) {
  var patient = timerPatients.find(function(p) { return p.id === patientId; });
  if (!patient) return;
  var timer = (patient.timers || []).find(function(t) { return t.id === timerId; });
  if (!timer) return;

  timer.history = timer.history || [];
  timer.history.unshift({ completedAt: Date.now(), note: "" });
  if (timer.history.length > 20) timer.history.length = 20;
  timer.nextDueAt = Date.now() + timer.intervalMs;
  saveTimers();
  updateTimerFabBadge();

  var btn = document.getElementById("done-" + timerId);
  var row = document.getElementById("tr-" + timerId);
  if (btn) { btn.textContent = "✓"; btn.classList.add("done-flash"); }
  if (row) row.classList.remove("overdue");
  setTimeout(renderTimerPage, 1200);
}

function updateTimerFabBadge() {
  var badge = document.getElementById("timer-fab-badge");
  if (!badge) return;
  var now = Date.now(), count = 0;
  (timerPatients || []).forEach(function(p) {
    (p.timers || []).forEach(function(t) { if (t.nextDueAt && now >= t.nextDueAt) count++; });
  });
  badge.style.display = count ? "flex" : "none";
  if (count) badge.textContent = count > 9 ? "9+" : count;
}

// ── Patient sheet ──

function openPatientSheet(patientId) {
  addPatientEditId = patientId || null;
  var patient = patientId && timerPatients.find(function(p) { return p.id === patientId; });
  document.getElementById("patient-sheet-title").textContent = patient ? "Edit Patient" : "Add Patient";
  document.getElementById("patient-label-input").value = patient ? patient.label : "";
  sheetOpen("patient-overlay", "patient-sheet");
  setTimeout(function() { document.getElementById("patient-label-input").focus(); }, 350);
}

function closePatientSheet() { sheetClose("patient-overlay", "patient-sheet"); }

function savePatient() {
  var inp = document.getElementById("patient-label-input");
  var label = inp.value.trim();
  if (!label) { inp.style.animation = "none"; inp.offsetWidth; inp.style.animation = "shake 0.3s"; return; }

  if (addPatientEditId) {
    var existing = timerPatients.find(function(p) { return p.id === addPatientEditId; });
    if (existing) existing.label = label;
  } else {
    var now = Date.now();
    timerPatients.push({ id: "pt_" + now, label: label, createdAt: now, timers: [
      { id: "tmr_" + now, type: "temperature", customLabel: "", intervalMs: TIMER_PRESETS["temperature"], nextDueAt: now + TIMER_PRESETS["temperature"], history: [], pushNotificationId: null }
    ] });
  }
  saveTimers();
  closePatientSheet();
  renderTimerPage();
}

function deletePatient(patientId) {
  var patient = timerPatients.find(function(p) { return p.id === patientId; });
  if (!patient) return;
  openTimerDelModal(
    "Remove patient?",
    '"' + patient.label + '" and all their timers will be gone.',
    function() {
      timerPatients = timerPatients.filter(function(p) { return p.id !== patientId; });
      saveTimers(); renderTimerPage(); updateTimerFabBadge();
    }
  );
}

// ── Timer sheet ──

function openAddTimerSheet(patientId) {
  addTimerPatientId = patientId;
  selectedTimerType = "temperature";
  selectedTimerIntervalMs = TIMER_PRESETS["temperature"];
  document.getElementById("timer-custom-label-wrap").style.display = "none";
  document.getElementById("timer-custom-label-input").value = "";
  renderChips();
  sheetOpen("timer-sheet-overlay", "timer-sheet");
}

function closeTimerSheet() { sheetClose("timer-sheet-overlay", "timer-sheet"); }

function renderChips() {
  document.getElementById("timer-type-chips").innerHTML = TIMER_TYPES.map(function(t) {
    return '<button class="type-chip' + (selectedTimerType === t.id ? " sel" : "") + '" onclick="selectTimerType(\'' + t.id + '\')">' + t.icon + " " + t.label + '</button>';
  }).join("");
  document.getElementById("timer-interval-chips").innerHTML = TIMER_INTERVALS.map(function(i) {
    return '<button class="interval-chip' + (selectedTimerIntervalMs === i.ms ? " sel" : "") + '" onclick="selectTimerInterval(' + i.ms + ')">' + i.label + '</button>';
  }).join("");
}

function selectTimerType(type) {
  selectedTimerType = type;
  if (type in TIMER_PRESETS) selectedTimerIntervalMs = TIMER_PRESETS[type];
  document.getElementById("timer-custom-label-wrap").style.display = type === "custom" ? "block" : "none";
  renderChips();
}

function selectTimerInterval(ms) { selectedTimerIntervalMs = ms; renderChips(); }

function saveTimer() {
  var patient = timerPatients.find(function(p) { return p.id === addTimerPatientId; });
  if (!patient) return;

  if (!selectedTimerIntervalMs) {
    var chips = document.getElementById("timer-interval-chips");
    if (chips) { chips.style.animation = "none"; chips.offsetWidth; chips.style.animation = "shake 0.3s"; }
    return;
  }

  var customLabel = "";
  if (selectedTimerType === "custom") {
    var inp = document.getElementById("timer-custom-label-input");
    customLabel = inp.value.trim();
    if (!customLabel) { inp.style.animation = "none"; inp.offsetWidth; inp.style.animation = "shake 0.3s"; return; }
  }

  (patient.timers = patient.timers || []).push({
    id: "tmr_" + Date.now(),
    type: selectedTimerType,
    customLabel: customLabel,
    intervalMs: selectedTimerIntervalMs,
    nextDueAt: Date.now() + selectedTimerIntervalMs,
    history: [],
    pushNotificationId: null
  });
  saveTimers();
  closeTimerSheet();
  renderTimerPage();
}

function deleteTimer(patientId, timerId) {
  var patient = timerPatients.find(function(p) { return p.id === patientId; });
  if (!patient) return;
  openTimerDelModal(
    "Remove timer?",
    "This timer and its history will be gone.",
    function() {
      patient.timers = (patient.timers || []).filter(function(t) { return t.id !== timerId; });
      saveTimers(); renderTimerPage(); updateTimerFabBadge();
    }
  );
}

function openTimerDelModal(title, subtitle, callback) {
  timerDelCallback = callback;
  document.getElementById("del-modal-title").textContent = title;
  document.getElementById("del-modal-sub").textContent = subtitle;
  document.getElementById("del-overlay").classList.add("open");
  document.getElementById("del-modal").classList.add("open");
}

// ── Swipe-to-close sheets ──

(function() {
  function addSwipe(sheetId, closeFn) {
    var sheet = document.getElementById(sheetId);
    var startY = 0, dragging = false;
    sheet.addEventListener("touchstart", function(e) {
      if (e.target.closest("input,textarea,button,.type-chip,.interval-chip")) return;
      startY = e.touches[0].clientY; dragging = true; sheet.style.transition = "none";
    }, { passive: true });
    sheet.addEventListener("touchmove", function(e) {
      if (!dragging) return;
      var dy = e.touches[0].clientY - startY;
      if (dy > 0) sheet.style.transform = "translateX(-50%) translateY(" + dy + "px)";
    }, { passive: true });
    sheet.addEventListener("touchend", function(e) {
      if (!dragging) return; dragging = false;
      var dy = e.changedTouches[0].clientY - startY;
      sheet.style.transition = ""; sheet.style.transform = "";
      if (dy > 60) closeFn();
    }, { passive: true });
  }
  addSwipe("patient-sheet", closePatientSheet);
  addSwipe("timer-sheet", closeTimerSheet);
})();

// Hook into the shared delete modal
document.getElementById("del-confirm").addEventListener("click", function() {
  if (timerDelCallback) { timerDelCallback(); timerDelCallback = null; }
});
document.getElementById("del-cancel").addEventListener("click", function() { timerDelCallback = null; });
document.getElementById("del-overlay").addEventListener("click", function() { timerDelCallback = null; });

document.getElementById("patient-overlay").addEventListener("click", closePatientSheet);
document.getElementById("timer-sheet-overlay").addEventListener("click", closeTimerSheet);
document.getElementById("patient-label-input").addEventListener("keydown", function(e) {
  if (e.key === "Enter") savePatient();
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", function(e) {
    if (e.data && e.data.type === "OPEN_TIMER") openTimerPage();
  });
}
