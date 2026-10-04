(function(){
"use strict";

let cinematicSelection=null;
const videoPattern=/\.(webm|mp4)(?:$|[?#])/i;

function esc(value){return String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]))}
function liveCharacter(id){return typeof getLiveCharacter==="function"?getLiveCharacter(id):null}
function mediaNode(source,name,media={}){
    if(!source)return `<span class="cinematic-fallback">${esc((name||"?").slice(0,1).toUpperCase())}</span>`;
    const style=`--media-scale:${Math.max(40,Math.min(200,Number(media.scale)||100))/100};--media-x:${Math.max(-200,Math.min(200,Number(media.offsetX)||0))}px;--media-y:${Math.max(-200,Math.min(200,Number(media.offsetY)||0))}px;--media-flip:${media.flip?-1:1}`;
    return videoPattern.test(source)?`<video class="cinematic-entity-media" style="${style}" src="${esc(source)}" autoplay muted loop playsinline></video>`:`<img class="cinematic-entity-media" style="${style}" src="${esc(source)}" alt="${esc(name||"Personagem")}">`;
}
function entityForSlot(slot){
    const position=Number(slot.dataset.position||slot.dataset.npcPosition),isPlayer=slot.classList.contains("player-position"),isEnemy=slot.classList.contains("enemy-position");
    const list=isPlayer?currentTableCampaign?.players:isEnemy?currentTableCampaign?.enemies:currentTableCampaign?.npcs;
    const entity=(list||[]).find(item=>Number(item.position)===position);
    return entity?{entity,type:isPlayer?"player":isEnemy?"enemy":"npc",position}:null;
}
function decorateTokens(){
    document.querySelectorAll(".combat-position,.npc-position").forEach(slot=>{
        const found=entityForSlot(slot),token=slot.querySelector(".combat-token");
        if(!found||!token)return;
        let model=found.entity;
        if(found.type==="player")model=liveCharacter(model.characterId)||model;
        const wounded=(model.conditions||[]).some(condition=>String(typeof condition==="string"?condition:condition.id||condition.name||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()==="machucado");
        const media=model.combatMedia||{},enemySize=found.type==="enemy"?Math.max(1,Number(found.entity.size)||1):1,displayMedia={...media,scale:(Number(media.scale)||100)*(1+((enemySize-1)*.18))},source=media.idle||(wounded?model.woundedPhoto:"")||model.photo||model.image||"";
        token.dataset.cinematicType=found.type;
        token.dataset.cinematicId=model.id||model.enemyId||model.npcId||found.entity.characterId||"";
        const old=token.querySelector("img,.combat-token-fallback,video");
        const sourceSignature=`${source}:${displayMedia.scale}:${displayMedia.offsetX||0}:${displayMedia.offsetY||0}:${Boolean(displayMedia.flip)}`;
        if(old&&token.dataset.cinematicSource!==sourceSignature){const holder=document.createElement("div");holder.innerHTML=mediaNode(source,model.name,displayMedia);old.replaceWith(holder.firstElementChild);token.dataset.cinematicSource=sourceSignature}
        if(!token.dataset.cinematicBound){token.addEventListener("click",()=>{cinematicSelection=entityForSlot(slot);renderHud()});token.dataset.cinematicBound="true"}
        if(found.type==="enemy")slot.style.setProperty("--enemy-size",enemySize);
    });
}
function portraitForParticipant(participant){
    const id=participant.characterId||participant.enemyId||participant.npcId||participant.id;
    const character=liveCharacter(participant.characterId||id);
    const enemy=(currentTableCampaign?.enemies||[]).find(item=>String(item.enemyId||item.id)===String(id));
    const npc=(currentTableCampaign?.npcs||[]).find(item=>String(item.npcId||item.id)===String(id));
    const model=character||enemy||npc||participant;
    return {name:model.name||participant.name||"Participante",photo:model.photo||model.image||"",id};
}
function renderInitiative(){
    const root=document.getElementById("cinematicInitiative");if(!root)return;
    const combat=currentTableCampaign?.combat||{},order=Array.isArray(combat.turnOrder)?combat.turnOrder:[],index=Math.max(0,Number(combat.currentTurnIndex??combat.turnIndex)||0);
    root.innerHTML=`<span class="cinematic-round">RODADA <strong>${Math.max(1,Number(combat.round)||1)}</strong></span><div class="initiative-portraits">${order.map((item,i)=>{const p=portraitForParticipant(item);return `<div class="initiative-portrait ${i===index?"active":""}" title="${esc(p.name)}">${p.photo?`<img src="${esc(p.photo)}" alt="">`:`<span>${esc(p.name.slice(0,1))}</span>`}</div>`}).join("")||'<small>Iniciativa ainda não definida</small>'}</div>`;
}
function resource(model,key,fallback=0){return Math.max(0,Number(model?.status?.[key]??model?.[key]??fallback)||0)}
function backButton(){return '<button type="button" class="hud-back" data-leave-table aria-label="Voltar para campanhas">↩ <span>Voltar</span></button>'}
function bodyHtml(model){
    const body=model?.body||{},labels=[["head","Cabeça"],["torso","Torso"],["leftArm","Braço E."],["rightArm","Braço D."],["leftLeg","Perna E."],["rightLeg","Perna D."],["heart","Coração"]];
    return `<div class="hud-body">${labels.map(([key,label])=>{const raw=key==="heart"?(model.heart||body.heart):body[key];const value=typeof raw==="object"?(raw.current??raw.currentPV??raw.max):raw;return `<div><span>${label}</span><strong>${Number(value)||0}</strong></div>`}).join("")}</div>`;
}
function playerHud(model,masterViewing=false){
    const status=model.status||{},pmNow=resource(model,"pmAtual",model.pm),pmMax=resource(model,"pmMax",model.pm),temp=resource(model,"pvTemporario",model.temporaryPV);
    const attacks=(model.attacks||[]).slice(0,3);
    const quick=`<div class="hud-quick-attacks">${[0,1,2].map(index=>{const attack=attacks[index];return `<div class="hud-quick-card"><strong>${esc(attack?.name||`Ataque ${index+1}`)}</strong><div>${attack?`<button data-quick="${index}" data-roll="attack">Ataque</button><button data-quick="${index}" data-roll="damage">Dano</button>`:"<small>Vazio</small>"}</div></div>`}).join("")}<button class="hud-heal" data-menu="character">＋ Cura</button></div>`;
    return `<div class="hud-identity"><span>${masterViewing?"FICHA SELECIONADA":"JOGADOR"}</span><strong>${esc(model.name||"Personagem")}</strong><small>PV temporário ${temp} • PM ${pmNow}/${pmMax}</small>${masterViewing?'<button type="button" class="hud-master-return" data-master-reset>♛ Controles do mestre</button>':backButton()}</div>${quick}${bodyHtml(model)}<div class="hud-resources"><button data-menu="character">Perícias</button><button data-menu="inventory">Inventário</button><button data-menu="notes">Anotações</button><button data-menu="dice">Dados</button></div><div class="hud-actions"><button data-open="abilities">Habilidades</button><button data-open="assimilations">Assimilações</button><button data-menu="grimoire">Rituais</button></div>`;
}
function enemyHud(enemy){
    const hp=resource(enemy,"pvAtual",enemy.pv),max=resource(enemy,"pvMax",enemy.pv),pa=resource(enemy,"paAtual",enemy.pa),paMax=resource(enemy,"paMax",enemy.pa);
    return `<div class="hud-identity"><span>AMEAÇA</span><strong>${esc(enemy.name||"Criatura")}</strong><small>PV ${hp}/${max} • PA ${pa}/${paMax} • DEF ${Number(enemy.defense)||0} • RD ${Number(enemy.rd)||0}</small>${backButton()}</div>${enemy.lifeMode==="body"?bodyHtml(enemy):`<div class="hud-vital"><span>PV</span><strong>${hp}</strong><small>de ${max}</small></div>`}<div class="hud-actions"><button data-enemy="basic">Ataque básico</button><button data-enemy="strong">Ataque forte</button><button data-enemy="sheet">Habilidades e ficha</button><button data-master="initiative">Iniciativa</button><button data-master="next-round">Passar rodada</button></div>`;
}
function masterHud(){return `<div class="hud-identity"><span>MESTRE</span><strong>Controle do combate</strong><small>Selecione um personagem, NPC ou ameaça</small>${backButton()}</div><div class="hud-actions"><button data-master="initiative">Iniciativa</button><button data-master="next-round">Passar rodada</button><button data-master="enemies">Ameaças</button><button data-master="npcs">NPCs</button><button data-master="map">Cenário</button><button data-master="music">Música</button><button data-master="dice">Dados</button><button data-master="notes">Anotações</button></div>`}
function renderHud(){
    const root=document.getElementById("cinematicHud");if(!root||!currentTableCampaign)return;
    root.className="cinematic-hud";
    if(currentTableRole==="player"){root.classList.add("hud-layout-player");root.innerHTML=playerHud(currentTableCharacter||{})}
    else if(cinematicSelection?.type==="enemy"){root.classList.add("hud-layout-enemy");root.innerHTML=enemyHud(cinematicSelection.entity)}
    else if(cinematicSelection?.type==="player"){root.classList.add("hud-layout-player");const character=liveCharacter(cinematicSelection.entity.characterId)||cinematicSelection.entity;root.innerHTML=playerHud(character,true)}
    else{root.classList.add("hud-layout-master");root.innerHTML=masterHud()}
    root.querySelectorAll("[data-menu]").forEach(button=>button.onclick=()=>handleMenuAction(button.dataset.menu));
    root.querySelectorAll("[data-quick]").forEach(button=>button.onclick=()=>rollQuickAttack(Number(button.dataset.quick),button.dataset.roll));
    root.querySelectorAll("[data-master]").forEach(button=>button.onclick=()=>handleMenuAction(button.dataset.master));
    root.querySelectorAll("[data-leave-table]").forEach(button=>button.onclick=()=>document.getElementById("leaveTable")?.click());
    root.querySelectorAll("[data-master-reset]").forEach(button=>button.onclick=()=>{cinematicSelection=null;renderHud()});
    root.querySelector('[data-open="abilities"]')?.addEventListener("click",()=>openCharacterPanel());
    root.querySelector('[data-open="assimilations"]')?.addEventListener("click",()=>openCharacterPanel());
    root.querySelectorAll("[data-enemy]").forEach(button=>button.onclick=()=>{const selected=cinematicSelection;if(!selected)return;openEnemyControlSheet(selected.entity,selected.position);requestAnimationFrame(()=>{if(button.dataset.enemy!=="sheet")document.querySelector(`.enemy-quick-attack[data-attack="${button.dataset.enemy}"][data-roll="attack"]`)?.focus()})});
}
function renderResult(){
    const root=document.getElementById("cinematicResult");if(!root)return;
    const rolls=(currentTableCampaign?.chatMessages||[]).filter(message=>message.type==="roll");
    const last=rolls[rolls.length-1];if(!last)return;
    let success=null,caption=last.label||"Resultado";
    if(typeof last.attackApplication?.hit==="boolean")success=last.attackApplication.hit;
    else if(typeof last.testSuccess==="boolean")success=last.testSuccess;
    else if(typeof last.success==="boolean")success=last.success;
    const signature=`${last.id}:${last.total}:${success}`;if(root.dataset.signature===signature)return;root.dataset.signature=signature;
    root.innerHTML=`<span>${esc(caption)}</span><strong>${Number(last.total)||0}</strong><small class="${success===true?"success":success===false?"failure":""}">${success===true?"SUCESSO":success===false?"FALHA":""}</small>`;
}
function refresh(){decorateTokens();renderInitiative();renderHud();renderResult();document.body.classList.toggle("cinematic-master",currentTableRole==="master");document.body.classList.toggle("cinematic-player",currentTableRole==="player")}

document.addEventListener("DOMContentLoaded",()=>{
    const original=window.renderCombatPositions;
    if(typeof original==="function")window.renderCombatPositions=function(){const value=original.apply(this,arguments);requestAnimationFrame(refresh);return value};
    const originalQuick=window.rollQuickAttack;
    if(typeof originalQuick==="function")window.rollQuickAttack=function(index,type){
        originalQuick.apply(this,arguments);
        refreshCurrentTableCampaign();
        const messages=currentTableCampaign?.chatMessages||[],message=[...messages].reverse().find(item=>item.type==="roll"&&item.rollKind===type&&Number(item.attackIndex)===Number(index)&&item.applied!==true);
        if(message){closeCurrentPanel();if(type==="attack")startAttackTargetSelection(message.id);else if(type==="damage")startDamageTargetSelection(message.id)}
        requestAnimationFrame(refresh);
    };
    requestAnimationFrame(refresh);
    window.setInterval(refresh,700);
});
})();
