import {move} from './world.js?v=7.5';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function updateColossus(c,e,dt,clear){
 const p=c.player;for(const k of ['flash','slow','cooldown'])e[k]=Math.max(0,(e[k]||0)-dt);
 // Leashed to a wide cleared territory. No navigation into narrow trails.
 if(distance(p,e.post)>350||distance(p,c.world.safeZone)<c.world.safeZone.radius){
  e.alert=false;e.state='idle';e.warnings=[];const a=Math.atan2(e.post.y-e.y,e.post.x-e.x);if(distance(e,e.post)>4)move(c.world,e,Math.cos(a)*e.speed*dt,Math.sin(a)*e.speed*dt);return;
 }
 if(!e.alert&&distance(e,p)>250)return;e.alert=true;
 if(e.state==='recover'){e.timer-=dt;if(e.timer<=0)e.state='chase';return;}
 if(e.state==='attack'){
  e.timer-=dt;if(e.timer>0)return;
  for(const mark of e.warnings||[])if(distance(mark,p)<mark.radius&&clear(c.world,e,p)){if(c.hurt(e.damage,e)&&e.species==='matron')p.root=.65;if(e.species==='tyrant')p.slow=2;}
  for(const mark of e.warnings||[])c.effect('100',e.species==='juggernaut'?0:12,mark.x,mark.y,mark.radius*2,0,.45);
  if(e.species==='admiral')for(let n=-3;n<=3;n++){c.shoot(e,e.angle+n*.24,'magic',e.damage*.75,'enemy',100,false,['slow']);c.projectiles[c.projectiles.length-1].ttl=3;}
  e.warnings=[];e.state='recover';e.timer=2.2;e.cooldown=3;return;
 }
 if(e.cooldown===0&&clear(c.world,e,p)&&distance(e,p)<245){
  e.state='attack';e.timer=e.species==='tyrant'?1.8:1.6;e.windup=e.timer;e.angle=Math.atan2(p.y-e.y,p.x-e.x);e.warnings=[];
  if(e.species==='juggernaut')e.warnings=[{x:e.x,y:e.y,radius:100},{x:p.x,y:p.y,radius:50}];
  if(e.species==='matron'){e.warnings.push({x:p.x,y:p.y,radius:44});for(const turn of [-1.4,1.4]){const a=e.angle+turn;e.warnings.push({x:p.x+Math.cos(a)*68,y:p.y+Math.sin(a)*68,radius:30});}}
  if(e.species==='tyrant')for(let n=1;n<=4;n++)e.warnings.push({x:e.x+Math.cos(e.angle)*n*52,y:e.y+Math.sin(e.angle)*n*52,radius:38});
  if(e.species==='admiral')for(const n of [-1,0,1]){const a=e.angle+n*.7;e.warnings.push({x:e.x+Math.cos(a)*115,y:e.y+Math.sin(a)*115,radius:40});}
  return;
 }
 const angle=Math.atan2(p.y-e.y,p.x-e.x);e.angle=angle;const nx=e.x+Math.cos(angle)*e.speed*dt,ny=e.y+Math.sin(angle)*e.speed*dt;
 if(distance({x:nx,y:ny},e.post)<220&&distance(e,p)>85)move(c.world,e,nx-e.x,ny-e.y);
}
export function drawColossalWarnings(g,c,ox,oy){
 for(const e of c.enemies)if(e.hp>0&&e.colossal)for(const m of e.warnings||[]){g.fillStyle=e.species==='tyrant'?'#88d8ff25':'#efab5430';g.strokeStyle=e.species==='tyrant'?'#b7edff':'#ffc87a';g.lineWidth=2;g.beginPath();g.arc(m.x+ox,m.y+oy,m.radius,0,Math.PI*2);g.fill();g.stroke();g.beginPath();g.arc(m.x+ox,m.y+oy,m.radius*Math.max(0,1-e.timer/e.windup),0,Math.PI*2);g.stroke();g.lineWidth=1;}
}
