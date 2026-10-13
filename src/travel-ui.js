// Travel is committed only by the explicit confirmation button.
export function confirmJourney(title,message,label,enabled=true){
 const panel=document.getElementById('story');panel.replaceChildren();
 const h=document.createElement('h2'),p=document.createElement('p'),yes=document.createElement('button'),no=document.createElement('button');
 h.textContent=title;p.textContent=message;yes.textContent=label;yes.disabled=!enabled;no.textContent='Not now';panel.append(h,p,yes,no);
 return new Promise(resolve=>{let settled=false;const finish=value=>{if(settled)return;settled=true;panel.removeEventListener('close',cancel);panel.close();resolve(value);};const cancel=()=>finish(false);yes.onclick=()=>{yes.disabled=true;finish(true);};no.onclick=()=>finish(false);panel.addEventListener('close',cancel);panel.showModal();});
}
