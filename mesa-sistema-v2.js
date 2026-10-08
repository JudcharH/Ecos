/*==========================================================
= MESA — SINCRONIZAÇÃO GERAL DO SISTEMA BASE V2
= Corpo, Foco, Nexo, PM, ataques, cura e ficha lateral
==========================================================*/
(function(){
"use strict";

const CHARACTER_STORAGE="ordem_characters";
let installed=false;

function number(value,fallback=0){
    const parsed=Number(value);
    return Number.isFinite(parsed)?parsed:fallback;
}

function escapeHTML(value){
    if(typeof escapeTableHTML==="function") return escapeTableHTML(String(value??""));
    return String(value??"")
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");
}

function titleCase(value){
    return String(value||"")
        .toLocaleLowerCase("pt-BR")
        .replace(/(^|[\s/–—-])([a-záàâãéêíóôõúç])/g,(_,space,letter)=>space+letter.toLocaleUpperCase("pt-BR"));
}

function loadCharacters(){
    try{
        const parsed=JSON.parse(localStorage.getItem(CHARACTER_STORAGE)||"[]");
        return Array.isArray(parsed)?parsed:[];
    }
    catch(error){
        console.error("Erro ao sincronizar fichas da mesa:",error);
        return [];
    }
}

function normalizeAbility(ability){
    if(typeof ability==="string"){
        return {id:ability,name:titleCase(ability),description:""};
    }
    if(!ability||typeof ability!=="object") return null;
    return {
        ...ability,
        name:titleCase(ability.name||ability.title||"Habilidade")
    };
}

function normalizeSkill(skill){
    if(!skill||typeof skill!=="object") return null;
    return {
        ...skill,
        id:skill.id||String(skill.name||"").toLowerCase(),
        name:titleCase(skill.name||skill.id||"Perícia"),
        attribute:skill.attribute||skill.atributo||"nexo",
        training:skill.training||skill.treino||"0",
        bonus:number(skill.bonus,0),
        penalty:Math.max(0,number(skill.penalty??skill.penalidade,0))
    };
}

function normalizeAttack(entry,index){
    if(!entry||typeof entry!=="object") entry={};
    const healing=index===3||entry.type==="healing"||entry.type==="cura";
    const skill=healing?"medicina":(entry.skill||entry.testSkill||entry.pericia||"luta");
    return {
        ...entry,
        slot:index+1,
        type:healing?"healing":"attack",
        name:entry.name||entry.nome||(healing?"Cura":`Ataque ${index+1}`),
        skill,
        skillName:entry.skillName||titleCase(skill),
        attribute:entry.attribute||(skill==="luta"?"corpo":skill==="pontaria"?"foco":"nexo"),
        roll:entry.roll||entry.attack||entry.test||entry.formula||"1d12",
        damage:healing?"":(entry.damage||entry.dano||""),
        healing:healing?(entry.healing||entry.cure||entry.cura||entry.damage||""):"",
        damageType:healing?null:(entry.damageType||entry.tipoDano||"impacto"),
        criticalOn:Math.max(2,number(entry.criticalOn,12)),
        criticalDie:"main",
        criticalEffect:"roll-training-again"
    };
}

function normalizeCharacterV2(character){
    if(!character||typeof character!=="object") return character;

    const attributes=character.attributes||{};
    const corpo=number(attributes.corpo??attributes.for??attributes.vig,1);
    const foco=number(attributes.foco??attributes.agi??attributes.pre,1);
    const nexo=number(attributes.nexo??attributes.int,1);

    character.attributes={...attributes,corpo,foco,nexo};

    const status=character.status||{};
    const pmAtual=number(status.pmAtual??status.pdAtual,0);
    const pmMax=number(status.pmMax??status.pdMax,0);
    const pmTemp=number(status.pmTemp??status.pdTemp,0);
    character.status={
        ...status,
        pmAtual,pmMax,pmTemp,
        pdAtual:pmAtual,pdMax:pmMax,pdTemp:pmTemp
    };

    const skills=(character.skills||character.pericias||[])
        .map(normalizeSkill).filter(Boolean);
    character.skills=skills;
    character.pericias=skills;

    const attackSource=[character.quickAttacks,character.attacks,character.ataquesRapidos]
        .find(Array.isArray)||[];
    const attacks=[0,1,2,3].map(index=>normalizeAttack(attackSource[index],index));
    character.quickAttacks=attacks;
    character.attacks=attacks;
    character.ataquesRapidos=attacks;
    character.quickHealing=attacks[3];

    const abilitySource=[character.abilities,character.acquiredAbilities,character.systemData?.abilities]
        .find(Array.isArray)||[];
    const abilities=abilitySource.map(normalizeAbility).filter(Boolean);
    character.abilities=abilities;
    character.acquiredAbilities=abilities;

    return character;
}

function syncCurrentCharacter(){
    const list=loadCharacters().map(normalizeCharacterV2);
    if(typeof tableCharacters!=="undefined") tableCharacters=list;

    const currentId=(typeof currentTableCharacter!=="undefined"&&currentTableCharacter?.id)
        ||localStorage.getItem("ordem_table_character");
    const fresh=list.find(item=>item.id===currentId)||null;
    if(fresh&&typeof currentTableCharacter!=="undefined") currentTableCharacter=fresh;
    return fresh;
}

function attributeLabel(attribute){
    return {corpo:"Corpo",foco:"Foco",nexo:"Nexo"}[attribute]||titleCase(attribute);
}

function trainingLabel(value){
    return {"0":"Sem treino","1d4":"Treinado (1d4)","1d8":"Veterano (1d8)","1d12":"Especialista (1d12)"}[value]||value||"Sem treino";
}

function damageTypeLabel(value){
    return {
        balistico:"Balístico",impacto:"Impacto",perfuracao:"Perfuração",corte:"Corte",fogo:"Fogo",energia:"Energia",sangue:"Sangue",morte:"Morte",conhecimento:"Conhecimento",medo:"Medo"
    }[value]||titleCase(value||"Impacto");
}

function currentLifeHTML(character){
    const mode=character.lifeMode||character.life?.mode||character.status?.lifeMode||"classic";
    if(typeof ensureCharacterHeart==="function")ensureCharacterHeart(character);
    const temporary=Math.max(number(character.body?.temporaryPV,0),number(character.status?.pvTemp,0));
    const heart=`<div class="table-v2-status-card"><span>Coração</span><strong>${number(character.heart?.current,0)} / ${number(character.heart?.max,0)}</strong></div>`;
    const temp=`<div class="table-v2-status-card"><span>PV Temporário</span><strong>${temporary}</strong></div>`;
    if(mode!=="members"&&mode!=="body"){
        return `<div class="table-v2-status-card"><span>PV</span><strong>${number(character.status?.pvAtual,0)} / ${number(character.status?.pvMax,0)}</strong></div>${heart}${temp}`;
    }

    const body=character.body||{};
    const parts=[
        ["Cabeça","head"],["Torso","chest"],["Braço E.","leftArm"],
        ["Braço D.","rightArm"],["Perna E.","leftLeg"],["Perna D.","rightLeg"]
    ];
    return `<div class="table-v2-members">${parts.map(([label,key])=>`
        <div><span>${label}</span><strong>${number(body[key],0)} / ${number(body[`${key}Max`],number(body[key],0))}</strong></div>
    `).join("")}</div>${heart}${temp}`;
}

function abilitySummaryHTML(character){
    const abilities=character.abilities||[];
    if(!abilities.length) return '<div class="editor-empty-state"><p>Nenhuma habilidade adquirida.</p></div>';
    return `<div class="table-panel-list">${abilities.map(ability=>`
        <div class="table-panel-card"><h3>${escapeHTML(ability.name)}</h3><p>${escapeHTML(ability.description||ability.effect||"Sem descrição.")}</p></div>
    `).join("")}</div>`;
}

function skillsHTML(character){
    const trained=(character.skills||[]).filter(skill=>skill.training&&skill.training!=="0");
    if(!trained.length) return '<div class="editor-empty-state"><p>Nenhuma perícia treinada.</p></div>';
    return `<div class="table-v2-skill-list">${trained.map(skill=>`
        <div class="table-v2-skill-row">
            <strong>${escapeHTML(skill.name)}</strong>
            <span>${escapeHTML(attributeLabel(skill.attribute))}</span>
            <span>${escapeHTML(trainingLabel(skill.training))}</span>
            ${skill.bonus?`<span>+${skill.bonus}</span>`:""}
            ${skill.penalty?`<span>−${skill.penalty}</span>`:""}
        </div>
    `).join("")}</div>`;
}

function openCharacterPanelV2(){
    const character=syncCurrentCharacter();
    if(!character) return;

    const attrs=character.attributes||{};
    const status=character.status||{};
    const defense=number(character.defense?.total??character.defesaTotal??character.defense,0);
    const rd=number(character.damageReduction?.total??character.rdTotal??character.rd,0);

    openTablePanel("PERSONAGEM",character.name||"Ficha",`
        <div class="table-v2-character">
            <div class="table-v2-attributes">
                <div><span>Corpo</span><strong>${number(attrs.corpo,1)}</strong></div>
                <div><span>Foco</span><strong>${number(attrs.foco,1)}</strong></div>
                <div><span>Nexo</span><strong>${number(attrs.nexo,1)}</strong></div>
            </div>

            <div class="table-v2-status-grid">
                ${currentLifeHTML(character)}
                <div class="table-v2-status-card"><span>PM</span><strong>${number(status.pmAtual,0)} / ${number(status.pmMax,0)}</strong></div>
                <div class="table-v2-status-card"><span>PA</span><strong>${number(status.paAtual,0)} / ${number(status.paMax,0)}</strong></div>
                <div class="table-v2-status-card"><span>Defesa</span><strong>${defense}</strong></div>
                <div class="table-v2-status-card"><span>RD</span><strong>${rd}</strong></div>
            </div>

            <div class="table-panel-section">
                <h3 class="table-panel-section-title">Perícias treinadas</h3>
                ${skillsHTML(character)}
            </div>

            <div class="table-panel-section">
                <h3 class="table-panel-section-title">Habilidades adquiridas</h3>
                ${abilitySummaryHTML(character)}
            </div>
        </div>
    `);
}

function attacksHTML(character){
    const attacks=(character.quickAttacks||[]).slice(0,3).filter(entry=>entry.name||entry.damage);
    const healing=character.quickAttacks?.[3];
    return `
        <div class="table-panel-section">
            <h3 class="table-panel-section-title">Ataques</h3>
            <div class="table-panel-list">
                ${attacks.length?attacks.map((attack,index)=>`
                    <div class="table-panel-card table-v2-attack-card">
                        <h3>${escapeHTML(attack.name||`Ataque ${index+1}`)}</h3>
                        <p><strong>${escapeHTML(attack.skillName||titleCase(attack.skill))}</strong> • ${escapeHTML(attack.roll)}</p>
                        <p>Dano: ${escapeHTML(attack.damage||"—")}</p>
                        <p>Tipo: ${escapeHTML(damageTypeLabel(attack.damageType))} • Crítico: ${attack.criticalOn}–12</p>
                        <button type="button" class="primary-button table-v2-roll-entry" data-index="${index}" data-type="attack">Rolar ataque</button>
                    </div>
                `).join(""):'<div class="editor-empty-state"><p>Nenhum ataque configurado.</p></div>'}
            </div>
        </div>
        <div class="table-panel-section">
            <h3 class="table-panel-section-title">Cura</h3>
            ${healing&&healing.name?`
                <div class="table-panel-card table-v2-attack-card">
                    <h3>${escapeHTML(healing.name)}</h3>
                    <p><strong>Medicina</strong> • ${escapeHTML(healing.roll)}</p>
                    <p>Cura: ${escapeHTML(healing.healing||"—")}</p>
                    <button type="button" class="primary-button table-v2-roll-entry" data-index="3" data-type="healing">Rolar cura</button>
                </div>
            `:'<div class="editor-empty-state"><p>Nenhuma cura configurada.</p></div>'}
        </div>
    `;
}

function openAttacksPanelV2(){
    const character=syncCurrentCharacter();
    if(!character) return;
    openTablePanel("COMBATE","Ataques e Cura",attacksHTML(character));
    document.querySelectorAll(".table-v2-roll-entry").forEach(button=>{
        button.addEventListener("click",()=>{
            const index=Number(button.dataset.index);
            const type=button.dataset.type;
            if(typeof rollQuickAttack==="function") rollQuickAttack(index,type);
        });
    });
}

function addStyle(){
    if(document.getElementById("tableSystemV2SyncStyle")) return;
    const style=document.createElement("style");
    style.id="tableSystemV2SyncStyle";
    style.textContent=`
        .table-v2-attributes{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
        .table-v2-attributes>div,.table-v2-status-card{padding:13px;border-radius:13px;background:#171720;border:1px solid var(--border);display:flex;flex-direction:column;gap:5px}
        .table-v2-attributes span,.table-v2-status-card span,.table-v2-members span{font-size:9px;letter-spacing:1.2px;text-transform:uppercase;color:var(--text3)}
        .table-v2-attributes strong{font-family:'Orbitron',sans-serif;font-size:20px;color:white}
        .table-v2-status-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-bottom:22px}
        .table-v2-status-card strong{font-size:15px;color:white}
        .table-v2-members{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;padding:10px;border-radius:13px;background:#171720;border:1px solid var(--border)}
        .table-v2-members>div{display:flex;justify-content:space-between;gap:8px;padding:7px;background:#111118;border-radius:8px}
        .table-v2-members strong{font-size:11px;color:white}
        .table-v2-skill-list{display:flex;flex-direction:column;gap:7px}
        .table-v2-skill-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto auto auto;gap:8px;align-items:center;padding:9px 10px;border-radius:10px;background:#171720;border:1px solid var(--border)}
        .table-v2-skill-row strong{font-size:12px;color:white}.table-v2-skill-row span{font-size:10px;color:var(--text3)}
        .table-v2-attack-card .primary-button{width:100%;margin-top:10px}
    `;
    document.head.appendChild(style);
}

function install(){
    if(installed) return;
    if(typeof openTablePanel!=="function"||typeof handleMenuAction!=="function") return;
    installed=true;
    addStyle();
    syncCurrentCharacter();

    window.normalizeTableCharacterV2=normalizeCharacterV2;
    window.syncCurrentTableCharacterV2=syncCurrentCharacter;
    window.getCharacterReadyAttacks=function(character){
        return normalizeCharacterV2(character||syncCurrentCharacter())?.quickAttacks?.slice(0,3)||[];
    };

    window.openCharacterPanel=openCharacterPanelV2;
    window.openAttacksPanel=openAttacksPanelV2;

    window.addEventListener("storage",event=>{
        if(event.key===CHARACTER_STORAGE){
            syncCurrentCharacter();
            if(!document.getElementById("tablePanelOverlay")?.classList.contains("hidden")){
                const title=document.getElementById("tablePanelTitle")?.textContent||"";
                if(/ficha|personagem/i.test(title)) openCharacterPanelV2();
                if(/ataques|cura/i.test(title)) openAttacksPanelV2();
            }
        }
    });
    window.addEventListener("focus",syncCurrentCharacter);
    document.addEventListener("visibilitychange",()=>{if(!document.hidden) syncCurrentCharacter();});
}

const timer=setInterval(()=>{
    install();
    if(installed) clearInterval(timer);
},100);
setTimeout(install,0);
})();
