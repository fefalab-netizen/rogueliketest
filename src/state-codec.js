// JSON graph format preserves Sets, typed grids and shared entity references.
const arrays={Uint8Array,Uint16Array,Uint32Array,Int8Array,Int16Array,Int32Array,Float32Array,Float64Array};
const forbidden=new Set(['__proto__','constructor','prototype']);
export function encodeState(root){
 const nodes=[],seen=new Map();
 function value(v){
  if(v===null||typeof v==='string'||typeof v==='boolean')return v;
  if(typeof v==='number')return Number.isFinite(v)?v:null;
  if(typeof v!=='object')return null;
  if(seen.has(v))return {ref:seen.get(v)};
  const id=nodes.length;seen.set(v,id);nodes.push(null);let node;
  if(ArrayBuffer.isView(v)){
   const runs=[];for(let i=0;i<v.length;){let end=i+1;while(end<v.length&&v[end]===v[i])end++;runs.push(end-i,v[i]);i=end;}node={type:v.constructor.name,length:v.length,runs};
  }else if(v instanceof Set)node={type:'set',data:[...v].map(value)};
  else if(v instanceof Map)node={type:'map',data:[...v].map(([k,x])=>[value(k),value(x)])};
  else if(Array.isArray(v))node={type:'array',data:v.map(value)};
  else node={type:'object',data:Object.entries(v).filter(([k,x])=>!forbidden.has(k)&&typeof x!=='function'&&x!==undefined).map(([k,x])=>[k,value(x)])};
  nodes[id]=node;return {ref:id};
 }
 const entry=value(root);return {entry,nodes};
}
export function decodeState(graph){
 if(!graph||!Array.isArray(graph.nodes)||graph.nodes.length>150000)throw Error('Invalid or oversized data graph.');
 let cells=0;const nodes=graph.nodes;
 const objects=nodes.map(n=>{
  if(!n||typeof n.type!=='string')throw Error('Invalid state entry.');
  if(Object.hasOwn(arrays,n.type)){if(!Number.isInteger(n.length)||n.length<0||n.length>262144||(cells+=n.length)>5000000)throw Error('Grid exceeds supported size.');return new arrays[n.type](n.length);}
  if(!Array.isArray(n.data)||n.data.length>262144)throw Error('Invalid state collection.');
  if(n.type==='array')return [];if(n.type==='set')return new Set();if(n.type==='map')return new Map();if(n.type==='object')return {};throw Error('Unknown state type.');
 });
 function value(v){if(v===null||['string','boolean','number'].includes(typeof v))return v;if(!v||!Number.isInteger(v.ref)||v.ref<0||v.ref>=objects.length)throw Error('Broken state reference.');return objects[v.ref];}
 nodes.forEach((n,i)=>{
  const out=objects[i];
  if(Object.hasOwn(arrays,n.type)){let offset=0;if(!Array.isArray(n.runs)||n.runs.length%2)throw Error('Invalid grid data.');for(let j=0;j<n.runs.length;j+=2){const count=n.runs[j],v=n.runs[j+1];if(!Number.isInteger(count)||count<1||offset+count>out.length||!Number.isFinite(v))throw Error('Invalid grid run.');out.fill(v,offset,offset+count);offset+=count;}if(offset!==out.length)throw Error('Incomplete grid.');}
  else if(n.type==='array')for(const v of n.data)out.push(value(v));
  else if(n.type==='set')for(const v of n.data)out.add(value(v));
  else for(const pair of n.data){if(!Array.isArray(pair)||pair.length!==2)throw Error('Invalid property.');const [k,v]=pair;if(n.type==='map')out.set(value(k),value(v));else{if(typeof k!=='string'||forbidden.has(k))throw Error('Unsupported property.');out[k]=value(v);}}
 });return value(graph.entry);
}
export function downloadJSON(name,data){const url=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export async function readJSON(file){if(!file||file.size>24*1024*1024)throw Error('Choose a JSON file smaller than 24 MB.');return JSON.parse(await file.text());}
