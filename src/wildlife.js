import {move,canOccupy} from './world.js?v=8.0.0';
import {hashSeed} from './monsters.js?v=8.0.0';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const animals=[
 [['110',14,'passive',22],['110',2,'scavenger',29]],
 [['106',0,'skittish',42],['106',4,'passive',18],['106',10,'passive',17],['106',12,'territorial',28],['106',14,'predator',23]],
 [['108',0,'passive',21],['108',4,'predator',27],['108',6,'skittish',25],['108',10,'territorial',36],['108',12,'scavenger',24]],
 [['110',0,'territorial',20],['110',2,'scavenger',26],['110',4,'skittish',23],['110',6,'passive',18],['110',8,'scavenger',30]],
];
export function damageAnimal(c,a,amount){
 if(!a.alive)return;a.hp=Math.max(0,a.hp-amount);a.think=0;
 c.effect('100',8,a.x,a.y-a.size/2,18);
 if(!a.hp){a.alive=false;a.state='dead';a.target=null;}
 // Wildlife grants neither XP, equipment, gold nor on-hit healing.
}
export function populateWildlife(w){
 if(w.wildlife)return;
 w.wildlife=[];
 for(let n=0;n<480&&w.wildlife.length<(w.expedition?100:40);n++){
  const h=hashSeed(w.seed+':animal:'+n),anchor=w.landmarks[n%w.landmarks.length],near=n<100,angle=(h%628)/100;
  const tx=near?Math.max(4,Math.min(251,Math.round(anchor.tx+Math.cos(angle)*(7+h%10)))):5+h%246,ty=near?Math.max(4,Math.min(251,Math.round(anchor.ty+Math.sin(angle)*(7+h%10)))):5+(h>>>10)%246,i=ty*w.width+tx,x=(tx+.5)*32,y=(ty+.5)*32;
  if(!canOccupy(w,x,y,6)||w.hazards?.[i]||w.terrain[i]===1||w.terrain[i]===3)continue;
  const biome=w.expedition?w.biomes[i]:-1,choices=w.expedition?animals[biome]:[['110',14,'passive',18],['106',10,'skittish',16],['110',2,'scavenger',25]];
  if(biome===0&&w.variants[i]>3)continue; // Sparse lizards and carrion birds on cool ash margins.
  const [sheet,frame,behavior,size]=choices[(h>>>20)%choices.length];
  w.wildlife.push({id:n,x,y,home:{x,y},sheet,frame,behavior,size,biome,radius:5,angle:0,timer:0,think:0,alive:true,hp:12,speed:behavior==='skittish'?70:behavior==='predator'?42:24,state:'rest'});
 }
}
export function updateWildlife(w,c,dt){
 if(!w.wildlife)return;const active=w.wildlife.filter(a=>a.alive&&distance(a,c.player)<520);
 w.wildlifeTick=(w.wildlifeTick||0)+dt;if(w.wildlifeTick<.2)return;const step=w.wildlifeTick;w.wildlifeTick=0;
 for(const a of active){
  a.timer-=step;a.think-=step;const d=distance(a,c.player);
  const hunter=active.find(b=>b!==a&&b.behavior==='predator'&&distance(a,b)<95),hostile=c.enemies.find(e=>e.hp>0&&distance(a,e)<90),source=hunter||hostile||c.player;
  const threat=d<85||hunter||hostile||c.noise&&distance(a,c.noise)<140&&c.noise.until>c.time;
  if(a.think<=0){
   a.think=.6;let target=null;a.state='wander';
   if((a.behavior==='skittish'||a.behavior==='passive')&&threat){const angle=Math.atan2(a.y-source.y,a.x-source.x);target={x:a.x+Math.cos(angle)*90,y:a.y+Math.sin(angle)*90};a.state='flee';}
   else if(a.behavior==='predator'){const prey=active.find(b=>b!==a&&['passive','skittish'].includes(b.behavior)&&distance(a,b)<120);if(prey){target=prey;a.prey=prey.id;a.state='hunt';}else if(d<40){target=c.player;a.state='defend';}}
   else if(a.behavior==='territorial'&&d<45){target=c.player;a.state='defend';}
   else if(a.behavior==='scavenger'){const corpse=c.enemies.find(e=>e.hp<=0&&!e.scavenged&&distance(a,e)<150)||w.wildlife.find(b=>!b.alive&&!b.scavenged&&distance(a,b)<150);if(corpse){target=corpse;a.state='scavenge';if(distance(a,corpse)<12)corpse.scavenged=true;}}
   if(!target){const h=hashSeed(w.seed+':'+a.id+':'+Math.floor(c.time/3)),angle=h/4294967296*Math.PI*2;target=h%4===0?{x:a.x,y:a.y}:{x:a.home.x+Math.cos(angle)*80,y:a.home.y+Math.sin(angle)*80};}
   if(distance(target,a.home)>170)target=a.home;a.target={x:target.x,y:target.y};
  }
  if(a.state==='defend'&&d<19&&a.timer<=0){c.hurt(5,a);a.timer=2;}
  if(a.state==='hunt'){const prey=active.find(b=>b.id===a.prey&&b.alive);if(prey&&distance(a,prey)<13){prey.alive=false;prey.hp=0;a.state='rest';a.target=null;}}
  if(!a.target||distance(a,a.target)<5)continue;
  const angle=Math.atan2(a.target.y-a.y,a.target.x-a.x),speed=a.speed*(a.state==='flee'?1.4:1),dx=Math.cos(angle)*speed*step,dy=Math.sin(angle)*speed*step,tx=Math.floor((a.x+dx)/32),ty=Math.floor((a.y+dy)/32),i=ty*w.width+tx;
  if(canOccupy(w,a.x+dx,a.y+dy,5)&&(!w.expedition||w.biomes[i]===a.biome)&&!w.hazards?.[i]){move(w,a,dx,dy);a.angle=angle;}else{a.think=0;a.target=a.home;}
 }
}
export function drawWildlife(g,assets,w,p,animation,ox,oy,sprites){
 for(const a of w.wildlife||[])if(a.alive&&distance(a,p)<520)sprites.push({depth:a.y+5,draw:()=>{
  const atlas=assets.atlases.get(a.sheet),b=atlas?.frames[a.frame].bounds,ratio=b?(b.right-b.left+1)/(b.bottom-b.top+1):1;
  assets.draw(g,a.sheet,a.frame+Math.floor(animation/.55+a.id)%2,a.x+ox-a.size*ratio/2,a.y+oy+5-a.size,a.size*ratio,a.size,Math.cos(a.angle)<0);
 }});
}
