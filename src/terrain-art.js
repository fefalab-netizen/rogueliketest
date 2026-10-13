import {noise} from './geography.js?v=7.5';
const groundCells=[[0,2,3,4,6,7,12,13,15],[0,1,2,3,6,7,8,9,10,11,12,13,14,15],[0,1,2,3,4,5,7,12,13,14,15],[0,1,13,14,15]];
export function outdoorTile(w,x,y){
 const i=y*w.width+x,t=w.terrain[i];
 if(!w.expedition){if(t===2||t===3)return ['82',t===2?1:8];const n=noise(w.numericSeed,x/5,y/5);return t===1?['81',4]:['81',n>.65?1:n<.25?2:0];}
 const biome=w.biomes[i],sheet=['103','105','107','109'][biome],v=w.variants[i];
 if(t===3)return ['101',8];
 if(t===2)return biome===1?['82',1]:[sheet,biome===0?8:biome===2?6:3];
 if(t===1)return [sheet,[7,4,7,1][biome]];
 const water=(dx,dy)=>w.terrain[(y+dy)*w.width+x+dx]===2;
 if(biome===3){const north=water(0,-1),south=water(0,1),west=water(-1,0),east=water(1,0);if(north&&west)return [sheet,8];if(north&&east)return [sheet,9];if(south&&west)return [sheet,10];if(south&&east)return [sheet,11];if(north)return [sheet,4];if(east)return [sheet,5];if(south)return [sheet,6];if(west)return [sheet,7];}
 if(biome===0&&water(-1,0))return [sheet,10];
 return [sheet,groundCells[biome][v%groundCells[biome].length]];
}
export function dungeonFloor(w,x,y){
 const n=noise(w.numericSeed||1,x/4,y/4),sheet=w.floorSheet||(w.theme==='chapel'?'68':'101');
 if(sheet==='101')return [sheet,n>.68?2:n>.51?1:n<.25?4:0];
 if(w.legendary)return [sheet,({103:0,105:15,107:0,109:0})[sheet]??0];
 return [sheet,n>.65?1:0];
}
export function wallCell(w,x,y){
 const open=(dx,dy)=>!w.solid[(y+dy)*w.width+x+dx],n=noise(w.numericSeed||1,x/3,y/3);
 if((open(1,0)||open(-1,0))&&(open(0,1)||open(0,-1)))return 6;
 if(open(0,1)){if((x*7+y*3)%19===0)return 8;if((x+y)%23===0)return 12;if((x*3+y)%29===0)return 14;}
 return n>.66?1:n<.27?5:0;
}
