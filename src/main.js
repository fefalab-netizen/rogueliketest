import {AssetManager} from './assets.js';
import {classes,art} from './data.js';
import {TILE,createTestRoom,move,direction} from './world.js';
import {Combat,weapons,lineClear} from './combat.js';
import {Progression,xpNeeded,colors} from './progression.js';
import {openInventory} from './inventory.js';

const $=id=>document.getElementById(id),canvas=$('game'),g=canvas.getContext('2d');
const assets=new AssetManager(),world=createTestRoom(),keys=new Set();
let selected=0,mode='selection',debug=false,animation=0,last=0,accumulator=0,fps=60;
const player={...world.spawn,radius:8,flip:false};
let combat=new Combat(world,player,classes[0]),attacking=false,dodgeRequested=false;
let progression=new Progression(classes[0],player),toastTime=0;
function notifyLoot(message){$('toast').textContent=message;$('toast').hidden=false;toastTime=3.5;}
function showGear(character=false){if(mode!=='playing')return;setMode('inventory');openInventory(progression,assets,character);}
function encounter(){if(combat.finished){combat.started=false;combat.finished=false;combat.projectiles=[];progression.wave++;}combat.start();canvas.focus();}
const pointer={x:innerWidth/2+100,y:innerHeight/2};
canvas.addEventListener('pointermove',e=>{pointer.x=e.clientX;pointer.y=e.clientY;});
canvas.addEventListener('pointerdown',e=>{if(e.button===0&&mode==='playing'){attacking=true;pointer.x=e.clientX;pointer.y=e.clientY;canvas.focus();}});
addEventListener('pointerup',()=>attacking=false);
const camera={x:player.x,y:player.y};
let viewWidth=640,viewHeight=360;
function resize(){const scale=innerWidth>=1000?2:1;canvas.width=Math.ceil(innerWidth/scale);canvas.height=Math.ceil(innerHeight/scale);viewWidth=canvas.width;viewHeight=canvas.height;g.imageSmoothingEnabled=false;}
addEventListener('resize',resize);resize();
function select(index){selected=index;document.querySelectorAll('.character').forEach((b,i)=>{b.classList.toggle('selected',i===index);b.setAttribute('aria-pressed',String(i===index));});const c=classes[index];$('chosenName').textContent=c.name;$('chosenStats').textContent=`${c.style} · ${c.hp} health · ${c.speed} speed · ${c.attack} power · ${c.defense} defense · ${weapons[index].special}`;}
function setMode(next){mode=next;keys.clear();attacking=false;dodgeRequested=false;accumulator=0;$('selection').hidden=next!=='selection';$('pause').hidden=next!=='paused';$('result').hidden=next!=='dead';$('hud').hidden=next==='selection';$('debug').hidden=!debug||next==='selection';if(next==='playing')canvas.focus();}
function reset(){Object.assign(player,world.spawn,{flip:false});Object.assign(camera,world.spawn);}
function begin(){reset();progression=new Progression(classes[selected],player);combat=new Combat(world,player,progression.stats);progression.recalculate();combat.onDefeat=(enemy,kill)=>{progression.drop(enemy,kill);const levels=progression.gainXP(enemy.xp);if(levels)notifyLoot(`Level ${progression.level}! Press C to choose an improvement.`);};$('heroName').textContent=classes[selected].name;$('healthText').textContent=`${classes[selected].hp} / ${classes[selected].hp} HP`;$('toast').hidden=true;setMode('playing');}
$('begin').onclick=begin;$('pauseButton').onclick=()=>setMode('paused');$('resume').onclick=()=>setMode('playing');$('reset').onclick=()=>{reset();setMode('playing');};$('change').onclick=()=>setMode('selection');
$('reset').textContent='Restart combat trial';$('reset').onclick=begin;
$('retry').onclick=begin;$('resultChange').onclick=()=>setMode('selection');
$('encounter').onclick=encounter;
$('inventoryButton').onclick=()=>showGear();$('characterButton').onclick=()=>showGear(true);
$('gear').addEventListener('close',()=>{if(mode==='inventory')setMode('playing');});
const movementCodes=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight'];
addEventListener('keydown',e=>{
  if($('info').open||$('gear').open)return;
  if(mode==='playing'&&!e.repeat&&['KeyI','KeyC','Digit1'].includes(e.code)){e.preventDefault();if(e.code==='Digit1'){if(progression.usePotion())notifyLoot('Healing potion used.');}else showGear(e.code==='KeyC');return;}
  if(e.code==='F3'){e.preventDefault();if(!e.repeat){debug=!debug;$('debug').hidden=!debug||mode==='selection';}return;}
  if(e.code==='Escape'&&!e.repeat&&['playing','paused'].includes(mode)){e.preventDefault();setMode(mode==='playing'?'paused':'playing');return;}
  if(mode==='playing'&&e.code==='Space'){e.preventDefault();if(!e.repeat)dodgeRequested=true;return;}
  if(mode==='playing'&&e.code==='KeyE'&&!e.repeat){encounter();return;}
  if(mode==='playing'&&movementCodes.includes(e.code)){e.preventDefault();keys.add(e.code);}
});
addEventListener('keyup',e=>keys.delete(e.code));
function blur(){keys.clear();if(mode==='playing')setMode('paused');}
addEventListener('blur',blur);document.addEventListener('visibilitychange',()=>{if(document.hidden)blur();});
$('closeInfo').onclick=()=>$('info').close();
$('helpButton').onclick=()=>{$('infoBody').innerHTML='<h2>Into the chamber</h2><p>Select one of eight adventurers, then enter the dungeon test room.</p><ul><li>WASD or arrow keys — move. Diagonal speed is normalized.</li><li>Escape — pause / resume. Switching windows also pauses.</li><li>F3 — show walls, player hitbox, coordinates and FPS.</li><li>Pause → Restart combat trial — reset health, XP and enemies.</li></ul><p>Walk around pillars and crates, follow the camera, and pass through the opening in the dividing wall. Walls and props should stop your feet, while the artwork may overlap them.</p><p>Mouse aims; hold left click to attack. Space dodges with brief invulnerability. E begins the encounter. Defeat six enemies to clear the chamber. Walk over drops to collect equipment, gold and potions. I opens inventory; C opens character stats and level-up choices; 1 uses a potion. E after a clear starts another encounter while keeping your gear and level. Restart resets progress.</p>';$('info').showModal();};
$('assetsButton').onclick=()=>{
  $('infoBody').innerHTML='<h2>Supplied asset report</h2><p>All 40 original PNGs are preserved. Every cell has a stable physical ID (for example 05.r1c1). The planned labels differ from the pictures; the foundation uses visually verified mappings.</p><p>03.png = props · 04.png = walls · 05.png = floors. A/B character pairs share crop bounds and scale. Dimensions and alpha are inspected when loaded.</p><table><thead><tr><th>File</th><th>Actual dimensions</th><th>Transparency</th></tr></thead><tbody>'+[...assets.atlases].sort().map(([id,a])=>`<tr><td>${id}.png</td><td>${a.width} × ${a.height}</td><td>${a.transparent?'Present':'Absent'}</td></tr>`).join('')+'</tbody></table>';
  for(const error of assets.errors){const p=document.createElement('p');p.textContent=error;$('infoBody').append(p);}$('info').showModal();
};
function simulate(dt){const d=direction(keys);const mx=pointer.x*viewWidth/innerWidth-viewWidth/2+camera.x,my=pointer.y*viewHeight/innerHeight-viewHeight/2+camera.y;combat.update(dt,{...d,angle:Math.atan2(my-player.y,mx-player.x),attack:attacking,dodge:dodgeRequested});dodgeRequested=false;const blend=1-Math.exp(-9*dt);camera.x+=(player.x-camera.x)*blend;camera.y+=(player.y-camera.y)*blend;animation+=dt;
 const picked=progression.collect(player,(a,b)=>lineClear(world,a,b));if(picked.length)notifyLoot(`Collected ${picked.map(i=>i.name).join(', ')} · I to equip${progression.points?' · C: improvement available':''}`);
 toastTime-=dt;if(toastTime<=0)$('toast').hidden=true;
 $('healthText').textContent=`${player.hp} / ${progression.stats.hp} HP`;document.querySelector('.health span').style.width=`${player.hp/progression.stats.hp*100}%`;
 $('xpText').textContent=`LEVEL ${progression.level} · ${progression.xp} / ${xpNeeded(progression.level)} XP`;$('xpFill').style.width=`${progression.xp/xpNeeded(progression.level)*100}%`;
 $('supplies').textContent=`Gold ${progression.gold} · Potions ${progression.potions} · 1 to heal${progression.points?' · C: '+progression.points+' improvement(s)':''}`;
 $('combatStatus').textContent=combat.finished?`Chamber cleared · ${combat.kills} defeated · ${player.xp} XP`:combat.started?`${combat.enemies.filter(e=>e.hp>0).length} enemies remaining · Dodge ${player.dodgeCooldown>0?player.dodgeCooldown.toFixed(1)+'s':'ready'}`:'Press E to summon the encounter when ready.';
 $('encounter').hidden=combat.started&&!combat.finished;$('encounter').textContent=combat.finished?'Next encounter · E':'Begin encounter · E';
 if(player.hp<=0){$('resultSummary').textContent=`${classes[selected].name} · ${combat.kills} enemies defeated · ${player.xp} XP · ${Math.floor(combat.time)} seconds`;setMode('dead');}
}
function render(){
  g.fillStyle='#0e1216';g.fillRect(0,0,viewWidth,viewHeight);
  const ox=Math.round(viewWidth/2-camera.x),oy=Math.round(viewHeight/2-camera.y);
  const minX=Math.max(0,Math.floor(-ox/TILE)-1),maxX=Math.min(world.width,Math.ceil((viewWidth-ox)/TILE)+1);
  const minY=Math.max(0,Math.floor(-oy/TILE)-2),maxY=Math.min(world.height,Math.ceil((viewHeight-oy)/TILE)+2);
  const sprites=[];
  for(const drop of progression.drops)sprites.push({depth:drop.y-1,draw:()=>{g.strokeStyle=colors[drop.item.rarity];g.strokeRect(Math.round(drop.x+ox-11),Math.round(drop.y+oy-11),22,22);assets.draw(g,drop.item.sheet,drop.item.cell,drop.x+ox-9,drop.y+oy-9,18,18);}});
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
  for(const e of combat.enemies){if(e.hp<=0)continue;sprites.push({depth:e.y+8,draw:()=>{
    const x=Math.round(e.x+ox),y=Math.round(e.y+oy),a=assets.atlases.get('02'),b=a?.frames[e.frame].bounds,ratio=b?(b.right-b.left+1)/(b.bottom-b.top+1):1;
    g.save();if(e.flash>0)g.globalAlpha=.45;assets.draw(g,'02',e.frame+Math.floor(animation/.42)%2,x-21*ratio,y-34,42*ratio,42,Math.cos(e.angle)<0);g.restore();
    g.fillStyle='#321b22';g.fillRect(x-17,y-43,34,4);g.fillStyle='#cd6958';g.fillRect(x-17,y-43,34*e.hp/e.maxHp,4);
    if(e.state==='attack'){g.strokeStyle='#ffb769';g.lineWidth=2;g.beginPath();if(e.kind==='melee')g.arc(x,y,40,e.angle-.95,e.angle+.95);else{g.moveTo(x,y);g.lineTo(x+Math.cos(e.angle)*80,y+Math.sin(e.angle)*80);}g.stroke();g.fillStyle='#ffe0a3';g.font='bold 13px monospace';g.fillText('!',x-3,y-49);}
    if(debug){g.strokeStyle='#ff9b74';g.strokeRect(x-8,y-8,16,16);g.font='8px monospace';g.fillText(e.state,x-15,y+19);}
  }});}
  sprites.sort((a,b)=>a.depth-b.depth).forEach(s=>s.draw());
  if(player.invulnerable>0){g.strokeStyle=player.dodge>0?'#a9e5ff':'#ffad94';g.strokeRect(Math.round(player.x+ox-16),Math.round(player.y+oy-35),32,44);}
  for(const q of combat.projectiles){const x=Math.round(q.x+ox),y=Math.round(q.y+oy);g.save();g.translate(x,y);g.rotate(q.angle);if(q.kind==='bomb')assets.draw(g,'88',7,-8,-8,16,16);else if(q.kind==='magic')assets.draw(g,'100',q.team==='enemy'?12:2,-9,-9,18,18);else{g.fillStyle=q.team==='enemy'?'#f58b62':'#e3d4a8';g.fillRect(-8,-1,14,2);g.fillRect(4,-3,3,6);}g.restore();}
  for(const e of combat.effects){g.save();g.translate(Math.round(e.x+ox),Math.round(e.y+oy));g.rotate(e.angle);g.globalAlpha=Math.min(1,e.ttl*8);assets.draw(g,e.sheet,e.cell+(e.ttl<e.duration/2?1:0),-e.size/2,-e.size/2,e.size,e.size);g.restore();}
  for(const n of combat.numbers){g.globalAlpha=Math.min(1,n.ttl*3);g.font='bold 11px monospace';g.textAlign='center';g.fillStyle='#101316';g.fillText(n.text,Math.round(n.x+ox)+1,Math.round(n.y+oy)+1);g.fillStyle=n.color;g.fillText(n.text,Math.round(n.x+ox),Math.round(n.y+oy));}g.globalAlpha=1;g.textAlign='start';
  if(debug){g.strokeStyle='#8effb4';g.strokeRect(Math.round(player.x-8+ox)+.5,Math.round(player.y-8+oy)+.5,16,16);$('debug').textContent=`COMBAT · fixed 60 Hz\nSeed: fixed test chamber\nRegion: dungeon test room / floor 1\nPosition: ${player.x.toFixed(1)}, ${player.y.toFixed(1)}\nFPS: ${Math.round(fps)} · living enemies: ${combat.enemies.filter(e=>e.hp>0).length}\nCollision: 16 × 16 feet box\nQuest: not introduced yet\nIdle frame: ${Math.floor(animation/.42)%2?'B':'A'} (420 ms)`;}
}
function drawPreviews(time){document.querySelectorAll('.character canvas').forEach((c,i)=>{const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#080f1230';ctx.beginPath();ctx.ellipse(48,85,24,5,0,0,Math.PI*2);ctx.fill();assets.character(ctx,i*2+Math.floor(time/420)%2,48,86,70);});}
function frame(now){const elapsed=Math.min((now-last)/1000||0,0.1);last=now;fps+=(1/(elapsed||1/60)-fps)*.05;if(mode==='playing'){accumulator+=elapsed;while(accumulator>=1/60){simulate(1/60);accumulator-=1/60;}}else accumulator=0;render();if(mode==='selection')drawPreviews(now);requestAnimationFrame(frame);}
try {
  await assets.load((done,total)=>$('loading').textContent=`Loading supplied sheets · ${done} / ${total}`);
  for(const c of classes){const b=document.createElement('button');b.className='character';b.setAttribute('aria-label',c.name);b.innerHTML=`<span class="number">0${c.id+1}</span><canvas width="96" height="96"></canvas><span class="name">${c.name}</span>`;b.onclick=()=>select(c.id);$('characters').append(b);}
  select(0);
  const ready=[...Object.values(art),'02','86','87','88','89','98','99','100'].every(id=>assets.atlases.has(id));$('begin').disabled=!ready;
  $('loading').textContent=assets.errors.length?`${assets.errors.length} sheet(s) unavailable — open Asset report${ready?'':'. Required combat art is missing.'}`:'40 original sheets loaded · No replacement artwork';
  requestAnimationFrame(frame);
}catch(error){$('fatal').hidden=false;$('fatal').textContent=`Unable to start: ${error.message}. Run the local server and open /game/.`;}
// Read-only inspection for acceptance tests and future development tools.
window.__descent={snapshot:()=>({mode,selected,player:{...player},camera:{...camera},loaded:assets.atlases.size,errors:[...assets.errors],frame:Math.floor(animation/.42)%2,debug}),assetReport:()=>[...assets.atlases].map(([id,a])=>({id,width:a.width,height:a.height,transparent:a.transparent,xLines:a.xLines,yLines:a.yLines}))};



