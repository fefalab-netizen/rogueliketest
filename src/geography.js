import {canOccupy} from './world.js?v=8.0.0';
export function noise(seed,x,y){
 const hash=(a,b)=>{let n=Math.imul(a+seed,374761393)^Math.imul(b,668265263);n=Math.imul(n^(n>>>13),1274126177);return (n>>>0)/4294967296;};
 const ix=Math.floor(x),iy=Math.floor(y),smooth=t=>t*t*(3-2*t),u=smooth(x-ix),v=smooth(y-iy);
 return (hash(ix,iy)*(1-u)+hash(ix+1,iy)*u)*(1-v)+(hash(ix,iy+1)*(1-u)+hash(ix+1,iy+1)*u)*v;
}
export function clearDisk(w,x,y,r,terrain=1){
 for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(dx*dx+dy*dy<=r*r){const nx=x+dx,ny=y+dy;if(nx<2||ny<2||nx>=w.width-2||ny>=w.height-2)continue;const i=ny*w.width+nx;w.solid[i]=false;if(w.terrain)w.terrain[i]=terrain;if(w.hazards)w.hazards[i]=0;}
}
export function trail(w,a,b,width=2){
 const distance=Math.hypot(b.tx-a.tx,b.ty-a.ty),steps=Math.ceil(distance*3),phase=(w.numericSeed%97)*.1;
 for(let n=0;n<=steps;n++){const t=n/steps,bend=Math.sin(t*Math.PI)*Math.sin(t*Math.PI*3+phase)*5,x=Math.round(a.tx+(b.tx-a.tx)*t-(b.ty-a.ty)/distance*bend),y=Math.round(a.ty+(b.ty-a.ty)*t+(b.tx-a.tx)/distance*bend);clearDisk(w,x,y,width,w.terrain?.[y*w.width+x]===2?3:1);}
}
export function reachableCells(w,radius=8,openDoors=false){
 const map=openDoors?{...w,solid:w.solid.slice()}:w;if(openDoors)for(const d of w.doors)map.solid[d.y*w.width+d.x]=false;
 const start=Math.floor(w.spawn.y/32)*w.width+Math.floor(w.spawn.x/32),seen=new Uint8Array(w.width*w.height),q=[];
 if(canOccupy(map,w.spawn.x,w.spawn.y,radius)){q.push(start);seen[start]=1;}
 for(let i=0;i<q.length;i++){const n=q[i],x=n%w.width,y=Math.floor(n/w.width);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=ny*w.width+nx;if(nx>=1&&ny>=1&&nx<w.width-1&&ny<w.height-1&&!seen[k]&&canOccupy(map,(nx+.5)*32,(ny+.5)*32,radius)){seen[k]=1;q.push(k);}}}return seen;
}
// Used by generation during normal play; never executes seed batches.
export function repairOutdoorRoutes(w){
 let seen=reachableCells(w);const home={tx:Math.floor(w.spawn.x/32),ty:Math.floor(w.spawn.y/32)};w.repairs=[];
 for(const l of w.landmarks){if(seen[l.ty*w.width+l.tx])continue;trail(w,home,l,2);w.repairs.push('Route: '+l.id);seen=reachableCells(w);}
 w.reachable=seen;return seen;
}
export function safePosition(w,p,radius=8,limit=12){
 const tx=Math.floor(p.x/32),ty=Math.floor(p.y/32);
 for(let ring=0;ring<=limit;ring++)for(let dy=-ring;dy<=ring;dy++)for(let dx=-ring;dx<=ring;dx++)if(Math.max(Math.abs(dx),Math.abs(dy))===ring){const x=(tx+dx+.5)*32,y=(ty+dy+.5)*32;if(canOccupy(w,x,y,radius)&&(!w.reachable||w.reachable[(ty+dy)*w.width+tx+dx]))return {x,y};}return null;
}
export function prepareDungeon(w){
 if(!w.rooms||!w.edges)return;
 const reachable=reachableCells(w,14,true),required=[w.exit,w.key,...(w.objects||[]),...(w.chests||[])].filter(Boolean);
 const inaccessible=required.some(p=>!reachable[Math.floor(p.y/32)*w.width+Math.floor(p.x/32)]);
 if(inaccessible){
  // Repair only declared room links, then restore every progression lock.
  for(const [from,to]of w.edges){const a=w.rooms[from],b=w.rooms[to];let x=a.cx,y=a.cy;while(x!==b.cx||y!==b.cy){for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)w.solid[(y+dy)*w.width+x+dx]=false;if(x!==b.cx)x+=Math.sign(b.cx-x);else y+=Math.sign(b.cy-y);}}
  for(const d of w.doors)w.solid[d.y*w.width+d.x]=!d.open;
  w.repairs=['Restored declared room links'];
 }
}
