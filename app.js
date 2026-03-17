const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

let vY = new Date().getFullYear();
let vM = new Date().getMonth();
let selDate = todayKey();
let sg = null;
let data = {};
let cDaily = null, cDonut = null;
let chartVY = new Date().getFullYear(), chartVM = new Date().getMonth();

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`;
}
function dKey(y,m,d) { return `${y}-${p2(m+1)}-${p2(d)}`; }
function p2(n) { return String(n).padStart(2,"0"); }
function load() { try { data = JSON.parse(localStorage.getItem("la3")||"{}"); } catch(e) { data={}; } }
function save() { localStorage.setItem("la3", JSON.stringify(data)); }
function babies(k) { return data[k]||[]; }

function monthStats(y,m) {
  const pfx = `${y}-${p2(m+1)}`;
  let g=0,b=0;
  Object.entries(data).forEach(([k,v])=>{ if(k.startsWith(pfx)) v.forEach(x=>x.gender==="girl"?g++:b++); });
  return {g,b,total:g+b};
}

function allStats() {
  let g=0,b=0,ds=new Set();
  Object.entries(data).forEach(([k,v])=>{ if(v.length){ds.add(k);v.forEach(x=>x.gender==="girl"?g++:b++);} });
  return {g,b,total:g+b,days:ds.size};
}

function switchTab(t) { setTab(t==="charts"?1:t==="babies"?2:0); }

function renderHeader() {
  const d = new Date();
  document.getElementById("hdr-date").textContent = `${DAYS[d.getDay()]} ${d.getDate()} ${MS[d.getMonth()]}`;
}

function renderStrip() {
  const s = monthStats(vY,vM);
  document.getElementById("strip-girls").textContent = s.g;
  document.getElementById("strip-boys").textContent = s.b;
  document.getElementById("strip-total").textContent = s.total;
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
    el.addEventListener("click",()=>{ selDate=key; renderCal(); renderDay(); });
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

  const list = document.getElementById("babies-list");
  if(!bs.length) {
    list.innerHTML=`<div class="empty-day"><div class="empty-face">${storkSVG()}</div><div class="empty-text">No arrivals recorded yet</div></div>`;
    return;
  }
  list.innerHTML = bs.map((b,i)=>{
    const ig = b.gender==="girl";
    return `<div class="baby-card">
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

let delPendingKey = null, delPendingIdx = null;

function delBaby(key, idx) {
  delPendingKey = key;
  delPendingIdx = idx;
  document.getElementById("del-overlay").classList.add("open");
  document.getElementById("del-modal").classList.add("open");
}

function closeDelModal() {
  document.getElementById("del-overlay").classList.remove("open");
  document.getElementById("del-modal").classList.remove("open");
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
    // Edit existing
    const existing = data[editingKey][editingIdx];
    data[editingKey][editingIdx] = {...existing, gender:sg, name, note};
  } else {
    // New entry
    const now = new Date();
    const time = now.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
    if(!data[selDate]) data[selDate]=[];
    data[selDate].push({gender:sg,note,name,time});
  }
  editingKey = null; editingIdx = null;
  save(); closeSheet(); renderCal(); renderStrip(); renderDay();
}

function esc(s) { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

function renderDailyChart() {
  const daysInMonth = new Date(chartVY, chartVM+1, 0).getDate();
  const labels=[], gd=[], bd=[];
  for(let d=1;d<=daysInMonth;d++) {
    const key=dKey(chartVY,chartVM,d);
    const bs=babies(key);
    labels.push(`${p2(chartVM+1)}/${p2(d)}`);
    gd.push(bs.filter(x=>x.gender==="girl").length);
    bd.push(bs.filter(x=>x.gender==="boy").length);
  }
  const maxVal=Math.max(5,...gd.map((g,i)=>g+bd[i]));
  document.getElementById("chart-month-label").textContent=`${MS[chartVM]} ${chartVY}`;

  const canvasD = document.getElementById("chart-daily");
  const wrapD = canvasD.parentElement;
  canvasD.width = wrapD.offsetWidth || 350;
  canvasD.height = 180;
  const ctxD = canvasD.getContext("2d");
  if(cDaily) cDaily.destroy();
  cDaily = new Chart(ctxD,{
    type:"bar",
    data:{labels,datasets:[
        {label:"Girls",data:gd,backgroundColor:"rgba(244,192,213,0.8)",borderRadius:4,borderSkipped:false},
        {label:"Boys",data:bd,backgroundColor:"rgba(170,207,232,0.8)",borderRadius:4,borderSkipped:false}
      ]},
    options:{
      responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{title:([t])=>{
              const d=parseInt(t.label.split("/")[1],10);
              return `${MS[chartVM]} ${d}, ${chartVY}`;
            }}}},
      scales:{
        x:{stacked:true,grid:{display:false},ticks:{maxTicksLimit:10,font:{size:9,family:"Figtree"},color:"#B0A090"}},
        y:{stacked:true,grid:{color:"rgba(80,60,40,0.05)"},ticks:{stepSize:1,precision:0,font:{size:10,family:"Figtree"},color:"#B0A090"},beginAtZero:true,max:maxVal}
      }
    }
  });
}


