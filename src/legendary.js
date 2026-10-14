import {createStoryDungeon} from './story-dungeon.js?v=7.5.2';
import {regions} from './expedition.js?v=7.5.2';
import {directEncounter} from './encounters.js?v=7.5.2';
export function createLegendary(a,event){
 const r=regions[event.region],w=createStoryDungeon(a.seed+':'+event.id,'raider',a.progression.level,2,a.difficulty);
 w.eventId=event.id;w.legendary=true;w.region=event.region;w.name=event.name;w.floorSheet=r.sheet;w.wallSheet='102';w.enemySpawns=[];w.traps=[];
 w.objects[0].text=`${event.name}: the ward key lies beyond the central chambers. Only the guardian carries the covenant. ${event.type==='one-attempt'?'Leaving forfeits this expedition.':'You may return through the entrance.'}`;
 for(const room of w.rooms.slice(1)){
  if(room.type==='boss')w.enemySpawns.push([room.cx,room.cy,'warden-'+r.id,'boss']);
  else w.enemySpawns.push(...directEncounter(w,room,a.progression.level,3,r.pool));
  if(!room.optional&&room.id>1)w.traps.push({x:(room.cx+2.5)*32,y:(room.cy+2.5)*32,phase:room.id*.63});
 }
 w.props=w.props.map(p=>({...p,sheet:event.region===0?'104':event.region===3?'111':'102',cell:event.region===0?11:event.region===3?4:15}));return w;
}
export function resolveEvent(a,status){
 const id=a.world.eventId,e=a.regions.get('expedition')?.world.events.find(v=>v.id===id);if(!e)return;
 e.status=status;const w=a.regions.get('expedition').world;w.landmarks=w.landmarks.filter(l=>l.id!==id);
}
