/*==========================================================
= MESA — HABILIDADES V2, PM E CRÍTICOS EM 1D12
==========================================================*/
(function(){
"use strict";

let installed=false;
let lastProcessedRollId=null;
const REMOVED_OFFENSIVE_IDS=new Set(["em-furia","golpe-arriscado","duplo-golpe","retribuir","maquina-de-matar","lobo-solitario","incansavel","atirar-para-matar"]);

const HYBRID_IDS=new Set([
    "sacar-e-atacar",
    "rompedor-de-defesas",
    "carrasco",
    "retribuir",
    "disparo-surpresa",
    "prontidao",
    "segunda-chance",
    "recuperando-folego",
    "reserva-oculta",
    "especialista",
    "pressao-constante",
    "executor",
    "ferimento-profundo",
    "instinto-de-combate",
    "aproveitador",
    "mira-persistente",
    "escudo-vivo",
    "reflexo-instantaneo",
    "cacada"
]);

const REACTION_IDS=new Set([
    "ataque-de-oportunidade",
    "revidar",
    "devolver-ataque",
    "inspirar-confianca",
    "brecha-na-guarda",
    "desvio-absoluto"
]);

const NO_MANUAL_BUTTON=new Set([
    "combatente-incansavel",
    "executor",
    "carrasco",
    "ferimento-profundo",
    "instinto-de-combate",
    "aproveitador",
    "mira-persistente",
    "escudo-vivo",
    "reflexo-instantaneo",
    "cacada",
    "ataque-de-oportunidade"
]);

function slug(value){
    return String(value||"")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g,"")
        .trim().toLowerCase()
        .replace(/[^a-z0-9]+/g,"-")
        .replace(/^-+|-+$/g,"");
}

function abilitiesOf(character){
    const lists=[
        character?.abilities,
        character?.acquiredAbilities,
        character?.systemData?.abilities,
        character?.skills?.abilities
    ];
    const list=lists.find(Array.isArray)||[];
    return list.map(item=>{
        if(typeof normalizeCharacterAbility==="function") return normalizeCharacterAbility(item);
        if(typeof item==="string") return {id:slug(item),name:item,description:""};
        return item;
    }).filter(item=>item&&!REMOVED_OFFENSIVE_IDS.has(abilityId(item)));
}

function abilityId(ability){return slug(ability?.id||ability?.abilityId||ability?.name||ability?.title);}
function abilityById(character,id){return abilitiesOf(character).find(a=>abilityId(a)===slug(id))||null;}
function hasAbility(character,id){return Boolean(abilityById(character,id));}
function abilityName(ability){return String(ability?.name||ability?.title||"Habilidade");}

function abilityType(ability){
    const id=abilityId(ability);
    const configured=slug(ability?.abilityType||ability?.type||ability?.activationType||ability?.category);
    if(id==="surto-de-acao") return "active";
    if(REACTION_IDS.has(id)||configured==="reaction"||configured==="reacao") return "reaction";
    if(HYBRID_IDS.has(id)||configured==="hybrid"||configured==="passiva-ativacao") return "hybrid";
    if(configured==="passive"||configured==="passiva"||ability?.passive===true) return "passive";
    return "active";
}

function normalizePM(character){
    character.status=character.status||{};
    const current=Number(character.status.pmAtual??character.status.pdAtual)||0;
    const maximum=Number(character.status.pmMax??character.status.pdMax)||0;
    const temporary=Number(character.status.pmTemp??character.status.pdTemp)||0;
    character.status.pmAtual=current;
    character.status.pdAtual=current;
    character.status.pmMax=maximum;
    character.status.pdMax=maximum;
    character.status.pmTemp=temporary;
    character.status.pdTemp=temporary;
    return character;
}

function spend(character,resource,amount){
    const value=Math.max(0,Number(amount)||0);
    normalizePM(character);
    const isPM=resource==="pm"||resource==="pd";
    const key=isPM?"pmAtual":"paAtual";
    const current=Math.max(0,Number(character.status[key])||0);
    const label=isPM?"PM":"PA";
    if(current<value){
        addSystemChatMessage(`${character.name||"O personagem"} não possui ${label} suficiente.`);
        return false;
    }
    character.status[key]=current-value;
    if(isPM) character.status.pdAtual=character.status.pmAtual;
    const saved=saveDamagedCharacter(character);
    if(saved){
        refreshCurrentTableCharacter();
        refreshOpenCharacterPanel();
    }
    return saved;
}

function recoverPA(character,amount){
    character.status=character.status||{};
    const maximum=Math.max(0,Number(character.status.paMax)||0);
    const current=Math.max(0,Number(character.status.paAtual)||0);
    character.status.paAtual=Math.min(maximum,current+Math.max(0,Number(amount)||0));
    return saveDamagedCharacter(character);
}

function combatState(){
    currentTableCampaign.combat=currentTableCampaign.combat||{};
    currentTableCampaign.combat.abilityState=currentTableCampaign.combat.abilityState||{};
    return currentTableCampaign.combat.abilityState;
}

function roundNumber(){return Number(currentTableCampaign?.combat?.round)||0;}
function sceneId(){return currentTableCampaign?.combat?.initiativeRequest?.id||currentTableCampaign?.combat?.startedAt||"scene";}
function useKey(id,scope="round"){return `${id}:${scope==="scene"?sceneId():roundNumber()}`;}
function hasUsed(key){return Boolean(combatState().uses?.[key]);}
function markUsed(key){const state=combatState();state.uses=state.uses||{};state.uses[key]=Date.now();saveTableCampaign();}

function parseCost(ability){
    const id=abilityId(ability);
    if(id==="ataque-especial") return {resource:"pm",amount:1,variable:true};
    if(id==="tecnica-secreta"||id==="tecnica-sublime") return {resource:"pm",amount:4,variable:false};
    const cost=ability?.useCost;
    if(cost?.type){
        const resource=cost.type==="pd"?"pm":cost.type;
        return {resource,amount:Math.max(0,Number(cost.value??cost.pd??cost.pm??cost.pa)||0),variable:cost.type==="variable"};
    }
    return {resource:"pa",amount:0,variable:false};
}

function notify(title,detail="",icon="✦"){
    refreshCurrentTableCampaign();
    currentTableCampaign.actionNotification={
        id:`action_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
        kind:"Habilidade",icon,title,detail,createdAt:Date.now()
    };
    saveTableCampaign();
}

function attacksOf(character){
    return typeof getCharacterReadyAttacks==="function"
        ? getCharacterReadyAttacks(character)
        : (Array.isArray(character?.attacks)?character.attacks:[]);
}

function chooseAttack(title,onChoose){
    const attacks=attacksOf(currentTableCharacter);
    openTablePanel("HABILIDADE",title,`
        <div class="table-panel-list">
            ${attacks.length?attacks.map((attack,index)=>`
                <button type="button" class="table-panel-card ability-v2-attack" data-index="${index}">
                    <h3>${escapeTableHTML(attack.name||`Ataque ${index+1}`)}</h3>
                    <p>${escapeTableHTML(typeof resolveCharacterFormula==="function"?resolveCharacterFormula(attack.roll||attack.attack||attack.formula||"1d12",currentTableCharacter):attack.roll||attack.attack||attack.formula||"1d12")}</p>
                </button>
            `).join(""):'<div class="editor-empty-state"><p>Nenhum ataque pronto encontrado.</p></div>'}
        </div>
    `);
    document.querySelectorAll(".ability-v2-attack").forEach(button=>{
        button.addEventListener("click",()=>onChoose(attacks[Number(button.dataset.index)],Number(button.dataset.index)));
    });
}

function renderCard(ability){
    const id=abilityId(ability);
    const type=abilityType(ability);
    const cost=parseCost(ability);
    let label=type==="passive"?"Passiva":type==="reaction"?"Reação":type==="hybrid"?"Passiva / ativação":"Ativa";
    if(cost.amount>0) label+=` • ${cost.amount} ${cost.resource.toUpperCase()}${cost.variable?" ou mais":""}`;
    const showButton=!NO_MANUAL_BUTTON.has(id)&&type!=="passive"&&type!=="reaction";
    return `<div class="table-panel-card" data-ability-card="${escapeTableHTML(id)}">
        <h3>${escapeTableHTML(abilityName(ability))}</h3>
        <p>${escapeTableHTML(ability.description||ability.effect||"Sem descrição.")}</p>
        <div class="ability-card-footer">
            <span>${escapeTableHTML(label)}</span>
            <span class="ability-card-actions">${showButton?`<button type="button" class="primary-button use-ability-v2" data-id="${escapeTableHTML(id)}">Usar</button>`:""}</span>
        </div>
    </div>`;
}

let abilityPanelCharacter=null;
function openAbilitiesV2(character=null){
    if(character){currentTableCharacter=character;abilityPanelCharacter=character;}
    else{refreshCurrentTableCharacter();abilityPanelCharacter=currentTableCharacter;}
    const all=abilitiesOf(currentTableCharacter);
    const passives=all.filter(a=>abilityType(a)==="passive");
    const reactions=all.filter(a=>abilityType(a)==="reaction");
    const usable=all.filter(a=>["active","hybrid"].includes(abilityType(a)));
    openTablePanel("PERSONAGEM","Habilidades",`
        <div class="table-panel-section"><h3 class="table-panel-section-title">Passivas</h3><div class="table-panel-list">${passives.length?passives.map(renderCard).join(""):'<div class="editor-empty-state"><p>Nenhuma habilidade passiva.</p></div>'}</div></div>
        <div class="table-panel-section"><h3 class="table-panel-section-title">Ativas e passivas/ativação</h3><div class="table-panel-list">${usable.length?usable.map(renderCard).join(""):'<div class="editor-empty-state"><p>Nenhuma habilidade utilizável.</p></div>'}</div></div>
        <div class="table-panel-section"><h3 class="table-panel-section-title">Reações</h3><div class="table-panel-list">${reactions.length?reactions.map(renderCard).join(""):'<div class="editor-empty-state"><p>Nenhuma habilidade de reação.</p></div>'}</div></div>
    `);
    document.querySelectorAll(".use-ability-v2").forEach(button=>button.addEventListener("click",()=>useAbilityV2(button.dataset.id)));
}
function removeAbilityV2(id,explicitCharacter=null){
    const character=explicitCharacter||abilityPanelCharacter||currentTableCharacter;if(!character)return false;
    const keys=["abilities","acquiredAbilities","habilidades"],key=keys.find(name=>Array.isArray(character[name]))||"abilities",list=Array.isArray(character[key])?character[key]:[],index=list.findIndex(item=>abilityId(item)===id);if(index<0)return false;
    const removed=list[index],cost=Math.max(0,Number(removed?._ecoAcquisitionCostPM)||4);list.splice(index,1);character.status=character.status||{};character.status.pmMax=Math.max(0,Number(character.status.pmMax??character.status.pdMax)||0)+cost;character.status.pdMax=character.status.pmMax;
    saveDamagedCharacter(character);if(typeof window.openCinematicAbilities==="function")window.openCinematicAbilities(character);else openAbilitiesV2(character);return true;
}
function applyAbilityHealing(character,amount,label){
    const value=Math.max(0,Number(amount)||0);if(!character||!value)return 0;
    if(window.ECO_BLOOD_ASSIMILATION_AUTOMATION?.heal)return window.ECO_BLOOD_ASSIMILATION_AUTOMATION.heal(character,value,label);
    character.status=character.status||{};const before=Math.max(0,Number(character.status.pvAtual)||0),maximum=Math.max(before,Number(character.status.pvMax)||0);character.status.pvAtual=Math.min(maximum,before+value);saveDamagedCharacter(character);return character.status.pvAtual-before;
}
function chooseAbilityHealingTarget(title,onChoose){
    const entries=(currentTableCampaign?.players||[]).map(entry=>({entry,character:getLiveCharacter(entry.characterId)})).filter(item=>item.character);
    if(currentTableCharacter&&!entries.some(item=>String(item.character.id)===String(currentTableCharacter.id)))entries.unshift({entry:null,character:currentTableCharacter});
    openTablePanel("CURA",title,`<div class="table-panel-list">${entries.map(({entry,character})=>`<button type="button" class="table-panel-card ability-healing-target" data-id="${escapeTableHTML(character.id)}"><h3>${escapeTableHTML(character.name||"Alvo")}</h3><p>${entry?.position?`Posição ${entry.position}`:"Personagem"}</p></button>`).join("")||'<p>Nenhum alvo disponível.</p>'}</div>`);
    document.querySelectorAll(".ability-healing-target").forEach(button=>button.onclick=()=>onChoose(getLiveCharacter(button.dataset.id)||entries.find(item=>String(item.character.id)===String(button.dataset.id))?.character));
}
function generalAbilitySkillBonus(character,skillName){
    const id=slug(skillName),entry=currentTableCampaign?.combat?.abilityState?.skillBonuses?.[character?.id]?.[id],round=roundNumber();
    let bonus=entry&&Number(entry.expiresRound)>=round?Number(entry.bonus)||0:0;
    if(id==="fortitude"&&hasAbility(character,"corpo-treinado"))bonus+=3;
    if(id==="presteza"&&hasAbility(character,"esquiva-aprimorada"))bonus+=2;
    const wounded=(character?.conditions||[]).some(condition=>slug(typeof condition==="string"?condition:condition?.id||condition?.name)==="machucado");
    if(wounded&&hasAbility(character,"suportar-a-dor")&&(id==="fortitude"||id==="vontade"))bonus+=3;
    return bonus;
}
window.ECO_GENERAL_ABILITY_SKILL_BONUS=generalAbilitySkillBonus;

function openAttackSpecial(ability){
    refreshCurrentTableCharacter();
    const character=currentTableCharacter;
    const available=Math.max(0,Number(character?.status?.pmAtual??character?.status?.pdAtual)||0);
    if(available<1){addSystemChatMessage("PM insuficiente para Ataque Especial.");return;}
    openTablePanel("HABILIDADE","Ataque Especial",`
        <div class="table-panel-card"><p>Cada 1 PM concede +2, distribuído entre ataque e dano.</p></div>
        <div class="field"><label>PM gasto</label><input id="specialV2PM" type="number" min="1" max="${available}" value="1"></div>
        <div class="field"><label>Bônus no ataque</label><input id="specialV2Attack" type="number" min="0" step="2" value="2"></div>
        <div class="field"><label>Bônus no dano</label><input id="specialV2Damage" type="number" min="0" step="2" value="0"></div>
        <div class="table-panel-card" id="specialV2Summary"><strong>Custo calculado: 1 PM</strong><p>Distribuição disponível: 2 pontos.</p></div>
        <button id="confirmSpecialV2" class="primary-button full-button">Preparar</button>
    `);
    const syncCost=()=>{
        const attack=Math.max(0,Number(document.getElementById("specialV2Attack")?.value)||0);
        const damage=Math.max(0,Number(document.getElementById("specialV2Damage")?.value)||0);
        const required=Math.max(1,Math.ceil((attack+damage)/2));
        const pmInput=document.getElementById("specialV2PM");
        if(pmInput) pmInput.value=String(Math.min(available,required));
        const summary=document.getElementById("specialV2Summary");
        if(summary) summary.innerHTML=`<strong>Custo calculado: ${required} PM</strong><p>${attack} no ataque + ${damage} no dano = ${attack+damage} pontos.</p>`;
    };
    document.getElementById("specialV2Attack")?.addEventListener("input",syncCost);
    document.getElementById("specialV2Damage")?.addEventListener("input",syncCost);
    document.getElementById("confirmSpecialV2")?.addEventListener("click",()=>{
        const pm=Math.max(1,Number(document.getElementById("specialV2PM")?.value)||1);
        const attack=Math.max(0,Number(document.getElementById("specialV2Attack")?.value)||0);
        const damage=Math.max(0,Number(document.getElementById("specialV2Damage")?.value)||0);
        const total=pm*2;
        if(attack+damage!==total||attack%2!==0||damage%2!==0){
            addSystemChatMessage(`Distribua exatamente ${total} pontos em múltiplos de 2.`);return;
        }
        chooseAttack("Ataque Especial — escolha o ataque",(chosen,attackIndex)=>{
            if(!spend(character,"pm",pm)) return;
            combatState().nextAttack={attackBonus:attack,damageBonus:damage,source:"ataque-especial",characterId:character.id,attackIndex,attackName:chosen.name||`Ataque ${attackIndex+1}`};
            saveTableCampaign();
            notify(`${character.name} preparou Ataque Especial`,`+${attack} no ataque e +${damage} no dano de ${chosen.name||`Ataque ${attackIndex+1}`}.`,"🗡");
            closeCurrentPanel();
        });
    });
}

function useAbilityV2(id){
    refreshCurrentTableCampaign();refreshCurrentTableCharacter();
    const character=abilityPanelCharacter||currentTableCharacter;
    if(character)currentTableCharacter=character;
    const ability=abilityById(character,id);
    if(!ability) return;
    if(id==="ataque-especial"){openAttackSpecial(ability);return;}
    if(id==="tecnica-secreta"){
        chooseAttack("Ataque Giratório",(attack,index)=>{
            const enemies=currentTableCampaign.enemies||[];
            openTablePanel("HABILIDADE","Ataque Giratório — dois alvos",`<div class="table-panel-list">${enemies.map(enemy=>`<label class="table-panel-card"><input type="checkbox" name="wideAttackTarget" value="${escapeTableHTML(enemy.enemyId||enemy.id)}"><h3>${escapeTableHTML(enemy.name||"Ameaça")}</h3><p>Posição ${enemy.position||"—"}</p></label>`).join("")}</div><button id="confirmWideAttack" class="primary-button full-button">Atacar os dois alvos</button>`);
            document.getElementById("confirmWideAttack")?.addEventListener("click",()=>{const targets=[...document.querySelectorAll('input[name="wideAttackTarget"]:checked')].map(input=>input.value);if(targets.length!==2){addSystemChatMessage("Escolha exatamente dois alvos para Ataque Giratório.");return}if(!spend(character,"pm",4))return;combatState().wideAttack={active:true,characterId:character.id,attackIndex:index,attackName:attack.name||"Ataque",targets,remaining:[...targets],createdAt:Date.now()};saveTableCampaign();notify(`${character.name} utilizou Ataque Giratório`,`Cada alvo poderá escolher sua própria reação.`,"🌀");closeCurrentPanel();window.ECO_CONTINUE_WIDE_ATTACK?.();});
        });
        return;
    }
    if(id==="surto-de-adrenalina"){
        if(!spend(character,"pm",4)) return;
        character.status=character.status||{};
        character.status.paAtual=Math.max(0,Number(character.status.paAtual)||0)+1;
        saveDamagedCharacter(character);
        notify(`${character.name} utilizou Surto de Adrenalina`,`+1 PA temporário nesta rodada.`,"⚡");
        openAbilitiesV2();return;
    }
    if(id==="surto-de-acao"){
        const key=useKey(id,"scene");
        if(hasUsed(key)){addSystemChatMessage("Surto de Ação já foi utilizado nesta cena.");return;}
        character.status=character.status||{};
        character.status.paAtual=Math.max(0,Number(character.status.paAtual)||0)+2;
        saveDamagedCharacter(character);markUsed(key);
        notify(`${character.name} utilizou Surto de Ação`,`+2 PA temporários nesta rodada.`,"⚡");
        openAbilitiesV2();return;
    }
    if(id==="potencia-maxima"){
        const key=useKey(id,"scene");
        if(hasUsed(key)){addSystemChatMessage("Potência Máxima já foi utilizada nesta cena.");return;}
        if(!spend(character,"pa",1)) return;
        combatState().potenciaMaxima={active:true,characterId:character.id,round:roundNumber(),activatedAt:Date.now()};
        markUsed(key);
        notify(`${character.name} ativou Potência Máxima`,`Bônus numéricos de ataque e dano dobrados durante esta rodada.`,"💣");
        openAbilitiesV2();return;
    }
    if(id==="segunda-respiracao"){
        const limit=Math.max(1,Number(character.attributes?.corpo??character.attributes?.for)||1),scene=sceneId(),state=combatState();
        state.sceneUses=state.sceneUses||{};const key=`${id}:${character.id}:${scene}`,uses=Number(state.sceneUses[key])||0;
        if(uses>=limit){addSystemChatMessage(`Segunda Respiração atingiu o limite de ${limit} uso(s) nesta cena.`);return;}
        const restored=applyAbilityHealing(character,8,"Segunda Respiração");state.sceneUses[key]=uses+1;saveTableCampaign();
        notify(`${character.name} utilizou Segunda Respiração`,`Gerou 8 PV de cura${character.lifeMode==="body"?" para distribuir entre os membros":` e recuperou ${restored}`}. Uso ${uses+1}/${limit}.`,"💚");
        if(character.lifeMode!=="body")openAbilitiesV2();return;
    }
    if(id==="paramedico"){
        const available=Math.max(0,Number(character.status?.pmAtual??character.status?.pdAtual)||0);if(available<2){addSystemChatMessage("PM insuficiente para Paramédico.");return;}
        const costs=[];for(let value=2;value<=available;value+=3)costs.push(value);
        openTablePanel("HABILIDADE","Paramédico",`<div class="table-panel-card"><p>2 PM curam 2d10. Cada +3 PM adiciona outros 2d10.</p></div><div class="table-panel-list">${costs.map(cost=>`<button class="table-panel-card paramedic-cost" data-cost="${cost}"><h3>${cost} PM</h3><p>${2+(Math.floor((cost-2)/3)*2)}d10 PV</p></button>`).join("")}</div>`);
        document.querySelectorAll(".paramedic-cost").forEach(button=>button.onclick=()=>{const pm=Math.max(2,Number(button.dataset.cost)||2),dice=2+(Math.floor((pm-2)/3)*2);chooseAbilityHealingTarget(`Paramédico • ${dice}d10`,target=>{if(!target||!spend(character,"pm",pm))return;const result=rollDiceExpression(`${dice}d10`);applyAbilityHealing(target,result?.total||0,"Paramédico");addRollChatMessage(`Paramédico • ${character.name} → ${target.name}`,`${dice}d10`,result?.total||0,result?.detail||"",{rollKind:"healing",characterId:character.id,targetCharacterId:target.id});notify(`${character.name} utilizou Paramédico`,`${target.name} recebeu ${result?.total||0} pontos de cura.`,"💚");if(target.lifeMode!=="body")closeCurrentPanel();});});return;
    }
    if(id==="movimento-fantasma"){
        if(!spend(character,"pm",3))return;const state=combatState();state.skillBonuses=state.skillBonuses||{};state.skillBonuses[character.id]=state.skillBonuses[character.id]||{};state.skillBonuses[character.id].discreto={bonus:5,source:"Movimento Fantasma",expiresRound:roundNumber()};saveTableCampaign();notify(`${character.name} utilizou Movimento Fantasma`,`+5 em Discreto até o fim da rodada e não provoca Ataques de Oportunidade.`,"👻");openAbilitiesV2();return;
    }
    if(id==="cai-dentro"){
        const enemies=currentTableCampaign.enemies||[];
        openTablePanel("HABILIDADE","Cai Dentro",`<div class="table-panel-list">${enemies.map(enemy=>`<button type="button" class="table-panel-card cai-dentro-target" data-id="${escapeTableHTML(enemy.enemyId||enemy.id)}"><h3>${escapeTableHTML(enemy.name||"Ameaça")}</h3><p>Na rodada atual, só poderá atacar ${escapeTableHTML(character.name||"você")}.</p></button>`).join("")||"<p>Nenhuma ameaça disponível.</p>"}</div>`);
        document.querySelectorAll(".cai-dentro-target").forEach(button=>button.onclick=()=>{const enemy=enemies.find(item=>String(item.enemyId||item.id)===String(button.dataset.id));if(!enemy||!spend(character,"pa",1))return;const state=combatState();state.caiDentro=state.caiDentro||{};state.caiDentro[String(enemy.enemyId||enemy.id)]={characterId:character.id,characterName:character.name,round:roundNumber(),active:true};saveTableCampaign();notify(`${character.name} utilizou Cai Dentro`,`${enemy.name||"A ameaça"} só pode atacar ${character.name} nesta rodada.`,"🎯");closeCurrentPanel();});
        return;
    }
    if(id==="ricochete"){
        chooseAttack("Ricochete — escolha o disparo",(attack,index)=>{if(!spend(character,"pa",1))return;combatState().ricochete={active:true,characterId:character.id,attackIndex:index,createdAt:Date.now()};saveTableCampaign();notify(`${character.name} preparou Ricochete`,`${attack.name||"O próximo disparo"} deixará o alvo Desprevenido durante esse ataque.`,"↗");closeCurrentPanel();});
        return;
    }
    if(id==="pele-dura"){
        const state=combatState(),round=roundNumber(),key=`pele-dura:${character.id}:${round}`;state.uses=state.uses||{};
        if(state.uses[key]){addSystemChatMessage("Pele Dura já foi utilizada nesta rodada.");return;}
        if(!spend(character,"pa",1))return;
        state.uses[key]=Date.now();state.peleDura=state.peleDura||{};state.peleDura[character.id]={active:true,round,createdAt:Date.now()};saveTableCampaign();notify(`${character.name} ativou Pele Dura`,`O próximo dano recebido será reduzido pela metade.`,"🛡");openAbilitiesV2();return;
    }
    const cost=parseCost(ability);
    if(cost.amount&&!spend(character,cost.resource,cost.amount)) return;
    notify(`${character.name} utilizou ${abilityName(ability)}`,cost.amount?`Custo: ${cost.amount} ${cost.resource.toUpperCase()}.`:"Sem custo.");
    addSystemChatMessage(`${character.name||"O personagem"} utilizou ${abilityName(ability)}.`);
    openAbilitiesV2();
}

function trainingSides(value){const match=String(value||"").match(/1d(4|8|12)/i);return match?Number(match[1]):0;}
function rollDie(sides){return Math.floor(Math.random()*sides)+1;}
function extractMainD12(message){
    const detail=String(message?.detail||message?.details||"");
    const match=detail.match(/1d12\s*\[\s*(\d+)/i)||detail.match(/d12[^0-9]*(\d+)/i);
    return match?Number(match[1]):null;
}
function attackEntry(character,message){
    const list=character?.quickAttacks||character?.attacks||character?.ataquesRapidos||[];
    return list[Number(message?.attackIndex)]||list.find(a=>a.name===message?.attackName)||null;
}
function criticalThreshold(character,entry){
    const direct=Number(entry?.criticalOn),baseMargin=Math.max(0,Number(entry?.criticalMargin)||0);
    let threshold=Number.isFinite(direct)&&direct>=2&&direct<=12?direct:Math.max(2,12-baseMargin);
    const skill=slug(entry?.skill||entry?.skillName||"Luta");
    if(skill==="luta"&&hasAbility(character,"especialista-em-criticos"))threshold=Math.max(2,threshold-1);
    const state=currentTableCampaign?.combat?.abilityState||{};
    const temporary=state.temporaryCriticalMargin;
    if(temporary?.active&&temporary.characterId===character?.id) threshold=Math.max(2,threshold-Number(temporary.amount||0));
    return threshold;
}
window.ECO_PLAYER_CRITICAL_THRESHOLD=criticalThreshold;
window.ECO_CONTINUE_WIDE_ATTACK=function(resolvedRequestId=null){refreshCurrentTableCampaign();refreshCurrentTableCharacter();const wide=combatState().wideAttack;if(!wide?.active||String(wide.characterId)!==String(currentTableCharacter?.id))return;if(wide.waitingRequestId){if(!resolvedRequestId||String(resolvedRequestId)!==String(wide.waitingRequestId))return;wide.waitingRequestId=null}if(currentTableCampaign.combat?.pendingEnemyAttack?.active)return;const enemyId=wide.remaining?.shift();if(!enemyId){delete combatState().wideAttack;saveTableCampaign();return}const enemy=(currentTableCampaign.enemies||[]).find(item=>String(item.enemyId||item.id)===String(enemyId));if(!enemy){saveTableCampaign();return window.ECO_CONTINUE_WIDE_ATTACK(resolvedRequestId)}const before=new Set((currentTableCampaign.chatMessages||[]).map(item=>item.id));rollQuickAttack(Number(wide.attackIndex),"attack");refreshCurrentTableCampaign();const message=[...(currentTableCampaign.chatMessages||[])].reverse().find(item=>!before.has(item.id)&&item.type==="roll"&&item.rollKind==="attack"&&Number(item.attackIndex)===Number(wide.attackIndex));if(!message){delete combatState().wideAttack;saveTableCampaign();return}message.forcedTargetEnemyId=enemyId;message.skipPACost=true;message.wideAttack=true;saveTableCampaign();startAttackTargetSelection(message.id);applyPendingAttackToTarget("enemy",enemy);refreshCurrentTableCampaign();const request=currentTableCampaign.combat?.pendingEnemyAttack;if(request?.active){wide.waitingRequestId=request.id;request.wideAttack=true}saveTableCampaign();};
function applyCriticalToLatestRoll(){
    refreshCurrentTableCampaign();refreshCurrentTableCharacter();
    const messages=currentTableCampaign?.chatMessages||[];
    const message=messages.at(-1);
    if(!message||message.id===lastProcessedRollId||message.type!=="roll"||message.rollKind!=="attack") return;
    lastProcessedRollId=message.id;
    const character=getLiveCharacter(message.characterId)||currentTableCharacter;
    if(!character) return;
    const entry=attackEntry(character,message);
    const main=extractMainD12(message);
    const threshold=criticalThreshold(character,entry);
    if(main===null||main<threshold) return;
    const sides=trainingSides(entry?.training);
    const extra=sides?rollDie(sides):0;
    message.critical=true;
    message.criticalThreshold=threshold;
    message.mainDieResult=main;
    message.criticalTrainingRoll=extra;
    if(extra){message.total=Number(message.total||0)+extra;message.detail=`${message.detail||""} • Crítico: +1d${sides} [${extra}]`;}
    else message.detail=`${message.detail||""} • Crítico`;
    const state=combatState();
    state.lastCriticalAttack={messageId:message.id,characterId:character.id,attackName:message.attackName||"Ataque",createdAt:Date.now()};
    if(state.temporaryCriticalMargin?.characterId===character.id) state.temporaryCriticalMargin.active=false;
    saveTableCampaign();renderPublicChat();
    addSystemChatMessage(`${character.name||"O personagem"} conseguiu um Acerto Crítico${extra?` e rolou +1d${sides} (${extra})`:""}.`);
}

function markDefeatEffects(target){
    refreshCurrentTableCampaign();
    const context=currentTableCampaign?.combat?.damageContext;
    if(!context?.attackerCharacterId) return;
    const attacker=getLiveCharacter(context.attackerCharacterId);
    if(!attacker) return;
    const state=combatState();
    const defeatId=`${target.id}:${roundNumber()}:${context.id||context.attackRequestId||Date.now()}`;
    state.processedDefeats=state.processedDefeats||{};
    if(state.processedDefeats[defeatId]) return;
    state.processedDefeats[defeatId]=Date.now();

    if(hasAbility(attacker,"combatente-incansavel")&&!hasUsed(useKey("combatente-incansavel"))){
        recoverPA(attacker,1);markUsed(useKey("combatente-incansavel"));
        addSystemChatMessage(`${attacker.name} ativou Combatente Incansável e recuperou 1 PA.`);
    }
    if(hasAbility(attacker,"executor")&&!hasUsed(useKey("executor"))){
        state.executor={active:true,characterId:attacker.id,bonusDice:1,round:roundNumber()};
        markUsed(useKey("executor"));
        addSystemChatMessage(`${attacker.name} ativou Executor. O próximo ataque recebe +1 dado de dano.`);
    }
    saveTableCampaign();
}

function characterCurrentPV(character){
    if(character?.lifeMode==="body"||character?.body){
        const body=character.body||{};
        return ["head","chest","leftArm","rightArm","leftLeg","rightLeg"].reduce((sum,key)=>sum+Math.max(0,Number(body[key])||0),0);
    }
    return Math.max(0,Number(character?.status?.pvAtual??character?.pvAtual??character?.pv)||0);
}

function install(){
    if(installed) return;
    if(typeof handleMenuAction!=="function"||typeof saveDamagedCharacter!=="function") return;
    installed=true;

    const previousHandle=handleMenuAction;
    handleMenuAction=function(action,button){
        if(action==="abilities"){
            clearActiveMenuButtons();button?.classList.add("active");openAbilitiesV2();return;
        }
        previousHandle(action,button);
    };

    const previousSave=saveDamagedCharacter;
    saveDamagedCharacter=function(character){
        const before=getLiveCharacter(character?.id);
        const beforePV=characterCurrentPV(before);
        normalizePM(character);
        const result=previousSave(character);
        const afterPV=characterCurrentPV(character);
        if(beforePV>0&&afterPV<=0) markDefeatEffects(character);
        return result;
    };

    if(typeof rollQuickAttack==="function"){
        const previousRoll=rollQuickAttack;
        rollQuickAttack=function(index,type){
            const result=previousRoll(index,type);
            setTimeout(applyCriticalToLatestRoll,0);
            return result;
        };
    }

    window.openSystemBaseAbilitiesPanel=openAbilitiesV2;
    window.removeAbilityV2=removeAbilityV2;
    window.applySystemBaseCriticalToLatestRoll=applyCriticalToLatestRoll;
}

const timer=setInterval(()=>{install();if(installed)clearInterval(timer);},100);
setTimeout(install,0);
})();
