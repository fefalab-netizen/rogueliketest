import {outdoorTile} from './terrain-art.js?v=7.5';
import {TILE} from './world.js?v=7.5';
const mapCache=new WeakMap();
export function drawOverworld(g,assets,w,p,bounds,ox,oy,sprites){
 const {minX,maxX,minY,maxY}=bounds;
 for(let y=minY;y<maxY;y++)for(let x=minX;x<maxX;x++){
  const t=w.terrain[y*w.width+x],px=x*TILE+ox,py=y*TILE+oy;
  g.fillStyle=t===2?'#154d78':t===1||t===3?'#876038':'#456228';g.fillRect(px,py,TILE,TILE);
  const [sheet,cell]=outdoorTile(w,x,y);assets.draw(g,sheet,cell,px,py,32,32);
 }
 for(const chunk of w.chunks.values())for(const prop of chunk.props){if(prop.tx<minX-2||prop.tx>maxX+2||prop.ty<minY-2||prop.ty>maxY+2)continue;
  sprites.push({depth:(prop.ty+1)*TILE,draw:()=>assets.draw(g,prop.sheet,prop.cell,(prop.tx+.5)*TILE+ox-prop.size/2,(prop.ty+1)*TILE+oy-prop.size,prop.size,prop.size)});
 }
 for(const l of w.landmarks){if(l.tx<minX-3||l.tx>maxX+3||l.ty<minY-3||l.ty>maxY+3)continue;
  if(l.colossal)continue;const camp=l.id==='camp'||l.id==='outpost',dungeon=['raider','chapel','underkeep'].includes(l.id),size=camp?48:dungeon?62:34;
  sprites.push({depth:l.y+12,draw:()=>{
   if(l.legendary)assets.draw(g,'97',2,l.x+ox-27,l.y+oy-43,54,60);else if(l.cache)assets.draw(g,'111',l.claimed?10:7,l.x+ox-22,l.y+oy-25,44,38);else if(l.id!=='caravan')assets.draw(g,camp?'84':dungeon?'102':'95',camp?8:dungeon?10:0,l.x+ox-size/2,l.y+oy-size+14,size,size);
   g.font='9px monospace';g.textAlign='center';g.fillStyle='#0a1210df';g.fillRect(l.x+ox-80,l.y+oy+17,160,15);g.fillStyle=camp?'#efcf89':'#e0e6c9';g.fillText(l.name,l.x+ox,l.y+oy+28);g.textAlign='start';
  }});
 }
}
export function drawFog(g,w,p,bounds,ox,oy){
 for(let y=bounds.minY;y<bounds.maxY;y++)for(let x=bounds.minX;x<bounds.maxX;x++){
  const explored=w.explored[y*w.width+x],distance=Math.hypot(x+.5-p.x/TILE,y+.5-p.y/TILE);
  if(explored&&distance<10)continue;g.fillStyle=explored?'#08100cca':'#08100c';g.fillRect(x*TILE+ox,y*TILE+oy,TILE,TILE);
 }
}
export function drawWorldMap(g,w,p,viewHeight){
 let cache=mapCache.get(w);
 if(!cache){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;cache={canvas,x:-1,y:-1};mapCache.set(w,cache);}
 if(cache.x!==w.revealX||cache.y!==w.revealY){const c=cache.canvas.getContext('2d');c.fillStyle='#08100c';c.fillRect(0,0,256,256);
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){const i=y*256+x;if(!w.explored[i])continue;const t=w.terrain[i];c.fillStyle=t===2?(w.expedition&&w.biomes[i]===0?'#cd692d':'#376581'):t===1||t===3?'#b49562':w.expedition?['#775347','#477246','#afc6ca','#bba475'][w.biomes[i]]:w.solid[i]?'#36462d':'#6a8152';c.fillRect(x,y,1,1);}
  cache.x=w.revealX;cache.y=w.revealY;
 }
 const size=Math.min(164,viewHeight*.42),scale=size/256,mx=12,my=viewHeight-size-35;
 g.fillStyle='#08100cee';g.fillRect(mx-4,my-17,size+8,size+21);g.drawImage(cache.canvas,mx,my,size,size);
 for(const l of w.landmarks)if(w.explored[l.ty*256+l.tx]){g.fillStyle=l.id==='camp'?'#ffe298':'#cc9df0';g.fillRect(mx+l.tx*scale-2,my+l.ty*scale-2,4,4);}
 g.fillStyle='#fff';g.fillRect(mx+p.x/TILE*scale-2,my+p.y/TILE*scale-2,4,4);g.font='8px monospace';g.fillText((w.expedition?'EXPEDITION':'DUNBARROW')+' · M: map',mx,my-6);
}
