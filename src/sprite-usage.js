import {auditedLabels} from './sprite-labels.js?v=7.5.2';
import {artRefs} from './art-mappings.js?v=7.5.2';
import {monsters} from './monsters.js?v=7.5.2';
// Zero-based cells. New character pairs checked against the attached source sheets.
export const spriteUsage=[
 ...Object.values(monsters).flatMap(m=>m.frames.map(cell=>({sheet:m.sheet,cell,use:m.name,pair:true}))),
 ...[['53',10,'Aldric: elder noble'],['51',4,'Brunna: smith'],['53',6,'Pell: scholar'],['51',12,'Merrin: scout']].flatMap(([sheet,cell,use])=>[cell,cell+1].map(cell=>({sheet,cell,use,pair:true}))),
 {sheet:'101',cell:0,use:'Chapel stone floor'},{sheet:'69',cell:0,use:'Chapel rib wall'},{sheet:'70',cell:9,use:'Chapel ossuary urns'},
 {sheet:'69',cell:12,use:'Ritual shrine'},...Object.entries(artRefs).map(([use,[sheet,cell]])=>({sheet,cell,use})),
].map(entry=>({...entry,label:auditedLabels[entry.sheet]?.[entry.cell]}));
export const coreSheets=['01','02','03','04','05','51','52','53','81','82','83','84','85','86','87','88','89','95','96','98','99','100','101','102','106','110'];
