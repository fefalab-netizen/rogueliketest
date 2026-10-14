import {createOverworld} from './overworld.js?v=8.0.0';
import {createExpedition,expeditionSheets} from './expedition.js?v=8.0.0';
import {createDungeon} from './dungeon.js?v=8.0.0';
import {createStoryDungeon} from './story-dungeon.js?v=8.0.0';
import {createUnderkeep} from './underkeep.js?v=8.0.0';
import {monsters,legacyMonsters} from './monsters.js?v=8.0.0';
import {coreSheets} from './sprite-usage.js?v=8.0.0';
import {canOccupy} from './world.js?v=8.0.0';
import {worldState,restoreWorld,BUILD} from './persistence.js?v=8.0.0';
import {encodeState,decodeState} from './state-codec.js?v=8.0.0';

export function generateMap(config){
 const {seed='Dunbarrow',type='dunbarrow',difficulty='adventurer',rooms=9}=config;let w;
 if(type==='dunbarrow')w=createOverworld(seed,difficulty);
 else if(type==='expedition')w=createExpedition(seed,difficulty);
 else if(type==='classic')w=createDungeon(seed,rooms);
 else if(['raider','chapel'].includes(type))w=createStoryDungeon(seed,type,1,0,difficulty);
 else if(/^underkeep-[123]$/.test(type))w=createUnderkeep(seed,Number(type.at(-1)),difficulty);
 else throw Error('Unknown map type.');
 w.kind??='dungeon';w.name??='Seeded dungeon';w.difficulty=difficulty;return w;
}
export function mapFile(w,config){return {format:'first-descent-map',version:1,build:BUILD,config,graph:encodeState(worldState(w))};}
export function loadMap(file){if(file?.format!=='first-descent-map'||file.version!==1||file.build!==BUILD)throw Error('Unsupported map file or build.');const w=restoreWorld(decodeState(file.graph));validateSpawns(w);return w;}
export function validateSpawns(w){
 if(w.enemySpawns.length>1500)throw Error('Too many enemies.');
 const occupied=new Set();
 for(const [x,y,type,tier='normal']of w.enemySpawns){const m=typeof type==='number'?legacyMonsters[type]:monsters[type],key=x+','+y;if(!m||!['normal','elite','boss'].includes(tier)||tier==='boss'&&!m.boss||!Number.isInteger(x)||!Number.isInteger(y)||!canOccupy(w,(x+.5)*32,(y+.5)*32,m.colossal?24:14)||occupied.has(key))throw Error('Enemy placement is blocked, duplicated, or invalid at '+key);occupied.add(key);}
}
export function requiredArtwork(a){const ids=new Set(coreSheets);for(const {world:w,combat}of a.regions.values()){if(w.expedition||w.legendary)expeditionSheets.forEach(id=>ids.add(id));for(const id of w.requiredSheets||[])ids.add(id);for(const key of ['floorSheet','wallSheet'])if(w[key])ids.add(w[key]);for(const p of [...w.props,...(w.decorations||[])])if(p.sheet)ids.add(p.sheet);for(const e of combat.enemies)ids.add(e.sheet);}return [...ids];}
export function inspectConnectivity(w){
 // Explicit tool action only: openable doors are treated as traversable.
 const solid=w.solid.slice();for(const d of w.doors)solid[d.y*w.width+d.x]=0;const map={...w,solid},seen=new Uint8Array(solid.length),queue=[Math.floor(w.spawn.y/32)*w.width+Math.floor(w.spawn.x/32)];seen[queue[0]]=1;
 for(let at=0;at<queue.length;at++){const i=queue[at],x=i%w.width,y=Math.floor(i/w.width);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,j=ny*w.width+nx;if(nx<0||ny<0||nx>=w.width||ny>=w.height||seen[j]||!canOccupy(map,(nx+.5)*32,(ny+.5)*32,8))continue;seen[j]=1;queue.push(j);}}
 const goals=w.kind==='overworld'?w.landmarks:[w.exit,w.key,...w.chests],missing=goals.filter(p=>!seen[Math.floor(p.y/32)*w.width+Math.floor(p.x/32)]);
 return {seen,message:`${queue.length} reachable tiles. ${missing.length} unreachable destinations with doors treated as open. This does not check quest or lock order.`};
}
export function encounterFile(w){return {format:'first-descent-encounter',version:1,build:BUILD,map:mapFile(w,{type:'encounter',seed:w.seed})};}
export function loadEncounter(file){if(file?.format!=='first-descent-encounter'||file.version!==1||file.build!==BUILD)throw Error('Unsupported encounter file.');const w=loadMap(file.map);if(w.kind!=='dungeon'||w.enemySpawns.length>80)throw Error('Encounter requires a dungeon with at most 80 enemies.');return w;}
