import {AssetManager} from './assets.js';
import {classes,art} from './data.js';
import {TILE,createTestRoom,move,direction} from './world.js';

const $=id=>document.getElementById(id),canvas=$('game'),g=canvas.getContext('2d');
const assets=new AssetManager(),world=createTestRoom(),keys=new Set();
let selected=0,mode='selection',debug=false,animation=0,last=0,accumulator=0,fps=60;
const player={...world.spawn,radius:8,flip:false};
const camera={x:player.x,y:player.y};
let viewWidth=640,viewHeight=360;
function resize(){const scale=innerWidth>=1000?2:1;canvas.width=Math.ceil(innerWidth/scale);canvas.height=Math.ceil(innerHeight/scale);viewWidth=canvas.width;viewHeight=canvas.height;g.imageSmoothingEnabled=false;}
addEventListener('resize',resize);resize();
function select(index){selected=index;document.querySelectorAll('.character').forEach((b,i)=>{b.classList.toggle('selected',i===index);b.setAttribute('aria-pressed',String(i===index));});const c=classes[index];$('chosenName').textContent=c.name;$('chosenStats').textContent=`${c.style} · ${c.hp} health · ${c.speed} speed · ${c.attack} power · ${c.defense} defense`;}
function setMode(next){mode=next;keys.clear();accumulator=0;$('selection').hidden=next!=='selection';$('pause').hidden=next!=='paused';$('hud').hidden=next==='selection';$('debug').hidden=!debug||next==='selection';if(next==='playing')canvas.focus();}
function reset(){Object.assign(player,world.spawn,{flip:false});Object.assign(camera,world.spawn);}
function begin(){reset();$('heroName').textContent=classes[selected].name;$('healthText').textContent=`${classes[selected].hp} / ${classes[selected].hp} HP`;setMode('playing');}
$('begin').onclick=begin;$('pauseButton').onclick=()=>setMode('paused');$('resume').onclick=()=>setMode('playing');$('reset').onclick=()=>{reset();setMode('playing');};$('change').onclick=()=>setMode('selection');
const movementCodes=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight'];
addEventListener('keydown',e=>{
  if($('info').open)return;
  if(e.code==='F3'){e.preventDefault();if(!e.repeat){debug=!debug;$('debug').hidden=!debug||mode==='selection';}return;}
  if(e.code==='Escape'&&!e.repeat&&mode!=='selection'){e.preventDefault();setMode(mode==='playing'?'paused':'playing');return;}
  if(mode==='playing'&&movementCodes.includes(e.code)){e.preventDefault();keys.add(e.code);}
});
addEventListener('keyup',e=>keys.delete(e.code));
function blur(){keys.clear();if(mode==='playing')setMode('paused');}
addEventListener('blur',blur);document.addEventListener('visibilitychange',()=>{if(document.hidden)blur();});
$('closeInfo').onclick=()=>$('info').close();
$('helpButton').onclick=()=>{$('infoBody').innerHTML='<h2>Into the chamber</h2><p>Select one of eight adventurers, then enter the dungeon test room.</p><ul><li>WASD or arrow keys — move. Diagonal speed is normalized.</li><li>Escape — pause / resume. Switching windows also pauses.</li><li>F3 — show walls, player hitbox, coordinates and FPS.</li><li>Pause → Reset position — return to the starting point.</li></ul><p>Walk around pillars and crates, follow the camera, and pass through the opening in the dividing wall. Walls and props should stop your feet, while the artwork may overlap them.</p><p>Attacks, dodge, loot, saving and quests are scheduled for later milestones.</p>';$('info').showModal();};
$('assetsButton').onclick=()=>{
  $('infoBody').innerHTML='<h2>Supplied asset report</h2><p>All 20 original PNGs are preserved. Every cell has a stable physical ID (for example 05.r1c1). The planned labels differ from the pictures; the foundation uses visually verified mappings.</p><p>03.png = props · 04.png = walls · 05.png = floors. A/B character pairs share crop bounds and scale. Dimensions and alpha are inspected when loaded.</p><table><thead><tr><th>File</th><th>Actual dimensions</th><th>Transparency</th></tr></thead><tbody>'+[...assets.atlases].sort().map(([id,a])=>`<tr><td>${id}.png</td><td>${a.width} × ${a.height}</td><td>${a.transparent?'Present':'Absent'}</td></tr>`).join('')+'</tbody></table>';
  for(const error of assets.errors){const p=document.createElement('p');p.textContent=error;$('infoBody').append(p);}$('info').showModal();
};
function simulate(dt){const d=direction(keys);if(d.x)player.flip=d.x<0;move(world,player,d.x*classes[selected].speed*dt,d.y*classes[selected].speed*dt);const blend=1-Math.exp(-9*dt);camera.x+=(player.x-camera.x)*blend;camera.y+=(player.y-camera.y)*blend;animation+=dt;}
function render(){
  g.fillStyle='#0e1216';g.fillRect(0,0,viewWidth,viewHeight);
  const ox=Math.round(viewWidth/2-camera.x),oy=Math.round(viewHeight/2-camera.y);
  const minX=Math.max(0,Math.floor(-ox/TILE)-1),maxX=Math.min(world.width,Math.ceil((viewWidth-ox)/TILE)+1);
  const minY=Math.max(0,Math.floor(-oy/TILE)-2),maxY=Math.min(world.height,Math.ceil((viewHeight-oy)/TILE)+2);
  const sprites=[];
  for(let y=minY;y<maxY;y++)for(let x=minX;x<maxX;x++){
    const px=x*TILE+ox,py=y*TILE+oy,isProp=world.props.some(p=>p.x===x&&p.y===y),wall=world.solid[y*world.width+x]&&!isProp;
    assets.draw(g,art.floor,(x*13+y*7)%19===0?1:0,px,py,TILE,TILE);
    // Subtle ground shading keeps characters and collision silhouettes legible.
    g.fillStyle='#07101735';g.fillRect(px,py,TILE,TILE);
    if(wall)sprites.push({depth:(y+1)*TILE,draw:()=>{g.fillStyle='#070b0b88';g.fillRect(px+3,py+12,32,23);assets.draw(g,art.walls,[10,28].includes(x)&&[9,18].includes(y)?13:0,px,py-12,32,44);}});
    if(debug&&world.solid[y*world.width+x]){g.strokeStyle='#e79462';g.strokeRect(px+.5,py+.5,31,31);}
  }
  for(const p of world.props)sprites.push({depth:(p.y+1)*TILE,draw:()=>assets.draw(g,art.props,p.cell,p.x*TILE+ox,p.y*TILE+oy-6,32,38)});
  // Torch artwork is decorative, mounted above the north boundary.
  for(const x of [5,15,25,33])sprites.push({depth:32,draw:()=>assets.draw(g,art.props,0,x*TILE+ox,oy-8,20,32)});
  sprites.push({depth:player.y+8,draw:()=>{g.fillStyle='#050b0bb0';g.beginPath();g.ellipse(Math.round(player.x+ox),Math.round(player.y+oy+5),12,5,0,0,Math.PI*2);g.fill();assets.character(g,classes[selected].frames[Math.floor(animation/.42)%2],player.x+ox,player.y+oy+8,42,player.flip);}});
  sprites.sort((a,b)=>a.depth-b.depth).forEach(s=>s.draw());
  if(debug){g.strokeStyle='#8effb4';g.strokeRect(Math.round(player.x-8+ox)+.5,Math.round(player.y-8+oy)+.5,16,16);$('debug').textContent=`FOUNDATION · fixed 60 Hz\nSeed: fixed test chamber\nRegion: dungeon test room / floor 1\nPosition: ${player.x.toFixed(1)}, ${player.y.toFixed(1)}\nFPS: ${Math.round(fps)} · entities: 1\nCollision: 16 × 16 feet box\nQuest: not introduced yet\nIdle frame: ${Math.floor(animation/.42)%2?'B':'A'} (420 ms)`;}
}
function drawPreviews(time){document.querySelectorAll('.character canvas').forEach((c,i)=>{const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#080f1230';ctx.beginPath();ctx.ellipse(48,85,24,5,0,0,Math.PI*2);ctx.fill();assets.character(ctx,i*2+Math.floor(time/420)%2,48,86,70);});}
function frame(now){const elapsed=Math.min((now-last)/1000||0,0.1);last=now;fps+=(1/(elapsed||1/60)-fps)*.05;if(mode==='playing'){accumulator+=elapsed;while(accumulator>=1/60){simulate(1/60);accumulator-=1/60;}}else accumulator=0;render();if(mode==='selection')drawPreviews(now);requestAnimationFrame(frame);}
try {
  await assets.load((done,total)=>$('loading').textContent=`Loading supplied sheets · ${done} / ${total}`);
  for(const c of classes){const b=document.createElement('button');b.className='character';b.setAttribute('aria-label',c.name);b.innerHTML=`<span class="number">0${c.id+1}</span><canvas width="96" height="96"></canvas><span class="name">${c.name}</span>`;b.onclick=()=>select(c.id);$('characters').append(b);}
  select(0);
  const ready=Object.values(art).every(id=>assets.atlases.has(id));$('begin').disabled=!ready;
  $('loading').textContent=assets.errors.length?`${assets.errors.length} sheet(s) unavailable — open Asset report${ready?'':'. Required foundation art is missing.'}`:'20 original sheets loaded · No replacement artwork';
  requestAnimationFrame(frame);
}catch(error){$('fatal').hidden=false;$('fatal').textContent=`Unable to start: ${error.message}. Run the local server and open /game/.`;}
// Read-only inspection for acceptance tests and future development tools.
window.__descent={snapshot:()=>({mode,selected,player:{...player},camera:{...camera},loaded:assets.atlases.size,errors:[...assets.errors],frame:Math.floor(animation/.42)%2,debug}),assetReport:()=>[...assets.atlases].map(([id,a])=>({id,width:a.width,height:a.height,transparent:a.transparent,xLines:a.xLines,yLines:a.yLines}))};
