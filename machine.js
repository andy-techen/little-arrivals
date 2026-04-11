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

  const crankOffset = 5;
  const cx = CW/2 + crankOffset;
  const globeR = W * 0.44;
  const globeCY = globeR + W*0.06;
  const bodyTop = globeCY + globeR - 4;
  const bodyH = H * 0.28;
  const bodyBot = bodyTop + bodyH;

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
    ctx.beginPath();
    ctx.ellipse(cx, globeCY+globeR+2, globeR*0.85, 8, 0, 0, Math.PI*2);
    ctx.fillStyle = "rgba(180,160,130,0.2)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx+shake*0.3, globeCY, globeR, 0, Math.PI*2);
    ctx.fillStyle = "#F5F0E8";
    ctx.fill();

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

    ctx.beginPath(); ctx.arc(cx+shake*0.3, globeCY, globeR, 0, Math.PI*2);
    ctx.strokeStyle="#C0AFA0"; ctx.lineWidth=2.5; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx-globeR*0.22+shake*0.3, globeCY-globeR*0.24, globeR*0.2, globeR*0.12, -0.3, 0, Math.PI*2);
    ctx.strokeStyle="rgba(255,255,255,0.65)"; ctx.lineWidth=3; ctx.stroke();

    // ── BODY BOX ──
    const bx = cx - W*0.40, bw = W*0.78;
    drawRoundRect(bx+shake*0.1, bodyTop, bw, bodyH, 10);
    ctx.fillStyle="#EDE4D8"; ctx.fill();
    ctx.strokeStyle="#C0AFA0"; ctx.lineWidth=2; ctx.stroke();

    ctx.fillStyle="#E0D4C4";
    drawRoundRect(bx+shake*0.1, bodyTop, bw, 10, [10,10,0,0]);
    ctx.fill();

    const slotX=cx-22+shake*0.1, slotY=bodyTop+18, slotW=44, slotH=20;
    drawRoundRect(slotX, slotY, slotW, slotH, 6);
    ctx.fillStyle="#D0C4B4"; ctx.fill(); ctx.strokeStyle="#B8A898"; ctx.lineWidth=1.5; ctx.stroke();
    drawRoundRect(slotX+16, slotY+6, 12, 4, 2);
    ctx.fillStyle="rgba(100,80,60,0.35)"; ctx.fill();
    ctx.fillStyle="#A09080"; ctx.font="bold 9px Figtree"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText("¥100", cx+shake*0.1, slotY+slotH+10);

    const chuteX=cx-W*0.18+shake*0.1, chuteW=W*0.36, chuteY=bodyTop+bodyH-38, chuteH=38;
    drawRoundRect(chuteX, chuteY, chuteW, chuteH, [0,0,10,10]);
    ctx.fillStyle="#D8CDBE"; ctx.fill(); ctx.strokeStyle="#B8A898"; ctx.lineWidth=1.5; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(chuteX+6, chuteY+16);
    ctx.quadraticCurveTo(cx+shake*0.1, chuteY+10, chuteX+chuteW-6, chuteY+16);
    ctx.quadraticCurveTo(chuteX+chuteW-6, chuteY+chuteH-6, cx+shake*0.1, chuteY+chuteH-2);
    ctx.quadraticCurveTo(chuteX+6, chuteY+chuteH-6, chuteX+6, chuteY+16);
    ctx.fillStyle="#C8BAA8"; ctx.fill(); ctx.strokeStyle="#B8A898"; ctx.lineWidth=1.2; ctx.stroke();
    drawRoundRect(cx-18+shake*0.1, chuteY+chuteH-12, 36, 5, 2.5);
    ctx.fillStyle="rgba(80,60,40,0.3)"; ctx.fill();

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
    ctx.beginPath(); ctx.arc(ckX, ckY, 9, 0, Math.PI*2);
    ctx.fillStyle="#D0C4B4"; ctx.fill(); ctx.strokeStyle="#B0A090"; ctx.lineWidth=2; ctx.stroke();

    if(crankSpinning) crankAngle += crankVel;
    crankVel *= 0.97;
    if(Math.abs(crankVel) < 0.02) crankSpinning = false;

    ctx.save();
    ctx.translate(ckX, ckY);
    ctx.rotate(crankAngle);
    ctx.beginPath(); ctx.roundRect(-4, 0, 8, 26, 4);
    ctx.fillStyle="#C8B8A8"; ctx.fill(); ctx.strokeStyle="#A89888"; ctx.lineWidth=1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 28, 8, 0, Math.PI*2);
    ctx.fillStyle="#EFA050"; ctx.fill(); ctx.strokeStyle="#C87830"; ctx.lineWidth=1.8; ctx.stroke();
    ctx.beginPath(); ctx.arc(-2.5, 25, 3, 0, Math.PI*2);
    ctx.fillStyle="rgba(255,255,255,0.4)"; ctx.fill();
    ctx.restore();

    machineAnim = requestAnimationFrame(tick);
  }
  tick();

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
      machineShaking = true;
      balls.forEach(b=>{ b.vx+=(Math.random()-0.5)*7; b.vy+=(Math.random()-0.5)*7; });
      setTimeout(()=>{ machineShaking=false; }, 500);
    }
  });
}
