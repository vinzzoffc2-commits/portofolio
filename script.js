/* =========================================================
   SCROLL LOCK
========================================================= */
function lockScroll(){
  document.body.classList.add('no-scroll');
  window.addEventListener('wheel',    stopEv, {passive:false});
  window.addEventListener('touchmove',stopEv, {passive:false});
  window.addEventListener('keydown',  stopKey, false);
}
function unlockScroll(){
  document.body.classList.remove('no-scroll');
  window.removeEventListener('wheel',    stopEv);
  window.removeEventListener('touchmove',stopEv);
  window.removeEventListener('keydown',  stopKey);
}
function stopEv(e){e.preventDefault()}
function stopKey(e){if([32,33,34,35,36,37,38,39,40].includes(e.keyCode))e.preventDefault()}

/* =========================================================
   CONSTELLATION BACKGROUND
========================================================= */
const canvas = document.getElementById('bg-canvas');
const ctx    = canvas.getContext('2d');
let parts    = [];
const DENSITY = window.innerWidth < 768 ? 40 : 100;
const MAX_D   = 110;

function resizeCanvas(){ canvas.width=window.innerWidth; canvas.height=window.innerHeight; }
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle{
  constructor(){
    this.x  = Math.random()*canvas.width;
    this.y  = Math.random()*canvas.height;
    this.vx = (Math.random()-.5)*.6;
    this.vy = (Math.random()-.5)*.6;
    this.r  = Math.random()*1+.8;
  }
  draw(){ctx.beginPath();ctx.arc(this.x,this.y,this.r,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill()}
  update(){
    if(this.x<0||this.x>canvas.width)  this.vx=-this.vx;
    if(this.y<0||this.y>canvas.height) this.vy=-this.vy;
    this.x+=this.vx; this.y+=this.vy;
  }
}
function initParts(){ parts=[]; for(let i=0;i<DENSITY;i++) parts.push(new Particle()); }
function drawParts(){
  for(let i=0;i<parts.length;i++){
    parts[i].update(); parts[i].draw();
    for(let j=i+1;j<parts.length;j++){
      const dx=parts[i].x-parts[j].x, dy=parts[i].y-parts[j].y;
      const d=Math.sqrt(dx*dx+dy*dy);
      if(d<MAX_D){
        const a=Math.pow(1-d/MAX_D,2);
        ctx.beginPath();
        ctx.strokeStyle=`rgba(255,255,255,${a})`;
        ctx.lineWidth=1.1;
        ctx.moveTo(parts[i].x,parts[i].y);
        ctx.lineTo(parts[j].x,parts[j].y);
        ctx.stroke();
      }
    }
  }
}
(function loop(){ ctx.clearRect(0,0,canvas.width,canvas.height); drawParts(); requestAnimationFrame(loop); })();
initParts();

/* =========================================================
   EASING & ANIMATION HELPERS
========================================================= */
const easeInOutCubic = t => t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
const easeInOutQuart = t => t<.5 ? 8*t*t*t*t : 1-Math.pow(-2*t+2,4)/2;
const easeOutCubic   = t => 1-Math.pow(1-t,3);
const lerp = (a,b,t) => a+(b-a)*t;

function tween(dur, onTick, onDone){
  const t0 = performance.now();
  function frame(now){
    const p = Math.min((now-t0)/dur, 1);
    onTick(p);
    if(p<1) requestAnimationFrame(frame);
    else if(onDone) onDone();
  }
  requestAnimationFrame(frame);
}

/* =========================================================
   TRANSITION SEQUENCE
========================================================= */
window.addEventListener('load', ()=>{
  lockScroll();
  setTimeout(runTransition, 2200);
});

function runTransition(){
  const loaderWrap = document.getElementById('loader-wrapper');
  const loaderSvg  = document.getElementById('loader-svg');
  const skugga     = document.querySelector('.skugga');
  const tRing      = document.getElementById('t-ring');
  const tSvg       = document.getElementById('t-svg');
  const tFill      = document.getElementById('t-fill');
  const tStroke    = document.getElementById('t-stroke');
  const profileImg = document.getElementById('profile-img');

  // Pause the dashed animations
  loaderSvg.querySelectorAll('.halvan,.strecken').forEach(el=>el.style.animationPlayState='paused');
  skugga.querySelectorAll('.halvan,.strecken').forEach(el=>el.style.animationPlayState='paused');
  skugga.style.opacity = '0';

  /* ---- helper: set ring position & size ---- */
  function setRing(cx, cy, size){
    tRing.style.left = cx + 'px';
    tRing.style.top  = cy + 'px';
    tSvg.style.width  = size + 'px';
    tSvg.style.height = size + 'px';
    tSvg.setAttribute('width',  size);
    tSvg.setAttribute('height', size);
  }

  // Initial ring center = center of screen (same as loader)
  const scx = window.innerWidth  / 2;
  const scy = window.innerHeight / 2;
  setRing(scx, scy, 200);

  /* ==============================================
     PHASE 1 — Dashed arcs merge into solid ring
     Achieved by animating stroke-dasharray toward
     a full circle (628 ≈ 2πr for r=100) and
     simultaneously cross-fading from loader SVG
     to transition ring fill.
     Duration: 700ms
  ============================================== */
  const FULL_DA = 628; // full circumference of r=100 circle, large gap=0
  const halvan  = loaderSvg.querySelector('.halvan');
  const strecken= loaderSvg.querySelector('.strecken');

  // snapshot current dasharray for interpolation
  const startDA_h  = 180, startGap_h  = 800;
  const startDA_s  = 26,  startGap_s  = 54;

  tRing.style.display = 'block';

  tween(700, p=>{
    const e = easeInOutCubic(p);
    // expand dasharray toward full circle, shrink gap toward 0
    const da_h  = lerp(startDA_h,  FULL_DA, e);
    const gap_h = lerp(startGap_h, 0,       e);
    const da_s  = lerp(startDA_s,  FULL_DA, e);
    const gap_s = lerp(startGap_s, 0,       e);
    halvan.style.strokeDasharray   = `${da_h} ${gap_h}`;
    strecken.style.strokeDasharray = `${da_s} ${gap_s}`;
    // fade in solid fill ring on top
    tFill.setAttribute('opacity', e * 0.97);
    tStroke.setAttribute('stroke-width', lerp(0, 22, e));
  }, ()=>{

  /* ==============================================
     PHASE 2 — Loader fades, ring shrinks to dot
     Duration: 600ms
  ============================================== */
  loaderWrap.classList.add('hide');

  tween(600, p=>{
    const e = easeInOutCubic(p);
    // shrink from 200px → 12px (dot)
    const sz = lerp(200, 12, e);
    setRing(scx, scy, sz);
  }, ()=>{

  /* ==============================================
     PHASE 3 — Dot travels up to profile img
     while expanding to match photo diameter
     Duration: 900ms
  ============================================== */
  // Show page now (behind the ring)
  document.getElementById('main-content').style.visibility = 'visible';
  document.getElementById('main-content').style.opacity    = '1';

  const rect    = profileImg.getBoundingClientRect();
  const imgCX   = rect.left + rect.width  / 2;
  const imgCY   = rect.top  + rect.height / 2;
  // target size = photo diameter + 6px for border overlap
  const targetSz = rect.width + 6;

  tween(900, p=>{
    const ePos  = easeInOutCubic(p);
    const eSz   = easeOutCubic(p);
    const cx = lerp(scx,   imgCX,    ePos);
    const cy = lerp(scy,   imgCY,    ePos);
    const sz = lerp(12,    targetSz, eSz);
    setRing(cx, cy, sz);
  }, ()=>{

  /* ==============================================
     PHASE 4 — Hollow out: fill shrinks inward
     revealing the photo, stroke thins to 3px
     Duration: 800ms
  ============================================== */
  tween(800, p=>{
    const e = easeInOutQuart(p);
    // fill radius 88 → 0  (hole opens from center outward)
    tFill.setAttribute('r', lerp(88, 0, e));
    // stroke 22 → 3
    tStroke.setAttribute('stroke-width', lerp(22, 3, e));
    // photo fades in
    profileImg.style.opacity = e;
  }, ()=>{

  /* ==============================================
     PHASE 5 — Ring fades, CSS border takes over
     Duration: 350ms
  ============================================== */
  tween(350, p=>{
    const e = easeInOutCubic(p);
    tRing.style.opacity = 1 - e;
  }, ()=>{
    tRing.style.display = 'none';
    profileImg.style.opacity = '1';

    // Unlock scroll
    unlockScroll();

    // Stagger reveal: photo already visible, now cascade rest
    const staggerEls = document.querySelectorAll('.stagger');
    staggerEls.forEach((el, i)=>{
      // skip profile img (i=0) — already shown
      if(i === 0) return;
      setTimeout(()=> el.classList.add('in'), i * 150);
    });

    // Scroll reveal observer for sections below
    setTimeout(initScrollObserver, 400);
  });
  });
  });
  });
  });
}

/* =========================================================
   SCROLL REVEAL OBSERVER
========================================================= */
function initScrollObserver(){
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(!e.isIntersecting) return;
      if(e.target.classList.contains('reveal'))    e.target.classList.add('active');
      if(e.target.classList.contains('skill-card')){ animateSkill(e.target); obs.unobserve(e.target); }
    });
  },{threshold:0.1});
  document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
  document.querySelectorAll('.skill-card').forEach(el=>obs.observe(el));
}

function animateSkill(card){
  const target = parseInt(card.getAttribute('data-target'));
  const prog   = card.querySelector('.progress');
  const pct    = card.querySelector('.percent-text');
  prog.style.strokeDashoffset = 440 - (target/100)*440;
  let cur=0;
  const step = target/(2000/20);
  const iv = setInterval(()=>{
    cur+=step; if(cur>=target){cur=target;clearInterval(iv);}
    pct.innerText = Math.round(cur)+'%';
  },20);
}