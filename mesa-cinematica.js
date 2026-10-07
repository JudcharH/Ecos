(function(){
"use strict";

let cinematicSelection=null;
let resultRenderFrame=0;
const videoPattern=/\.(webm|mp4)(?:$|[?#])/i;

function esc(value){return String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]))}
function liveCharacter(id){return typeof getLiveCharacter==="function"?getLiveCharacter(id):null}
function mediaNode(source,name,media={},portrait=false){
    if(!source)return `<span class="cinematic-fallback">${esc((name||"?").slice(0,1).toUpperCase())}</span>`;
    const style=`--media-scale:${Math.max(40,Math.min(200,Number(media.scale)||100))/100};--media-x:${Math.max(-200,Math.min(200,Number(media.offsetX)||0))}px;--media-y:${Math.max(-200,Math.min(200,Number(media.offsetY)||0))}px;--media-flip:${media.flip?-1:1}`;
    const className=portrait?"cinematic-entity-media cinematic-portrait-media":"cinematic-entity-media";
    return videoPattern.test(source)?`<video class="${className}" style="${style}" src="${esc(source)}" autoplay muted loop playsinline></video>`:`<img class="${className}" style="${style}" src="${esc(source)}" alt="${esc(name||"Personagem")}">`;
}
function entityForSlot(slot){
    const position=Number(slot.dataset.position),type=slot.dataset.cinematicType;
    const list=type==="player"?currentTableCampaign?.players:currentTableCampaign?.enemies;
    const entity=(list||[]).find(item=>Number(item.position)===position);
    return entity?{entity,type,position}:null;
}
function campaignPlayerFor(characterOrEntry){
    const id=characterOrEntry?.characterId??characterOrEntry?.id;
    return (currentTableCampaign?.players||[]).find(item=>String(item.characterId)===String(id))||null;
}
function openCinematicPlayerMovement(characterOrEntry){
    refreshCurrentTableCampaign?.();
    const entry=campaignPlayerFor(characterOrEntry);
    if(!entry)return;
    const own=String(entry.characterId)===String(currentTableCharacter?.id);
    if(currentTableRole!=="master"&&!own)return;
    const occupied=new Map((currentTableCampaign.players||[]).filter(item=>String(item.characterId)!==String(entry.characterId)&&Number(item.position)>=1).map(item=>[Number(item.position),item]));
    const buttons=Array.from({length:6},(_,index)=>index+1).map(position=>{
        const occupant=occupied.get(position),current=Number(entry.position)===position;
        return `<button type="button" class="primary-button cinematic-move-player" data-position="${position}" ${occupant||current?"disabled":""}>Posição ${position}${current?" • atual":occupant?` • ${esc(occupant.name||"ocupada")}`:""}</button>`;
    }).join("");
    openTablePanel("MOVIMENTO",entry.name||"Personagem",`<div class="table-panel-card"><p>Escolha uma posição livre entre 1 e 6.</p></div><div class="cinematic-position-grid">${buttons}</div>`);
    document.querySelectorAll(".cinematic-move-player").forEach(button=>button.onclick=()=>{
        const position=Number(button.dataset.position);
        closeCurrentPanel();
        if(currentTableRole==="master")moveCampaignPlayer(entry.characterId,position);else placeCurrentPlayer(position);
        refresh();
    });
}
function decorateTokens(){
    document.querySelectorAll(".cinematic-slot").forEach(slot=>{
        slot.classList.remove("occupied","covered","current-turn");
        const found=entityForSlot(slot);
        if(!found){
            slot.replaceChildren();
            slot.style.removeProperty("--entity-size");
            slot.dataset.cinematicSource="";slot.dataset.cinematicEntity="";
            slot.onclick=event=>{event.preventDefault();event.stopPropagation();if(pendingEnemyAbilityTarget||pendingAttackApplication||pendingDamageApplication)return;handleEmptyPosition(slot.dataset.cinematicType,Number(slot.dataset.position))};
            return;
        }
        let model=found.type==="enemy"&&typeof hydrateEnemyMedia==="function"?hydrateEnemyMedia(found.entity):found.entity;
        if(found.type==="player")model=liveCharacter(model.characterId)||model;
        const wounded=(model.conditions||[]).some(condition=>String(typeof condition==="string"?condition:condition.id||condition.name||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()==="machucado");
        const media=model.combatMedia||{},enemySize=found.type==="enemy"?Math.max(1,Number(found.entity.size)||1):1,displayMedia={...media,scale:Number(media.scale)||100},source=(wounded&&model.woundedPhoto)||media.idle||model.photo||model.image||"",portrait=false;
        const sourceSignature=`${source}:${portrait}:${displayMedia.scale}:${displayMedia.offsetX||0}:${displayMedia.offsetY||0}:${Boolean(displayMedia.flip)}`;
        if(slot.dataset.cinematicSource!==sourceSignature||slot.dataset.cinematicEntity!==String(model.id||model.enemyId||model.npcId||found.entity.characterId||"")){
            slot.innerHTML=`<button type="button" class="cinematic-token" aria-label="${esc(model.name||"Entidade")}">${mediaNode(source,model.name,displayMedia,portrait)}<span class="cinematic-token-name">${esc(model.name||"Sem nome")}</span></button>`;
            slot.dataset.cinematicSource=sourceSignature;slot.dataset.cinematicEntity=String(model.id||model.enemyId||model.npcId||found.entity.characterId||"");
        }
        slot.classList.add("occupied");
        if(typeof isEntityCurrentTurn==="function"&&isEntityCurrentTurn(found.entity,found.type))slot.classList.add("current-turn");
        slot.style.setProperty("--entity-size",enemySize);
        slot.onclick=event=>{event.preventDefault();event.stopPropagation();const current=entityForSlot(slot);if(!current)return;const playArea=document.querySelector(".table-play-area");if(pendingEnemyAbilityTarget){resolveEnemyAbilityTargetRouter(current.type,current.entity);return}if(playArea?.classList.contains("selecting-damage-target")&&pendingDamageApplication){applyPendingDamageToTarget(current.type,current.entity);return}if(playArea?.classList.contains("selecting-attack-target")&&pendingAttackApplication){applyPendingAttackToTarget(current.type,current.entity);return}if(pendingDamageApplication){applyPendingDamageToTarget(current.type,current.entity);return}if(pendingAttackApplication){applyPendingAttackToTarget(current.type,current.entity);return}if(currentTableRole==="master"){cinematicSelection=current;renderHud();return}if(current.type==="player"&&String(current.entity.characterId)===String(currentTableCharacter?.id))openCinematicPlayerMovement(current.entity)};
    });
    (currentTableCampaign?.enemies||[]).forEach(enemy=>{const anchor=Number(enemy.position),size=Math.max(1,Number(enemy.size)||1);for(let offset=1;offset<size;offset++)document.querySelector(`.cinematic-slot[data-cinematic-type="enemy"][data-position="${anchor-offset}"]`)?.classList.add("covered")});
}
function portraitForParticipant(participant){
    const id=participant.characterId||participant.enemyId||participant.id;
    const character=liveCharacter(participant.characterId||id);
    const rawEnemy=(currentTableCampaign?.enemies||[]).find(item=>String(item.enemyId||item.id)===String(id)),enemy=rawEnemy&&typeof hydrateEnemyMedia==="function"?hydrateEnemyMedia(rawEnemy):rawEnemy;
    const model=character||enemy||participant;
    return {name:model.name||participant.name||"Participante",photo:model.photo||model.image||"",id};
}
function renderInitiative(){
    const root=document.getElementById("cinematicInitiative");if(!root)return;
    const combat=currentTableCampaign?.combat||{},order=Array.isArray(combat.turnOrder)?combat.turnOrder:[],index=Math.max(0,Number(combat.currentTurnIndex??combat.turnIndex)||0);
    root.innerHTML=`<span class="cinematic-round">RODADA <strong>${Math.max(1,Number(combat.round)||1)}</strong></span><div class="initiative-portraits">${order.map((item,i)=>{const p=portraitForParticipant(item);return `<div class="initiative-portrait ${i===index?"active":""}" title="${esc(p.name)}">${p.photo?`<img src="${esc(p.photo)}" alt="">`:`<span>${esc(p.name.slice(0,1))}</span>`}</div>`}).join("")||'<small>Iniciativa ainda não definida</small>'}</div>`;
}
function resource(model,key,fallback=0){return Math.max(0,Number(model?.status?.[key]??model?.[key]??fallback)||0)}
function backButton(){return '<button type="button" class="hud-back" data-leave-table aria-label="Voltar para campanhas">↩ <span>Voltar</span></button>'}
function bodyHtml(model,includeHeart=true,hiddenValues=false){
    const body=model?.body||{},labels=[["head","Cabeça"],["chest","Torso"],["leftArm","Braço E."],["rightArm","Braço D."],["leftLeg","Perna E."],["rightLeg","Perna D."]];
    if(includeHeart)labels.push(["heart","Coração"]);
    return `<div class="hud-body">${labels.map(([key,label])=>{const raw=key==="heart"?(model.heart||body.heart):body[key];const value=typeof raw==="object"?(raw.current??raw.currentPV??raw.max):raw,numeric=Math.max(0,Number(value)||0),shown=hiddenValues?(numeric<=0?"0":"?"):numeric;return `<div><span>${label}</span><strong>${shown}</strong></div>`}).join("")}</div>`;
}
function saveCharacterModel(character){
    try{const key="ordem_characters",list=JSON.parse(localStorage.getItem(key)||"[]"),index=list.findIndex(item=>String(item.id)===String(character.id));if(index>=0)list[index]=character;localStorage.setItem(key,JSON.stringify(list));if(typeof tableCharacters!=="undefined"){const tableIndex=tableCharacters.findIndex(item=>String(item.id)===String(character.id));if(tableIndex>=0)tableCharacters[tableIndex]=character}}catch(error){console.error("Falha ao salvar personagem",error)}
}
function openCinematicSkills(character){
    const skills=Array.isArray(character?.skills)?character.skills:Object.values(character?.skills||{});
    openTablePanel("PERÍCIAS",character?.name||"Personagem",`<div class="table-panel-list">${skills.length?skills.map((skill,index)=>`<button type="button" class="table-panel-card cinematic-skill-roll" data-index="${index}" style="width:100%;text-align:left"><h3>${esc(skill.name||skill.id||"Perícia")}</h3><p>${esc(skill.training||skill.treino||"Sem treino")} • ${esc(skill.selectedAttribute||skill.attribute||"")}${Number(skill.bonus)?` • +${Number(skill.bonus)}`:""}</p></button>`).join(""):"<div class='editor-empty-state'><p>Nenhuma perícia disponível.</p></div>"}</div>`);
    document.querySelectorAll(".cinematic-skill-roll").forEach(button=>button.onclick=()=>{const skill=skills[Number(button.dataset.index)];if(!skill)return;const attribute=skill.selectedAttribute||skill.attribute||enemySkillAttribute(skill.name),attributeValue=Number(character.attributes?.[attribute]??character[attribute])||0,modifier=attributeValue+(Number(skill.bonus)||0)-Math.abs(Number(skill.penalty??skill.penalidade)||0),result=rollCharacterTrainedTest(skill.training||skill.treino||"0",modifier);if(result)addRollChatMessage(`${skill.name||"Perícia"} • ${character.name||"Personagem"}${result.critical?" • CRÍTICO":""}`,result.formula,result.total,enemyRollDetail(result),{rollKind:"skill",playerCritical:result.critical})});
}
function openAbilityPicker(character){
    const owned=new Set((character.abilities||[]).map(item=>String(item.id||item.name).toLowerCase())),catalog=Array.isArray(window.SYSTEM_BASE_V2_ABILITIES)?window.SYSTEM_BASE_V2_ABILITIES:[];
    openTablePanel("HABILIDADES","Adicionar habilidade",`<div class="table-panel-card"><p>Cada habilidade custa <strong>4 PM máximos permanentes</strong>.</p></div><div class="table-panel-list">${catalog.filter(item=>!owned.has(String(item.id||item.name).toLowerCase())).map((item,index)=>`<button class="table-panel-card cinematic-buy-ability" data-index="${index}" style="width:100%;text-align:left"><h3>${esc(item.name||"Habilidade")}</h3><p>${esc(item.description||item.effect||"")}</p></button>`).join("")||"<p>Todas as habilidades disponíveis já foram adquiridas.</p>"}</div>`);
    const available=catalog.filter(item=>!owned.has(String(item.id||item.name).toLowerCase()));document.querySelectorAll(".cinematic-buy-ability").forEach(button=>button.onclick=()=>{const ability=available[Number(button.dataset.index)],status=character.status||(character.status={}),maximum=Math.max(0,Number(status.pmMax)||0);if(!ability||maximum<4){addSystemChatMessage("PM máximo insuficiente para adquirir esta habilidade.");return}status.pmMax=maximum-4;status.pmAtual=Math.min(Math.max(0,Number(status.pmAtual)||0),status.pmMax);character.abilities=Array.isArray(character.abilities)?character.abilities:[];character.abilities.push(structuredClone(ability));saveCharacterModel(character);openCinematicAbilities(character)});
}
function openCinematicAbilities(character){
    if(currentTableRole==="master")currentTableCharacter=character;
    if(typeof window.openSystemBaseAbilitiesPanel==="function")window.openSystemBaseAbilitiesPanel();else openTablePanel("HABILIDADES","Habilidades","");
    if(tablePanelContent)tablePanelContent.dataset.ecoPanelKind="abilities";
    const button=document.createElement("button");button.className="primary-button full-button cinematic-add-owned";button.textContent="＋ Adicionar habilidade";button.onclick=()=>openAbilityPicker(character);tablePanelContent?.prepend(button);
}
function assimilationCatalog(){return [...(window.ECO_BLOOD_ASSIMILATIONS||[]),...(window.ECO_DEATH_ASSIMILATIONS||[])]}
function openAssimilationPicker(character){
    const owned=new Set((character.assimilations||[]).map(item=>String(item.id||item.name).toLowerCase())),available=assimilationCatalog().filter(item=>!owned.has(String(item.id||item.name).toLowerCase()));
    openTablePanel("ASSIMILAÇÕES","Adicionar assimilação",`<div class="table-panel-list">${available.map((item,index)=>`<button class="table-panel-card cinematic-buy-assimilation" data-index="${index}" style="width:100%;text-align:left"><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p><small>Custo permanente: ${Number(item.permanentCost?.value)||0} ${(item.permanentCost?.type||"pv").toUpperCase()}</small></button>`).join("")||"<p>Todas as assimilações disponíveis já foram adquiridas.</p>"}</div>`);
    document.querySelectorAll(".cinematic-buy-assimilation").forEach(button=>button.onclick=()=>{const assimilation=available[Number(button.dataset.index)];if(!assimilation)return;const cost=Math.max(0,Number(assimilation.permanentCost?.value)||0),status=character.status||(character.status={});if((assimilation.permanentCost?.type||"pv")==="pv"){const max=Math.max(0,Number(status.pvMax)||0);if(max<=cost){addSystemChatMessage("PV máximo insuficiente para esta assimilação.");return}status.pvMax=max-cost;status.pvAtual=Math.min(Math.max(0,Number(status.pvAtual)||0),status.pvMax)}character.assimilations=Array.isArray(character.assimilations)?character.assimilations:[];character.assimilations.push(structuredClone(assimilation));saveCharacterModel(character);openCinematicAssimilations(character)});
}
function openCinematicAssimilations(character){
    if(currentTableRole==="master")currentTableCharacter=character;
    openTablePanel("ASSIMILAÇÕES","Assimilações",`<button id="cinematicAddAssimilation" class="primary-button full-button">＋ Adicionar assimilação</button><div class="table-panel-list">${(character.assimilations||[]).length?"":"<div class='editor-empty-state'><p>Nenhuma assimilação adquirida.</p></div>"}</div>`);
    if(tablePanelContent)tablePanelContent.dataset.ecoPanelKind="assimilations";
    document.getElementById("cinematicAddAssimilation")?.addEventListener("click",()=>openAssimilationPicker(character));
}
function openCinematicPlayerConditions(character){
    character=liveCharacter(character?.id||character?.characterId)||character;if(!character)return;
    const conditions=Array.isArray(character.conditions)?character.conditions:[];
    openTablePanel("ESTADO",`Condições • ${character.name||"Personagem"}`,`<button id="cinematicPlayerAddCondition" class="primary-button full-button">＋ Adicionar condição</button><div class="table-panel-list">${conditions.map((item,index)=>`<div class="table-panel-card"><h3>${esc(typeof item==="string"?item:item.name||"Condição")}</h3><button type="button" class="secondary-button cinematic-player-remove-condition" data-index="${index}">Remover</button></div>`).join("")||"<p>Nenhuma condição ativa.</p>"}</div>`);
    document.getElementById("cinematicPlayerAddCondition")?.addEventListener("click",()=>{openTablePanel("ESTADO","Adicionar condição",`<div class="table-panel-list">${ENEMY_CONDITION_CATALOG.map(item=>`<button type="button" class="table-panel-card cinematic-player-condition-choice" data-condition="${esc(item.id)}" style="width:100%;text-align:left"><h3>${esc(item.icon||"")} ${esc(item.name)}</h3><p>${esc(item.description||"")}</p></button>`).join("")}</div>`);document.querySelectorAll(".cinematic-player-condition-choice").forEach(button=>button.onclick=()=>{const definition=ENEMY_CONDITION_CATALOG.find(item=>item.id===button.dataset.condition);if(!definition)return;character.conditions=Array.isArray(character.conditions)?character.conditions:[];const existing=character.conditions.find(item=>normalizeEnemyAbilityId(typeof item==="string"?item:item.id||item.name)===definition.id);if(existing&&definition.stackable&&typeof existing==="object")existing.stacks=Math.max(1,Number(existing.stacks)||1)+1;else if(!existing)character.conditions.push({...definition,stacks:1});saveDamagedCharacter(character);openCinematicPlayerConditions(character);renderHud()})});
    document.querySelectorAll(".cinematic-player-remove-condition").forEach(button=>button.onclick=()=>{character.conditions.splice(Number(button.dataset.index),1);saveDamagedCharacter(character);openCinematicPlayerConditions(character);renderHud()});
}
function rollCinematicPlayer(index,type){
    rollQuickAttack(index,type);
    refreshCurrentTableCharacter?.();
    renderHud();
    if(type!=="attack"&&type!=="damage")return;
    refreshCurrentTableCampaign();
    const message=[...(currentTableCampaign?.chatMessages||[])].reverse().find(item=>item.type==="roll"&&item.rollKind===type&&Number(item.attackIndex)===Number(index)&&item.applied!==true);
    if(message){if(type==="attack")startAttackTargetSelection(message.id);else startDamageTargetSelection(message.id)}
}
function playerHud(model,masterViewing=false){
    const status=model.status||{},pmNow=resource(model,"pmAtual",model.pm),pmMax=resource(model,"pmMax",model.pm),paNow=resource(model,"paAtual",model.pa),paMax=resource(model,"paMax",model.paMax??model.pa),temp=resource(model,"pvTemporario",model.temporaryPV);
    const entries=[model.quickAttacks,model.attacks,model.ataquesRapidos].find(Array.isArray)||[],attacks=entries.slice(0,3),healing=entries[3];
    const quick=`<div class="hud-quick-attacks">${[0,1,2].map(index=>{const attack=attacks[index];return `<div class="hud-quick-card"><strong>${esc(attack?.name||`Ataque ${index+1}`)}</strong><div>${attack?`<button data-quick="${index}" data-roll="attack">Ataque</button><button data-quick="${index}" data-roll="damage">Dano</button>`:"<small>Vazio</small>"}</div></div>`}).join("")}<div class="hud-quick-card hud-healing-card"><strong>${esc(healing?.name||"Cura rápida")}</strong><div>${healing?'<button data-quick="3" data-roll="healing-test">Testar</button><button data-quick="3" data-roll="healing">Curar</button>':"<small>Vazio</small>"}</div></div></div>`;
    return `<div class="hud-identity"><span>${masterViewing?"FICHA SELECIONADA":"JOGADOR"}</span><strong>${esc(model.name||"Personagem")}</strong><small>PV temporário ${temp} • PM ${pmNow}/${pmMax}</small>${masterViewing?'<button type="button" class="hud-master-return" data-master-reset>♛ Controles do mestre</button>':`${backButton()}<span class="hud-pa">PA <strong>${paNow}</strong>/${paMax}</span>`}</div>${quick}${bodyHtml(model)}<div class="hud-resources"><button data-menu="character">Perícias</button><button data-menu="inventory">Inventário</button><button data-menu="notes">Anotações</button><button data-menu="dice">Dados</button><button data-player-move>Mover</button><button data-player-conditions>Condições</button></div><div class="hud-actions"><button data-open="abilities">Habilidades</button><button data-open="assimilations">Assimilações</button><button data-menu="grimoire">Rituais</button><button data-menu="allies">Aliados</button></div>`;
}
function enemyHud(enemy){
    if(enemy?.lifeMode==="body"&&typeof initializeEnemyBody==="function")initializeEnemyBody(enemy);
    const hp=resource(enemy,"pvAtual",enemy.pv),max=resource(enemy,"pvMax",enemy.pv),pa=resource(enemy,"paAtual",enemy.pa),paMax=resource(enemy,"paMax",enemy.pa);
    const attack=(kind,label)=>`<div class="hud-quick-card"><strong>${label}</strong><div><button data-enemy-roll="attack" data-enemy-kind="${kind}">Ataque</button><button data-enemy-roll="damage" data-enemy-kind="${kind}">Dano</button></div></div>`;
    const lifeLabel=enemy.lifeMode==="body"?"Usar PV clássico":"Usar membros";
    return `<div class="hud-identity"><span>CONTROLANDO AMEAÇA</span><strong>${esc(enemy.name||"Criatura")}</strong><small>PV ${hp}/${max} • PA ${pa}/${paMax} • DEF ${Number(enemy.defense)||0} • RD ${Number(enemy.rd)||0}</small><button type="button" class="hud-master-return" data-master-reset>♛ Controles do mestre</button></div><div class="hud-quick-attacks">${attack("basic","Ataque básico")}${attack("strong","Ataque forte")}</div>${enemy.lifeMode==="body"?bodyHtml(enemy,false,true):`<div class="hud-vital"><span>PV</span><strong>${hp}</strong><small>de ${max}</small></div>`}<div class="hud-resources"><button data-enemy-panel="skills">Perícias</button><button data-enemy-panel="conditions">Condições</button><button data-enemy-panel="move">Mover</button><button data-enemy-panel="remove">Remover</button></div><div class="hud-actions"><button data-enemy-panel="abilities">Habilidades</button><button data-enemy-panel="life-mode">${lifeLabel}</button><button data-enemy-panel="rituals">Rituais</button><button data-master="dice">Dados</button></div>`;
}
function liveEnemyFromSelection(){const id=cinematicSelection?.entity?.enemyId||cinematicSelection?.entity?.id;return(currentTableCampaign?.enemies||[]).find(item=>String(item.enemyId||item.id)===String(id))||cinematicSelection?.entity}
function beginLatestTarget(kind,index){refreshCurrentTableCampaign();const message=[...(currentTableCampaign?.chatMessages||[])].reverse().find(item=>item.type==="roll"&&item.rollKind===kind&&item.applied!==true&&(index==null||item.attackVariant===index));if(message){closeCurrentPanel();if(kind==="attack")startAttackTargetSelection(message.id);else startDamageTargetSelection(message.id)}}
function rollCinematicEnemy(enemy,kind,rollType){
    const attackName=kind==="strong"?"Ataque forte":"Ataque básico",position=cinematicSelection?.position||enemy.position,enemyInstanceId=enemy.enemyId||enemy.id;
    if(rollType==="attack"){if(!spendEnemyActionPoints(enemy,1))return;const secondPhase=enemyHasAbility(enemy,"segunda-fase")&&(enemy.conditions||[]).some(condition=>normalizeEnemyAbilityId(typeof condition==="string"?condition:condition.id||condition.name)==="machucado");rollEnemySkill(enemy,"Luta",{label:`Ataque • ${attackName} • ${enemy.name||"Criatura"}`,rollKind:"attack",attackName,enemyInstanceId,attackVariant:kind,flatBonus:secondPhase?3:0,applied:false});beginLatestTarget("attack",kind);renderHud();return}
    const state=enemyAbilityState(enemy),raw=kind==="strong"?enemy.strongAttack:enemy.basicAttack,critical=state.criticalDamageDice&&(!state.criticalAttackVariant||state.criticalAttackVariant===kind)?Number(state.criticalDamageDice)||0:0,investida=state.investidaArmed?1:0,secondPhase=enemyHasAbility(enemy,"segunda-fase")&&(enemy.conditions||[]).some(condition=>normalizeEnemyAbilityId(typeof condition==="string"?condition:condition.id||condition.name)==="machucado"),phaseDice=secondPhase?1:0,extraDice=critical+investida+phaseDice,formula=String(extraDice?addEnemyDamageDice(raw,extraDice):raw||"").replace(/Corpo/gi,Number(enemy.corpo)||0),result=rollDiceExpression(formula);if(!result)return;if(investida)state.investidaArmed=false;if(critical){state.criticalDamageDice=0;state.criticalAttackVariant=null}saveTableCampaign();addRollChatMessage(`Dano • ${attackName} • ${enemy.name}${secondPhase?" • Segunda Fase +1 dado":""}`,formula,result.total,enemyRollDetail(result),{rollKind:"damage",attackName,enemyInstanceId,attackVariant:kind,applied:false});beginLatestTarget("damage",kind);renderHud();
}
function openCinematicEnemyPanel(enemy,type){
    const position=cinematicSelection?.position||enemy.position;
    if(type==="abilities"){openTablePanel("AMEAÇA",`Habilidades • ${enemy.name}`,renderEnemyAbilityCards(enemy));document.querySelectorAll(".enemy-use-ability").forEach(button=>button.onclick=()=>{if(!useNewEnemyAbility(enemy,button.dataset.ability,position))useEnemyAbility(enemy,button.dataset.ability,position)});return}
    if(type==="skills"){const skills=enemy.skills&&typeof enemy.skills==="object"?Object.keys(enemy.skills):[];openTablePanel("AMEAÇA",`Perícias • ${enemy.name}`,`<div class="table-panel-list">${skills.map(name=>`<button class="table-panel-card cinematic-enemy-skill" data-skill="${esc(name)}" style="width:100%;text-align:left"><h3>${esc(name)}</h3><p>Clique para rolar</p></button>`).join("")||"<p>Nenhuma perícia.</p>"}</div>`);document.querySelectorAll(".cinematic-enemy-skill").forEach(button=>button.onclick=()=>rollEnemySkill(enemy,button.dataset.skill));return}
    if(type==="conditions"){const conditions=enemy.conditions||[];openTablePanel("AMEAÇA",`Condições • ${enemy.name}`,`<button id="cinematicEnemyAddCondition" class="primary-button full-button">＋ Adicionar condição</button><div class="table-panel-list">${conditions.map(item=>`<div class="table-panel-card"><h3>${esc(typeof item==="string"?item:item.name||"Condição")}</h3></div>`).join("")||"<p>Nenhuma condição ativa.</p>"}</div>`);document.getElementById("cinematicEnemyAddCondition")?.addEventListener("click",()=>openEnemyConditionSelector(enemy,position));return}
    if(type==="life-mode"){if(enemy.lifeMode==="body")enemy.lifeMode="classic";else initializeEnemyBody(enemy);saveTableCampaign();renderHud();return}
    if(type==="rituals"){if(typeof window.openEnemyGrimoireV25==="function")window.openEnemyGrimoireV25(enemy);else openEnemyGrimoire(enemy);return}
    if(type==="move"){startMoveEntity("enemy",enemy);return}if(type==="remove"){removeEntityFromScene("enemy",enemy);cinematicSelection=null;renderHud()}
}
function masterHud(){return `<div class="hud-identity"><span>MESTRE</span><strong>Controle do combate</strong><small>Selecione um personagem ou ameaça</small>${backButton()}</div><div class="hud-actions"><button data-master="initiative">Iniciativa</button><button data-master="next-round">Passar rodada</button><button data-master="enemies">Ameaças</button><button data-master="npcs">Aliados</button><button data-master="map">Cenário</button><button data-master="music">Música</button><button data-master="dice">Dados</button><button data-master="notes">Anotações</button></div>`}
function redirectLegacyEnemySheet(enemy,position){
    if(!enemy)return;
    closeCurrentPanel();
    cinematicSelection={entity:enemy,type:"enemy",position:Number(position||enemy.position)||1};
    renderHud();
}
function renderHud(){
    const root=document.getElementById("cinematicHud");if(!root||!currentTableCampaign)return;
    root.className="cinematic-hud";
    if(currentTableRole==="player"){root.classList.add("hud-layout-player");root.innerHTML=playerHud(currentTableCharacter||{})}
    else if(cinematicSelection?.type==="enemy"){const enemy=liveEnemyFromSelection();if(enemy)cinematicSelection.entity=enemy;root.classList.add("hud-layout-enemy");root.innerHTML=enemyHud(enemy||cinematicSelection.entity)}
    else if(cinematicSelection?.type==="player"){root.classList.add("hud-layout-player");const character=liveCharacter(cinematicSelection.entity.characterId)||cinematicSelection.entity;root.innerHTML=playerHud(character,true)}
    else{root.classList.add("hud-layout-master");root.innerHTML=masterHud()}
    root.querySelectorAll("[data-menu]").forEach(button=>button.onclick=()=>{if(button.dataset.menu==="character"){const character=currentTableRole==="player"?currentTableCharacter:(cinematicSelection?.type==="player"?liveCharacter(cinematicSelection.entity.characterId):null);if(character)openCinematicSkills(character);return}handleMenuAction(button.dataset.menu)});
    root.querySelectorAll("[data-quick]").forEach(button=>button.onclick=()=>rollCinematicPlayer(Number(button.dataset.quick),button.dataset.roll));
    root.querySelectorAll("[data-master]").forEach(button=>button.onclick=()=>handleMenuAction(button.dataset.master));
    root.querySelectorAll("[data-leave-table]").forEach(button=>button.onclick=()=>document.getElementById("leaveTable")?.click());
    root.querySelectorAll("[data-master-reset]").forEach(button=>button.onclick=()=>{cinematicSelection=null;renderHud()});
    root.querySelectorAll("[data-player-move]").forEach(button=>button.onclick=()=>{const model=currentTableRole==="player"?currentTableCharacter:(cinematicSelection?.type==="player"?cinematicSelection.entity:null);if(model)openCinematicPlayerMovement(model)});
    root.querySelectorAll("[data-player-conditions]").forEach(button=>button.onclick=()=>{const model=currentTableRole==="player"?currentTableCharacter:(cinematicSelection?.type==="player"?liveCharacter(cinematicSelection.entity.characterId):null);if(model)openCinematicPlayerConditions(model)});
    root.querySelector('[data-open="abilities"]')?.addEventListener("click",()=>{const character=currentTableRole==="player"?currentTableCharacter:(cinematicSelection?.type==="player"?liveCharacter(cinematicSelection.entity.characterId):null);if(character)openCinematicAbilities(character)});
    root.querySelector('[data-open="assimilations"]')?.addEventListener("click",()=>{const character=currentTableRole==="player"?currentTableCharacter:(cinematicSelection?.type==="player"?liveCharacter(cinematicSelection.entity.characterId):null);if(character)openCinematicAssimilations(character)});
    root.querySelectorAll("[data-enemy-roll]").forEach(button=>button.onclick=()=>{const enemy=liveEnemyFromSelection();if(enemy)rollCinematicEnemy(enemy,button.dataset.enemyKind,button.dataset.enemyRoll)});
    root.querySelectorAll("[data-enemy-panel]").forEach(button=>button.onclick=()=>{const enemy=liveEnemyFromSelection();if(enemy)openCinematicEnemyPanel(enemy,button.dataset.enemyPanel)});
}
function resultView(message){
    if(!message)return null;
    let success=null,caption=message.label||"Resultado";
    if(typeof message.attackApplication?.hit==="boolean")success=message.attackApplication.hit;
    else if(typeof message.testSuccess==="boolean")success=message.testSuccess;
    else if(typeof message.success==="boolean")success=message.success;
    const target=Number(message.attackApplication?.finalDefense??message.dt??message.resistanceDT),comparison=Number.isFinite(target)&&target>0?` contra ${target}`:"",critical=message.critical===true||message.playerCritical===true||message.enemyCritical===true||/CRÍTICO/i.test(String(message.label||""));
    return{caption,total:Number(message.total)||0,success,comparison,critical,signature:`${message.id}:${message.total}:${success}:${target}:${critical}`};
}
function paintResult(root,view,animate=false){
    if(!root||!view)return;
    root.dataset.signature=view.signature;
    if(animate){root.classList.remove("result-flash");void root.offsetWidth;root.classList.add("result-flash")}
    root.innerHTML=`<span>${esc(view.caption)}</span><strong>${view.total}</strong><small class="${view.success===true?"success":view.success===false?"failure":""}">${view.success===true?"SUCESSO":view.success===false?"FALHA":""}${view.comparison}</small>`;
    root.classList.toggle("critical-result",view.critical);
}
function renderResult(){
    const root=document.getElementById("cinematicResult"),previousRoot=document.getElementById("cinematicPreviousResult");if(!root)return;
    const rolls=(currentTableCampaign?.chatMessages||[]).filter(message=>message?.type==="roll"),last=rolls.at(-1),previous=rolls.at(-2);if(!last)return;
    const currentView=resultView(last),previousView=resultView(previous),signature=`${currentView.signature}|${previousView?.signature||""}`;if(root.dataset.historySignature===signature)return;root.dataset.historySignature=signature;
    paintResult(root,currentView,true);
    if(previousView)paintResult(previousRoot,previousView,false);
}
function scheduleResultRender(refreshCampaign=false){
    if(resultRenderFrame)return;
    resultRenderFrame=requestAnimationFrame(()=>{resultRenderFrame=0;if(refreshCampaign)refreshCurrentTableCampaign?.();renderResult()});
}
function refresh(){decorateTokens();renderInitiative();renderHud();renderResult();document.body.classList.toggle("cinematic-master",currentTableRole==="master");document.body.classList.toggle("cinematic-player",currentTableRole==="player")}

document.addEventListener("DOMContentLoaded",()=>{
    window.openEnemyControlSheet=redirectLegacyEnemySheet;
    try{openEnemyControlSheet=redirectLegacyEnemySheet}catch(error){}
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
    const originalRollMessage=window.addRollChatMessage;
    if(typeof originalRollMessage==="function")window.addRollChatMessage=function(){const value=originalRollMessage.apply(this,arguments);scheduleResultRender(false);return value};
    const originalSaveCampaign=window.saveTableCampaign;
    if(typeof originalSaveCampaign==="function")window.saveTableCampaign=function(){const value=originalSaveCampaign.apply(this,arguments);scheduleResultRender(false);return value};
    try{saveTableCampaign=window.saveTableCampaign}catch(error){}
    document.addEventListener("eco:campaign-render",()=>{refreshCurrentTableCampaign?.();refresh()});
    document.addEventListener("eco:roll-render",()=>scheduleResultRender(true));
    requestAnimationFrame(refresh);
    window.setInterval(renderInitiative,800);
});
})();
