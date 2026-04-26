let swipeStartX=0, swipeStartY=0, currentTab=0;
const pages = [
  document.getElementById("page-calendar"),
  document.getElementById("page-stats"),
  document.getElementById("page-babies")
];

function switchTab(t) { setTab(t==="charts"?1:t==="babies"?2:0); }

function setTab(idx) {
  const prev = currentTab;
  if(idx === prev) return;
  currentTab = idx;
  const incoming = pages[idx];
  const outgoing = pages[prev];

  outgoing.classList.remove("active");
  incoming.classList.remove("slide-in-left","slide-in-right");
  incoming.classList.add("active");
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

// Tab buttons
document.getElementById("tab-calendar").onclick=()=>setTab(0);
document.getElementById("tab-stats").onclick=()=>setTab(1);
document.getElementById("tab-babies").onclick=()=>setTab(2);

// Calendar nav
document.getElementById("prev-m").addEventListener("click",()=>{ vM--; if(vM<0){vM=11;vY--;} renderCal();renderStrip(); });
document.getElementById("next-m").addEventListener("click",()=>{ vM++; if(vM>11){vM=0;vY++;} renderCal();renderStrip(); });

// Chart nav
document.getElementById("chart-prev-m").addEventListener("click",()=>{ chartVM--; if(chartVM<0){chartVM=11;chartVY--;} renderDailyChart(); });
document.getElementById("chart-next-m").addEventListener("click",()=>{ chartVM++; if(chartVM>11){chartVM=0;chartVY++;} renderDailyChart(); });

// FAB + arrival sheet
document.getElementById("fab").addEventListener("click",openSheet);
document.getElementById("overlay").addEventListener("click",closeSheet);
document.getElementById("save-btn").addEventListener("click",saveArrival);

// Swipe-to-close on arrival sheet
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
    if(dy > 60) closeSheet();
  }, {passive:true});
})();

// Swipe between tabs
let swipeOnCal = false;
document.getElementById("app").addEventListener("touchstart",e=>{
  swipeStartX=e.touches[0].clientX;
  swipeStartY=e.touches[0].clientY;
  swipeOnCal = !!e.target.closest(".cal-card");
},{passive:true});
document.getElementById("app").addEventListener("touchend",e=>{
  const dx=e.changedTouches[0].clientX-swipeStartX;
  const dy=e.changedTouches[0].clientY-swipeStartY;
  if(Math.abs(dx)>Math.abs(dy) && Math.abs(dx)>50) {
    if(currentTab === 0 && swipeOnCal) {
      if(dx<0) { vM++; if(vM>11){vM=0;vY++;} renderCal(); renderStrip(); }
      else      { vM--; if(vM<0){vM=11;vY--;} renderCal(); renderStrip(); }
    } else {
      if(dx<0 && currentTab<2) setTab(currentTab+1);
      else if(dx>0 && currentTab>0) setTab(currentTab-1);
    }
  }
},{passive:true});

// ── Init ──
load(); loadShifts(); loadProfile(); renderHeader(); renderStrip(); renderCal(); renderDay();
document.getElementById("gnd-face-girl").innerHTML = girlSVG(56);
document.getElementById("gnd-face-boy").innerHTML = boySVG(56);

// Generate app icon
(function() {
  const size = 180;
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#FEF8FB";
  ctx.beginPath(); ctx.roundRect(0,0,size,size,40); ctx.fill();

  const svgBlob = new Blob([girlSVG(160)], {type:"image/svg+xml"});
  const svgUrl = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.onload = function() {
    ctx.drawImage(img, 10, 2, 160, 176);
    URL.revokeObjectURL(svgUrl);
    document.getElementById("apple-touch-icon").href = c.toDataURL("image/png");
  };
  img.src = svgUrl;
})();

// Service worker with auto-refresh
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
