import {captureAdventure,decodeSave,resumeAdventure,saveAdventure,readRecord,writeRecords,recordEnding} from './persistence.js?v=8.0.0';
import {downloadJSON,readJSON} from './state-codec.js?v=8.0.0';
import {requiredArtwork} from './tool-data.js?v=8.0.0';

export function installSaveUI(api){
 const $=id=>document.getElementById(id),dialog=document.createElement('dialog');dialog.id='saveDialog';
 dialog.innerHTML='<h2>Adventure records</h2><p id="saveStatus" role="status">Loading local records…</p><p>One local save slot. Save manually before closing the browser. Death ends the run. Export a file to keep a portable backup.</p><div class="save-actions"><button id="saveNow">Save adventure</button><button id="saveQuit">Save and quit</button><button id="loadRun">Continue saved adventure</button><button id="exportRun">Export current adventure</button><label class="file-button">Import save file<input id="importRun" type="file" accept=".json,application/json"></label><button id="replayRun">Replay current seed from the beginning</button></div><h3>Legacy</h3><p id="legacySummary"></p><button id="closeSave">Close</button>';
 document.body.append(dialog);let busy=false,previous='selection';const endedHere=new Set();
 async function refresh(){try{const [file,legacy]=await Promise.all([readRecord('active'),readRecord('legacy')]);$('saveStatus').textContent=file?`${file.summary.hero} · Level ${file.summary.level} · ${file.summary.region} · ${file.summary.difficulty} · Saved ${new Date(file.savedAt).toLocaleString()}`:'No saved adventure yet.';$('loadRun').disabled=!file;$('legacySummary').textContent=legacy?`${legacy.completed} completed · ${legacy.fallen} fallen · ${legacy.kills} enemies defeated · ${legacy.lore.length} lore entries · All eight heroes unlocked`:'Your story is still unwritten. All eight heroes are available.';}catch(e){$('saveStatus').textContent=e.message;}}
 async function action(fn){if(busy)return;busy=true;dialog.querySelectorAll('button,input').forEach(b=>b.disabled=true);try{await fn();}catch(e){$('saveStatus').textContent=e.message;}finally{busy=false;dialog.querySelectorAll('button,input').forEach(b=>b.disabled=false);}}
 function close(next){dialog.close();api.mode(next||previous);}
 function show(){const mode=api.state().mode;previous=['selection','dead','complete'].includes(mode)?mode:'paused';api.mode(previous);dialog.showModal();const a=api.state().adventure,alive=a&&a.player.hp>0&&!a.quests.finished&&!a.sandbox;for(const id of ['saveNow','saveQuit','exportRun'])$(id).hidden=!alive;$('replayRun').hidden=!a;refresh();}
 for(const container of [document.querySelector('#selection footer'),document.querySelector('#pause .modal'),document.querySelector('#result .modal')]){const b=document.createElement('button');b.textContent='Save / Continue';b.onclick=show;container.append(b);}
 $('closeSave').onclick=()=>close();dialog.addEventListener('cancel',e=>{e.preventDefault();if(!busy)close();});
 $('saveNow').onclick=()=>action(async()=>{await saveAdventure(api.state().adventure);await refresh();$('saveStatus').textContent+=' · Saved successfully.';});
 $('saveQuit').onclick=()=>action(async()=>{await saveAdventure(api.state().adventure);close('selection');});
 $('exportRun').onclick=()=>action(async()=>{downloadJSON('first-descent-adventure.json',captureAdventure(api.state().adventure));$('saveStatus').textContent='Save file exported.';});
 async function load(file,importing=false){
  const state=decodeSave(file);let legacy,storageAvailable=true;
  try{legacy=await readRecord('legacy');}catch(e){if(!importing)throw e;storageAvailable=false;}
  if(endedHere.has(state.adventure.runId)||legacy?.ended.includes(state.adventure.runId))throw Error('This run has ended. Replay its seed to begin again.');
  const current=api.state().adventure;if(current&&current.player.hp>0&&!current.quests.finished&&!confirm('Replace the current in-memory adventure? Unsaved progress will be lost.'))return;
  const restored=resumeAdventure(state,api.notice);await api.loadArt(requiredArtwork(restored));
  if(importing&&storageAvailable){const existing=await readRecord('active');if(existing&&!confirm('Replace the local save slot with this imported adventure?'))return;await writeRecords([['active',file]]);}
  api.restore(restored,state.hero);close('paused');api.notice(storageAvailable?'Adventure restored. Resume when ready.':'Adventure restored in memory. Local storage is unavailable; export your progress before closing.');
 }
 $('loadRun').onclick=()=>action(async()=>load(await readRecord('active')));
 $('importRun').onchange=()=>action(async()=>{const file=$('importRun').files[0];$('importRun').value='';await load(await readJSON(file),true);});
 $('replayRun').onclick=()=>{const a=api.state().adventure;if(a&&confirm('Start this seed again with the same hero and difficulty? Current unsaved progress will be lost.')){api.replay(a);close('playing');}};
 return {show,ended:async a=>{endedHere.add(a.runId);try{await recordEnding(a);}catch(e){api.notice(e.message);}},confirmNew:()=>!api.state().adventure||api.state().adventure.player.hp<=0||api.state().adventure.quests.finished||confirm('Begin a fresh adventure? Current unsaved progress will be lost. Your saved slot remains until you save over it.')};
}
