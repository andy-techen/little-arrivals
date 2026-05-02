let cDaily = null, cDonut = null;
let chartVY = new Date().getFullYear(), chartVM = new Date().getMonth();

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
