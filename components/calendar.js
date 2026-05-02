function jumpToToday() {
  const now = new Date();
  vY = now.getFullYear();
  vM = now.getMonth();
  selDate = todayKey();
  shiftNoteOpen = false;
  renderCal(); renderStrip(); renderDay();
}

function renderHeader() {
  const d = new Date();
  document.getElementById("hdr-date").textContent = `${DAYS[d.getDay()]} ${d.getDate()} ${MS[d.getMonth()]}`;
}

function renderStrip() {
  const s = monthStats(vY,vM);
  document.getElementById("strip-girls").textContent = s.g;
  document.getElementById("strip-boys").textContent = s.b;
  document.getElementById("strip-total").textContent = s.total;
  const pfx = `${vY}-${p2(vM+1)}`;
  document.getElementById("strip-shifts").textContent = Object.keys(shifts).filter(k => k.startsWith(pfx)).length;
}

function renderCal() {
  document.getElementById("cal-year").textContent = vY;
  document.getElementById("cal-month-name").textContent = MONTHS[vM];
  const grid = document.getElementById("cal-grid");
  grid.innerHTML = "";
  const first = new Date(vY,vM,1).getDay();
  const total = new Date(vY,vM+1,0).getDate();
  const today = todayKey();

  for(let i=0;i<first;i++) { const e=document.createElement("div"); e.className="cal-day empty"; grid.appendChild(e); }

  for(let d=1;d<=total;d++) {
    const key = dKey(vY,vM,d);
    const bs = babies(key);
    const el = document.createElement("div");
    let cls = "cal-day";
    if(key===today) cls+=" today";
    if(key===selDate) cls+=" selected";
    if(bs.length) cls+=" has-data";
    if(shifts[key]) cls+=" shift-day";
    el.className = cls;

    const max = Math.min(bs.length,4);
    let fh = "";
    bs.slice(0,max).forEach(b=>{
      fh+=`<div class="cal-face ${b.gender}">
        <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3.5" fill="white" opacity="0.3"/><circle cx="2.8" cy="3.5" r="0.7" fill="white"/><circle cx="5.2" cy="3.5" r="0.7" fill="white"/><path d="M2.8 5.5 Q4 7 5.2 5.5" stroke="white" stroke-width="0.7" stroke-linecap="round" fill="none"/></svg>
      </div>`;
    });
    if(bs.length>4) fh+=`<div style="font-size:7px;font-weight:700;color:var(--ink-mid);align-self:center">+${bs.length-4}</div>`;

    el.innerHTML=`<div class="cal-day-num">${d}</div><div class="cal-faces">${fh}</div>`;
    el.addEventListener("click",()=>{ selDate=key; shiftNoteOpen=false; renderCal(); renderDay(); });
    grid.appendChild(el);
  }
}

function renderDay() {
  const key = selDate;
  const [y,m,d] = key.split("-").map(Number);
  const dt = new Date(y,m-1,d);
  document.getElementById("day-label").textContent = `${DAYS[dt.getDay()]}, ${MS[m-1]} ${d}`;
  const bs = babies(key);
  document.getElementById("day-girls").textContent = bs.filter(x=>x.gender==="girl").length;
  document.getElementById("day-boys").textContent = bs.filter(x=>x.gender==="boy").length;

  const isShift = !!shifts[key];
  let shiftInner;
  if(!isShift) {
    shiftInner = `<button class="shift-toggle" onclick="toggleShift('${key}')">Mark as shift</button>`;
  } else {
    const note = shifts[key].note || "";
    shiftInner = `<div class="shift-row-btns">
      <button class="shift-toggle active" onclick="toggleShift('${key}')">On shift</button>
      <button class="shift-note-toggle${note && !shiftNoteOpen ? " has-note" : ""}${shiftNoteOpen ? " open" : ""}" onclick="toggleShiftNote()">${shiftNoteOpen ? "Hide note" : "Notes"}</button>
    </div>
    ${shiftNoteOpen ? `<textarea class="shift-note" placeholder="Shift notes..." oninput="saveShiftNote('${key}',this.value)">${esc(note)}</textarea>` : ""}`;
  }
  document.getElementById("shift-row").innerHTML = shiftInner;

  const list = document.getElementById("babies-list");
  if(!bs.length) {
    list.innerHTML=`<div class="empty-day"><div class="empty-face">${storkSVG()}</div><div class="empty-text">No arrivals recorded yet</div></div>`;
    return;
  }
  list.innerHTML = bs.map((b,i)=>{
    const ig = b.gender==="girl";
    return `<div class="baby-card" onclick="if(!event.target.closest('button'))showNotePopover('${key}',${i})" style="cursor:pointer">
      <div class="baby-blob ${b.gender}">${ig?girlSVG():boySVG()}</div>
      <div class="baby-info">
        <div class="baby-gender">${b.name || (ig?"Baby Girl":"Baby Boy")}</div>
        ${b.time?`<div class="baby-time">${b.time}</div>`:""}
        ${b.note?`<div class="baby-note">${esc(b.note)}</div>`:""}
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0">
        <button class="baby-del" onclick="editBaby('${key}',${i})" title="Edit"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 4l2 2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg></button>
        <button class="baby-del" onclick="delBaby('${key}',${i})" title="Delete"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M3.5 3.5l.7 7.5a.5.5 0 00.5.5h4.6a.5.5 0 00.5-.5l.7-7.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 6.5v3M8.5 6.5v3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg></button>
      </div>
    </div>`;
  }).join("");
}

