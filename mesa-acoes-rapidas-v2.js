/*==========================================================
= MESA V2 — DANO, CURA E ATAQUES DE HABILIDADES
==========================================================*/
(function(){
"use strict";

let installed=false;
let originalAddRollChatMessage=null;

function slug(value){
    return String(value||"")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g,"")
        .trim().toLowerCase()
        .replace(/[^a-z0-9]+/g,"-")
        .replace(/^-+|-+$/g,"");
}

function esc(value){
    if(typeof escapeTableHTML==="function") return escapeTableHTML(String(value??""));
    return String(value??"")
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");
}

function refreshAll(){
    if(typeof refreshCurrentTableCampaign==="function") refreshCurrentTableCampaign();
    if(typeof refreshCurrentTableCharacter==="function") refreshCurrentTableCharacter();
    if(typeof syncCurrentTableCharacterV2==="function") syncCurrentTableCharacterV2();
}

function abilityState(){
    currentTableCampaign.combat=currentTableCampaign.combat||{};
    currentTableCampaign.combat.abilityState=currentTableCampaign.combat.abilityState||{};
    return currentTableCampaign.combat.abilityState;
}

function notify(title,detail="",icon="✦",kind="Habilidade"){
    refreshAll();
    if(!currentTableCampaign) return;
    currentTableCampaign.actionNotification={
        id:`action_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
        kind,icon,title,detail,createdAt:Date.now()
    };
    if(typeof saveTableCampaign==="function") saveTableCampaign();
}

function attacks(){
    refreshAll();
    if(typeof getCharacterReadyAttacks==="function"){
        return getCharacterReadyAttacks(currentTableCharacter)||[];
    }
    return (currentTableCharacter?.quickAttacks||currentTableCharacter?.attacks||[]).slice(0,3);
}

function rollExpression(formula){
    const resolved=typeof resolveCharacterFormula==="function"
        ? resolveCharacterFormula(formula,currentTableCharacter)
        : formula;
    const result=typeof rollDiceExpression==="function"
        ? rollDiceExpression(resolved)
        : null;
    if(!result) return null;
    return {
        formula:resolved,
        total:Number(result.total)||0,
        detail:result.detail||result.details?.map(part=>
            part.type==="dice"
                ? `${part.formula} [${(part.rolls||[]).join(", ")}]`
                : String(part.value??"")
        ).join(" + ")||""
    };
}

function addRoll(title,result,meta){
    if(!result||typeof addRollChatMessage!=="function") return;
    addRollChatMessage(title,result.formula,result.total,result.detail,meta);
}

function rollDamage(index){
    refreshAll();
    const attack=attacks()[index];
    if(!attack){
        addSystemChatMessage?.("O ataque selecionado não foi encontrado.");
        return;
    }
    const formula=String(attack.damage||attack.dano||"").trim();
    if(!formula){
        addSystemChatMessage?.(`${attack.name||"Este ataque"} não possui dano configurado.`);
        return;
    }
    const result=rollExpression(formula);
    if(!result) return;
    addRoll(
        `Dano • ${attack.name||`Ataque ${index+1}`}`,
        result,
        {
            rollKind:"damage",
            attackIndex:index,
            attackName:attack.name||`Ataque ${index+1}`,
            damageType:attack.damageType||attack.tipoDano||"impacto",
            applied:false
        }
    );
    notify(
        `${currentTableCharacter?.name||"O personagem"} rolou dano`,
        `${attack.name||`Ataque ${index+1}`}: ${result.total} de dano.`,
        "💥",
        "Dano"
    );
}

function rollHealing(){
    refreshAll();
    const entry=currentTableCharacter?.quickAttacks?.[3]
        ||currentTableCharacter?.attacks?.[3]
        ||currentTableCharacter?.quickHealing;
    if(!entry){
        addSystemChatMessage?.("Nenhuma cura foi configurada.");
        return;
    }
    const formula=String(entry.healing||entry.cure||entry.cura||"").trim();
    if(!formula){
        addSystemChatMessage?.(`${entry.name||"A cura"} não possui fórmula de cura configurada.`);
        return;
    }
    const result=rollExpression(formula);
    if(!result) return;
    addRoll(
        `Cura • ${entry.name||"Cura"}`,
        result,
        {
            rollKind:"healing",
            healing:true,
            attackIndex:3,
            attackName:entry.name||"Cura",
            applied:false
        }
    );
    notify(
        `${currentTableCharacter?.name||"O personagem"} realizou uma cura`,
        `${entry.name||"Cura"}: ${result.total} PV.`,
        "✚",
        "Cura"
    );
}

function chooseAttack(title,onChoose){
    const list=attacks();
    openTablePanel("HABILIDADE",title,`
        <div class="table-panel-list">
            ${list.length?list.map((attack,index)=>`
                <button type="button" class="table-panel-card quick-v2-ability-attack" data-index="${index}">
                    <h3>${esc(attack.name||`Ataque ${index+1}`)}</h3>
                    <p>${esc(attack.roll||attack.attack||attack.formula||"1d12")}</p>
                    <p>Dano: ${esc(attack.damage||"—")}</p>
                </button>
            `).join(""):'<div class="editor-empty-state"><p>Nenhum ataque rápido configurado.</p></div>'}
        </div>
    `);
    document.querySelectorAll(".quick-v2-ability-attack").forEach(button=>{
        button.addEventListener("click",()=>{
            const index=Number(button.dataset.index);
            onChoose(list[index],index);
        });
    });
}

function saveCharacter(character){
    if(typeof saveDamagedCharacter==="function") return saveDamagedCharacter(character);
    return false;
}

function useSacarEAtacar(){
    refreshAll();
    const character=currentTableCharacter;
    if(!character) return;
    const scene=currentTableCampaign?.combat?.initiativeRequest?.id
        ||currentTableCampaign?.combat?.startedAt
        ||"scene";
    const key=`sacar-e-atacar:${scene}`;
    const state=abilityState();
    state.uses=state.uses||{};
    if(state.uses[key]){
        addSystemChatMessage?.("Sacar e Atacar já foi utilizado nesta cena.");
        return;
    }

    chooseAttack("Sacar e Atacar — escolha o ataque",(attack,index)=>{
        const beforePA=Number(character.status?.paAtual)||0;
        state.uses[key]=Date.now();
        if(typeof saveTableCampaign==="function") saveTableCampaign();

        if(typeof rollQuickAttack==="function") rollQuickAttack(index,"attack");

        refreshAll();
        const fresh=currentTableCharacter;
        if(fresh){
            fresh.status=fresh.status||{};
            if(Number(fresh.status.paAtual)!==beforePA){
                fresh.status.paAtual=beforePA;
                saveCharacter(fresh);
            }
        }

        notify(
            `${character.name||"O personagem"} utilizou Sacar e Atacar`,
            `${attack.name||`Ataque ${index+1}`} foi realizado sem gastar PA.`,
            "⚔"
        );
        addSystemChatMessage?.(`${character.name||"O personagem"} utilizou Sacar e Atacar com ${attack.name||`Ataque ${index+1}`}.`);
        if(typeof closeCurrentPanel==="function") closeCurrentPanel();
    });
}

function armAttackOpportunity(){
    refreshAll();
    const character=currentTableCharacter;
    if(!character) return;
    const state=abilityState(),trigger=state.attackOpportunityTriggers?.[character.id];
    if(trigger?.active){
        const eligible=new Set((trigger.attackIndexes||[]).map(Number));
        chooseAttack(`Ataque de Oportunidade contra ${trigger.enemyName||"a ameaça"}`,(attack,index)=>{
            if(!eligible.has(Number(index))){addSystemChatMessage?.("Este ataque não alcançava a posição que a ameaça abandonou.");return;}
            const before=(currentTableCampaign.chatMessages||[]).length;
            rollQuickAttack(index,"attack");
            refreshAll();
            const message=(currentTableCampaign.chatMessages||[]).slice(before).reverse().find(item=>item.type==="roll"&&item.rollKind==="attack");
            if(!message)return;
            message.opportunityTargetEnemyId=trigger.enemyId;
            message.opportunityDesprevenido=true;
            message.targetPositions=[Number(trigger.toPosition)];
            trigger.active=false;trigger.usedAt=Date.now();
            saveTableCampaign();
            if(typeof closeCurrentPanel==="function")closeCurrentPanel();
            if(typeof startAttackTargetSelection==="function")startAttackTargetSelection(message.id);
            notify("Ataque de Oportunidade",`${trigger.enemyName||"A ameaça"} está Desprevenida: não pode reagir e sofre -5 na Defesa.`,"↯","Reação");
        });
        document.querySelectorAll(".quick-v2-ability-attack").forEach(button=>{if(!eligible.has(Number(button.dataset.index)))button.disabled=true;});
        return;
    }
    chooseAttack("Ataque de Oportunidade — escolha o ataque",(attack,index)=>{
        state.attackOpportunity={
            active:true,
            characterId:character.id,
            attackIndex:index,
            attackName:attack.name||`Ataque ${index+1}`,
            round:Number(currentTableCampaign?.combat?.round)||0,
            armedAt:Date.now()
        };
        if(typeof saveTableCampaign==="function") saveTableCampaign();
        notify(
            `${character.name||"O personagem"} preparou Ataque de Oportunidade`,
            `${attack.name||`Ataque ${index+1}`} será usado quando um inimigo sair voluntariamente do alcance.`,
            "↯"
        );
        addSystemChatMessage?.(`${character.name||"O personagem"} preparou Ataque de Oportunidade com ${attack.name||`Ataque ${index+1}`}.`);
        if(typeof closeCurrentPanel==="function") closeCurrentPanel();
    });
}

function patchRollBonuses(){
    if(typeof addRollChatMessage!=="function"||addRollChatMessage.__quickV2BonusPatched) return;
    originalAddRollChatMessage=addRollChatMessage;
    const patched=function(title,formula,total,detail,meta={}){
        refreshAll();
        const state=abilityState();
        const characterId=currentTableCharacter?.id||meta.characterId||null;
        let nextTotal=Number(total)||0;
        let nextFormula=String(formula||"");
        let nextDetail=String(detail||"");
        const nextMeta={...(meta||{})};

        if(nextMeta.rollKind==="attack"){
            const prepared=state.nextAttack;
            if(prepared&&(!prepared.characterId||prepared.characterId===characterId)){
                const bonus=Math.max(0,Number(prepared.attackBonus)||0);
                if(bonus){
                    nextTotal+=bonus;
                    nextFormula+=` + ${bonus} (Ataque Especial)`;
                    nextDetail+=`${nextDetail?" + ":""}${bonus} Ataque Especial`;
                    nextMeta.attackSpecialBonus=bonus;
                }
                const damageBonus=Math.max(0,Number(prepared.damageBonus)||0);
                if(damageBonus){
                    state.pendingDamageBonus={
                        characterId,
                        amount:damageBonus,
                        source:prepared.source||"ataque-especial",
                        attackName:nextMeta.attackName||null,
                        createdAt:Date.now()
                    };
                }
                delete state.nextAttack;
                if(typeof saveTableCampaign==="function") saveTableCampaign();
            }
        }
        else if(nextMeta.rollKind==="damage"){
            const pending=state.pendingDamageBonus;
            if(pending&&(!pending.characterId||pending.characterId===characterId)){
                const bonus=Math.max(0,Number(pending.amount)||0);
                if(bonus){
                    nextTotal+=bonus;
                    nextFormula+=` + ${bonus} (Ataque Especial)`;
                    nextDetail+=`${nextDetail?" + ":""}${bonus} Ataque Especial`;
                    nextMeta.attackSpecialDamageBonus=bonus;
                }
                delete state.pendingDamageBonus;
                if(typeof saveTableCampaign==="function") saveTableCampaign();
            }
        }

        return originalAddRollChatMessage(title,nextFormula,nextTotal,nextDetail,nextMeta);
    };
    patched.__quickV2BonusPatched=true;
    window.addRollChatMessage=patched;
    try{ addRollChatMessage=patched; }catch(error){}
}

function enhanceAttackPanel(){
    const panel=document.getElementById("tablePanelContent");
    if(!panel) return;

    panel.querySelectorAll(".table-v2-attack-card").forEach((card,index)=>{
        const heading=slug(card.querySelector("h3")?.textContent);
        const isHealing=heading.includes("cura")||card.querySelector('[data-type="healing"]');
        if(isHealing){
            const old=card.querySelector('[data-type="healing"]');
            if(old&&!old.dataset.healingV2Fixed){
                const replacement=old.cloneNode(true);
                replacement.dataset.healingV2Fixed="true";
                replacement.textContent="Rolar cura";
                replacement.addEventListener("click",event=>{
                    event.preventDefault();event.stopImmediatePropagation();rollHealing();
                });
                old.replaceWith(replacement);
            }
            return;
        }

        if(!card.querySelector(".table-v2-roll-damage")){
            const attackButton=card.querySelector('[data-type="attack"]');
            const damageButton=document.createElement("button");
            damageButton.type="button";
            damageButton.className="secondary-button table-v2-roll-damage";
            damageButton.textContent="Rolar dano";
            damageButton.dataset.index=String(Number(attackButton?.dataset.index??index));
            damageButton.addEventListener("click",()=>rollDamage(Number(damageButton.dataset.index)));
            card.appendChild(damageButton);
        }
    });
}

function enhanceAbilityPanel(){
    const panel=document.getElementById("tablePanelContent");
    if(!panel) return;
    panel.querySelectorAll(".table-panel-card").forEach(card=>{
        const id=slug(card.querySelector("h3")?.textContent);
        if(id!=="sacar-e-atacar"&&id!=="ataque-de-oportunidade") return;
        if(card.dataset.quickV2Enhanced==="true") return;
        card.dataset.quickV2Enhanced="true";

        card.querySelectorAll("button").forEach(button=>button.remove());
        let footer=card.querySelector(".ability-card-footer");
        if(!footer){
            footer=document.createElement("div");
            footer.className="ability-card-footer";
            card.appendChild(footer);
        }
        const button=document.createElement("button");
        button.type="button";
        button.className="primary-button";
        button.textContent=id==="sacar-e-atacar"?"Usar":"Ativar";
        button.addEventListener("click",event=>{
            event.preventDefault();event.stopImmediatePropagation();
            if(id==="sacar-e-atacar") useSacarEAtacar();
            else armAttackOpportunity();
        });
        footer.appendChild(button);
    });
}

function observePanels(){
    const panel=document.getElementById("tablePanelContent");
    if(!panel||panel.__quickV2Observed) return;
    panel.__quickV2Observed=true;
    const update=()=>{
        enhanceAttackPanel();
        enhanceAbilityPanel();
    };
    new MutationObserver(update).observe(panel,{childList:true,subtree:true});
    update();
}

function addStyle(){
    if(document.getElementById("quickActionsV2Style")) return;
    const style=document.createElement("style");
    style.id="quickActionsV2Style";
    style.textContent=`
        .table-v2-attack-card .table-v2-roll-damage{width:100%;margin-top:7px}
        .quick-v2-ability-attack{width:100%;text-align:left;cursor:pointer}
    `;
    document.head.appendChild(style);
}

function install(){
    if(installed) return;
    if(typeof openTablePanel!=="function"||typeof addRollChatMessage!=="function") return;
    installed=true;
    addStyle();
    patchRollBonuses();
    observePanels();

    window.rollTableV2Damage=rollDamage;
    window.rollTableV2Healing=rollHealing;
    window.armTableV2AttackOpportunity=armAttackOpportunity;
    window.useTableV2SacarEAtacar=useSacarEAtacar;
}

const timer=setInterval(()=>{
    install();
    if(installed) clearInterval(timer);
},100);
setTimeout(install,0);
})();