function renderCharts() {
  const all = allStats();

  document.getElementById("stat-grid").innerHTML=`
    <div class="stat-card"><div class="stat-card-num p">${all.g}</div><div class="stat-card-label">Total Girls</div></div>
    <div class="stat-card"><div class="stat-card-num b">${all.b}</div><div class="stat-card-label">Total Boys</div></div>
    <div class="stat-card"><div class="stat-card-num g">${all.total}</div><div class="stat-card-label">Total Births</div></div>
    <div class="stat-card"><div class="stat-card-num y">${all.days}</div><div class="stat-card-label">Days Recorded</div></div>`;

  renderDailyChart();

  const ctxDo = document.getElementById("chart-donut").getContext("2d");
  if(cDonut) cDonut.destroy();
  cDonut = new Chart(ctxDo,{
    type:"doughnut",
    data:{
      labels:["Girls","Boys"],
      datasets:[{
        data:all.total?[all.g,all.b]:[1,1],
        backgroundColor:["rgba(244,192,213,0.85)","rgba(170,207,232,0.85)"],
        borderWidth:0,hoverOffset:4
      }]
    },
    options:{
      responsive:true,maintainAspectRatio:false,cutout:"65%",
      plugins:{legend:{display:false},tooltip:{enabled:all.total>0}}
    }
  });
  const gPct = all.total ? Math.round((all.g/all.total)*100) : 50;
  const bPct = all.total ? 100-gPct : 50;
  document.getElementById("donut-legend").innerHTML=`
    <div style="display:flex;flex-direction:column;gap:10px">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:12px;height:12px;border-radius:50%;background:rgba(244,192,213,0.9);flex-shrink:0"></div>
        <div>
          <div style="font-size:12px;font-weight:600;color:var(--ink-mid)">Girls</div>
          <div style="font-family:var(--fd);font-size:20px;color:var(--pink-deep);line-height:1">${all.g} <span style="font-family:var(--fu);font-size:11px;color:var(--ink-light)">${gPct}%</span></div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:12px;height:12px;border-radius:50%;background:rgba(170,207,232,0.9);flex-shrink:0"></div>
        <div>
          <div style="font-size:12px;font-weight:600;color:var(--ink-mid)">Boys</div>
          <div style="font-family:var(--fd);font-size:20px;color:var(--blue-deep);line-height:1">${all.b} <span style="font-family:var(--fu);font-size:11px;color:var(--ink-light)">${bPct}%</span></div>
        </div>
      </div>
    </div>`;

  const dc = DAYS.map((_,i)=>({day:DAYS[i],g:0,b:0}));
  Object.entries(data).forEach(([k,v])=>{
    const dt=new Date(k+"T12:00:00");
    v.forEach(x=>x.gender==="girl"?dc[dt.getDay()].g++:dc[dt.getDay()].b++);
  });
  const sorted=[...dc].sort((a,b)=>(b.g+b.b)-(a.g+a.b)).slice(0,5);
  const maxB=Math.max(1,...sorted.map(x=>x.g+x.b));
  document.getElementById("busy-days").innerHTML=sorted.map(x=>{
    const t=x.g+x.b, w=Math.round((t/maxB)*100);
    return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
      <div style="width:32px;font-size:12px;font-weight:600;color:var(--ink-mid);flex-shrink:0">${x.day}</div>
      <div style="flex:1;height:10px;background:rgba(80,60,40,0.07);border-radius:10px;overflow:hidden">
        <div style="height:100%;width:${w}%;background:linear-gradient(90deg,var(--pink-mid),var(--blue-mid));border-radius:10px"></div>
      </div>
      <div style="width:20px;font-size:12px;font-weight:700;color:var(--ink-mid);text-align:right;flex-shrink:0">${t}</div>
    </div>`;
  }).join("");

}



// ── Gachapon Machine ──
let machineAnim = null;
let balls = [];
let machineShaking = false;
let crankAngle = 0;
let crankSpinning = false;
let crankVel = 0;

function getAllBabies() {
  const all = [];
  Object.entries(data).forEach(([k,v])=>{
    v.forEach((b,i)=>{ all.push({...b, date:k, idx:i}); });
  });
  return all;
}

function renderMachine() {
  const wrap = document.getElementById("machine-wrap");
  if(!wrap) return;
  const CW = Math.min(window.innerWidth - 32, 360);
  const W = CW - 60;
  const H = Math.round(CW * 1.35);
  wrap.innerHTML = `<canvas id="machine-canvas" width="${CW}" height="${H}" style="display:block"></canvas>
    <div class="machine-count" id="machine-count"></div>
    <div class="machine-hint" id="machine-hint"></div>`;

  const allBabies = getAllBabies();
  document.getElementById("machine-count").textContent =
      allBabies.length === 0 ? "No babies yet" :
          allBabies.length === 1 ? "1 baby" : `${allBabies.length} babies`;

  // Layout constants
  const crankOffset = 5; // half of crank width, so body visually centers
  const cx = CW/2 + crankOffset;
  const globeR = W * 0.44;
  const globeCY = globeR + W*0.06;
  const bodyTop = globeCY + globeR - 4;
  const bodyH = H * 0.28;
  const bodyBot = bodyTop + bodyH;

  // Init balls
  balls = allBabies.map((b,i)=>{
    const angle = (i / Math.max(allBabies.length,1)) * Math.PI * 2;
    const dist = globeR * 0.35 * Math.random();
    const br = Math.max(13, Math.min(20, W*0.058));
    return {
      x: cx + Math.cos(angle)*dist,
      y: globeCY + Math.sin(angle)*dist*0.6,
      vx: (Math.random()-0.5)*1.2,
      vy: (Math.random()-0.5)*1.2,
      radius: br,
      color: b.gender==="girl" ? "#F4C0D5" : "#AACFE8",
      stroke: b.gender==="girl" ? "#D4789A" : "#5A9DC8",
      data: b
    };
  });

  crankAngle = 0; crankVel = 0; crankSpinning = false;
  document.getElementById("ball-card").style.display = "none";

  if(machineAnim) cancelAnimationFrame(machineAnim);

  const canvas = document.getElementById("machine-canvas");
  const ctx = canvas.getContext("2d");

  function drawRoundRect(x,y,w,h,r) {
    ctx.beginPath(); ctx.roundRect(x,y,w,h,r);
  }

  function tick() {
    ctx.clearRect(0,0,CW,H);

    const shake = machineShaking ? (Math.random()-0.5)*5 : 0;

    // ── GLOBE ──
    // shadow under globe
    ctx.beginPath();
    ctx.ellipse(cx, globeCY+globeR+2, globeR*0.85, 8, 0, 0, Math.PI*2);
    ctx.fillStyle = "rgba(180,160,130,0.2)";
    ctx.fill();

    // globe fill
    ctx.beginPath();
    ctx.arc(cx+shake*0.3, globeCY, globeR, 0, Math.PI*2);
    ctx.fillStyle = "#F5F0E8";
    ctx.fill();

    // top color tint
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx+shake*0.3, globeCY, globeR-1, 0, Math.PI*2);
    ctx.clip();
    const grad = ctx.createLinearGradient(cx, globeCY-globeR, cx, globeCY);
    grad.addColorStop(0, "rgba(253,232,242,0.55)");
    grad.addColorStop(1, "rgba(253,232,242,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(cx-globeR, globeCY-globeR, globeR*2, globeR);
    ctx.restore();

    // ── BALLS (clipped to globe) ──
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx+shake*0.3, globeCY, globeR-3, 0, Math.PI*2);
    ctx.clip();

    balls.forEach(b=>{
      b.x += b.vx + shake*0.25;
      b.y += b.vy + shake*0.25;
      b.vx *= 0.992; b.vy *= 0.992;
      b.vy += 0.035;

      const dx=b.x-(cx+shake*0.3), dy=b.y-globeCY;
      const dist=Math.sqrt(dx*dx+dy*dy);
      const maxD=globeR-b.radius-3;
      if(dist>maxD) {
        const nx=dx/dist, ny=dy/dist;
        b.x=(cx+shake*0.3)+nx*maxD; b.y=globeCY+ny*maxD;
        const dot=b.vx*nx+b.vy*ny;
        b.vx-=2*dot*nx*0.65; b.vy-=2*dot*ny*0.65;
      }
      balls.forEach(o=>{
        if(o===b) return;
        const ox=b.x-o.x, oy=b.y-o.y, od=Math.sqrt(ox*ox+oy*oy), minD=b.radius+o.radius;
        if(od<minD&&od>0){
          const nx=ox/od,ny=oy/od,ov=(minD-od)/2;
          b.x+=nx*ov; b.y+=ny*ov; o.x-=nx*ov; o.y-=ny*ov;
          const dv=(b.vx-o.vx)*nx+(b.vy-o.vy)*ny;
          if(dv<0){b.vx-=dv*nx;b.vy-=dv*ny;o.vx+=dv*nx;o.vy+=dv*ny;}
        }
      });

      ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2);
      ctx.fillStyle=b.color; ctx.fill();
      ctx.strokeStyle=b.stroke; ctx.lineWidth=1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(b.x-b.radius*0.28, b.y-b.radius*0.3, b.radius*0.24, 0, Math.PI*2);
      ctx.fillStyle="rgba(255,255,255,0.6)"; ctx.fill();
      const lbl=b.data.name?b.data.name[0].toUpperCase():(b.data.gender==="girl"?"♀":"♂");
      ctx.fillStyle=b.stroke; ctx.font=`bold ${Math.round(b.radius*0.68)}px Figtree`;
      ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText(lbl, b.x, b.y+1);
    });
    ctx.restore();

    // globe outline + shine
    ctx.beginPath(); ctx.arc(cx+shake*0.3, globeCY, globeR, 0, Math.PI*2);
    ctx.strokeStyle="#C0AFA0"; ctx.lineWidth=2.5; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx-globeR*0.22+shake*0.3, globeCY-globeR*0.24, globeR*0.2, globeR*0.12, -0.3, 0, Math.PI*2);
    ctx.strokeStyle="rgba(255,255,255,0.65)"; ctx.lineWidth=3; ctx.stroke();

    // ── BODY BOX ──
    const bx = cx - W*0.40, bw = W*0.78;
    drawRoundRect(bx+shake*0.1, bodyTop, bw, bodyH, 10);
    ctx.fillStyle="#EDE4D8"; ctx.fill();
    ctx.strokeStyle="#C0AFA0"; ctx.lineWidth=2; ctx.stroke();

    // body top stripe
    ctx.fillStyle="#E0D4C4";
    drawRoundRect(bx+shake*0.1, bodyTop, bw, 10, [10,10,0,0]);
    ctx.fill();

    // coin slot
    const slotX=cx-22+shake*0.1, slotY=bodyTop+18, slotW=44, slotH=20;
    drawRoundRect(slotX, slotY, slotW, slotH, 6);
    ctx.fillStyle="#D0C4B4"; ctx.fill(); ctx.strokeStyle="#B8A898"; ctx.lineWidth=1.5; ctx.stroke();
    drawRoundRect(slotX+16, slotY+6, 12, 4, 2);
    ctx.fillStyle="rgba(100,80,60,0.35)"; ctx.fill();
    ctx.fillStyle="#A09080"; ctx.font="bold 9px Figtree"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText("¥100", cx+shake*0.1, slotY+slotH+10);

    // chute
    const chuteX=cx-W*0.18+shake*0.1, chuteW=W*0.36, chuteY=bodyTop+bodyH-38, chuteH=38;
    drawRoundRect(chuteX, chuteY, chuteW, chuteH, [0,0,10,10]);
    ctx.fillStyle="#D8CDBE"; ctx.fill(); ctx.strokeStyle="#B8A898"; ctx.lineWidth=1.5; ctx.stroke();
    // chute flap
    ctx.beginPath();
    ctx.moveTo(chuteX+6, chuteY+16);
    ctx.quadraticCurveTo(cx+shake*0.1, chuteY+10, chuteX+chuteW-6, chuteY+16);
    ctx.quadraticCurveTo(chuteX+chuteW-6, chuteY+chuteH-6, cx+shake*0.1, chuteY+chuteH-2);
    ctx.quadraticCurveTo(chuteX+6, chuteY+chuteH-6, chuteX+6, chuteY+16);
    ctx.fillStyle="#C8BAA8"; ctx.fill(); ctx.strokeStyle="#B8A898"; ctx.lineWidth=1.2; ctx.stroke();
    // slot
    drawRoundRect(cx-18+shake*0.1, chuteY+chuteH-12, 36, 5, 2.5);
    ctx.fillStyle="rgba(80,60,40,0.3)"; ctx.fill();

    // label panel
    const panH=22, panY=bodyTop+bodyH-panH-2;
    drawRoundRect(bx+25+shake*0.1, panY, bw-50, panH, 5);
    ctx.fillStyle="#F5EED8"; ctx.fill(); ctx.strokeStyle="#C0AFA0"; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle="#B0A080"; ctx.font="11px Figtree"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText("ガチャポン", cx+shake*0.1, panY+panH/2);

    // ── BASE ──
    const baseH=H*0.09, baseY=bodyTop+bodyH;
    drawRoundRect(bx+shake*0.1, baseY, bw, baseH, [0,0,12,12]);
    ctx.fillStyle="#E0D5C5"; ctx.fill(); ctx.strokeStyle="#C0AFA0"; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle="#D8CCBA";
    drawRoundRect(bx+shake*0.1, baseY+8, bw, 8, 0);
    ctx.fill();

    // ── CRANK ──
    const ckX=bx+bw+14, ckY=bodyTop+bodyH*0.38;
    // crank axle
    ctx.beginPath(); ctx.arc(ckX, ckY, 9, 0, Math.PI*2);
    ctx.fillStyle="#D0C4B4"; ctx.fill(); ctx.strokeStyle="#B0A090"; ctx.lineWidth=2; ctx.stroke();

    // spinning crank arm
    if(crankSpinning) crankAngle += crankVel;
    crankVel *= 0.97;
    if(Math.abs(crankVel) < 0.02) crankSpinning = false;

    ctx.save();
    ctx.translate(ckX, ckY);
    ctx.rotate(crankAngle);
    // arm
    ctx.beginPath(); ctx.roundRect(-4, 0, 8, 26, 4);
    ctx.fillStyle="#C8B8A8"; ctx.fill(); ctx.strokeStyle="#A89888"; ctx.lineWidth=1.5; ctx.stroke();
    // handle ball
    ctx.beginPath(); ctx.arc(0, 28, 8, 0, Math.PI*2);
    ctx.fillStyle="#EFA050"; ctx.fill(); ctx.strokeStyle="#C87830"; ctx.lineWidth=1.8; ctx.stroke();
    ctx.beginPath(); ctx.arc(-2.5, 25, 3, 0, Math.PI*2);
    ctx.fillStyle="rgba(255,255,255,0.4)"; ctx.fill();
    ctx.restore();

    machineAnim = requestAnimationFrame(tick);
  }
  tick();

  // Wire clicks: globe area = bounce, crank area = spin & draw
  canvas.addEventListener("click", function(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = CW / rect.width;
    const scaleY = H / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const ckX = cx - W*0.40 + W*0.78 + 14;
    const ckY = bodyTop + bodyH*0.38;
    const distCrank = Math.sqrt((mx-ckX)**2 + (my-ckY)**2);

    if(distCrank < 50) {
      // Crank clicked — spin and draw
      if(balls.length === 0) return;
      crankSpinning = true;
      crankVel = 0.55;
      machineShaking = true;
      balls.forEach(b=>{ b.vx+=(Math.random()-0.5)*10; b.vy+=(Math.random()-0.5)*10; });
      setTimeout(()=>{ machineShaking=false; }, 700);
      setTimeout(()=>{
        const pick = balls[Math.floor(Math.random()*balls.length)];
        const b = pick.data;
        const [y,m,d] = b.date.split("-");
        const dateStr = `${String(m).padStart(2,"0")}/${String(d).padStart(2,"0")}/${y}`;
        const ig = b.gender==="girl";
        const card = document.getElementById("ball-card");
        card.style.display = "block";
        card.style.animation = "none";
        void card.offsetWidth;
        card.style.animation = "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)";
        card.innerHTML = `
          <div style="display:flex;justify-content:center;margin-bottom:10px">
            <div style="width:52px;height:52px;border-radius:50%;background:${ig?"#FEF0F6":"#EDF7FD"};border:2px solid ${ig?"#D4789A":"#5A9DC8"};display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-size:22px;color:${ig?"#D4789A":"#5A9DC8"}">
              ${b.name ? b.name[0].toUpperCase() : (ig?"♀":"♂")}
            </div>
          </div>
          <div class="ball-card-name">${b.name || (ig ? "Baby Girl" : "Baby Boy")}</div>
          <div class="ball-card-sub">${ig?"Girl":"Boy"} · ${dateStr}${b.time ? " · "+b.time : ""}</div>
          ${b.note ? `<div class="ball-card-note">${esc(b.note)}</div>` : ""}
        `;
        card.scrollIntoView({behavior:"smooth", block:"nearest"});
      }, 500);
    } else {
      // Globe clicked — just bounce balls
      machineShaking = true;
      balls.forEach(b=>{ b.vx+=(Math.random()-0.5)*7; b.vy+=(Math.random()-0.5)*7; });
      setTimeout(()=>{ machineShaking=false; }, 500);
    }
  });
}

// ── Swaddled baby SVG illustrations ──
function storkSVG() {
  return `<svg width="72" height="72" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="32" cy="38" rx="12" ry="16" fill="#F8F4EE" stroke="#C8B8A8" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M22 36 Q14 30 16 22 Q20 28 26 30" fill="#EDE4D8" stroke="#C8B8A8" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M32 22 Q30 16 32 10 Q34 4 36 8 Q34 12 34 18" fill="#F8F4EE" stroke="#C8B8A8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <ellipse cx="34" cy="7" rx="5" ry="4.5" fill="#F8F4EE" stroke="#C8B8A8" stroke-width="1.4"/>
    <circle cx="36" cy="6" r="1" fill="#8B7B6B"/>
    <circle cx="36.4" cy="5.6" r="0.4" fill="white"/>
    <path d="M38 7 L45 8.5 L38 9" fill="#F0A050" stroke="#D08030" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M32 10 Q35 12 35 18 Q33 16 31 18 Q31 12 32 10 Z" fill="#D8CEC4" opacity="0.5"/>
    <path d="M28 53 L26 62" stroke="#F0A050" stroke-width="2" stroke-linecap="round"/>
    <path d="M36 53 L38 62" stroke="#F0A050" stroke-width="2" stroke-linecap="round"/>
    <path d="M26 62 L22 63 M26 62 L26 64 M26 62 L29 63" stroke="#F0A050" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M38 62 L34 63 M38 62 L38 64 M38 62 L41 63" stroke="#F0A050" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M20 28 Q10 20 12 10 Q14 4 18 6" fill="none" stroke="#F0C0D8" stroke-width="2" stroke-linecap="round" />
    <ellipse cx="14" cy="14" rx="6" ry="5" fill="#FDE8F2" stroke="#D4789A" stroke-width="1.4"/>
    <circle cx="13" cy="13" r="2.5" fill="#FFE8D8" stroke="#D4A090" stroke-width="1"/>
    <path d="M12 14 Q13 15.5 14 14" stroke="#C08080" stroke-width="0.8" stroke-linecap="round" fill="none"/>
  </svg>`;
}

function girlSVG(size) {
  size = size||52;
  // viewBox: 0 0 80 88 — girl fits circle perfectly with bow tucked in
  return `<svg width="${size}" height="${size}" viewBox="0 0 80 88" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="46" r="38" fill="#FEF8FB"/>
    <path d="M16 48 Q13 66 24 76 Q40 86 56 76 Q67 66 64 48 Q56 34 40 32 Q24 34 16 48 Z" fill="#FDE8F2" stroke="#D4789A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M23 52 Q40 45 57 52" fill="none" stroke="#F0C0D8" stroke-width="1.6" stroke-linecap="round"/>
    <ellipse cx="40" cy="30" rx="18" ry="16" fill="#FFF0E8" stroke="#D4789A" stroke-width="1.8"/>
    <ellipse cx="30" cy="33" rx="4.5" ry="3" fill="#F5B8CF" opacity="0.55"/>
    <ellipse cx="50" cy="33" rx="4.5" ry="3" fill="#F5B8CF" opacity="0.55"/>
    <path d="M33 23 Q36 27 39 23" fill="none" stroke="#C09090" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M41 23 Q44 27 47 23" fill="none" stroke="#C09090" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M38 28 Q40 30 42 28" fill="none" stroke="#C8A0A0" stroke-width="1.1" stroke-linecap="round"/>
    <path d="M34 35 Q40 39 46 35" fill="none" stroke="#C8A0A0" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M30 15 Q35 20 40 17 Q45 20 50 15 Q45 10 40 14 Q35 10 30 15 Z" fill="#F9C8DF" stroke="#D4789A" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="40" cy="15" r="3" fill="#F0A8C4" stroke="#D4789A" stroke-width="1.1"/>
    <path d="M16 60 Q7 56 9 48 Q13 43 17 50" fill="#FFF0E8" stroke="#D4789A" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M64 60 Q73 56 71 48 Q67 43 63 50" fill="#FFF0E8" stroke="#D4789A" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function boySVG(size) {
  size = size||52;
  return `<svg width="${size}" height="${size}" viewBox="0 0 80 88" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="46" r="38" fill="#F2FAFD"/>
    <path d="M16 50 Q13 68 24 78 Q40 88 56 78 Q67 68 64 50 Q56 36 40 34 Q24 36 16 50 Z" fill="#E4F3FA" stroke="#5A9DC8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M23 54 Q40 47 57 54" fill="none" stroke="#AADCF0" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M21 66 Q40 60 59 66" fill="none" stroke="#AADCF0" stroke-width="1.1" stroke-linecap="round" opacity="0.7"/>
    <ellipse cx="40" cy="32" rx="18" ry="16" fill="#FFF0E8" stroke="#5A9DC8" stroke-width="1.8"/>
    <ellipse cx="30" cy="35" rx="4.5" ry="3" fill="#8EC4E4" opacity="0.45"/>
    <ellipse cx="50" cy="35" rx="4.5" ry="3" fill="#8EC4E4" opacity="0.45"/>
    <path d="M33 25 Q36 29 39 25" fill="none" stroke="#8AAABB" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M41 25 Q44 29 47 25" fill="none" stroke="#8AAABB" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M38 30 Q40 32 42 30" fill="none" stroke="#9AAABB" stroke-width="1.1" stroke-linecap="round"/>
    <path d="M34 37 Q40 41 46 37" fill="none" stroke="#9AAABB" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M22 18 Q20 8 40 4 Q60 8 58 18 Z" fill="#8EC4E4" stroke="#5A9DC8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M20 18 Q40 24 60 18" fill="#C0DFF0" stroke="#5A9DC8" stroke-width="1.4" stroke-linecap="round"/>
    <circle cx="40" cy="4" r="4.5" fill="#C0DFF0" stroke="#5A9DC8" stroke-width="1.4"/>
    <path d="M16 62 Q7 58 9 50 Q13 45 17 52" fill="#FFF0E8" stroke="#5A9DC8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M64 62 Q73 58 71 50 Q67 45 63 52" fill="#FFF0E8" stroke="#5A9DC8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

document.getElementById("fab").addEventListener("click",openSheet);
document.getElementById("overlay").addEventListener("click",closeSheet);
document.getElementById("save-btn").addEventListener("click",saveArrival);

// ── Swipe-to-close on sheet ──
(function() {
  const sheet = document.getElementById("sheet");
  let startY = 0, dragging = false;

  sheet.addEventListener("touchstart", function(e) {
    if(e.target.closest("input, textarea, button, .gnd-btn")) return;
    startY = e.touches[0].clientY;
    dragging = true;
    sheet.style.transition = "none";
  }, {passive:true});

  sheet.addEventListener("touchmove", function(e) {
    if(!dragging) return;
    var dy = e.touches[0].clientY - startY;
    if(dy > 0) {
      sheet.style.transform = "translateX(-50%) translateY(" + dy + "px)";
    }
  }, {passive:true});

  sheet.addEventListener("touchend", function(e) {
    if(!dragging) return;
    dragging = false;
    var dy = e.changedTouches[0].clientY - startY;
    sheet.style.transition = "";
    sheet.style.transform = "";
    if(dy > 60) {
      closeSheet();
    }
  }, {passive:true});
})();

document.getElementById("prev-m").addEventListener("click",()=>{ vM--; if(vM<0){vM=11;vY--;} renderCal();renderStrip(); });
document.getElementById("next-m").addEventListener("click",()=>{ vM++; if(vM>11){vM=0;vY++;} renderCal();renderStrip(); });
document.getElementById("chart-prev-m").addEventListener("click",()=>{ chartVM--; if(chartVM<0){chartVM=11;chartVY--;} renderDailyChart(); });
document.getElementById("chart-next-m").addEventListener("click",()=>{ chartVM++; if(chartVM>11){chartVM=0;chartVY++;} renderDailyChart(); });

// ── Swipe between tabs ──
let swipeStartX=0, swipeStartY=0, currentTab=0;
const pages = [document.getElementById("page-calendar"), document.getElementById("page-stats"), document.getElementById("page-babies")];

function setTab(idx) {
  const prev = currentTab;
  if(idx === prev) return;
  currentTab = idx;
  const incoming = pages[idx];
  const outgoing = pages[prev];

  // Show incoming page first (so Chart.js can measure it), then animate
  outgoing.classList.remove("active");
  incoming.classList.remove("slide-in-left","slide-in-right");
  incoming.classList.add("active");
  // Direction: going right (idx>prev) slides in from right, left from left
  requestAnimationFrame(()=>{
    incoming.classList.add(idx > prev ? "slide-in-left" : "slide-in-right");
  });

  document.getElementById("tab-calendar").classList.toggle("active", idx===0);
  document.getElementById("tab-stats").classList.toggle("active", idx===1);
  document.getElementById("tab-babies").classList.toggle("active", idx===2);
  document.getElementById("fab").style.display = idx === 0 ? "flex" : "none";
  if(idx===1) renderCharts();
  if(idx===2) setTimeout(renderMachine, 50);
}

// Override tab button clicks
document.getElementById("tab-calendar").onclick=()=>setTab(0);
document.getElementById("tab-stats").onclick=()=>setTab(1);
document.getElementById("tab-babies").onclick=()=>setTab(2);

document.getElementById("app").addEventListener("touchstart",e=>{ swipeStartX=e.touches[0].clientX; swipeStartY=e.touches[0].clientY; },{passive:true});
document.getElementById("app").addEventListener("touchend",e=>{
  const dx=e.changedTouches[0].clientX-swipeStartX;
  const dy=e.changedTouches[0].clientY-swipeStartY;
  if(Math.abs(dx)>Math.abs(dy) && Math.abs(dx)>50) {
    if(dx<0 && currentTab<2) setTab(currentTab+1);
    else if(dx>0 && currentTab>0) setTab(currentTab-1);
  }
},{passive:true});

load(); renderHeader(); renderStrip(); renderCal(); renderDay();
document.getElementById("gnd-face-girl").innerHTML = girlSVG(56);
document.getElementById("gnd-face-boy").innerHTML = boySVG(56);

// Generate app icon dynamically as PNG and set as apple-touch-icon
(function() {
  const c = document.createElement("canvas");
  c.width = 180; c.height = 180;
  const ctx = c.getContext("2d");
  // Background rounded rect
  ctx.fillStyle = "#FEF8FB";
  ctx.beginPath(); ctx.roundRect(0,0,180,180,40); ctx.fill();
  // Swaddle body
  ctx.fillStyle = "#FDE8F2"; ctx.strokeStyle = "#D4789A"; ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(48,100); ctx.quadraticCurveTo(44,130,58,144);
  ctx.quadraticCurveTo(90,162,122,144); ctx.quadraticCurveTo(136,130,132,100);
  ctx.quadraticCurveTo(118,76,90,72); ctx.quadraticCurveTo(62,76,48,100);
  ctx.fill(); ctx.stroke();
  // Head
  ctx.fillStyle = "#FFF0E8"; ctx.strokeStyle = "#D4789A"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(90,72,36,32,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
  // Cheeks
  ctx.fillStyle = "rgba(245,184,207,0.55)";
  ctx.beginPath(); ctx.ellipse(74,78,9,6,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(106,78,9,6,0,0,Math.PI*2); ctx.fill();
  // Eyes
  ctx.strokeStyle = "#C09090"; ctx.lineWidth = 2.5; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(78,63); ctx.quadraticCurveTo(84,69,90,63); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(90,63); ctx.quadraticCurveTo(96,69,102,63); ctx.stroke();
  // Smile
  ctx.strokeStyle = "#C8A0A0"; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(82,82); ctx.quadraticCurveTo(90,88,98,82); ctx.stroke();
  // Bow
  ctx.fillStyle = "#F9C8DF"; ctx.strokeStyle = "#D4789A"; ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(64,42); ctx.quadraticCurveTo(72,52,90,47);
  ctx.quadraticCurveTo(108,52,116,42); ctx.quadraticCurveTo(108,32,90,38);
  ctx.quadraticCurveTo(72,32,64,42);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#F0A8C4"; ctx.strokeStyle = "#D4789A"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(90,42,7,0,Math.PI*2); ctx.fill(); ctx.stroke();
  // Set as apple-touch-icon
  const url = c.toDataURL("image/png");
  let link = document.querySelector("link[rel='apple-touch-icon']");
  if(!link) { link = document.createElement("link"); link.rel = "apple-touch-icon"; document.head.appendChild(link); }
  link.href = url;
})();

// ── Service worker with auto-refresh ──
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").then(function(reg) {
    reg.addEventListener("updatefound", function() {
      var newWorker = reg.installing;
      newWorker.addEventListener("statechange", function() {
        if (newWorker.state === "activated") {
          window.location.reload();
        }
      });
    });
  });
}