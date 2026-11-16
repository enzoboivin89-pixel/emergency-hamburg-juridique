const $ = (s) => document.querySelector(s);
const storeKey = "eh_rp_portal_demo_v1";
const getData = () => { try { return JSON.parse(localStorage.getItem(storeKey)) || {docs:[],cases:[]}; } catch { return {docs:[],cases:[]}; } };
const saveData = d => localStorage.setItem(storeKey, JSON.stringify(d));
const penal = [
 ["Excès de vitesse","Circulation","250 $","—"],
 ["Conduite dangereuse","Circulation","500 $","5 min"],
 ["Stationnement gênant","Circulation","150 $","—"],
 ["Coups et blessures","Atteintes aux personnes","750 $","10 min"],
 ["Menaces","Atteintes aux personnes","400 $","5 min"],
 ["Vol","Atteintes aux biens","600 $","8 min"],
 ["Dégradation de véhicule","Atteintes aux biens","450 $","6 min"],
 ["Refus d'obtempérer","Ordre public","500 $","8 min"],
 ["Trouble à l'ordre public","Ordre public","300 $","—"]
];
function renderPenal(){
 const q=$("#penalSearch").value.toLowerCase(), c=$("#penalCategory").value;
 $("#penalRows").innerHTML=penal.filter(r=>(!q||r[0].toLowerCase().includes(q))&&(!c||r[1]===c)).map(r=>`<tr>${r.map(x=>`<td>${x}</td>`).join("")}</tr>`).join("") || '<tr><td colspan="4">Aucun résultat.</td></tr>';
}
function renderAdmin(){
 const d=getData(); $("#docCount").textContent=d.docs.length; $("#caseCount").textContent=d.cases.length;
 const all=[...d.docs.map(x=>({...x,group:"Document"})),...d.cases.map(x=>({...x,group:"Tribunal"}))].sort((a,b)=>b.created-a.created);
 $("#requestsList").innerHTML=all.length?all.map(x=>`<div class="request-item"><span><b>${escapeHtml(x.group)} · ${escapeHtml(x.type||x.kind)}</b><br>${escapeHtml(x.name)} — ${new Date(x.created).toLocaleString("fr-FR")}</span><span>${escapeHtml(x.status||"À examiner")}</span></div>`).join(""):'<p class="muted">Aucune demande pour le moment.</p>';
}
function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
$("#penalSearch").addEventListener("input",renderPenal); $("#penalCategory").addEventListener("change",renderPenal);
$("#menuBtn").addEventListener("click",()=>$("#nav").classList.toggle("open"));
document.querySelectorAll("[data-form]").forEach(btn=>btn.addEventListener("click",()=>{
 const type=btn.dataset.form, config={
 identity:["Demande de carte d'identité",""],
 license:["Demande de permis de conduire",'<label>Catégorie souhaitée<select name="category" required><option value="">Choisir…</option><option>A — Moto</option><option>B — Voiture</option><option>C — Poids lourd</option></select></label>'],
 vehicle:["Demande de carte grise",'<label>Marque et modèle RP<input name="vehicle" required maxlength="80" placeholder="Ex. Bürgerfahrzeug"></label><label>Immatriculation RP<input name="plate" required maxlength="15" placeholder="Ex. HH-RP-204"></label>']
 };
 $("#dialogTitle").textContent=config[type][0]; $("#documentType").value=type; $("#extraFields").innerHTML=config[type][1]; $("#docStatus").textContent=""; $("#requestDialog").showModal();
}));
$("#documentForm").addEventListener("submit",e=>{
 e.preventDefault(); const fd=new FormData(e.currentTarget), obj=Object.fromEntries(fd.entries());
 if(!obj.name||!obj.birth){$("#docStatus").textContent="Merci de compléter les champs obligatoires.";return;}
 const d=getData(); d.docs.push({...obj,type:$("#dialogTitle").textContent,status:"À examiner",created:Date.now()});saveData(d);
 $("#docStatus").textContent="Demande enregistrée sur cet appareil (démonstration).";renderAdmin();e.currentTarget.reset();setTimeout(()=>$("#requestDialog").close(),1000);
});
$("#caseForm").addEventListener("submit",e=>{
 e.preventDefault(); const obj=Object.fromEntries(new FormData(e.currentTarget).entries());const d=getData();
 d.cases.push({...obj,status:"À examiner",created:Date.now()});saveData(d);$("#caseStatus").textContent="Demande enregistrée sur cet appareil (démonstration).";e.currentTarget.reset();renderAdmin();
});
$("#exportBtn").addEventListener("click",()=>{
 const blob=new Blob([JSON.stringify(getData(),null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="demandes-emergency-hamburg-rp.json";a.click();URL.revokeObjectURL(url);
});
renderPenal();renderAdmin();