import {encodeState,decodeState} from './state-codec.js?v=8.0.0';
import {Adventure} from './adventure.js?v=8.0.0';
import {Progression} from './progression.js?v=8.0.0';
import {Quests,campNPCs} from './quests.js?v=8.0.0';
import {Combat} from './combat.js?v=8.0.0';
import {classes} from './data.js?v=8.0.0';
import {hashSeed} from './monsters.js?v=8.0.0';
import {canOccupy} from './world.js?v=8.0.0';
import {updateChunks} from './overworld.js?v=8.0.0';

export const BUILD='8.0.0';
const combatKeys=['enemies','projectiles','effects','numbers','kills','time','started','finished','randomState','nextEnemyId','noise'];
const adventureKeys=['seed','difficulty','caravanPaid','elapsed','totalKills','returnPosition','underkeepReturn','regionId','runId','sandbox'];
const pick=(o,keys)=>Object.fromEntries(keys.filter(k=>o[k]!==undefined).map(k=>[k,o[k]]));
export function worldState(w){const copy={...w,solid:Uint8Array.from(w.solid)};delete copy.hash;delete copy.chunks;if(w.kind==='overworld')copy.props=[];return copy;}
export function restoreWorld(w){
 validateWorld(w);
 if(w.kind==='overworld'){
  const seed=w.numericSeed;w.hash=w.expedition?(x,y)=>hashSeed(`${seed}:${x}:${y}`)/4294967296:(x,y)=>{let n=Math.imul(x+seed,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return (n>>>0)/4294967296;};
  w.chunks=new Map();delete w.revealX;delete w.revealY;
 }
 return w;
}
export function validateWorld(w){
 if(!w||!['overworld','dungeon'].includes(w.kind)||!Number.isInteger(w.width)||!Number.isInteger(w.height)||w.width<8||w.height<8||w.width>256||w.height>256||w.solid?.length!==w.width*w.height)throw Error('Invalid map dimensions or collision grid.');
 if(w.kind==='overworld'&&(w.width!==256||w.height!==256||w.terrain?.length!==w.solid.length||w.explored?.length!==w.solid.length||!Array.isArray(w.landmarks)||!Array.isArray(w.decorations)||!w.safeZone||!Number.isFinite(w.numericSeed)))throw Error('Incomplete outdoor map.');
 if(w.expedition)for(const key of ['biomes','variants','hazards'])if(w[key]?.length!==w.solid.length)throw Error('Incomplete wilderness terrain.');
 for(const k of ['props','doors','chests','traps','enemySpawns'])if(!Array.isArray(w[k]))throw Error('Missing map collection: '+k);
 if(!w.spawn||!Number.isFinite(w.spawn.x)||!Number.isFinite(w.spawn.y)||!canOccupy(w,w.spawn.x,w.spawn.y,8))throw Error('Map entrance is blocked.');
 if(w.kind==='dungeon'&&(!w.exit||!w.key))throw Error('Dungeon entrance, exit and key are required.');
}
export function captureAdventure(a){
 if(!a||a.player.hp<=0||a.quests.finished)throw Error('Only a living, unfinished adventure can be saved.');
 if(a.sandbox)throw Error('Developer previews do not overwrite campaign saves.');
 a.runId??=crypto.randomUUID();a.current.drops=a.progression.drops;
 const pr={...a.progression};delete pr.base;delete pr.player;delete pr.stats;delete pr.drops;
 const state={adventure:pick(a,adventureKeys),hero:a.progression.base.id,player:{...a.player},progression:pr,quests:{...a.quests},shop:a.shop,regions:[...a.regions].map(([id,r])=>({id,world:worldState(r.world),combat:pick(r.combat,combatKeys),drops:r.drops}))};
 return {format:'first-descent-save',version:1,build:BUILD,savedAt:new Date().toISOString(),summary:{hero:a.progression.base.name,level:a.progression.level,region:a.world.name,seed:a.seed,difficulty:a.difficulty},graph:encodeState(state)};
}
export function decodeSave(file){
 if(file?.format!=='first-descent-save'||file.version!==1||file.build!==BUILD)throw Error('This save needs game build '+(file?.build||'8.0.0')+'. Keep your original file.');
 const s=decodeState(file.graph);
 if(!Number.isInteger(s?.hero)||!classes[s.hero]||!s.adventure||typeof s.adventure.runId!=='string'||typeof s.adventure.seed!=='string'||!['explorer','adventurer','veteran','nightmare'].includes(s.adventure.difficulty)||!Array.isArray(s.regions)||!s.regions.length||s.regions.length>16||!s.regions.some(r=>r.id==='overworld')||!s.regions.some(r=>r.id===s.adventure.regionId)||new Set(s.regions.map(r=>r.id)).size!==s.regions.length)throw Error('Incomplete adventure data.');
 if(!s.player||!Number.isFinite(s.player.hp)||s.player.hp<=0||!Number.isFinite(s.player.x)||!Number.isFinite(s.player.y)||!s.progression||!Array.isArray(s.progression.items)||!s.progression.equipment||!s.progression.bonus||!Number.isInteger(s.progression.level)||s.progression.level<1||!Array.isArray(s.shop)||!s.quests||s.quests.finished)throw Error('Invalid hero or progression data.');
 for(const k of ['artifacts','lore','spoken','secrets'])if(!(s.quests[k] instanceof Set))throw Error('Incomplete quest journal.');
 for(const r of s.regions){
  validateWorld(r.world);if(!r.combat||!Array.isArray(r.combat.enemies)||r.combat.enemies.length>2000||!Array.isArray(r.drops))throw Error('Incomplete region state.');
  for(const key of ['projectiles','effects','numbers'])if(!Array.isArray(r.combat[key]))throw Error('Missing combat collection.');
  for(const key of ['time','randomState','kills','nextEnemyId'])if(!Number.isFinite(r.combat[key]))throw Error('Invalid combat clock or state.');
  for(const e of r.combat.enemies)if(!e||!Number.isFinite(e.x)||!Number.isFinite(e.y)||!Number.isFinite(e.hp)||!Array.isArray(e.frames)||e.frames.length!==2||!Array.isArray(e.abilities)||!e.post||typeof e.sheet!=='string')throw Error('Incomplete enemy state.');
 }
 return s;
}
export function resumeAdventure(s,onNotice){
 const a=Object.create(Adventure.prototype),p={...s.player};Object.assign(a,pick(s.adventure,adventureKeys),{player:p,onNotice,travelBusy:false,regions:new Map()});
 a.progression=new Progression(classes[s.hero],p);
 for(const k of Object.keys(a.progression))if(!['base','player','stats','drops'].includes(k)&&Object.hasOwn(s.progression,k))a.progression[k]=s.progression[k];
 a.progression.recalculate();a.quests=new Quests();for(const k of [...Object.keys(a.quests),'depth'])if(Object.hasOwn(s.quests,k))a.quests[k]=s.quests[k];a.shop=s.shop;
 for(const r of s.regions){const w=restoreWorld(r.world),combat=new Combat(w,p,a.progression.stats);Object.assign(combat,pick(r.combat,combatKeys));const region={world:w,combat,drops:r.drops};a.regions.set(r.id,region);a.bindCombat(region);}
 Object.assign(p,s.player);a.overworld=a.regions.get('overworld').world;a.npcs=campNPCs(a.overworld);a.current=a.regions.get(a.regionId);a.progression.drops=a.current.drops;
 if(!canOccupy(a.world,p.x,p.y,p.radius||8))throw Error('Saved position is blocked; the existing save has been retained.');
 if(a.world.kind==='overworld')updateChunks(a.world,p);return a;
}

let database;
function open(){return database??=new Promise((resolve,reject)=>{const request=indexedDB.open('first-descent',1);request.onupgradeneeded=()=>request.result.createObjectStore('records');request.onsuccess=()=>resolve(request.result);request.onerror=()=>{database=null;reject(Error('Local storage is unavailable. Export a save file instead.'));};});}
export async function readRecord(key){const db=await open();return new Promise((resolve,reject)=>{const req=db.transaction('records').objectStore('records').get(key);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
export async function writeRecords(entries){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite'),store=tx.objectStore('records');for(const [key,value]of entries)value===undefined?store.delete(key):store.put(value,key);tx.oncomplete=resolve;tx.onerror=()=>reject(Error('Unable to save locally. Your previous save is unchanged; export a file instead.'));tx.onabort=()=>reject(Error('Save was interrupted. Your previous save is unchanged.'));});}
export async function saveAdventure(a){const file=captureAdventure(a);await writeRecords([['active',file]]);return file;}
export async function recordEnding(a){
 if(a.sandbox)return;const legacy=await readRecord('legacy')||{completed:0,fallen:0,kills:0,seconds:0,lore:[],ended:[],unlocked:classes.map(c=>c.id),achievements:[]};
 a.runId??=crypto.randomUUID();if(!legacy.ended.includes(a.runId)){legacy.ended.push(a.runId);legacy.completed+=a.quests.finished?1:0;legacy.fallen+=a.player.hp<=0?1:0;legacy.kills+=a.totalKills||0;legacy.seconds+=Math.floor(a.elapsed);legacy.lore=[...new Set([...legacy.lore,...a.quests.lore])];if(a.quests.finished&&!legacy.achievements.includes('The First Descent'))legacy.achievements.push('The First Descent');}
 const active=await readRecord('active');let same=false;try{same=active&&decodeSave(active).adventure.runId===a.runId;}catch{/* An unrelated incompatible save must not prevent recording this ending. */}await writeRecords([['legacy',legacy],...(same?[['active',undefined]]:[])]);
}