// ── Arrival CRUD ──
let editingKey = null, editingIdx = null;
let delPendingKey = null, delPendingIdx = null;

function selGender(g) {
  sg = g;
  document.getElementById("btn-girl").classList.toggle("sel",g==="girl");
  document.getElementById("btn-boy").classList.toggle("sel",g==="boy");
  document.getElementById("save-btn").classList.add("enabled");
}

function openSheet() {
  editingKey = null; editingIdx = null;
  sg = null;
  document.getElementById("btn-girl").classList.remove("sel");
  document.getElementById("btn-boy").classList.remove("sel");
  document.getElementById("notes-ta").value = "";
  document.getElementById("name-input").value = "";
  document.getElementById("save-btn").classList.remove("enabled");
  document.getElementById("sheet-title").textContent = "New Arrival";
  document.getElementById("save-btn").textContent = "Record Arrival";
  document.getElementById("overlay").classList.add("open");
  document.getElementById("sheet").classList.add("open");
}

function editBaby(key, idx) {
  const b = data[key][idx];
  if(!b) return;
  editingKey = key; editingIdx = idx;
  sg = b.gender;
  document.getElementById("btn-girl").classList.toggle("sel", sg==="girl");
  document.getElementById("btn-boy").classList.toggle("sel", sg==="boy");
  document.getElementById("name-input").value = b.name || "";
  document.getElementById("notes-ta").value = b.note || "";
  document.getElementById("save-btn").classList.add("enabled");
  document.getElementById("sheet-title").textContent = "Edit Arrival";
  document.getElementById("save-btn").textContent = "Save Changes";
  document.getElementById("overlay").classList.add("open");
  document.getElementById("sheet").classList.add("open");
}

function closeSheet() {
  document.getElementById("overlay").classList.remove("open");
  document.getElementById("sheet").classList.remove("open");
}

function saveArrival() {
  if(!sg) {
    const gr = document.querySelector(".gender-row");
    gr.style.animation="none";
    requestAnimationFrame(()=>gr.style.animation="shake 0.3s ease");
    return;
  }
  const note = document.getElementById("notes-ta").value.trim();
  const rawName = document.getElementById("name-input").value.trim();
  const name = rawName.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  if(editingKey !== null && editingIdx !== null) {
    const existing = data[editingKey][editingIdx];
    data[editingKey][editingIdx] = {...existing, gender:sg, name, note};
  } else {
    const now = new Date();
    const time = now.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
    if(!data[selDate]) data[selDate]=[];
    data[selDate].push({gender:sg,note,name,time});
  }
  editingKey = null; editingIdx = null;
  save();
  if(!shifts[selDate]) { shifts[selDate] = { note: "" }; saveShifts(); }
  closeSheet(); renderCal(); renderStrip(); renderDay();
}

function delBaby(key, idx) {
  delPendingKey = key;
  delPendingIdx = idx;
  document.getElementById("del-overlay").classList.add("open");
  document.getElementById("del-modal").classList.add("open");
}

function closeDelModal() {
  document.getElementById("del-overlay").classList.remove("open");
  document.getElementById("del-modal").classList.remove("open");
  document.getElementById("del-modal-title").textContent = "Delete this arrival?";
  document.getElementById("del-modal-sub").textContent = "This little one will be gone for good.";
  delPendingKey = null;
  delPendingIdx = null;
}

document.getElementById("del-cancel").addEventListener("click", closeDelModal);
document.getElementById("del-overlay").addEventListener("click", closeDelModal);
document.getElementById("del-confirm").addEventListener("click", function() {
  if(delPendingKey && data[delPendingKey]) {
    data[delPendingKey].splice(delPendingIdx, 1);
    if(!data[delPendingKey].length) delete data[delPendingKey];
    save(); renderCal(); renderStrip(); renderDay();
  }
  closeDelModal();
});

// ── Note popover ──
function showNotePopover(key, idx) {
  const b = (data[key]||[])[idx];
  if(!b) return;
  const ig = b.gender === "girl";
  const name = b.name || (ig ? "Baby Girl" : "Baby Boy");
  const [y,m,d] = key.split("-").map(Number);
  const dt = new Date(y,m-1,d);
  const dateStr = `${DAYS[dt.getDay()]}, ${MS[m-1]} ${d}`;
  const sub = [dateStr, b.time].filter(Boolean).join(" · ");

  document.getElementById("note-popover-avatar").innerHTML =
    `<div style="width:60px;height:60px;border-radius:50%;background:${ig?"#FEF0F6":"#EDF7FD"};border:2px solid ${ig?"#D4789A":"#5A9DC8"};display:flex;align-items:center;justify-content:center;">${ig?girlSVG(44):boySVG(44)}</div>`;
  document.getElementById("note-popover-name").textContent = name;
  document.getElementById("note-popover-sub").textContent = sub;

  const body = document.getElementById("note-popover-body");
  if(b.note) {
    body.textContent = b.note;
    body.style.display = "";
  } else {
    body.style.display = "none";
  }

  document.getElementById("note-overlay").classList.add("open");
  document.getElementById("note-popover").classList.add("open");
}

function closeNotePopover() {
  document.getElementById("note-overlay").classList.remove("open");
  document.getElementById("note-popover").classList.remove("open");
}

document.getElementById("note-overlay").addEventListener("click", closeNotePopover);
