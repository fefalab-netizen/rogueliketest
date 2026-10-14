import {difficultyFor} from './difficulty.js?v=7.5.2';
import {move} from './world.js?v=7.5.2';
const cell=(w,p)=>Math.floor(p.y/32)*w.width+Math.floor(p.x/32);
export function updateHazards(a,dt,input){
 const w=a.world,p=a.player,c=a.combat;if(!w.expedition)return;
 const i=cell(w,p),type=w.hazards[i],d=difficultyFor(w),phase=(c.time*d.hazard+(i%7)*.4)%5;
 p.hazardCooldown=Math.max(0,(p.hazardCooldown||0)-dt);
 if(w.biomes[i]===2&&w.terrain[i]===0){
  if(w.variants[i]>=12)p.slow=Math.max(p.slow||0,.12);
  if(w.variants[i]>=4&&w.variants[i]<=6&&!p.dodge){p.slideX=(p.slideX||0)*Math.exp(-4*dt)+input.x*35*dt;p.slideY=(p.slideY||0)*Math.exp(-4*dt)+input.y*35*dt;move(w,p,p.slideX*dt,p.slideY*dt);}
 }else{p.slideX=0;p.slideY=0;}
 if(type&&phase>3.5&&p.hazardCooldown===0){
  if(c.hurt((type===1?18:type===2?9:type===3?16:10)*d.hazard,{x:p.x+2,y:p.y+2})){p.hazardCooldown=1;if(type===1)p.burn=2;if(type===2){p.root=.55;p.poison=3;}if(type===4)p.slow=1.5;}
 }
 for(const key of ['burn','poison'])if(p[key]>0){p[key]=Math.max(0,p[key]-dt);if(p.hazardCooldown===0){c.hurt((key==='burn'?4:2)*d.hazard,{x:p.x,y:p.y});p.hazardCooldown=1;}}
}
export function drawHazards(g,w,c,bounds,ox,oy){
 if(!w.expedition)return;
 const colors=['','#ff913c','#cba0ef','#c4edff','#80e4f0'];
 for(let y=bounds.minY;y<bounds.maxY;y++)for(let x=bounds.minX;x<bounds.maxX;x++){const i=y*w.width+x,type=w.hazards[i];if(!type)continue;const phase=(c.time*difficultyFor(w).hazard+(i%7)*.4)%5;g.globalAlpha=phase>3.5?.7:phase>2?.4:.14;g.fillStyle=colors[type];g.beginPath();g.ellipse((x+.5)*32+ox,(y+.5)*32+oy,14,10,0,0,Math.PI*2);g.fill();if(phase>2){g.globalAlpha=.8;g.strokeStyle=colors[type];g.stroke();}g.globalAlpha=1;}
}
