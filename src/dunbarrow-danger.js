import {hashSeed,monsters} from './monsters.js?v=8.0.0';
import {canOccupy} from './world.js?v=8.0.0';
import {difficultyFor} from './difficulty.js?v=8.0.0';

export function distanceFromRoad(w,p){
 const x=Math.floor(p.x/32),y=Math.floor(p.y/32);
 return w.roadDistance?.[y*w.width+x]??0;
}
export function seedWildernessPacks(w){
 // Multi-source distance field measures distance from the carved roads, not camp.
 const size=w.width*w.height,field=new Uint16Array(size);field.fill(65535);const queue=[];
 for(let i=0;i<size;i++)if(w.terrain[i]===1||w.terrain[i]===3){field[i]=0;queue.push(i);}
 for(let head=0;head<queue.length;head++){const i=queue[head],x=i%w.width,y=Math.floor(i/w.width);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,j=ny*w.width+nx;if(nx<0||ny<0||nx>=w.width||ny>=w.height||field[j]<=field[i]+1)continue;field[j]=field[i]+1;queue.push(j);}}
 w.roadDistance=field;w.wildernessPacks=[];const difficulty=difficultyFor(w),limit=Math.round(20*difficulty.budget);
 for(let attempt=0;attempt<640&&w.wildernessPacks.length<limit;attempt++){
  const roll=hashSeed(w.seed+':wild-pack:'+attempt),tx=12+roll%232,ty=12+(roll>>>10)%232,i=ty*w.width+tx,x=(tx+.5)*32,y=(ty+.5)*32;
  if(field[i]<12||!w.reachable[i]||!canOccupy(w,x,y,14)||Math.hypot(x-w.spawn.x,y-w.spawn.y)<1000)continue;
  if(w.landmarks.some(l=>Math.hypot(x-l.x,y-l.y)<500)||w.wildernessPacks.some(p=>Math.hypot(x-p.x,y-p.y)<720))continue;
  const deep=field[i]>=25,id=w.wildernessPacks.length,territory={x,y,radius:300},members=[];
  const roster=deep?['brute','archer','tank','bandit','archer','grunt','bandit','tank']:['tank','archer','bandit','grunt','archer','bandit'];
  let budget=Math.round((deep?26:18)*difficulty.budget);
  for(let n=0;n<roster.length;n++){
   const species=roster[n],tier=n===0||(deep&&n===2&&difficulty.budget>=1)?'elite':'normal',cost=monsters[species].cost*(tier==='elite'?1.5:1);
   if(cost>budget)continue;
   const angle=n*2.399+roll%6,radius=45+Math.floor(n/3)*30,px=Math.round(tx+Math.cos(angle)*radius/32),py=Math.round(ty+Math.sin(angle)*radius/32),index=py*w.width+px;
   if(field[index]<9||!w.reachable[index]||!canOccupy(w,(px+.5)*32,(py+.5)*32,14)||members.some(m=>m[0]===px&&m[1]===py))continue;
   members.push([px,py,species,tier,{packId:id,territory,faction:'dunbarrow-pack-'+id}]);budget-=cost;
  }
  if(members.length<3)continue;
  w.enemySpawns.push(...members);w.wildernessPacks.push({id,x,y,deep,warned:false});
  // Audited dead trees mark these territories without changing collision or routes.
  const marker=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({tx:tx+dx*4,ty:ty+dy*4})).find(p=>w.solid[p.ty*w.width+p.tx]&&w.terrain[p.ty*w.width+p.tx]===0);
  if(marker)w.decorations.push({...marker,sheet:'83',cell:2,size:55});
 }
}
export function warnWilderness(a,dt){
 const w=a.world;if(!w.wildernessPacks)return;
 w.dangerClock=(w.dangerClock||0)-dt;if(w.dangerClock>0)return;w.dangerClock=.5;
 if(distanceFromRoad(w,a.player)<5)return;
 const pack=w.wildernessPacks.find(p=>!p.warned&&Math.hypot(p.x-a.player.x,p.y-a.player.y)<390&&a.combat.enemies.some(e=>e.packId===p.id&&e.hp>0));
 if(pack){pack.warned=true;a.onNotice(pack.deep?'A warband holds these deep woods. Heavy footsteps, several bowstrings. Retreat to the trail if outmatched.':'An armed hunting pack is nearby. Off the road, they fight together.');}
}
