(function(){
"use strict";

let cinematicSelection=null;
let resultRenderFrame=0;
let resultResetBoundaryId=null;
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
function latestEntityRoll(model,type){
    const id=String(type==="player"?(model.characterId||model.id):(model.enemyId||model.id));
    return [...visibleCinematicRolls()].reverse().find(message=>(type==="player"?String(message.characterId||"")===id:String(message.enemyInstanceId||"")===id))||null;
}
function visibleCinematicRolls(){const rolls=(currentTableCampaign?.chatMessages||[]).filter(message=>message?.type==="roll");if(!resultResetBoundaryId)return rolls;const boundary=rolls.findIndex(message=>String(message.id)===String(resultResetBoundaryId));return boundary>=0?rolls.slice(boundary+1):rolls}
function entityResultHtml(model,type){const roll=latestEntityRoll(model,type);if(!roll)return"";const critical=roll.critical===true||roll.playerCritical===true||roll.enemyCritical===true||/CRÍTICO/i.test(String(roll.label||""));return`<span class="cinematic-entity-result ${critical?"critical":""}" title="${esc(roll.label||"Resultado")}"><small>${esc(String(roll.label||"Teste").split("•")[0].trim())}</small><strong>${Number(roll.total)||0}</strong></span>`}
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
        const latestRoll=latestEntityRoll(found.entity,found.type),sourceSignature=`${source}:${portrait}:${displayMedia.scale}:${displayMedia.offsetX||0}:${displayMedia.offsetY||0}:${Boolean(displayMedia.flip)}:${latestRoll?.id||""}:${latestRoll?.total??""}`;
        if(slot.dataset.cinematicSource!==sourceSignature||slot.dataset.cinematicEntity!==String(model.id||model.enemyId||model.npcId||found.entity.characterId||"")){
            slot.innerHTML=`<button type="button" class="cinematic-token" aria-label="${esc(model.name||"Entidade")}">${entityResultHtml(found.entity,found.type)}${mediaNode(source,model.name,displayMedia,portrait)}<span class="cinematic-token-name">${esc(model.name||"Sem nome")}</span></button>`;
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
function resolvedCharacterFormula(formula,character){
    if(typeof resolveCharacterFormula==="function")return resolveCharacterFormula(formula,character);
    const attributes=character?.attributes||{},values={corpo:Number(attributes.corpo??attributes.for??attributes.vig)||0,foco:Number(attributes.foco??attributes.agi??attributes.pre)||0,nexo:Number(attributes.nexo??attributes.int)||0};
    return String(formula||"").replace(/\b(Corpo|Foco|Nexo)\b/gi,word=>values[word.toLowerCase()]);
}
function backButton(){return '<button type="button" class="hud-back" data-leave-table aria-label="Voltar para campanhas">↩ <span>Voltar</span></button>'}
function bodyHtml(model,includeHeart=true,hiddenValues=false,includeTemporary=false,editable=false){
    const body=model?.body||{},labels=[["head","Cabeça"],["chest","Torso"],["leftArm","Braço E."],["rightArm","Braço D."],["leftLeg","Perna E."],["rightLeg","Perna D."]];
    if(includeHeart)labels.push(["heart","Coração"]);
    if(includeTemporary)labels.push(["temporaryPV","PV Temp."]);
    return `<div class="hud-body">${labels.map(([key,label])=>{const raw=key==="heart"?(model.heart||body.heart):key==="temporaryPV"?(model.status?.pvTemp??body.temporaryPV):body[key];const value=typeof raw==="object"?(raw.current??raw.currentPV??raw.max):raw,numeric=Math.max(0,Number(value)||0),shown=hiddenValues?(numeric<=0?"0":"?"):numeric,field=key==="heart"?"heart.current":key==="temporaryPV"?"status.pvTemp":`body.${key}`;return `<div><span>${label}</span>${editable?editableNumber(numeric,field):`<strong>${shown}</strong>`}</div>`}).join("")}</div>`;
}
function classicVitalHtml(model,editable=false){const current=resource(model,"pvAtual",model.pv),maximum=resource(model,"pvMax",model.pv),temporary=resource(model,"pvTemp",model.body?.temporaryPV);return`<div class="hud-body hud-classic-vitals"><div><span>PV</span>${editable?`<div class="hud-paired-inputs">${editableNumber(current,"status.pvAtual")}${editableNumber(maximum,"status.pvMax",1)}</div>`:`<strong>${current}</strong><small>de ${maximum}</small>`}</div><div><span>PV Temp.</span>${editable?editableNumber(temporary,"status.pvTemp"):`<strong>${temporary}</strong>`}</div></div>`}
function saveCharacterModel(character){
    try{const key="ordem_characters",list=JSON.parse(localStorage.getItem(key)||"[]"),index=list.findIndex(item=>String(item.id)===String(character.id));if(index>=0)list[index]=character;localStorage.setItem(key,JSON.stringify(list));if(typeof tableCharacters!=="undefined"){const tableIndex=tableCharacters.findIndex(item=>String(item.id)===String(character.id));if(tableIndex>=0)tableCharacters[tableIndex]=character}}catch(error){console.error("Falha ao salvar personagem",error)}
}
function persistCinematicCharacter(character,{rerender=true}={}){
    if(!character?.id)return false;
    character.updatedAt=Date.now();
    const saved=typeof saveDamagedCharacter==="function"?saveDamagedCharacter(character):(saveCharacterModel(character),true);
    if(saved&&typeof saveTableCampaign==="function")saveTableCampaign();
    if(saved&&typeof refreshCurrentTableCharacter==="function")refreshCurrentTableCharacter();
    if(saved&&rerender)requestAnimationFrame(renderHud);
    return saved;
}
function bodyMaximumsFor(level,corpo){const total=Math.max(1,(9*Math.max(1,Number(level)||1))+(2*Math.max(0,Number(corpo)||0))),baseHead=Math.round(total*.2),chest=Math.ceil(total*.25),remaining=Math.max(0,total-chest-baseHead),limb=Math.floor(remaining/4),head=baseHead+remaining-(limb*4);return{head,chest,leftArm:limb,rightArm:limb,leftLeg:limb,rightLeg:limb}}
function repairCharacterTorso(character){
    if(!character||character.lifeMode!=="body")return false;
    const corpo=Math.max(0,Number(character.attributes?.corpo??character.attributes?.for??character.attributes?.vig)||0),natural=bodyMaximumsFor(character.level,corpo).chest,deduction=(character.assimilations||[]).reduce((sum,item)=>sum+((item._ecoCostMode==="body"&&item._ecoCostPart==="chest")?Math.max(0,Number(item._ecoPermanentCost??item.permanentCost?.value)||0):0),0),expected=Math.max(1,natural-deduction);
    character.body=character.body||{};character.bodyMaximums=character.bodyMaximums||{};const stored=Math.max(0,Number(character.bodyMaximums.chest??character.body.chestMax)||0),maximum=stored>0?Math.min(stored,expected):expected,current=Math.min(Math.max(0,Number(character.body.chest)||0),maximum),changed=stored!==maximum||Number(character.body.chest)!==current||Number(character.body.chestMax)!==maximum;
    character.bodyMaximums.chest=maximum;character.body.chestMax=maximum;character.body.chest=current;character.heart=character.heart||{};character.heart.max=maximum;character.heart.current=Math.min(Math.max(0,Number(character.heart.current)||0),maximum);if(changed)persistCinematicCharacter(character,{rerender:false});return changed;
}
function updateCurrentAndMaximum(current,oldMaximum,newMaximum){const oldMax=Math.max(0,Number(oldMaximum)||0),oldCurrent=Math.max(0,Number(current)||0),newMax=Math.max(0,Number(newMaximum)||0);return{max:newMax,current:oldMax>0&&oldCurrent>=oldMax?newMax:Math.min(oldCurrent,newMax)}}
function changeCharacterLevel(character,nextLevel){
    const oldLevel=Math.max(1,Number(character.level)||1),level=Math.max(1,Math.min(99,Number(nextLevel)||oldLevel));if(level===oldLevel)return;
    const corpo=Math.max(0,Number(character.attributes?.corpo??character.attributes?.for)||0),status=character.status||(character.status={}),oldPVBase=9*oldLevel+corpo*2,newPVBase=9*level+corpo*2,oldPMBase=6*oldLevel+Math.max(0,Number(character.attributes?.foco??character.attributes?.agi)||0)*2,newPMBase=6*level+Math.max(0,Number(character.attributes?.foco??character.attributes?.agi)||0)*2;
    const pv=updateCurrentAndMaximum(status.pvAtual,status.pvMax,Math.max(1,(Number(status.pvMax)||oldPVBase)+(newPVBase-oldPVBase))),pm=updateCurrentAndMaximum(status.pmAtual??status.pdAtual,status.pmMax??status.pdMax,Math.max(0,(Number(status.pmMax??status.pdMax)||oldPMBase)+(newPMBase-oldPMBase)));
    status.pvAtual=pv.current;status.pvMax=pv.max;status.pmAtual=pm.current;status.pmMax=pm.max;status.pdAtual=pm.current;status.pdMax=pm.max;
    const oldParts=bodyMaximumsFor(oldLevel,corpo),newParts=bodyMaximumsFor(level,corpo);character.body=character.body||{};character.bodyMaximums=character.bodyMaximums||{};
    Object.keys(newParts).forEach(key=>{const oldMax=Number(character.bodyMaximums[key]??character.body[`${key}Max`]??oldParts[key])||oldParts[key],adjusted=updateCurrentAndMaximum(character.body[key],oldMax,Math.max(1,oldMax+(newParts[key]-oldParts[key])));character.body[key]=adjusted.current;character.body[`${key}Max`]=adjusted.max;character.bodyMaximums[key]=adjusted.max});
    const oldHeart=Number(character.heart?.max)||Math.ceil((Number(status.pvMax)||oldPVBase)/4),heartMax=character.lifeMode==="body"?character.bodyMaximums.chest:Math.ceil(status.pvMax/4),heart=updateCurrentAndMaximum(character.heart?.current,oldHeart,heartMax);character.heart={...(character.heart||{}),current:heart.current,max:heart.max};character.level=level;persistCinematicCharacter(character);
}
function editableNumber(value,field,min=0,max=999){return`<input class="hud-inline-number" type="number" inputmode="numeric" min="${min}" max="${max}" value="${Math.max(min,Number(value)||0)}" data-character-field="${field}" aria-label="${field}">`}
function openCinematicSkills(character){
    const skills=Array.isArray(character?.skills)?character.skills:Object.values(character?.skills||{});
    const trainingOptions=[['0','Destreinado'],['1d4','Treinado'],['1d8','Veterano'],['1d12','Especialista']];
    openTablePanel("PERÍCIAS",character?.name||"Personagem",`<div class="cinematic-skill-editor">${skills.length?skills.map((skill,index)=>{const training=String(skill.training||skill.treino||"0");return`<div class="cinematic-skill-row" data-index="${index}"><strong>${esc(skill.name||skill.id||"Perícia")}</strong><select data-skill-field="training" aria-label="Treino de ${esc(skill.name||"perícia")}">${trainingOptions.map(([value,label])=>`<option value="${value}" ${training.includes(value)||training===label?"selected":""}>${label}</option>`).join("")}</select><input type="number" data-skill-field="bonus" value="${Number(skill.bonus)||0}" aria-label="Bônus"><input type="number" data-skill-field="penalty" value="${Number(skill.penalty??skill.penalidade)||0}" aria-label="Penalidade"><button type="button" class="cinematic-skill-roll">Rolar</button></div>`}).join(""):"<div class='editor-empty-state'><p>Nenhuma perícia disponível.</p></div>"}</div>`);
    document.querySelectorAll(".cinematic-skill-row").forEach(row=>{const skill=skills[Number(row.dataset.index)];row.querySelectorAll("[data-skill-field]").forEach(input=>input.onchange=()=>{const key=input.dataset.skillField,value=key==="training"?input.value:Number(input.value)||0;skill[key]=value;if(key==="training")skill.treino=value;if(key==="penalty")skill.penalidade=value;persistCinematicCharacter(character,{rerender:false})});row.querySelector(".cinematic-skill-roll")?.addEventListener("click",()=>{const attribute=skill.selectedAttribute||skill.attribute||enemySkillAttribute(skill.name),attributeValue=Number(character.attributes?.[attribute]??character[attribute])||0,modifier=attributeValue+(Number(skill.bonus)||0)-Math.abs(Number(skill.penalty??skill.penalidade)||0),result=rollCharacterTrainedTest(skill.training||skill.treino||"0",modifier);if(result)addRollChatMessage(`${skill.name||"Perícia"} • ${character.name||"Personagem"}${result.critical?" • CRÍTICO":""}`,result.formula,result.total,enemyRollDetail(result),{rollKind:"skill",playerCritical:result.critical,characterId:character.id})})});
}
function openAbilityPicker(character){
    const owned=new Set((character.abilities||[]).map(item=>String(item.id||item.name).toLowerCase())),catalog=Array.isArray(window.SYSTEM_BASE_V2_ABILITIES)?window.SYSTEM_BASE_V2_ABILITIES:[];
    openTablePanel("HABILIDADES","Adicionar habilidade",`<div class="table-panel-card"><p>Cada habilidade custa <strong>4 PM máximos permanentes</strong>.</p></div><div class="table-panel-list">${catalog.filter(item=>!owned.has(String(item.id||item.name).toLowerCase())).map((item,index)=>`<button class="table-panel-card cinematic-buy-ability" data-index="${index}" style="width:100%;text-align:left"><h3>${esc(item.name||"Habilidade")}</h3><p>${esc(item.description||item.effect||"")}</p></button>`).join("")||"<p>Todas as habilidades disponíveis já foram adquiridas.</p>"}</div>`);
    const available=catalog.filter(item=>!owned.has(String(item.id||item.name).toLowerCase()));document.querySelectorAll(".cinematic-buy-ability").forEach(button=>button.onclick=()=>{const ability=available[Number(button.dataset.index)],status=character.status||(character.status={}),maximum=Math.max(0,Number(status.pmMax??status.pdMax)||0),cost=4;if(!ability||maximum<cost){addSystemChatMessage("PM máximo insuficiente para adquirir esta habilidade.");return}status.pmMax=maximum-cost;status.pdMax=status.pmMax;status.pmAtual=Math.min(Math.max(0,Number(status.pmAtual??status.pdAtual)||0),status.pmMax);status.pdAtual=status.pmAtual;character.abilities=Array.isArray(character.abilities)?character.abilities:[];character.abilities.push({...structuredClone(ability),_ecoAcquisitionCostPM:cost});persistCinematicCharacter(character);openCinematicAbilities(character)});
}
function openCinematicAbilities(character){
    currentTableCharacter=character;
    if(typeof window.openSystemBaseAbilitiesPanel==="function")window.openSystemBaseAbilitiesPanel(character);else openTablePanel("HABILIDADES","Habilidades","");
    if(tablePanelContent)tablePanelContent.dataset.ecoPanelKind="abilities";
    if(!tablePanelContent?.querySelector(".cinematic-add-owned")){const button=document.createElement("button");button.className="primary-button full-button cinematic-add-owned";button.textContent="＋ Adicionar habilidade";button.onclick=()=>openAbilityPicker(character);tablePanelContent?.prepend(button)}
}
function removeCinematicAssimilation(character,index){
    const list=Array.isArray(character?.assimilations)?character.assimilations:[],assimilation=list[index];if(!assimilation)return false;
    const cost=Math.max(0,Number(assimilation._ecoPermanentCost??assimilation.permanentCost?.value)||0),status=character.status||(character.status={});
    if((assimilation.permanentCost?.type||"pv")==="pv"&&cost){
        if((assimilation._ecoCostMode||character.lifeMode)==="body"){
            const part=assimilation._ecoCostPart||"chest";character.body=character.body||{};character.bodyMaximums=character.bodyMaximums||{};
            const maximum=Math.max(0,Number(character.bodyMaximums[part]??character.body[`${part}Max`]??character.body[part])||0)+cost;character.bodyMaximums[part]=maximum;character.body[`${part}Max`]=maximum;
            if(part==="chest"&&character.heart)character.heart.max=maximum;
        }else{status.pvMax=Math.max(0,Number(status.pvMax)||0)+cost;if(character.heart)character.heart.max=Math.ceil(status.pvMax/4)}
    }
    list.splice(index,1);persistCinematicCharacter(character);openCinematicAssimilations(character);return true;
}
function assimilationCatalog(){return [...(window.ECO_BLOOD_ASSIMILATIONS||[]),...(window.ECO_DEATH_ASSIMILATIONS||[])]}
function acquireAssimilation(character,assimilation,bodyPart=""){
    if(!character||!assimilation)return false;
    const cost=Math.max(0,Number(assimilation.permanentCost?.value)||0),status=character.status||(character.status={});
    if((assimilation.permanentCost?.type||"pv")==="pv"){
        if(character.lifeMode==="body"){
            const labels={head:"Cabeça",chest:"Torso",leftArm:"Braço esquerdo",rightArm:"Braço direito",leftLeg:"Perna esquerda",rightLeg:"Perna direita"};
            if(!labels[bodyPart])return false;
            character.body=character.body||{};character.bodyMaximums=character.bodyMaximums||{};
            const maximum=Math.max(0,Number(character.bodyMaximums[bodyPart]??character.body[`${bodyPart}Max`]??character.body[bodyPart])||0);
            if(maximum<=cost){addSystemChatMessage(`PV máximo de ${labels[bodyPart]} insuficiente para esta assimilação.`);return false}
            const nextMaximum=maximum-cost;
            character.bodyMaximums[bodyPart]=nextMaximum;character.body[`${bodyPart}Max`]=nextMaximum;character.body[bodyPart]=Math.min(Math.max(0,Number(character.body[bodyPart])||0),nextMaximum);
            if(bodyPart==="chest"&&character.heart){character.heart.max=nextMaximum;character.heart.current=Math.min(Number(character.heart.current)||0,nextMaximum)}
        }else{
            const maximum=Math.max(0,Number(status.pvMax)||0);if(maximum<=cost){addSystemChatMessage("PV máximo insuficiente para esta assimilação.");return false}
            status.pvMax=maximum-cost;status.pvAtual=Math.min(Math.max(0,Number(status.pvAtual)||0),status.pvMax);
            if(character.heart){character.heart.max=Math.ceil(status.pvMax/4);character.heart.current=Math.min(Number(character.heart.current)||0,character.heart.max)}
        }
    }
    character.assimilations=Array.isArray(character.assimilations)?character.assimilations:[];character.assimilations.push({...structuredClone(assimilation),_ecoPermanentCost:cost,_ecoCostMode:character.lifeMode,_ecoCostPart:bodyPart||null});persistCinematicCharacter(character);openCinematicAssimilations(character);return true;
}
function chooseAssimilationBodyPart(character,assimilation){
    const labels=[["head","Cabeça"],["chest","Torso"],["leftArm","Braço esquerdo"],["rightArm","Braço direito"],["leftLeg","Perna esquerda"],["rightLeg","Perna direita"]],cost=Math.max(0,Number(assimilation.permanentCost?.value)||0),body=character.body||{},maximums=character.bodyMaximums||{};
    openTablePanel("ASSIMILAÇÕES","Escolher membro",`<div class="table-panel-card"><h3>${esc(assimilation.name)}</h3><p>Escolha o membro que perderá <strong>${cost} PV máximos permanentes</strong>.</p></div><div class="table-panel-list">${labels.map(([key,label])=>{const maximum=Math.max(0,Number(maximums[key]??body[`${key}Max`]??body[key])||0);return`<button type="button" class="table-panel-card cinematic-assimilation-part" data-part="${key}" ${maximum<=cost?"disabled":""} style="width:100%;text-align:left"><h3>${label}</h3><p>Máximo atual: ${maximum} • após aquisição: ${Math.max(0,maximum-cost)}</p></button>`}).join("")}</div>`);
    document.querySelectorAll(".cinematic-assimilation-part").forEach(button=>button.onclick=()=>acquireAssimilation(character,assimilation,button.dataset.part));
}
function openAssimilationPicker(character){
    const owned=new Set((character.assimilations||[]).map(item=>String(item.id||item.name).toLowerCase())),available=assimilationCatalog().filter(item=>!owned.has(String(item.id||item.name).toLowerCase()));
    openTablePanel("ASSIMILAÇÕES","Adicionar assimilação",`<div class="table-panel-list">${available.map((item,index)=>`<button class="table-panel-card cinematic-buy-assimilation" data-index="${index}" style="width:100%;text-align:left"><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p><small>Custo permanente: ${Number(item.permanentCost?.value)||0} ${(item.permanentCost?.type||"pv").toUpperCase()}</small></button>`).join("")||"<p>Todas as assimilações disponíveis já foram adquiridas.</p>"}</div>`);
    document.querySelectorAll(".cinematic-buy-assimilation").forEach(button=>button.onclick=()=>{const assimilation=available[Number(button.dataset.index)];if(!assimilation)return;if(character.lifeMode==="body"&&(assimilation.permanentCost?.type||"pv")==="pv")chooseAssimilationBodyPart(character,assimilation);else acquireAssimilation(character,assimilation)});
}
function openCinematicAssimilations(character){
    if(currentTableRole==="master")currentTableCharacter=character;
    const owned=Array.isArray(character.assimilations)?character.assimilations:[];
    openTablePanel("ASSIMILAÇÕES","Assimilações",`<button id="cinematicAddAssimilation" class="primary-button full-button">＋ Adicionar assimilação</button><div class="table-panel-section cinematic-owned-assimilations"><h3 class="table-panel-section-title">Gerenciar aprendidas</h3><div class="table-panel-list">${owned.map((item,index)=>`<div class="table-panel-card"><h3>${esc(item.name||"Assimilação")}</h3><p>${esc(item.description||"")}</p><div class="ability-card-footer"><span>${Number(item._ecoPermanentCost??item.permanentCost?.value)||0} PV permanentes</span><button type="button" class="cinematic-remove-assimilation" data-index="${index}">Remover</button></div></div>`).join("")||"<div class='editor-empty-state'><p>Nenhuma assimilação adquirida.</p></div>"}</div></div>`);
    if(tablePanelContent)tablePanelContent.dataset.ecoPanelKind="assimilations";
    document.getElementById("cinematicAddAssimilation")?.addEventListener("click",()=>openAssimilationPicker(character));
    document.querySelectorAll(".cinematic-remove-assimilation").forEach(button=>button.onclick=()=>removeCinematicAssimilation(character,Number(button.dataset.index)));
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
function openQuickAttackEditor(character,index){
    character.attacks=Array.isArray(character.attacks)?character.attacks:structuredClone([character.quickAttacks,character.ataquesRapidos].find(Array.isArray)||[]);const attack=character.attacks[index]||{id:`attack_${Date.now()}`,name:index===3?"Cura rápida":`Ataque ${index+1}`,roll:"1d12 + Corpo",damage:"",skill:index===3?"Medicina":"Luta"},healing=index===3;
    const rawRoll=String(attack.roll||attack.attack||""),rawEffect=String(attack.damage||attack.healing||""),shownRoll=resolvedCharacterFormula(rawRoll,character),shownEffect=resolvedCharacterFormula(rawEffect,character);
    const selectedSkill=String(attack.skill||attack.skillName||(healing?"Medicina":"Luta")).toLowerCase(),selectedType=String(attack.damageType||attack.type||"impacto").toLowerCase();
    const skillField=healing?`<input id="cinematicAttackSkill" value="${esc(attack.skill||attack.skillName||"Medicina")}">`:`<select id="cinematicAttackSkill"><option value="Luta" ${selectedSkill==="luta"?"selected":""}>Luta</option><option value="Pontaria" ${selectedSkill==="pontaria"?"selected":""}>Pontaria</option></select>`;
    const damageTypes=[["perfuracao","Perfuração"],["impacto","Impacto"],["balistico","Balístico"],["fogo","Fogo"],["corte","Corte"],["energia","Energia"],["sangue","Sangue"],["morte","Morte"],["conhecimento","Conhecimento"],["medo","Medo"]];
    openTablePanel(healing?"CURA":"ATAQUE RÁPIDO",attack.name||`Ataque ${index+1}`,`<div class="cinematic-attack-editor"><label>Nome<input id="cinematicAttackName" value="${esc(attack.name||"")}"></label><label>Perícia${skillField}</label><label>${healing?"Teste":"Fórmula de ataque"}<input id="cinematicAttackRoll" value="${esc(shownRoll)}" data-source-formula="${esc(rawRoll)}"></label><label>${healing?"Fórmula de cura":"Fórmula de dano"}<input id="cinematicAttackDamage" value="${esc(shownEffect)}" data-source-formula="${esc(rawEffect)}"></label>${healing?"":`<label>Tipo de dano<select id="cinematicAttackType">${damageTypes.map(([value,label])=>`<option value="${value}" ${selectedType===value?"selected":""}>${label}</option>`).join("")}</select></label>`}<button id="saveCinematicAttack" class="primary-button full-button">Salvar ataque</button></div>`);
    document.getElementById("saveCinematicAttack")?.addEventListener("click",()=>{const rollInput=document.getElementById("cinematicAttackRoll"),effectInput=document.getElementById("cinematicAttackDamage"),rollValue=rollInput?.value.trim()||"1d12",effectValue=effectInput?.value.trim()||"",savedRoll=rollValue===shownRoll?rawRoll||rollValue:rollValue,savedEffect=effectValue===shownEffect?rawEffect:effectValue,updated={...attack,id:attack.id||`attack_${Date.now()}`,name:document.getElementById("cinematicAttackName")?.value.trim()||attack.name,skill:document.getElementById("cinematicAttackSkill")?.value.trim()||(healing?"Medicina":"Luta"),roll:savedRoll};if(healing){updated.damage=savedEffect;updated.healing=savedEffect}else{updated.damage=savedEffect;updated.damageType=document.getElementById("cinematicAttackType")?.value.trim()||""}if(String(updated.name).toLowerCase()==="desarmado")updated.linkedWeaponId="desarmado";character.attacks[index]=updated;character.quickAttacks=character.attacks;character.ataquesRapidos=character.attacks;persistCinematicCharacter(character);closeCurrentPanel();});
}
const CINEMATIC_INVENTORY_CATALOG={
    "Corpo a corpo":{"Desarmado":{kind:"melee",damage:"1d4 + Corpo",type:"Impacto",ep:0,noSpace:true,skill:"Luta"},"Faca":{kind:"melee",damage:"1d4 + Corpo",type:"Corte",ep:1},"Adaga":{kind:"melee",damage:"1d6 + Corpo",type:"Corte",ep:1},"Taco":{kind:"melee",damage:"1d6 + Corpo",type:"Impacto",ep:2},"Lança":{kind:"melee",damage:"1d6 + Corpo",type:"Perfuração",ep:2},"Marreta":{kind:"melee",damage:"2d8 + Corpo",type:"Impacto",ep:3},"Bastão":{kind:"melee",damage:"1d6 + Corpo",type:"Impacto",ep:2},"Nunchaku":{kind:"melee",damage:"1d6 + Corpo",type:"Impacto",ep:2},"Machadinha":{kind:"melee",damage:"1d6 + Corpo",type:"Corte",ep:2},"Machado":{kind:"melee",damage:"1d8 + Corpo",type:"Corte",ep:3},"Espada":{kind:"melee",damage:"1d10 + Corpo",type:"Corte",ep:3},"Maça":{kind:"melee",damage:"2d6 + Corpo",type:"Impacto",ep:2},"Florete":{kind:"melee",damage:"1d6 + Corpo",type:"Corte",ep:2},"Katana":{kind:"melee",damage:"1d10 + Corpo",type:"Corte",ep:3},"Acha":{kind:"melee",damage:"1d12 + Corpo",type:"Corte",ep:3},"Gadanho":{kind:"melee",damage:"2d4 + Corpo",type:"Corte",ep:2},"Motosserra":{kind:"melee",damage:"3d6 + Corpo",type:"Corte",ep:3},"Montante":{kind:"melee",damage:"2d8 + Corpo",type:"Corte",ep:2},"Corrente":{kind:"melee",damage:"1d8 + Corpo",type:"Impacto",ep:1}},
    "À distância":{"Arco curto":{kind:"ranged",damage:"1d6 + 1",type:"Perfuração",ep:2},"Arco composto":{kind:"ranged",damage:"1d8 + 2",type:"Perfuração",ep:3},"Arco refinado":{kind:"ranged",damage:"1d10 + 2",type:"Perfuração",ep:4},"Besta":{kind:"ranged",damage:"1d6 + 2",type:"Perfuração",ep:2},"Besta refinada":{kind:"ranged",damage:"1d8 + 3",type:"Perfuração",ep:3},"Pistola":{kind:"ranged",damage:"1d8",type:"Balístico",ep:2},"Revólver":{kind:"ranged",damage:"1d8 + 2",type:"Balístico",ep:2},"Fuzil de caça":{kind:"ranged",damage:"2d8",type:"Balístico",ep:3},"Submetralhadora":{kind:"ranged",damage:"2d6",type:"Balístico",ep:3},"Espingarda":{kind:"ranged",damage:"4d6",type:"Balístico",ep:4},"Fuzil de assalto":{kind:"ranged",damage:"2d8",type:"Balístico",ep:4},"Fuzil de precisão":{kind:"ranged",damage:"2d10",type:"Balístico",ep:4},"Metralhadora":{kind:"ranged",damage:"2d12",type:"Balístico",ep:4},"Lança-chamas":{kind:"ranged",damage:"6d6",type:"Fogo",ep:5},"Bazuca":{kind:"ranged",damage:"10d8",type:"Fogo",ep:5}},
    "Defensivos":{"Proteção Leve":{kind:"defense",defense:3,ep:2},"Proteção Pesada":{kind:"defense",defense:5,ep:4},"Escudo":{kind:"defense",defense:2,ep:2},"Escudo Grande":{kind:"defense",defense:4,ep:3}},
    "Itens gerais":{"Vestimenta":{kind:"general",description:"+2 em uma perícia permitida",ep:1},"Soqueira":{kind:"general",description:"+2 em dano desarmado",ep:.5},"Kit Médico":{kind:"general",description:"Auxilia Medicina e cura",ep:2,uses:5,maxUses:5},"Kit de Reparos":{kind:"general",description:"Restaura durabilidade",ep:2,uses:5,maxUses:5},"Cicatrizante":{kind:"general",description:"Restaura 2d6 + 2 PV",ep:1,uses:1,maxUses:1},"Binóculos":{kind:"general",description:"+3 em Percepção",ep:1},"Pé de Cabra":{kind:"general",description:"+3 para arrombar portas",ep:1},"Mochila":{kind:"general",description:"+4 EP",ep:0},"Bolsa":{kind:"general",description:"+2 EP",ep:0}},
    "Consumíveis":{"Lanchinho":{kind:"food",description:"Recupera 3 PV e 1 PM",healPV:3,healPM:1,ep:.5},"Lanche":{kind:"food",description:"Recupera 5 PV e 2 PM",healPV:5,healPM:2,ep:1},"Marmita":{kind:"food",description:"Recupera 7 PV e 3 PM",healPV:7,healPM:3,ep:2},"Banquete":{kind:"food",description:"Recupera 10 PV e 4 PM",healPV:10,healPM:4,ep:3}}
};
function openCinematicInventoryPicker(character){openTablePanel("INVENTÁRIO","Adicionar item",`<div class="table-panel-list">${Object.entries(CINEMATIC_INVENTORY_CATALOG).map(([group,items])=>`<section class="table-panel-section"><h3 class="table-panel-section-title">${esc(group)}</h3>${Object.entries(items).map(([name,item])=>`<button class="table-panel-card cinematic-pick-item" data-group="${esc(group)}" data-name="${esc(name)}" style="width:100%;text-align:left"><h3>${esc(name)}</h3><p>${esc(item.damage?resolvedCharacterFormula(item.damage,character):item.description||`${item.defense||0} Defesa`)}${item.noSpace?" • 0 EP":` • ${item.ep||0} EP`}</p></button>`).join("")}</section>`).join("")}</div>`);document.querySelectorAll(".cinematic-pick-item").forEach(button=>button.onclick=()=>{const base=CINEMATIC_INVENTORY_CATALOG[button.dataset.group]?.[button.dataset.name];if(!base)return;character.inventory=Array.isArray(character.inventory)?character.inventory:[];if(base.noSpace&&character.inventory.some(item=>String(item.name).toLowerCase()===button.dataset.name.toLowerCase())){addSystemChatMessage(`${button.dataset.name} já está no inventário.`);return}character.inventory.push({id:`item_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,name:button.dataset.name,mods:[],equipped:false,...structuredClone(base)});persistCinematicCharacter(character,{rerender:false});openCinematicInventory(character)})}
function openCinematicInventory(character){const items=Array.isArray(character.inventory)?character.inventory:[];openTablePanel("INVENTÁRIO",character.name||"Personagem",`<button id="cinematicAddItem" class="primary-button full-button">＋ Adicionar item</button><div class="table-panel-list">${items.map((item,index)=>`<div class="table-panel-card"><h3>${esc(item.name||"Item")}</h3><p>${esc(item.damage?resolvedCharacterFormula(item.damage,character):item.description||item.type||"")}${item.noSpace?" • Sem espaço":item.ep!=null?` • ${item.ep} EP`:""}</p><button class="secondary-button cinematic-remove-item" data-index="${index}">Remover</button></div>`).join("")||"<div class='editor-empty-state'><p>Nenhum item no inventário.</p></div>"}</div>`);document.getElementById("cinematicAddItem")?.addEventListener("click",()=>openCinematicInventoryPicker(character));document.querySelectorAll(".cinematic-remove-item").forEach(button=>button.onclick=()=>{character.inventory.splice(Number(button.dataset.index),1);persistCinematicCharacter(character,{rerender:false});openCinematicInventory(character)})}
function playerHud(model,masterViewing=false){
    repairCharacterTorso(model);
    const status=model.status||{},pmNow=resource(model,"pmAtual",model.pm),pmMax=resource(model,"pmMax",model.pm),paNow=resource(model,"paAtual",model.pa),paMax=resource(model,"paMax",model.paMax??model.pa);
    const entries=Array.isArray(model.attacks)?model.attacks:([model.quickAttacks,model.ataquesRapidos].find(Array.isArray)||[]),attacks=entries.slice(0,3),healing=entries[3];
    const quick=`<div class="hud-quick-attacks">${[0,1,2].map(index=>{const attack=attacks[index];return `<div class="hud-quick-card" data-edit-quick="${index}" title="Clique duas vezes ou use ✎ para editar"><button class="hud-edit-quick" data-edit-quick-button="${index}" aria-label="Editar ataque">✎</button><strong>${esc(attack?.name||`Ataque ${index+1}`)}</strong><div>${attack?`<button data-quick="${index}" data-roll="attack">Ataque</button><button data-quick="${index}" data-roll="damage">Dano</button>`:"<small>Vazio</small>"}</div></div>`}).join("")}<div class="hud-quick-card hud-healing-card" data-edit-quick="3"><button class="hud-edit-quick" data-edit-quick-button="3" aria-label="Editar cura">✎</button><strong>${esc(healing?.name||"Cura rápida")}</strong><div>${healing?'<button data-quick="3" data-roll="healing-test">Testar</button><button data-quick="3" data-roll="healing">Curar</button>':"<small>Vazio</small>"}</div></div></div>`;
    const pmEditor=`<div class="hud-resource-editor"><span>PM</span>${editableNumber(pmNow,"status.pmAtual")}<b>/</b>${editableNumber(pmMax,"status.pmMax")}</div>`;
    return `<div class="hud-identity"><span>${masterViewing?"FICHA SELECIONADA":"JOGADOR"}</span><strong>${esc(model.name||"Personagem")}</strong>${pmEditor}<small>PA ${paNow}/${paMax}</small>${masterViewing?'<button type="button" class="hud-master-return" data-master-reset>♛ Controles do mestre</button>':backButton()}<label class="hud-pa">NV ${editableNumber(model.level||1,"level",1,99)}</label></div>${quick}${model.lifeMode==="body"?bodyHtml(model,true,false,true,true):classicVitalHtml(model,true)}<div class="hud-resources"><button data-menu="character">Perícias</button><button data-menu="inventory">Inventário</button><button data-menu="notes">Anotações</button><button data-menu="dice">Dados</button><button data-player-move>Mover</button><button data-player-conditions>Condições</button></div><div class="hud-actions"><button data-open="abilities">Habilidades</button><button data-open="assimilations">Assimilações</button><button data-menu="grimoire">Rituais</button><button data-menu="allies">Aliados</button></div>`;
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
function masterHud(){return `<div class="hud-identity"><span>MESTRE</span><strong>Controle do combate</strong><small>Selecione um personagem ou ameaça</small>${backButton()}<button type="button" class="hud-reset-results" data-reset-results>↻ Resetar resultados</button></div><div class="hud-actions"><button data-master="initiative">Iniciativa</button><button data-master="next-round">Passar rodada</button><button data-master="enemies">Ameaças</button><button data-master="npcs">Aliados</button><button data-master="map">Cenário</button><button data-master="music">Música</button><button data-master="dice">Dados</button><button data-master="notes">Anotações</button></div>`}
function clearCinematicResults(){
    if(!currentTableCampaign)return false;const rolls=(currentTableCampaign.chatMessages||[]).filter(message=>message?.type==="roll");resultResetBoundaryId=rolls.at(-1)?.id||null;
    if(resultRenderFrame){cancelAnimationFrame(resultRenderFrame);resultRenderFrame=0}
    [["cinematicResult","RESULTADO"],["cinematicPreviousResult","ANTERIOR"]].forEach(([id,label])=>{const root=document.getElementById(id);if(!root)return;root.removeAttribute("data-signature");root.removeAttribute("data-history-signature");root.classList.remove("critical-result","result-flash");root.innerHTML=`<span>${label}</span><strong>—</strong><small></small>`});
    document.querySelectorAll(".cinematic-slot").forEach(slot=>{slot.dataset.cinematicSource=""});decorateTokens();renderHud();return true;
}
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
    const selectedCharacter=()=>currentTableRole==="player"?currentTableCharacter:(cinematicSelection?.type==="player"?liveCharacter(cinematicSelection.entity.characterId||cinematicSelection.entity.id):null);
    root.querySelectorAll("[data-menu]").forEach(button=>button.onclick=()=>{const character=selectedCharacter();if(button.dataset.menu==="character"){if(character)openCinematicSkills(character);return}if(button.dataset.menu==="inventory"){if(character)openCinematicInventory(character);return}handleMenuAction(button.dataset.menu)});
    root.querySelectorAll("[data-quick]").forEach(button=>button.onclick=()=>rollCinematicPlayer(Number(button.dataset.quick),button.dataset.roll));
    root.querySelectorAll("[data-edit-quick]").forEach(card=>card.ondblclick=event=>{if(event.target.closest("[data-quick]"))return;const character=selectedCharacter();if(character)openQuickAttackEditor(character,Number(card.dataset.editQuick))});
    root.querySelectorAll("[data-edit-quick-button]").forEach(button=>button.onclick=event=>{event.preventDefault();event.stopPropagation();const character=selectedCharacter();if(character)openQuickAttackEditor(character,Number(button.dataset.editQuickButton))});
    root.querySelectorAll("[data-character-field]").forEach(input=>input.onchange=()=>{const character=selectedCharacter();if(!character)return;const field=input.dataset.characterField,value=Math.max(Number(input.min)||0,Number(input.value)||0);if(field==="level"){changeCharacterLevel(character,value);return}character.status=character.status||{};character.body=character.body||{};character.heart=character.heart||{};if(field.startsWith("status.")){const key=field.split(".")[1];character.status[key]=value;if(key==="pmAtual")character.status.pdAtual=value;if(key==="pmMax"){character.status.pdMax=value;character.status.pmAtual=Math.min(Number(character.status.pmAtual)||0,value);character.status.pdAtual=character.status.pmAtual}if(key==="pvMax")character.status.pvAtual=Math.min(Number(character.status.pvAtual)||0,value);if(key==="pvTemp")character.body.temporaryPV=value}else if(field.startsWith("body.")){character.body[field.split(".")[1]]=value}else if(field==="heart.current")character.heart.current=Math.min(value,Math.max(value,Number(character.heart.max)||value));persistCinematicCharacter(character)});
    root.querySelectorAll("[data-master]").forEach(button=>button.onclick=()=>handleMenuAction(button.dataset.master));
    root.querySelectorAll("[data-leave-table]").forEach(button=>button.onclick=()=>document.getElementById("leaveTable")?.click());
    root.querySelectorAll("[data-master-reset]").forEach(button=>button.onclick=()=>{cinematicSelection=null;renderHud()});
    root.querySelector("[data-reset-results]")?.addEventListener("click",clearCinematicResults);
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
    const rolls=visibleCinematicRolls(),last=rolls.at(-1),previous=rolls.at(-2);if(!last)return;
    const currentView=resultView(last),previousView=resultView(previous),signature=`${currentView.signature}|${previousView?.signature||""}`;if(root.dataset.historySignature===signature)return;root.dataset.historySignature=signature;
    paintResult(root,currentView,true);
    if(previousView)paintResult(previousRoot,previousView,false);
}
function scheduleResultRender(refreshCampaign=false){
    if(resultRenderFrame)return;
    resultRenderFrame=requestAnimationFrame(()=>{resultRenderFrame=0;if(refreshCampaign)refreshCurrentTableCampaign?.();renderResult()});
}
function refresh(){decorateTokens();renderInitiative();renderHud();renderResult();document.body.classList.toggle("cinematic-master",currentTableRole==="master");document.body.classList.toggle("cinematic-player",currentTableRole==="player")}

window.openCinematicAbilities=openCinematicAbilities;
window.ECO_CINEMATIC_SHEET={version:1,bodyMaximumsFor,repairCharacterTorso,changeCharacterLevel,openQuickAttackEditor,openCinematicSkills,openCinematicInventory,acquireAssimilation,removeAssimilation:removeCinematicAssimilation,clearResults:clearCinematicResults,persist:persistCinematicCharacter};

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
    document.addEventListener("eco:roll-render",()=>{refreshCurrentTableCampaign?.();decorateTokens();scheduleResultRender(false)});
    document.addEventListener("click",event=>{const button=event.target.closest(".remove-element-assimilation");if(!button)return;event.preventDefault();event.stopImmediatePropagation();refreshCurrentTableCharacter?.();const character=currentTableCharacter;if(!character)return;const wanted=String(button.dataset.id||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");const index=(character.assimilations||[]).findIndex(item=>String(item.id||item.name||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")===wanted);if(index>=0)removeCinematicAssimilation(character,index)},true);
    requestAnimationFrame(refresh);
    window.setInterval(renderInitiative,800);
});
})();
