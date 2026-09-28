/*==========================================================
= ECO — AUTOMAÇÕES DAS HABILIDADES FINAIS
==========================================================*/
(function(){
"use strict";

let installed=false;
const slug=value=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
function abilities(character){const list=[character?.abilities,character?.acquiredAbilities,character?.habilidades].find(Array.isArray)||[];return list.map(item=>slug(typeof item==="string"?item:item.id||item.name));}
function has(character,id){return abilities(character).includes(id);}
function players(){return (currentTableCampaign?.players||[]).map(entry=>({entry,character:getLiveCharacter(entry.characterId)})).filter(item=>item.character);}
function positionOf(character){return Number((currentTableCampaign?.players||[]).find(entry=>entry.characterId===character?.id)?.position)||0;}
function adjacent(a,b){const pa=positionOf(a),pb=positionOf(b);return Boolean(pa&&pb&&Math.abs(pa-pb)<=1);}
function abilityState(){currentTableCampaign.combat=currentTableCampaign.combat||{};currentTableCampaign.combat.finalAbilityState=currentTableCampaign.combat.finalAbilityState||{};return currentTableCampaign.combat.finalAbilityState;}
function heal(character,amount,source){
    const value=Math.max(0,Number(amount)||0);if(!character||!value)return 0;
    if(character.lifeMode==="body"&&typeof bodyDamageParts==="function"){
        const parts=bodyDamageParts(character,"player").map(part=>({...part,max:Math.max(0,Number(character.bodyMaximums?.[part.id]??character.body?.[`${part.id}Max`])||part.current)})).filter(part=>part.current<part.max&&part.state.type!=="missing").sort((a,b)=>(b.max-b.current)-(a.max-a.current));
        const part=parts[0];if(!part)return 0;const restored=Math.min(value,part.max-part.current);if(part.state.type==="prosthetic")part.state.currentPV=part.current+restored;else character.body[part.id]=part.current+restored;saveDamagedCharacter(character);addSystemChatMessage(`${source}: ${character.name} recuperou ${restored} PV em ${part.label}.`);return restored;
    }
    character.status=character.status||{};const before=Math.max(0,Number(character.status.pvAtual)||0),maximum=Math.max(before,Number(character.status.pvMax)||0),restored=Math.min(value,maximum-before);character.status.pvAtual=before+restored;saveDamagedCharacter(character);if(restored)addSystemChatMessage(`${source}: ${character.name} recuperou ${restored} PV.`);return restored;
}
function spend(character,pa=0,pm=0){character.status=character.status||{};const currentPA=Math.max(0,Number(character.status.paAtual)||0),currentPM=Math.max(0,Number(character.status.pmAtual??character.status.pdAtual)||0);if(currentPA<pa||currentPM<pm){addSystemChatMessage(`${character.name} não possui PA ou PM suficiente.`);return false;}character.status.paAtual=currentPA-pa;character.status.pmAtual=currentPM-pm;character.status.pdAtual=character.status.pmAtual;saveDamagedCharacter(character);return true;}
function initializeRoundAbilities(){
    refreshCurrentTableCampaign();const round=Math.max(1,Number(currentTableCampaign.combat?.round)||1),state=abilityState(),list=players();
    state.positions=state.positions||{};state.medicalReserve=state.medicalReserve||{};
    list.forEach(({entry,character:owner})=>{
        const nexo=Math.max(0,Number(owner.attributes?.nexo??owner.attributes?.int)||0),corpo=Math.max(0,Number(owner.attributes?.corpo??owner.attributes?.for)||0),previousPosition=state.positions[owner.id];
        if(has(owner,"dominio-de-terreno"))state.dominated=state.dominated||{},state.dominated[owner.id]=previousPosition&&Number(previousPosition)===Number(entry.position)?Number(entry.position):null;
        state.positions[owner.id]=Number(entry.position)||0;
        const scene=currentTableCampaign.combat?.startedAt||currentTableCampaign.combat?.initiativeRequest?.id||"scene";
        if(has(owner,"reserva-medica")&&state.medicalReserve[owner.id]?.scene!==scene)state.medicalReserve[owner.id]={remaining:nexo*4,maximum:nexo*4,scene};
        if(has(owner,"aura-revigorante"))list.filter(({character})=>character.id===owner.id||adjacent(owner,character)).forEach(({character})=>{character.status=character.status||{};character.status.pvTemp=Math.max(Number(character.status.pvTemp)||0,nexo);saveDamagedCharacter(character);});
        if(has(owner,"cicatrizacao-de-repouso")&&Number(state.lastDamageRound?.[owner.id]??-1)<round-1)heal(owner,corpo+nexo,"Cicatrização de Repouso");
    });
    saveTableCampaign();
}
function openMedicalReserve(){
    refreshCurrentTableCampaign();refreshCurrentTableCharacter();const owner=currentTableCharacter,state=abilityState(),nexo=Math.max(0,Number(owner.attributes?.nexo??owner.attributes?.int)||0);state.medicalReserve=state.medicalReserve||{};const reserve=state.medicalReserve[owner.id]||(state.medicalReserve[owner.id]={remaining:nexo*4,maximum:nexo*4});const targets=players().filter(({character})=>character.id!==owner.id&&adjacent(owner,character));
    openTablePanel("HABILIDADE","Reserva Médica",`<div class="table-panel-card"><h3>Reserva: ${reserve.remaining}/${reserve.maximum} PV</h3><p>Escolha um aliado adjacente e a quantidade de cura.</p></div><div class="table-panel-list">${targets.map(({character})=>`<button class="table-panel-card final-medical-target" data-id="${escapeTableHTML(character.id)}"><h3>${escapeTableHTML(character.name)}</h3></button>`).join("")||'<p>Nenhum aliado adjacente.</p>'}</div>`);
    document.querySelectorAll(".final-medical-target").forEach(button=>button.addEventListener("click",()=>{const target=getLiveCharacter(button.dataset.id);openTablePanel("HABILIDADE",`Reserva Médica • ${target.name}`,`<div class="field"><label>PV da reserva a utilizar</label><input id="finalMedicalAmount" type="number" min="1" max="${reserve.remaining}" value="${Math.min(5,reserve.remaining)}"></div><button id="finalMedicalConfirm" class="primary-button full-button">Curar sem gastar PA</button>`);document.getElementById("finalMedicalConfirm")?.addEventListener("click",()=>{const amount=Math.max(1,Math.min(reserve.remaining,Number(document.getElementById("finalMedicalAmount")?.value)||1)),restored=heal(target,amount,"Reserva Médica");reserve.remaining=Math.max(0,reserve.remaining-restored);saveTableCampaign();openMedicalReserve();});}));
}
function openPrioritySwap(){
    refreshCurrentTableCampaign();refreshCurrentTableCharacter();const owner=currentTableCharacter,state=abilityState(),scene=currentTableCampaign.combat?.startedAt||"scene",key=`${owner.id}:${scene}`;if(state.prioritySwap?.[key]){addSystemChatMessage("Troca de Prioridades já foi utilizada nesta cena.");return;}const order=currentTableCampaign.combat?.turnOrder||[],targets=players().filter(({character})=>character.id!==owner.id);
    openTablePanel("HABILIDADE","Troca de Prioridades",`<div class="table-panel-list">${targets.map(({character})=>`<button class="table-panel-card final-priority-target" data-id="${escapeTableHTML(character.id)}"><h3>${escapeTableHTML(character.name)}</h3></button>`).join("")}</div>`);
    document.querySelectorAll(".final-priority-target").forEach(button=>button.addEventListener("click",()=>{const a=order.findIndex(item=>(item.characterId||item.id)===owner.id),b=order.findIndex(item=>(item.characterId||item.id)===button.dataset.id);if(a<0||b<0)return;[order[a],order[b]]=[order[b],order[a]];state.prioritySwap=state.prioritySwap||{};state.prioritySwap[key]=true;saveTableCampaign();renderCombatPositions();addSystemChatMessage(`${owner.name} trocou sua prioridade com ${getLiveCharacter(button.dataset.id)?.name||"um aliado"}.`);closeCurrentPanel();}));
}
function install(){
    if(installed||typeof passTableRound!=="function"||typeof finishDamageApplication!=="function")return;installed=true;
    const oldRound=passTableRound;passTableRound=function(){const result=oldRound();initializeRoundAbilities();return result;};
    const oldFinish=finishDamageApplication;finishDamageApplication=function(character,application){refreshCurrentTableCampaign();const state=abilityState();state.lastDamageRound=state.lastDamageRound||{};if((Number(application?.reducedDamage??application?.finalDamage??application?.actualPVLost)||0)>0)state.lastDamageRound[character.id]=Number(currentTableCampaign.combat?.round)||0;const result=oldFinish(character,application);saveTableCampaign();return result;};
    if(typeof answerAttackReaction==="function"){
        const oldAnswer=answerAttackReaction;answerAttackReaction=function(type){refreshCurrentTableCampaign();refreshCurrentTableCharacter();const character=currentTableCharacter,state=abilityState(),position=positionOf(character),domain=has(character,"dominio-de-terreno")&&Number(state.dominated?.[character.id])===position,shared=has(character,"fortaleza-compartilhada")&&players().some(({character:ally})=>ally.id!==character.id&&adjacent(character,ally));character.defense=character.defense||{};character.damageReduction=character.damageReduction||{};const defense=Number(character.defense.total)||0,rd=Number(character.damageReduction.total)||0;if(domain)character.defense.total=defense+3;if(shared)character.damageReduction.total=rd+2;try{return oldAnswer(type);}finally{refreshCurrentTableCharacter();currentTableCharacter.defense=currentTableCharacter.defense||{};currentTableCharacter.damageReduction=currentTableCharacter.damageReduction||{};currentTableCharacter.defense.total=defense;currentTableCharacter.damageReduction.total=rd;saveDamagedCharacter(currentTableCharacter);}};
    }
    document.addEventListener("click",event=>{const button=event.target.closest(".use-ability-v2,.use-combat-ability");if(!button)return;const id=slug(button.dataset.id);if(id==="reserva-medica"||id==="troca-de-prioridades"){event.preventDefault();event.stopImmediatePropagation();id==="reserva-medica"?openMedicalReserve():openPrioritySwap();}},true);
}
const timer=setInterval(()=>{install();if(installed)clearInterval(timer);},100);setTimeout(install,0);
})();
