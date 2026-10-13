export const rarities=['Common','Uncommon','Rare','Epic','Legendary'];
export const colors=['#c7c9bd','#8bdd9d','#82bcff','#d69aff','#ffbf55'];
const weaponNames=['Axe','Sword','Frost Staff','Sacred Staff','Bow','Dagger','Great Axe','Bomb Focus'];
const weaponIcons=[4,0,14,12,8,2,6,13];
export const xpNeeded=level=>80+(level-1)*50;
export class Progression {
 constructor(base,player){this.base=base;this.player=player;this.level=1;this.xp=0;this.gold=0;this.goldEarned=0;this.soldCount=0;this.points=0;this.potions=2;this.bonus={attack:0,defense:0,hp:0};this.items=[];this.equipment={weapon:null,armor:null,trinket:null};this.drops=[];this.serial=0;this.seed=491;this.wave=1;this.stats={...base};}
 addGold(amount){this.gold+=amount;this.goldEarned+=amount;}
 random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 recalculate(){const b=this.base,s={...b,hp:b.hp+(this.level-1)*8+this.bonus.hp,attack:b.attack+(this.level-1)*2+this.bonus.attack,defense:b.defense+(this.level-1)+this.bonus.defense,crit:b.id===5?.25:.08,haste:0,reach:0,stagger:0,frost:0};for(const item of Object.values(this.equipment))if(item)for(const [key,value]of Object.entries(item.stats))s[key]=(s[key]||0)+value;s.crit=Math.min(.65,s.crit);s.haste=Math.max(-.35,Math.min(.6,s.haste));Object.assign(this.stats,s);this.player.hp=Math.min(this.player.hp,s.hp);return s;}
 equip(id){const item=this.items.find(i=>i.id===id);if(!item)return false;this.equipment[item.slot]=item;this.recalculate();return true;}
 unequip(slot){this.equipment[slot]=null;this.recalculate();}
 gainXP(amount){this.xp+=amount;let levels=0;while(this.xp>=xpNeeded(this.level)){this.xp-=xpNeeded(this.level);this.level++;this.points++;levels++;this.recalculate();if(this.player.hp>0)this.player.hp=Math.min(this.stats.hp,this.player.hp+Math.round(this.stats.hp*.25));}return levels;}
 improve(stat){if(!this.points||!['attack','defense','hp'].includes(stat))return false;this.points--;this.bonus[stat]+=stat==='hp'?12:stat==='attack'?3:2;this.recalculate();return true;}
 usePotion(){if(!this.potions||this.player.hp<=0||this.player.hp>=this.stats.hp)return false;this.potions--;this.player.hp=Math.min(this.stats.hp,this.player.hp+Math.round(this.stats.hp*.4));return true;}
 makeItem(slot,guaranteed=false,forcedRarity=null){
  const roll=this.random(),rarity=forcedRarity??(guaranteed?1:roll<.85?0:roll<.98?1:2),power=1+rarity+Math.floor((this.wave-1)/2),style=Math.floor(this.random()*4);
  let stats=slot==='weapon'?{attack:4*power}:slot==='armor'?{defense:2*power,hp:6*power}:{crit:.02*power,haste:.04*power};
  let prefix='';
  if(slot==='weapon'){if(style===0){stats={attack:2*power,haste:.12};prefix='Swift ';}else if(style===1){stats={attack:5*power,haste:-.12,reach:10,stagger:.15};prefix='Heavy ';}else if(style===2){stats={attack:3*power,frost:.45,crit:.02*power};prefix='Rime ';}}
  if(slot==='armor'&&style===0){stats={defense:power,hp:4*power,speed:8};prefix='Scout ';}
  if(slot==='armor'&&style===1){stats.speed=-6;stats.defense+=power;prefix='Bulwark ';}
  return {id:++this.serial,slot,rarity,stats,name:rarities[rarity]+' '+prefix+(slot==='weapon'?weaponNames[this.base.id]:slot==='armor'?'Armor':'Sun Charm'),sheet:slot==='weapon'?'86':slot==='armor'?'87':'98',cell:slot==='weapon'?weaponIcons[this.base.id]:slot==='armor'?8:3};
 }
 namedReward(key){
  const rewards={juggernaut:['Cinder Oath','weapon',{attack:26,haste:-.15,reach:16,stagger:.25}],matron:['Mantle of the First Grove','armor',{defense:12,hp:55,speed:-5}],tyrant:['Winter’s Patience','weapon',{attack:19,frost:1.2,crit:.08}],admiral:['Admiral’s Last Promise','trinket',{haste:.18,crit:.12,hp:20}],covenant:['Lantern Beyond Dawn','trinket',{crit:.16,haste:.16,frost:.5}]};
  const [name,slot,stats]=rewards[key]||rewards.covenant,item=this.makeItem(slot,true,4);Object.assign(item,{name,stats});this.items.push(item);return item;
 }
 drop(enemy){
  if(enemy.noLoot)return;const elite=enemy.tier==='elite',boss=enemy.boss,mult=elite?5:1;
  const gold=this.random()<(boss?1:elite?.85:.6)?(1+Math.floor(this.random()*3))*(boss?8:elite?3:1):0,potions=this.random()<(boss?.6:elite?.18:.06)?1:0;
  const items=[];for(const [rarity,chance]of [[0,.017],[1,.006],[2,.001]])if(this.random()<chance*mult)items.push(this.makeItem(['weapon','armor','trinket'][Math.floor(this.random()*3)],false,rarity));
  if(elite&&this.random()<.04)items.push(this.makeItem('weapon',true,2));
  if(gold||potions)this.drops.push({x:enemy.x,y:enemy.y,item:null,gold,potions});
  items.forEach((item,i)=>this.drops.push({x:enemy.x+8+i*8,y:enemy.y,item,gold:0,potions:0}));
 }
 collect(player,clear){const found=[];this.drops=this.drops.filter(d=>{if(Math.hypot(d.x-player.x,d.y-player.y)>30||!clear(player,d))return true;if(d.item){this.items.push(d.item);found.push(d.item);}this.addGold(d.gold);this.potions+=d.potions;if(d.gold||d.potions)found.push({name:[d.gold?d.gold+' gold':'',d.potions?'healing potion':''].filter(Boolean).join(' + ')});return false;});return found;}
}
