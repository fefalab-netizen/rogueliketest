import {hashSeed} from './monsters.js?v=7.5';
import {noise,clearDisk,trail,repairOutdoorRoutes,safePosition} from './geography.js?v=7.5';
import {directEncounter} from './encounters.js?v=7.5';
export const regions=[
 {id:'volcano',name:'Volcanic Wastes',sheet:'103',enemySheet:'16',color:'#a46643',center:[64,64],boss:[29,32],bossId:'juggernaut',pool:['imp','emberhound','lava','brimstone'],warning:'Lava never cools. Amber circles mark vents about to erupt.'},
 {id:'jungle',name:'Deep Jungle',sheet:'105',enemySheet:'22',color:'#668549',center:[190,63],boss:[225,29],bossId:'matron',pool:['panther','rootboar','serpent','junglehunter'],warning:'Purple pools poison; roots stir before they grasp. Keep a clear retreat.'},
 {id:'ice',name:'Frozen Peaks',sheet:'107',enemySheet:'26',color:'#a9d0dc',center:[64,191],boss:[29,225],bossId:'tyrant',pool:['icewolf','frostboar','yeti','icespider'],warning:'Ice carries your momentum. Falling ice casts a blue warning circle.'},
 {id:'coast',name:'Drowned Coast',sheet:'109',enemySheet:'31',color:'#d5af70',center:[191,191],boss:[225,225],bossId:'admiral',pool:['sailor','harpoon','reef','coral'],warning:'Foam marks the rising tide. Deep water is impassable; bridges remain safe.'},
];
export const expeditionSheets=['16','22','26','31','91','97','103','104','105','106','107','108','109','110','111'];
export function regionAt(w,x,y){return regions[w.biomes[Math.max(0,Math.min(w.biomes.length-1,Math.floor(y/32)*w.width+Math.floor(x/32)))]];}
export function createExpedition(seed,difficulty){
 const numericSeed=hashSeed(seed+':expedition'),width=256,height=256;
 const w={kind:'overworld',expedition:true,name:'The Living Wilderness',seed:seed+':expedition',numericSeed,difficulty,width,height,solid:Array(width*height).fill(false),terrain:new Uint8Array(width*height),biomes:new Uint8Array(width*height),variants:new Uint8Array(width*height),hazards:new Uint8Array(width*height),landmarks:[],decorations:[],enemySpawns:[],props:[],doors:[],chests:[],traps:[],chunks:new Map(),explored:new Uint8Array(width*height),spawn:{x:4112,y:4112},safeZone:{x:4112,y:4112,radius:320}};
 w.hash=(x,y)=>hashSeed(`${numericSeed}:${x}:${y}`)/4294967296;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x,n=noise(numericSeed,x/17,y/17),fine=noise(numericSeed+9,x/5,y/5),east=x>128+Math.sin(y*.05)*11+(n-.5)*24,south=y>128+Math.sin(x*.04)*12,biome=(south?2:0)+(east?1:0);
  w.biomes[i]=biome;const wet=noise(numericSeed+43,x/23,y/23)>.70,wall=n*.7+fine*.3>.66;
  w.solid[i]=x<3||y<3||x>252||y>252||wall||wet;w.terrain[i]=wet?2:0;w.variants[i]=Math.floor(fine*15);
  if(!wall&&!wet&&n>.49&&fine>.62)w.hazards[i]=biome+1;
 }
 const landmark=(id,name,tx,ty,extra={})=>({id,name,tx,ty,x:(tx+.5)*32,y:(ty+.5)*32,...extra});
 w.landmarks.push(landmark('outpost','Expedition Outpost · Free return',128,128));
 for(const [i,r]of regions.entries()){
  const [tx,ty]=r.center,[bx,by]=r.boss;
  w.landmarks.push(landmark(r.id,r.name,tx,ty,{region:i}),landmark(r.bossId,'Territory of '+({juggernaut:'the Juggernaut',matron:'the Rotwood Matron',tyrant:'the Frostfang Tyrant',admiral:'the Drowned Admiral'}[r.bossId]),bx,by,{region:i,colossal:true}));
  clearDisk(w,bx,by,13,0);for(let y=by-14;y<=by+14;y++)for(let x=bx-14;x<=bx+14;x++)if(x>2&&y>2&&x<253&&y<253)w.biomes[y*256+x]=i;
  w.enemySpawns.push([bx,by,r.bossId,'boss']);
 }
 for(const l of w.landmarks.filter(l=>!l.colossal))clearDisk(w,l.tx,l.ty,l.id==='outpost'?12:7,1);
 for(let i=0;i<4;i++){const l=w.landmarks[1+i*2];trail(w,w.landmarks[0],l);trail(w,l,w.landmarks[2+i*2]);}
 for(const [a,b]of [[1,3],[3,7],[7,5],[5,1]])trail(w,w.landmarks[a],w.landmarks[b]);
 w.decorations.push({tx:125,ty:125,sheet:'84',cell:0,size:78},{tx:131,ty:125,sheet:'95',cell:5,size:84});
 for(const [i,r]of regions.entries()){
  const [cx,cy]=r.center;
  const landmarksArt=i===0?[['104',12],['104',11]]:i===1?[['102',15],['102',7]]:i===2?[['102',15],['102',5]]:[['111',1],['111',2]];
  landmarksArt.forEach(([sheet,cell],n)=>{const tx=cx+(n?4:-4),ty=cy-4;w.decorations.push({tx,ty,sheet,cell,size:56});w.solid[ty*width+tx]=true;});
  for(let n=0;n<7;n++){
   const angle=n*2.399,tx=Math.round(cx+Math.cos(angle)*(12+n*2)),ty=Math.round(cy+Math.sin(angle)*(12+n*2));
   if(Math.hypot(tx-128,ty-128)<20||Math.hypot(tx-r.boss[0],ty-r.boss[1])<18)continue;
   clearDisk(w,tx,ty,5,0);trail(w,{tx:cx,ty:cy},{tx,ty},1);
   for(let y=ty-5;y<=ty+5;y++)for(let x=tx-5;x<=tx+5;x++)w.biomes[y*256+x]=i;
   const squad={id:i*10+n+3,cx:tx,cy:ty,type:n===6?'treasure':'wilderness',optional:n===6};
   w.enemySpawns.push(...directEncounter(w,squad,4,2,r.pool));
   if(n===6)w.landmarks.push(landmark('cache-'+r.id,`${r.name} · Lost supplies`,tx+2,ty+2,{region:i,cache:true,claimed:false}));
  }
 }
 repairOutdoorRoutes(w);
 w.enemySpawns=w.enemySpawns.filter(([x,y,id])=>{if(regions.some(r=>r.bossId===id))return true;return Boolean(safePosition(w,{x:(x+.5)*32,y:(y+.5)*32},14,0));});
 w.events=['timed','persistent','one-attempt'].map((type,i)=>{const ri=(numericSeed+i)%4,r=regions[ri],tx=r.center[0]+(i%2?13:-13),ty=r.center[1]+12;clearDisk(w,tx,ty,4,1);trail(w,{tx:r.center[0],ty:r.center[1]},{tx,ty},1);return {id:'legend-'+i,type,region:ri,tx,ty,x:(tx+.5)*32,y:(ty+.5)*32,status:'dormant',discovered:false,entered:false,appearsAt:90+i*240+hashSeed(seed+':event'+i)%120,name:[['The Cinder Hour','The Ashen Covenant','The Last Furnace'],['The Blooming Hour','The Buried Covenant','The Last Orchid'],['The Thawing Hour','The Frozen Covenant','The Last Aurora'],['The Ebbing Hour','The Drowned Covenant','The Last Lantern']][ri][i]};});
 repairOutdoorRoutes(w);return w;
}
export function updateEvents(a){
 const w=a.regions.get('expedition')?.world;if(!w)return;
 for(const e of w.events){
  if(e.status==='dormant'&&a.elapsed>=e.appearsAt&&w.events.filter(v=>v.status==='active').length<2){e.status='active';e.expiresAt=a.elapsed+420;w.landmarks.push({...e,legendary:true});a.onNotice(`A strange light rises in the ${regions[e.region].name}. The caravan has heard of ${e.name}.`);}
  if(e.status==='active'&&a.world===w&&!e.discovered&&Math.hypot(e.x-a.player.x,e.y-a.player.y)<360){e.discovered=true;a.quests.lore.add(`${e.name} — ${regions[e.region].name}, ${e.type}.`);a.onNotice(e.type==='timed'?`${e.name}: entry fades in ${Math.ceil(e.expiresAt-a.elapsed)} seconds of active play.`:e.type==='one-attempt'?`${e.name}: one attempt. Read the entrance warning before committing.`:`${e.name} discovered. This entrance will wait for you.`);}
  if(e.status==='active'&&e.type==='timed'&&a.elapsed>=e.expiresAt&&a.world.eventId!==e.id){e.status='expired';w.landmarks=w.landmarks.filter(l=>l.id!==e.id);if(e.discovered)a.onNotice(`${e.name} fades. Its entrance has expired.`);}
 }
}
