import {Adventure} from './adventure.js?v=5.0';
import {reveal,nearbyLandmark} from './overworld.js?v=5.0';
import {drawOverworld,drawFog,drawWorldMap} from './overworld-render.js?v=5.0';
import {createDungeon,nearbyInteraction,interactDungeon,trapActive} from './dungeon.js?v=5.0';
import {flipForAim} from './facing.js?v=5.0';
import {AssetManager} from './assets.js?v=5.0';
import {classes,art} from './data.js?v=5.0';
import {TILE,direction} from './world.js?v=5.0';
import {Combat,weapons,lineClear} from './combat.js?v=5.0';
import {Progression,xpNeeded,colors} from './progression.js?v=5.0';
import {openInventory} from './inventory.js?v=5.0';

const $=id=>document.getElementById(id),canvas=$('game'),g=canvas.getContext('2d');
const assets=new AssetManager(),keys=new Set();
let world=createDungeon('Dunbarrow'),aimUntil=0,mapVisible=true;
let selected=0,mode='selection',debug=false,animation=0,last=0,accumulator=0,fps=60;
const player={...world.spawn,radius:8,flip:false};
let combat=new Combat(world,player,classes[0]),attacking=false,dodgeRequested=false;
let progression=new Progression(classes[0],player),toastTime=0,adventure=null;
function notifyLoot(message){$('toast').textContent=message;$('toast').hidden=false;toastTime=3.5;}
function showGear(character=false){if(!['playing','paused'].includes(mode))return;setMode('inventory');try{openInventory(progression,assets,character);}catch(error){setMode('paused');reportError(error);}}
function drinkPotion(){if(!['playing','paused'].includes(mode))return;if(progression.usePotion()){notifyLoot('Healed to '+player.hp+' / '+progression.stats.hp+' HP');}else notifyLoot(progression.potions?'Health is already full.':'No potions remaining.');syncVitals();}
function syncVitals(){$('healthText').textContent=player.hp+' / '+progression.stats.hp+' HP';document.querySelector('.health span').style.width=(player.hp/progression.stats.hp*100)+'%';}
function reportError(error){$('fatal').hidden=false;$('fatal').textContent='Game error: '+error.message;}
addEventListener('error',event=>reportError(event.error||new Error(event.message)));
function encounter(){
 if(mode!=='playing'||!adventure)return;
 const oldWorld=world,message=adventure.interact();world=adventure.world;combat=adventure.combat;
 if(world!==oldWorld){Object.assign(camera,player);keys.clear();attacking=false;aimUntil=0;}
 notifyLoot(message);canvas.focus();
}
const pointer={x:innerWidth/2+100,y:innerHeight/2};
canvas.addEventListener('pointermove',e=>{pointer.x=e.clientX;pointer.y=e.clientY;aimUntil=performance.now()+300;});
canvas.addEventListener('pointerdown',e=>{if(e.button===0&&mode==='playing'){attacking=true;pointer.x=e.clientX;pointer.y=e.clientY;canvas.focus();}});
addEventListener('pointerup',()=>attacking=false);
const camera={x:player.x,y:player.y};
let viewWidth=640,viewHeight=360;
function resize(){const scale=innerWidth>=1000?2:1;canvas.width=Math.ceil(innerWidth/scale);canvas.height=Math.ceil(innerHeight/scale);viewWidth=canvas.width;viewHeight=canvas.height;g.imageSmoothingEnabled=false;}
addEventListener('resize',resize);resize();
function select(index){selected=index;document.querySelectorAll('.character').forEach((b,i)=>{b.classList.toggle('selected',i===index);b.setAttribute('aria-pressed',String(i===index));});const c=classes[index];$('chosenName').textContent=c.name;$('chosenStats').textContent=`${c.style} · ${c.hp} health · ${c.speed} speed · ${c.attack} power · ${c.defense} defense · ${weapons[index].special}`;}
function setMode(next){mode=next;keys.clear();attacking=false;dodgeRequested=false;accumulator=0;$('selection').hidden=next!=='selection';$('pause').hidden=next!=='paused';$('result').hidden=next!=='dead';$('complete').hidden=next!=='complete';$('hud').hidden=next==='selection';$('debug').hidden=!debug||next==='selection';if(next==='playing')canvas.focus();}
function reset(){Object.assign(player,world.spawn,{flip:false});Object.assign(camera,world.spawn);}
function begin(){adventure=new Adventure($('seed').value.trim()||'Dunbarrow',classes[selected],player,notifyLoot);world=adventure.world;combat=adventure.combat;progression=adventure.progression;Object.assign(camera,player);$('heroName').textContent=classes[selected].name;syncVitals();aimUntil=0;setMode('playing');notifyLoot('Welcome to Dunbarrow. E at the campfire to rest. Follow roads west to the Raider Cellar or east to the Bone Chapel.');}
$('begin').onclick=begin;$('pauseButton').onclick=()=>setMode('paused');$('resume').onclick=()=>setMode('playing');$('reset').onclick=()=>{reset();setMode('playing');};$('change').onclick=()=>setMode('selection');
$('reset').textContent='Restart this seed';$('reset').onclick=begin;
$('retry').onclick=begin;$('resultChange').onclick=()=>setMode('selection');
$('encounter').onclick=encounter;
$('newSeed').onclick=()=>{$('seed').value='Descent-'+Math.floor(Math.random()*1000000);};
$('nextDungeon').onclick=()=>{$('seed').value='Descent-'+Math.floor(Math.random()*1000000);begin();};
$('completeMenu').onclick=()=>setMode('selection');
$('potionButton').onclick=drinkPotion;
$('inventoryButton').onclick=()=>showGear();$('characterButton').onclick=()=>showGear(true);
$('gear').addEventListener('close',()=>{if(mode==='inventory')setMode('playing');});
const movementCodes=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight'];
addEventListener('keydown',e=>{
  if($('info').open||$('gear').open)return;
  if(['playing','paused'].includes(mode)&&!e.repeat&&['KeyI','KeyC','Digit1','Numpad1'].includes(e.code)){e.preventDefault();if(['Digit1','Numpad1'].includes(e.code))drinkPotion();else showGear(e.code==='KeyC');return;}
  if(e.code==='F3'){e.preventDefault();if(!e.repeat){debug=!debug;$('debug').hidden=!debug||mode==='selection';}return;}
  if(e.code==='Escape'&&!e.repeat&&['playing','paused'].includes(mode)){e.preventDefault();setMode(mode==='playing'?'paused':'playing');return;}
  if(mode==='playing'&&e.code==='Space'){e.preventDefault();if(!e.repeat)dodgeRequested=true;return;}
  if(mode==='playing'&&e.code==='KeyM'&&!e.repeat){mapVisible=!mapVisible;return;}
  if(mode==='playing'&&e.code==='KeyE'&&!e.repeat){encounter();return;}
  if(mode==='playing'&&movementCodes.includes(e.code)){e.preventDefault();keys.add(e.code);}
});
addEventListener('keyup',e=>keys.delete(e.code));
function blur(){keys.clear();if(mode==='playing')setMode('paused');}
addEventListener('blur',blur);document.addEventListener('visibilitychange',()=>{if(document.hidden)blur();});
$('closeInfo').onclick=()=>$('info').close();
$('helpButton').onclick=()=>{$('infoBody').innerHTML='<h2>Explore Dunbarrow</h2><p>Start in a safe camp. Follow roads west to the Raider Cellar or east to the Bone Chapel. E at the campfire restores health and supplies at least two potions. M toggles the exploration map. Trees, rocks and water block travel; roads and bridges connect all landmarks. Unknown terrain is hidden by fog.</p><p>WASD / arrows: walk and face movement. Moving the mouse aims; hold left click to attack in that direction. Space: dodge. E: open a nearby door or chest, pick up the golden key, or use stairs. I: inventory. C: statistics. 1: potion. M: toggle map. Escape: pause.</p><p>Find the key and defeat every enemy, then use the violet exit stairs to return outdoors. Cyan stairs return outdoors. Equipment, health, enemies, doors and opened chests persist when travelling between regions during this run. Spike traps pulse amber before firing. Chests give equipment and a potion. Enter a seed to replay its layout, or choose Random seed for another dungeon.</p>';$('info').showModal();};
$('assetsButton').onclick=()=>{
  $('infoBody').innerHTML='<h2>Supplied asset report</h2><p>All 40 original PNGs are preserved. Every cell has a stable physical ID (for example 05.r1c1). The planned labels differ from the pictures; the foundation uses visually verified mappings.</p><p>03.png = props · 04.png = walls · 05.png = floors. A/B character pairs share crop bounds and scale. Dimensions and alpha are inspected when loaded.</p><table><thead><tr><th>File</th><th>Actual dimensions</th><th>Transparency</th></tr></thead><tbody>'+[...assets.atlases].sort().map(([id,a])=>`<tr><td>${id}.png</td><td>${a.width} × ${a.height}</td><td>${a.transparent?'Present':'Absent'}</td></tr>`).join('')+'</tbody></table>';
  for(const error of assets.errors){const p=document.createElement('p');p.textContent=error;$('infoBody').append(p);}$('info').showModal();
};
function simulate(dt){const d=direction(keys);const mx=pointer.x*viewWidth/innerWidth-viewWidth/2+camera.x,my=pointer.y*viewHeight/innerHeight-viewHeight/2+camera.y;combat.update(dt,{...d,angle:Math.atan2(my-(player.y-13),mx-player.x),aiming:performance.now()<aimUntil,attack:attacking,dodge:dodgeRequested});dodgeRequested=false;if(world.kind==='overworld')reveal(world,player);for(const trap of world.traps)if(trapActive(trap,combat.time)&&Math.hypot(player.x-trap.x,player.y-trap.y)<17)combat.hurt(15,trap);const blend=1-Math.exp(-9*dt);camera.x+=(player.x-camera.x)*blend;camera.y+=(player.y-camera.y)*blend;animation+=dt;
 const picked=progression.collect(player,(a,b)=>lineClear(world,a,b));if(picked.length)notifyLoot(`Collected ${picked.map(i=>i.name).join(', ')} · I to equip${progression.points?' · C: improvement available':''}`);
 toastTime-=dt;if(toastTime<=0)$('toast').hidden=true;
 $('healthText').textContent=`${player.hp} / ${progression.stats.hp} HP`;document.querySelector('.health span').style.width=`${player.hp/progression.stats.hp*100}%`;
 $('xpText').textContent=`LEVEL ${progression.level} · ${progression.xp} / ${xpNeeded(progression.level)} XP`;$('xpFill').style.width=`${progression.xp/xpNeeded(progression.level)*100}%`;
 $('supplies').textContent=`Gold ${progression.gold} · Potions ${progression.potions} · 1 to heal${progression.points?' · C: '+progression.points+' improvement(s)':''}`;
 const outdoors=world.kind==='overworld',landmark=outdoors?nearbyLandmark(world,player):null,action=outdoors?(landmark?{kind:'landmark'}:null):nearbyInteraction(world,player);
 $('combatStatus').textContent=outdoors?`${landmark?.name||'Dunbarrow wilderness'} · West: Cellar / East: Chapel`:`${world.name} · ${combat.enemies.filter(e=>e.hp>0).length} enemies · Key: ${world.hasKey?'found':'missing'}`;
 $('encounter').hidden=false;$('encounter').disabled=!action;$('encounter').textContent=action?({landmark:landmark?.id==='camp'?'Rest at camp':landmark?.id==='raider'||landmark?.id==='chapel'?'Enter dungeon':'Read sign',door:'Open door',key:'Take key',chest:'Open chest',exit:'Use exit',entrance:'Return outdoors'}[action.kind]+' · E'):'Explore · E to interact';
 if(player.hp<=0){$('resultSummary').textContent=`${classes[selected].name} · ${combat.kills} enemies defeated · ${player.xp} XP · ${Math.floor(combat.time)} seconds`;setMode('dead');}
}
function render(){
  g.fillStyle='#0e1216';g.fillRect(0,0,viewWidth,viewHeight);
  const ox=Math.round(viewWidth/2-camera.x),oy=Math.round(viewHeight/2-camera.y);
  const minX=Math.max(0,Math.floor(-ox/TILE)-1),maxX=Math.min(world.width,Math.ceil((viewWidth-ox)/TILE)+1);
  const minY=Math.max(0,Math.floor(-oy/TILE)-2),maxY=Math.min(world.height,Math.ceil((viewHeight-oy)/TILE)+2);
  const sprites=[],outdoors=world.kind==='overworld',bounds={minX,maxX,minY,maxY};
  if(outdoors)drawOverworld(g,assets,world,player,bounds,ox,oy,sprites);
  for(const drop of progression.drops)sprites.push({depth:drop.y-1,draw:()=>{g.strokeStyle=colors[drop.item.rarity];g.strokeRect(Math.round(drop.x+ox-11),Math.round(drop.y+oy-11),22,22);assets.draw(g,drop.item.sheet,drop.item.cell,drop.x+ox-9,drop.y+oy-9,18,18);}});
  if(!outdoors)for(let y=minY;y<maxY;y++)for(let x=minX;x<maxX;x++){
    const px=x*TILE+ox,py=y*TILE+oy,isProp=world.props.some(p=>p.x===x&&p.y===y),wall=world.solid[y*world.width+x]&&!isProp&&!world.doors.some(d=>d.x===x&&d.y===y);
    assets.draw(g,art.floor,(x*13+y*7)%19===0?1:0,px,py,TILE,TILE);
    // Subtle ground shading keeps characters and collision silhouettes legible.
    g.fillStyle='#07101735';g.fillRect(px,py,TILE,TILE);
    if(wall)sprites.push({depth:(y+1)*TILE,draw:()=>{g.fillStyle='#070b0b88';g.fillRect(px+3,py+12,32,23);assets.draw(g,art.walls,[10,28].includes(x)&&[9,18].includes(y)?13:0,px,py-12,32,44);}});
    if(debug&&world.solid[y*world.width+x]){g.strokeStyle='#e79462';g.strokeRect(px+.5,py+.5,31,31);}
  }
  for(const p of world.props)sprites.push({depth:(p.y+1)*TILE,draw:()=>assets.draw(g,art.props,p.cell,p.x*TILE+ox,p.y*TILE+oy-6,32,38)});
  for(const trap of world.traps){const active=trapActive(trap,combat.time),warning=(combat.time+trap.phase)%3>1.3;g.fillStyle=active?'#df714477':warning?(Math.sin(combat.time*20)>0?'#ffd45899':'#ffd45833'):'#c9a45822';g.fillRect(trap.x+ox-15,trap.y+oy-15,30,30);assets.draw(g,'95',active?7:6,trap.x+ox-14,trap.y+oy-12,28,24);}
  if(!outdoors)for(const [p,color,label] of [[world.spawn,'#80dcdb','ENTRANCE'],[world.exit,world.hasKey&&combat.finished?'#9cf4b1':'#c799ee','EXIT']]){g.fillStyle=color;for(let i=0;i<4;i++)g.fillRect(p.x+ox-13+i*2,p.y+oy-12+i*6,26-i*4,4);g.font='7px monospace';g.fillText(label,p.x+ox-16,p.y+oy+23);}
  for(const d of world.doors)sprites.push({depth:(d.y+1)*TILE,draw:()=>assets.draw(g,'95',d.open?5:4,d.x*TILE+ox,d.y*TILE+oy-12,32,44)});
  for(const c of world.chests)sprites.push({depth:c.y+8,draw:()=>assets.draw(g,'03',c.open?5:4,c.x+ox-15,c.y+oy-22,30,30)});
  if(!outdoors&&!world.key.taken)sprites.push({depth:world.key.y,draw:()=>assets.draw(g,'03',12,world.key.x+ox-10,world.key.y+oy-16,20,24)});
  sprites.push({depth:player.y+8,draw:()=>{g.fillStyle='#050b0bb0';g.beginPath();g.ellipse(Math.round(player.x+ox),Math.round(player.y+oy+5),12,5,0,0,Math.PI*2);g.fill();g.save();if(player.flash>0)g.globalAlpha=.5;assets.character(g,classes[selected].frames[Math.floor(animation/.42)%2],player.x+ox,player.y+oy+8,42,player.flip);g.restore();}});
  for(const e of combat.enemies){if(e.hp<=0||Math.abs(e.x-player.x)>viewWidth/2+100||Math.abs(e.y-player.y)>viewHeight/2+100)continue;sprites.push({depth:e.y+8,draw:()=>{
    const x=Math.round(e.x+ox),y=Math.round(e.y+oy),a=assets.atlases.get('02'),b=a?.frames[e.frame].bounds,ratio=b?(b.right-b.left+1)/(b.bottom-b.top+1):1;
    g.save();if(e.flash>0)g.globalAlpha=.45;assets.draw(g,'02',e.frame+Math.floor(animation/.42)%2,x-21*ratio,y-34,42*ratio,42,flipForAim(e.angle));g.restore();
    g.fillStyle='#321b22';g.fillRect(x-17,y-43,34,4);g.fillStyle='#cd6958';g.fillRect(x-17,y-43,34*e.hp/e.maxHp,4);
    if(e.state==='attack'){g.strokeStyle='#ffb769';g.lineWidth=2;g.beginPath();if(e.kind==='melee')g.arc(x,y,40,e.angle-.95,e.angle+.95);else{g.moveTo(x,y);g.lineTo(x+Math.cos(e.angle)*80,y+Math.sin(e.angle)*80);}g.stroke();g.fillStyle='#ffe0a3';g.font='bold 13px monospace';g.fillText('!',x-3,y-49);}
    if(debug){g.strokeStyle='#ff9b74';g.strokeRect(x-14,y-34,28,42);g.font='8px monospace';g.fillText(e.state,x-15,y+19);}
  }});}
  sprites.sort((a,b)=>a.depth-b.depth).forEach(s=>s.draw());
  for(const q of combat.projectiles){const x=Math.round(q.x+ox),y=Math.round(q.y+oy);g.save();g.translate(x,y);g.rotate(q.angle);if(q.kind==='bomb')assets.draw(g,'88',7,-8,-8,16,16);else if(q.kind==='magic')assets.draw(g,'100',q.team==='enemy'?12:2,-9,-9,18,18);else{g.fillStyle=q.team==='enemy'?'#f58b62':'#e3d4a8';g.fillRect(-8,-1,14,2);g.fillRect(4,-3,3,6);}g.restore();}
  for(const e of combat.effects){g.save();g.translate(Math.round(e.x+ox),Math.round(e.y+oy));g.rotate(e.angle);g.globalAlpha=Math.min(1,e.ttl*8);assets.draw(g,e.sheet,e.cell+(e.ttl<e.duration/2?1:0),-e.size/2,-e.size/2,e.size,e.size);g.restore();}
  for(const n of combat.numbers){g.globalAlpha=Math.min(1,n.ttl*3);g.font='bold 11px monospace';g.textAlign='center';g.fillStyle='#101316';g.fillText(n.text,Math.round(n.x+ox)+1,Math.round(n.y+oy)+1);g.fillStyle=n.color;g.fillText(n.text,Math.round(n.x+ox),Math.round(n.y+oy));}g.globalAlpha=1;g.textAlign='start';
  if(outdoors)drawFog(g,world,player,bounds,ox,oy);
  if(debug){g.strokeStyle='#8effb4';g.strokeRect(Math.round(player.x-8+ox)+.5,Math.round(player.y-8+oy)+.5,16,16);$('debug').textContent=`COMBAT · fixed 60 Hz\nSeed: ${world.seed}\nRegion: ${outdoors?'Dunbarrow / chunks loaded: '+world.chunks.size:world.name}\nPosition: ${player.x.toFixed(1)}, ${player.y.toFixed(1)}\nFPS: ${Math.round(fps)} · living enemies: ${combat.enemies.filter(e=>e.hp>0).length}\nCollision: 16 × 16 feet box\nQuest: not introduced yet\nIdle frame: ${Math.floor(animation/.42)%2?'B':'A'} (420 ms)`;}
  if(mapVisible&&outdoors)drawWorldMap(g,world,player,viewHeight);
  if(mapVisible&&!outdoors){const scale=2,mx=12,my=viewHeight-world.height*scale-32;g.fillStyle='#071014e8';g.fillRect(mx-4,my-4,world.width*scale+8,world.height*scale+8);for(let y=0;y<world.height;y++)for(let x=0;x<world.width;x++)if(!world.solid[y*world.width+x]){g.fillStyle='#65736b';g.fillRect(mx+x*scale,my+y*scale,scale,scale);}for(const d of world.doors){g.fillStyle=d.open?'#65736b':'#dbaf70';g.fillRect(mx+d.x*scale,my+d.y*scale,2,2);}for(const [p,color] of [[world.exit,'#d498ff'],[world.spawn,'#80dcdb'],...(!world.key.taken?[[world.key,'#ffd45b']]:[]),[player,'#ffffff']]){g.fillStyle=color;g.fillRect(mx+p.x/TILE*scale-2,my+p.y/TILE*scale-2,4,4);}g.fillStyle='#d9ddcf';g.font='8px monospace';g.fillText('M: MAP · gold key / violet exit',mx,my-9);}
}
function drawPreviews(time){document.querySelectorAll('.character canvas').forEach((c,i)=>{const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#080f1230';ctx.beginPath();ctx.ellipse(48,85,24,5,0,0,Math.PI*2);ctx.fill();assets.character(ctx,i*2+Math.floor(time/420)%2,48,86,70);});}
function frame(now){const elapsed=Math.min((now-last)/1000||0,0.1);last=now;fps+=(1/(elapsed||1/60)-fps)*.05;if(mode==='playing'){accumulator+=elapsed;while(accumulator>=1/60){simulate(1/60);accumulator-=1/60;}}else accumulator=0;render();if(mode==='selection')drawPreviews(now);requestAnimationFrame(frame);}
try {
  await assets.load((done,total)=>$('loading').textContent=`Loading supplied sheets · ${done} / ${total}`);
  for(const c of classes){const b=document.createElement('button');b.className='character';b.setAttribute('aria-label',c.name);b.innerHTML=`<span class="number">0${c.id+1}</span><canvas width="96" height="96"></canvas><span class="name">${c.name}</span>`;b.onclick=()=>select(c.id);$('characters').append(b);}
  select(0);
  const ready=[...Object.values(art),'02','86','87','88','89','81','82','83','84','85','96','95','98','99','100'].every(id=>assets.atlases.has(id));$('begin').disabled=!ready;
  $('loading').textContent=assets.errors.length?`${assets.errors.length} sheet(s) unavailable — open Asset report${ready?'':'. Required combat art is missing.'}`:'40 original sheets loaded · No replacement artwork';
  requestAnimationFrame(frame);
}catch(error){$('fatal').hidden=false;$('fatal').textContent=`Unable to start: ${error.message}. Run the local server and open /game/.`;}
// Read-only inspection for acceptance tests and future development tools.
window.__descent={snapshot:()=>({mode,selected,player:{...player},camera:{...camera},loaded:assets.atlases.size,errors:[...assets.errors],frame:Math.floor(animation/.42)%2,debug}),assetReport:()=>[...assets.atlases].map(([id,a])=>({id,width:a.width,height:a.height,transparent:a.transparent,xLines:a.xLines,yLines:a.yLines}))};





