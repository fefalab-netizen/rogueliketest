import {createExpedition,regions as wildRegions,updateEvents} from './expedition.js?v=7.5.2';
import {createLegendary,resolveEvent} from './legendary.js?v=7.5.2';
import {populateWildlife,updateWildlife} from './wildlife.js?v=7.5.2';
import {safePosition,prepareDungeon} from './geography.js?v=7.5.2';
import {createUnderkeep,interactUnderkeep} from './underkeep.js?v=7.5.2';
import {createStoryDungeon,interactStory} from './story-dungeon.js?v=7.5.2';
import {Quests,campNPCs} from './quests.js?v=7.5.2';
import {createOverworld,nearbyLandmark} from './overworld.js?v=7.5.2';
import {createDungeon,interactDungeon} from './dungeon.js?v=7.5.2';
import {Combat} from './combat.js?v=7.5.2';
import {Progression} from './progression.js?v=7.5.2';

// Region state survives travel: enemies, doors, loot and chests are not regenerated.
export class Adventure {
 constructor(seed,hero,player,onNotice=()=>{},difficulty='adventurer'){
  this.difficulty=difficulty;this.caravanPaid=false;this.travelBusy=false;this.elapsed=0;this.seed=seed;this.player=player;this.onNotice=onNotice;this.progression=new Progression(hero,player);this.regions=new Map();this.quests=new Quests();this.shop=['weapon','armor','trinket'].map(slot=>this.progression.makeItem(slot,true));
  this.overworld=createOverworld(seed,difficulty);this.npcs=campNPCs(this.overworld);this.progression.seed=this.overworld.numericSeed;this.travel('overworld',this.overworld,this.overworld.spawn,true);
 }
 travel(id,world,position,first=false){
  const p=this.player,pr=this.progression,hp=p.hp,xp=p.xp||0;
  if(this.current)this.current.drops=pr.drops;
  let region=this.regions.get(id);
  if(!region){world.difficulty=this.difficulty;if(world.kind==='overworld')populateWildlife(world);else prepareDungeon(world);const combat=new Combat(world,p,pr.stats);combat.randomState=world.numericSeed||1;combat.start();combat.onNotice=this.onNotice;if(world.depth===2)for(const e of combat.enemies)e.faction='underkeep';region={world,combat,drops:[]};this.regions.set(id,region);
   combat.onDefeat=(enemy)=>{this.totalKills=(this.totalKills||0)+1;if(!enemy.noLoot)pr.drop(enemy,this.totalKills);if(enemy.finalBoss){
    world.bossDefeated=true;this.quests.heraldDefeated=true;this.quests.artifacts.add('Heart of the Underkeep');
    for(const e of combat.enemies)if(e.summoner===enemy.id){e.hp=0;e.state='dead';}enemy.runes=[];combat.projectiles=[];world.traps=[];
    const reward=pr.makeItem('trinket',true);Object.assign(reward,{name:'Heartward Seal',rarity:3,stats:{crit:.12,haste:.2,hp:30}});pr.items.push(reward);pr.addGold(150);pr.potions+=3;
    this.onNotice('The First Herald falls. The Heart of the Underkeep is yours. Use the exit to return to Dunbarrow, then speak with Aldric.');
   }else if(enemy.colossal){world.defeatedColossi??=[];if(!world.defeatedColossi.includes(enemy.species)){world.defeatedColossi.push(enemy.species);const item=pr.namedReward(enemy.species);pr.addGold(65);this.quests.lore.add(enemy.name+' defeated.');this.onNotice(enemy.name+' falls. '+item.name+' recovered.');}}else if(world.legendary&&enemy.optionalBoss){world.bossDefeated=true;if(!world.rewardClaimed){world.rewardClaimed=true;const event=this.regions.get('expedition').world.events.find(e=>e.id===world.eventId),item=event.type==='one-attempt'?pr.namedReward('covenant'):pr.makeItem('weapon',true,3);if(event.type!=='one-attempt')pr.items.push(item);pr.addGold(60);pr.potions+=2;this.onNotice(world.name+' conquered. '+item.name+' earned.');}}else if(enemy.boss){world.bossDefeated=true;const message=this.quests.claim(world.theme,pr);if(message)this.onNotice(message);}if(pr.gainXP(enemy.xp))this.onNotice(`Level ${pr.level}! Press C to improve your stats.`);};
  }
  this.current=region;this.regionId=id;position=safePosition(world,position,8)||world.spawn;pr.drops=region.drops;Object.assign(p,position,{hp:first?pr.stats.hp:hp,xp,angle:0,flip:true,flash:0,invulnerable:0,dodge:0,cooldown:0,dodgeCooldown:0,root:0,slow:0,burn:0,poison:0,slideX:0,slideY:0});
  region.combat.projectiles=[];region.combat.effects=[];region.combat.numbers=[];pr.wave=world.legendary?5:world.expedition?3:world.depth?world.depth*2+1:1;
 }
 enterUnderkeep(depth,fromBelow=false){
  const id='underkeep-'+depth,w=this.regions.get(id)?.world||createUnderkeep(this.seed,depth,this.difficulty);
  this.quests.stairOpen=true;this.quests.depth=depth;this.travel(id,w,fromBelow?w.exit:w.spawn);
  return 'Entered '+w.name+'. The stone stairs lead between floors.';
 }
 get fare(){return this.caravanPaid?20:40;}
 get caravan(){const w=this.world,l=w.landmarks?.find(l=>l.id===(w.expedition?'outpost':'caravan'));return l?{id:'caravan',name:'Iona',role:'Caravan Guide',sheet:'52',frame:14,x:l.x,y:l.y}:null;}
 journey(){
  if(this.travelBusy)return 'The caravan is already moving.';
  if(this.world.kind!=='overworld'||!this.caravan||Math.hypot(this.player.x-this.caravan.x,this.player.y-this.caravan.y)>65)return 'Meet Iona beside the caravan.';
  const returning=this.world.expedition,fare=returning?0:this.fare;if(this.progression.gold<fare)return 'You need '+fare+' gold. The Cellar and Chapel offer paid work and supply caches.';
  this.travelBusy=true;
  try{const w=returning?this.overworld:this.regions.get('expedition')?.world||createExpedition(this.seed,this.difficulty),destination=returning?this.overworld.landmarks.find(l=>l.id==='caravan'):w.spawn;
   if(w.expedition&&w.epoch===undefined){w.epoch=this.elapsed;for(const event of w.events)event.appearsAt+=w.epoch;}
   this.travel(returning?'overworld':'expedition',w,{x:destination.x,y:destination.y+64});
   if(!returning){this.progression.gold-=fare;this.caravanPaid=true;}
   return returning?'Back in Dunbarrow. Return travel is always free.':'The Living Wilderness. Four regions, no gates. The Outpost is safe; Iona will always take you home for free.';
  }finally{this.travelBusy=false;}
 }
 enterLegendary(event){
  if(this.world!==this.regions.get('expedition')?.world||event.status!=='active'||Math.hypot(this.player.x-event.x,this.player.y-event.y)>65)return 'That entrance is no longer available.';
  if(event.type==='one-attempt'&&event.entered)return 'This entrance has already claimed its attempt.';
  const w=this.regions.get(event.id)?.world||createLegendary(this,event);this.travel(event.id,w,w.spawn);event.entered=true;event.discovered=true;return event.name+' · '+(event.type==='one-attempt'?'Leaving or dying closes this entrance.':'Progress remains if you retreat.');
 }
 tick(dt){
  updateEvents(this);if(this.world.kind==='overworld')updateWildlife(this.world,this.combat,dt);
  const w=this.world;if(w.expedition&&Math.hypot(this.player.x-w.spawn.x,this.player.y-w.spawn.y)>w.safeZone.radius){
   const index=w.biomes[Math.floor(this.player.y/32)*w.width+Math.floor(this.player.x/32)];w.visitedRegions??=[];
   if(!w.visitedRegions.includes(index)){w.visitedRegions.push(index);const r=wildRegions[index];this.quests.lore.add(r.name+': '+r.warning);this.onNotice(r.name+' — '+r.warning);}
  }
 }
 died(){if(this.world.legendary){const event=this.regions.get('expedition').world.events.find(e=>e.id===this.world.eventId);if(event.type==='one-attempt')resolveEvent(this,'failed');}}
 get world(){return this.current.world;}
 get combat(){return this.current.combat;}
 interact(){
  const p=this.player,w=this.world,pr=this.progression;
  if(w.expedition){
   const l=nearbyLandmark(w,p);if(!l)return 'The marked trails connect all four regions. Return to the Outpost for free passage home.';
   if(l.cache){if(l.claimed)return 'These supplies have already been recovered.';const threats=this.combat.enemies.some(e=>e.hp>0&&Math.hypot(e.x-l.x,e.y-l.y)<220);if(threats)return 'Drive off the creatures guarding these supplies first.';l.claimed=true;pr.addGold(18);pr.potions++;return 'Recovered 18 gold and a healing potion.';}
   if(l.region!==undefined)return wildRegions[l.region].warning;
   return 'Iona offers free passage back to Dunbarrow.';
  }
  if(w.kind==='overworld'){
   if(nearbyLandmark(w,p)?.id==='caravan')return 'Speak to Iona to confirm your fare.';

   const l=nearbyLandmark(w,p);if(!l)return 'Follow the roads to explore Dunbarrow.';
   if(l.id==='camp'){p.hp=pr.stats.hp;pr.potions=Math.max(2,pr.potions);return 'Rested at camp. Health restored; at least two potions supplied. West: Raider Cellar. East: Bone Chapel.';}
   if(['raider','chapel'].includes(l.id)){this.returnPosition={x:l.x,y:l.y+64};const dungeon=this.regions.get(l.id)?.world||createStoryDungeon(this.seed+':'+l.id,l.id,pr.level,this.quests.artifacts.size,this.difficulty);dungeon.name=l.name;this.travel(l.id,dungeon,dungeon.spawn);return `Entered ${l.name}. Use the entrance stairs to return anytime.`;}
   if(l.id==='underkeep'){if(!this.quests.ready)return 'The Black Stair is sealed. Recover the Iron Seal Key and Rune of Opening.';this.underkeepReturn={x:l.x,y:l.y+64};return this.enterUnderkeep(1);}
   return {bandit:'Bandit Road — the Raider Cellar lies northwest. Follow the roads.',ridge:'North Ridge — roads lead southwest to the Cellar and southeast to the Chapel.',grave:'Grave Path — the Bone Chapel lies northeast. Follow the roads.',approach:'Sealed Stair Approach — the Black Stair lies to the south.'}[l.id];
  }
  if(w.depth){
   const result=interactUnderkeep(w,p,pr,this.quests);
   if(result==='descend')return this.enterUnderkeep(w.depth+1);
   if(result==='ascend'&&w.depth>1)return this.enterUnderkeep(w.depth-1,true);
   if(result==='ascend'||result==='escape'){
    const camp=result==='escape';this.travel('overworld',this.overworld,camp?this.overworld.spawn:this.underkeepReturn);
    return camp?'The Heart is silent. You emerge into the dawn at Dunbarrow. Speak with Aldric Venn to finish the adventure.':'Returned to the Black Stair entrance.';
   }return result;
  }
  if(w.legendary){
   const result=interactStory(w,p,pr,this.quests);
   if(result==='entrance'||result==='complete'){
    const event=this.regions.get('expedition').world.events.find(e=>e.id===w.eventId);
    if(w.bossDefeated)resolveEvent(this,'completed');else if(event.type==='one-attempt')resolveEvent(this,'failed');
    this.travel('expedition',this.regions.get('expedition').world,{x:event.x,y:event.y+64});
    return w.bossDefeated?'The covenant is fulfilled. Returned to the wilderness.':event.type==='one-attempt'?'The last lantern goes dark. This attempt is over.':'Returned to the wilderness. Your progress inside is retained.';
   }return result;
  }
  const result=w.theme?interactStory(w,p,pr,this.quests):interactDungeon(w,p,pr,this.combat.finished);
  if(result==='entrance'||result==='complete'){this.travel('overworld',this.overworld,this.returnPosition);return result==='complete'?`${w.name} cleared. Returned to Dunbarrow with your equipment and rewards.`:'Returned to Dunbarrow.';}
  return result;
 }
}
