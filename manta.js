/* Décor autonome : aucune dépendance, aucun accès aux données de navigation. */
(() => {
  'use strict';
  const ocean = document.getElementById('ocean');
  if (!ocean) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const slots = [...ocean.querySelectorAll('.manta')];
  const particles = [];
  const history = [];
  let width = innerWidth, height = innerHeight, frame = 0, last = 0, elapsed = 0, wingTime = 0;
  let customReduced = document.documentElement.classList.contains('reduce-motion');
  let boostUntil = 0, sampleAt = 0;
  const pointer = { x: -1000, y: -1000 };
  const reduced = () => motion.matches || customReduced;
  const rays = slots.map((node, index) => ({node, index, angle:0, x:0, y:0, offsetX:0, offsetY:0, wings:[], tail:null, ready:false}));
  const style = document.createElement('style');
  style.textContent = '.manta-art svg{width:100%;height:auto;overflow:visible;stroke:none}.manta-art svg g{transform-box:view-box;transform-origin:38% 59%}.manta-trail{position:absolute;left:0;top:0;width:3px;height:3px;background:#73ecff;border-radius:50%;box-shadow:0 0 9px #38e1ff66;opacity:0;will-change:transform,opacity}.manta{left:0;top:0;right:auto;width:300px;will-change:transform}.manta-far{opacity:.25!important}.manta-near{opacity:.35!important}@media(max-width:600px){.manta{width:160px}}';
  document.head.append(style);
  for (let i = 0; i < 14; i++) {
    const particle = document.createElement('span');
    particle.className = 'manta-trail'; ocean.append(particle); particles.push(particle);
  }
  function position(ray, seconds) {
    const phase = ray.index ? 7.7 : 0;
    return {
      x: width * (.48 + .29 * Math.sin(seconds / 19 + phase) + .09 * Math.sin(seconds / 31 + phase)),
      y: height * (.47 + .23 * Math.sin(seconds / 24 + phase + 1) + .12 * Math.sin(seconds / 15 + phase))
    };
  }
  function still() {
    rays.forEach((ray, i) => {
      ray.node.style.transform = `translate3d(${width*(i ? .19 : .7)}px,${height*(i ? .77 : .47)}px,0) translate(-50%,-50%) rotate(${i ? -18 : 10}deg) scale(${i ? .64 : 1.15})`;
      ray.wings.forEach(wing => {wing.style.transform='none';});
      if(ray.tail)ray.tail.style.transform='none';
    });
    particles.forEach(particle => {particle.style.opacity='0';});
  }
  function tick(now) {
    frame = 0;
    if(document.hidden || reduced())return;
    const dt = last ? Math.min((now-last)/1000, .05) : 0;
    last=now;
    wingTime += dt;
    elapsed += dt * 1.55 * (now < boostUntil ? 2.4 : 1);
    for(const ray of rays) {
      const point=position(ray,elapsed);
      const dx=point.x-pointer.x, dy=point.y-pointer.y, distance=Math.hypot(dx,dy);
      const force=ray.index===0 && distance<150 ? (1-distance/150)*65 : 0;
      const mix=1-Math.exp(-dt*2.5);
      ray.offsetX += ((distance>0 ? dx/distance*force : 0)-ray.offsetX)*mix;
      ray.offsetY += ((distance>0 ? dy/distance*force : 0)-ray.offsetY)*mix;
      const x=point.x+ray.offsetX, y=point.y+ray.offsetY;
      const next=position(ray,elapsed+.1);
      const target=Math.atan2(next.y-point.y,next.x-point.x)+.8;
      const delta=Math.atan2(Math.sin(target-ray.angle),Math.cos(target-ray.angle));
      ray.angle+=delta*(1-Math.exp(-dt*1.3));
      ray.x=x; ray.y=y;
      const bank=Math.sin(wingTime/3+ray.index)*4;
      ray.node.style.transform=`translate3d(${x}px,${y}px,0) translate(-50%,-50%) rotate(${ray.angle*180/Math.PI+bank}deg) scale(${ray.index ? .6 : 1})`;
      const flap=Math.sin(wingTime*Math.PI/1.35+ray.index);
      if(ray.wings.length) {
        ray.wings[0].style.transform=`rotate(${flap*4}deg) skewY(${flap*3}deg)`;
        ray.wings[1].style.transform=`rotate(${-flap*4}deg) skewY(${-flap*3}deg)`;
      }
      if(ray.tail)ray.tail.style.transform=`rotate(${Math.sin(wingTime*Math.PI/1.35+.75)*4}deg)`;
    }
    if(elapsed-sampleAt>.15) {
      sampleAt=elapsed;
      const ray=rays[0];
      if(ray)history.unshift({x:ray.x,y:ray.y});
      if(history.length>particles.length)history.pop();
    }
    particles.forEach((particle,index)=>{
      const point=history[index];
      if(!point)return;
      particle.style.transform=`translate3d(${point.x-18}px,${point.y+24}px,0) scale(${1-index*.035})`;
      particle.style.opacity=String((1-index/particles.length)*.24);
    });
    frame=requestAnimationFrame(tick);
  }
  function sync() {
    if(frame)cancelAnimationFrame(frame);
    frame=0;last=0;
    if(reduced())still();
    else if(!document.hidden)frame=requestAnimationFrame(tick);
  }
  fetch('assets/manta.svg').then(response=>{if(!response.ok)throw new Error('manta');return response.text();}).then(source=>{
    rays.forEach(ray=>{
      // Les deux SVG ont chacun leurs identifiants de dégradé et de groupes.
      const markup=source.replace(/id="([^"]+)"/g,(_,id)=>`id="m${ray.index}-${id}"`).replace(/url\(#([^)]+)\)/g,(_,id)=>`url(#m${ray.index}-${id})`);
      const parsed=new DOMParser().parseFromString(markup,'image/svg+xml');
      const svg=parsed.documentElement;
      if(svg.localName!=='svg')return;
      svg.setAttribute('aria-hidden','true');
      ray.node.querySelector('.manta-art')?.replaceChildren(document.importNode(svg,true));
      ray.wings=[ray.node.querySelector(`#m${ray.index}-aile-gauche`),ray.node.querySelector(`#m${ray.index}-aile-droite`)];
      ray.tail=ray.node.querySelector(`#m${ray.index}-queue`);
    });
    sync();
  }).catch(()=>{ocean.hidden=true;});
  addEventListener('resize',()=>{width=innerWidth;height=innerHeight;if(reduced())still();},{passive:true});
  addEventListener('pointermove',event=>{if(event.pointerType==='mouse'){pointer.x=event.clientX;pointer.y=event.clientY;}},{passive:true});
  document.addEventListener('pointerleave',()=>{pointer.x=-1000;pointer.y=-1000;});
  document.addEventListener('visibilitychange',sync);
  motion.addEventListener('change',sync);
  document.addEventListener('ailyro:motion',event=>{customReduced=Boolean(event.detail?.reduced);sync();});
  document.addEventListener('ailyro:download',()=>{if(!reduced())boostUntil=performance.now()+1000;});
  still();
})();
