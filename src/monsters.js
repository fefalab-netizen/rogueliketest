// Physical cells verified against supplied 02, 66 and 67 sheets (see sprite-usage.js).
const define=(id,name,frame,hp,speed,damage,xp,role,extra={})=>({id,name,sheet:'02',frame,frames:[frame,frame+1],hp,speed,damage,xp,role,kind:['ranged','caster','support','summoner'].includes(role)?'magic':'melee',armor:0,attackSpeed:1,range:role==='ranged'?210:['caster','support','summoner'].includes(role)?180:35,detection:260,faction:'raiders',biomes:['raider','overworld'],loot:{gold:1,rarity:0},rarity:'normal',abilities:[],statuses:[],cost:2,...extra});
export const monsters={
 grunt:define('grunt','Goblin Grunt',0,38,65,12,16,'grunt'),
 archer:define('archer','Goblin Archer',2,30,55,10,18,'ranged',{kind:'arrow',cost:3}),
 tank:define('tank','Orc Raider',4,65,48,19,24,'tank',{armor:3,cost:4,resistance:.45}),
 scavenger:define('scavenger','Ratfolk Scavenger',6,28,85,9,14,'skirmisher',{abilities:['coward'],cost:2}),
 bandit:define('bandit','Masked Bandit',8,44,68,14,18,'ambusher'),
 cult:define('cult','Cult Initiate',14,38,48,14,20,'caster',{faction:'chapel',biomes:['chapel'],cost:3,statuses:['slow']}),
 shaman:define('shaman','Bone Shaman',10,48,46,12,22,'support',{sheet:'66',frames:[10,11],faction:'chapel',biomes:['chapel'],abilities:['heal','ward'],cost:4}),
 summoner:define('summoner','Ossuary Caller',14,48,42,12,24,'summoner',{sheet:'66',frames:[14,15],faction:'chapel',biomes:['chapel'],abilities:['summon'],cost:4}),
 bone:define('bone','Bone Crawler',0,28,72,10,12,'skirmisher',{sheet:'67',faction:'chapel',biomes:['chapel'],cost:2}),
 quartermaster:define('quartermaster','Bandit Quartermaster',8,90,53,16,65,'miniboss',{boss:true,abilities:['lunge','reinforce'],cost:10}),
 keeper:define('keeper','Chapel Keeper',14,85,42,14,65,'miniboss',{boss:true,kind:'magic',range:180,faction:'chapel',biomes:['chapel'],abilities:['rune','summon'],cost:10}),
};
monsters.brute={...monsters.tank,id:'brute',name:'Orc Brute',hp:100,damage:24,armor:5,speed:43,cost:6,xp:36,abilities:['lunge']};
monsters.herald={...monsters.keeper,id:'herald',name:'The First Herald',finalBoss:true,hp:280,damage:24,armor:4,xp:180,abilities:['rune','summon'],loot:{gold:3,rarity:3}};

// Physical cell mappings from the supplied 111-sheet inventory.
const regional=[
 ['imp','Imp Scout','16',0,'ranged',42,62,13],['emberhound','Ember Hound','16',4,'skirmisher',50,80,15],['lava','Lava Elemental','16',6,'tank',95,39,24],['brimstone','Brimstone Brute','16',10,'tank',120,35,27],
 ['panther','Vine Panther','22',0,'ambusher',62,85,19],['rootboar','Root-Tusk Boar','22',8,'tank',90,52,24],['serpent','Canopy Serpent','22',10,'caster',58,48,18],['junglehunter','Jungle Goblin','22',6,'ranged',50,62,17],
 ['icewolf','Ice Wolf','26',0,'skirmisher',65,76,20],['frostboar','Frost Boar','26',4,'tank',105,43,25],['yeti','Yeti','26',12,'tank',130,37,30],['icespider','Ice Spider','26',14,'ambusher',52,68,18],
 ['sailor','Drowned Sailor','31',0,'grunt',70,50,20],['harpoon','Harpoon Revenant','31',4,'ranged',65,46,23],['reef','Reef Skeleton','31',6,'skirmisher',58,60,20],['coral','Coral Priest','31',10,'support',70,40,18],
];
for(const [id,name,sheet,frame,role,hp,speed,damage]of regional){const region=['16','22','26','31'].indexOf(sheet),biome=['volcano','jungle','ice','coast'][region];monsters[id]=define(id,name,frame,hp,speed,damage,24,role,{sheet,frames:[frame,frame+1],faction:biome,biomes:[biome],cost:role==='tank'?4:['ranged','caster','support'].includes(role)?3:2,armor:role==='tank'?3:0,abilities:role==='support'?['heal','ward']:role==='tank'?['lunge']:[],statuses:['ice','jungle'].includes(biome)?['slow']:[]});}
for(const [id,name,frame,region]of [['juggernaut','Infernal Juggernaut',14,'volcano'],['matron','Rotwood Matron',4,'jungle'],['tyrant','Frostfang Tyrant',6,'ice'],['admiral','Drowned Admiral',8,'coast']]){
 monsters[id]=define(id,name,frame,540,21,43,170,'colossal',{sheet:'91',frames:[frame,frame+1],boss:true,colossal:true,faction:region,biomes:[region],armor:5,resistance:.95,cost:25});
 const base=regional.find(r=>monsters[r[0]].faction===region&&r[4]==='tank')||regional.find(r=>monsters[r[0]].faction===region);
 monsters['warden-'+region]={...monsters[base[0]],id:'warden-'+region,name:region[0].toUpperCase()+region.slice(1)+' Covenant Warden',boss:true,optionalBoss:true,hp:180,damage:27,xp:110,abilities:['lunge'],cost:12};
}
export const legacyMonsters=['grunt','archer','tank','scavenger','bandit','cult'].map(id=>monsters[id]);
export function hashSeed(value){let n=2166136261;for(const c of String(value))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
export const variationCurves={hp:.85,damage:.35,reach:.45,speed:.18,reward:.8};
export function spawnMonster(species,id,x,y,seed,tier='normal'){
 const m=monsters[species];if(!m)throw new Error('Unknown monster '+species);
 if(tier==='boss'&&!m.boss)throw new Error('Boss tier requires an authorized boss encounter');
 const roll=hashSeed(`${seed}:${id}:${species}`)/4294967296,scale=m.colossal?2.5+roll:tier==='boss'?2:tier==='elite'?1.4+roll*.3:.9+roll*.4;
 const delta=scale-1,c=variationCurves,mult=tier==='boss'?1.35:tier==='elite'?1.15:1;
 const hp=Math.round(m.hp*(1+delta*c.hp)*mult);
 return {...m,abilities:tier==='elite'&&m.kind==='melee'?[...m.abilities,'lunge']:m.abilities,attackSpeed:tier==='elite'?1.15:m.attackSpeed,species,scale,tier,hp,maxHp:hp,damage:Math.round(m.damage*(1+delta*c.damage)),speed:m.speed*Math.max(.75,1-delta*c.speed),range:m.range*(m.kind==='melee'?1+delta*c.reach:1),xp:Math.round(m.xp*(1+delta*c.reward)),reward:1+delta*c.reward,resistance:Math.min(.8,(m.resistance||0)+Math.max(0,delta)*.4),radius:m.colossal?24:Math.min(14,8*scale),id,x,y,post:{x,y},state:'idle',timer:0,cooldown:1,flash:0,slow:0,alert:false,angle:0,pathTimer:0,tacticalTimer:0,waypoint:null,abilityCooldown:3,stuck:0,ward:0};
}
