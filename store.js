const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`;
}
function dKey(y,m,d) { return `${y}-${p2(m+1)}-${p2(d)}`; }
function p2(n) { return String(n).padStart(2,"0"); }
function esc(s) { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

// ── Calendar view state ──
let vY = new Date().getFullYear();
let vM = new Date().getMonth();
let selDate = todayKey();

// ── Arrival form state ──
let sg = null;

// ── Shift state ──
let shiftNoteOpen = false;

// ── Data stores ──
let data = {};
let shifts = {};

function load() { try { data = JSON.parse(localStorage.getItem("la3")||"{}"); } catch(e) { data={}; } }
function save() { localStorage.setItem("la3", JSON.stringify(data)); }
function loadShifts() { try { shifts = JSON.parse(localStorage.getItem("la-shifts")||"{}"); } catch(e) { shifts={}; } }
function saveShifts() { localStorage.setItem("la-shifts", JSON.stringify(shifts)); }

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
