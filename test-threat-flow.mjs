import fs from "node:fs";
import vm from "node:vm";

const listeners = new Map();
const storage = new Map();
const document = {
    addEventListener(type, handler) {
        const list = listeners.get(type) || [];
        list.push(handler);
        listeners.set(type, list);
    },
    getElementById() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    createElement() {
        return {
            classList: { add() {}, remove() {}, toggle() {} },
            appendChild() {},
            addEventListener() {},
            dataset: {},
            style: {}
        };
    },
    body: { appendChild() {} }
};

const context = vm.createContext({
    console,
    document,
    window: {
        location: { search: "", href: "" },
        addEventListener() {},
        setInterval() {},
        clearInterval() {}
    },
    localStorage: {
        getItem(key) { return storage.has(key) ? storage.get(key) : null; },
        setItem(key, value) { storage.set(key, String(value)); },
        removeItem(key) { storage.delete(key); }
    },
    URLSearchParams,
    Date,
    Math,
    JSON,
    Number,
    String,
    Array,
    Object,
    Map,
    Set,
    alert() {},
    confirm() { return true; },
    setTimeout() {},
    clearTimeout() {}
});

const mesaSource = fs.readFileSync("mesa.js", "utf8");
vm.runInContext(mesaSource, context, { filename: "mesa.js" });

vm.runInContext(`
    let openedEnemy = null;
    let selectedEnemy = null;
    let saved = 0;
    openEnemyControlSheet = enemy => { openedEnemy = enemy; };
    openPositionSelector = (type, enemy) => { selectedEnemy = { type, enemy }; };
    closeCurrentPanel = () => {};
    closeCurrentPositionModal = () => {};
    renderCombatPositions = () => {};
    addSystemChatMessage = () => {};
    saveTableCampaign = () => { saved += 1; };
    currentTableRole = "master";
    currentTableCampaign = {
        id: "campaign-test",
        enemies: [{
            id: "enemy-instance-1",
            enemyId: "enemy-instance-1",
            templateId: 42,
            name: "Criatura Teste",
            position: 3,
            size: 2,
            foco: 5,
            corpo: 1,
            pa: 3,
            pv: 40,
            skills: { Presteza: 2 }
        }],
        players: [],
        npcs: [],
        combat: {}
    };
`, context);

vm.runInContext("bindTableEvents()", context);
const click = listeners.get("click")?.at(-1);
if (!click) throw new Error("O clique delegado da ameaça não foi registrado.");

const token = { dataset: { enemyInstanceId: "enemy-instance-1", enemyPosition: "3" } };
click({
    target: { closest: () => token },
    preventDefault() {},
    stopPropagation() {}
});

if (!vm.runInContext("openedEnemy?.name === 'Criatura Teste'", context)) {
    throw new Error("O clique no token não abriu a ficha da criatura.");
}

storage.set("ordem_threats", JSON.stringify([{ id: 42, name: "Modelo numérico" }]));
vm.runInContext("startEnemyPlacement('42')", context);
if (!vm.runInContext("selectedEnemy?.enemy?.name === 'Modelo numérico'", context)) {
    throw new Error("A ameaça com ID numérico não foi localizada pelo dataset.");
}

vm.runInContext(`
    const movingEnemy = currentTableCampaign.enemies[0];
    placeEntityAtPosition("enemy", movingEnemy, 5);
`, context);
if (!vm.runInContext("currentTableCampaign.enemies.length === 1 && currentTableCampaign.enemies[0].position === 5", context)) {
    throw new Error("Mover a criatura duplicou a instância ou não atualizou a posição.");
}

vm.runInContext("removeEntityFromScene('enemy', currentTableCampaign.enemies[0])", context);
if (!vm.runInContext("currentTableCampaign.enemies.length === 0", context)) {
    throw new Error("Remover a criatura não retirou a instância da mesa.");
}

vm.runInContext(`
    currentTableCampaign.enemies = [{
        id: "enemy-instance-2",
        enemyId: "enemy-instance-2",
        name: "Criatura Teste",
        position: 3,
        foco: 5,
        corpo: 1,
        skills: { Luta: 2, Presteza: 2 }
    }];
    currentTableCampaign.combat = {
        initiativeRequest: {
            active: true,
            participants: [{
                type: "enemy",
                enemyId: "enemy-instance-2",
                rolled: false
            }]
        }
    };
    let rolledFormula = "";
    let initiativeSavedBeforeChat = false;
    rollDiceExpression = formula => formula === "1d12"
        ? { total: 7, details: [{ type: "dice", formula, rolls: [7] }] }
        : { total: 5, details: [{ type: "dice", formula, rolls: [5] }] };
    saveTableCampaign = () => { initiativeSavedBeforeChat = currentTableCampaign.combat.initiativeRequest.participants[0].rolled === true; };
    addRollChatMessage = (label, formula) => { rolledFormula = formula; if(!initiativeSavedBeforeChat) throw new Error("A iniciativa foi publicada antes de ser salva."); };
    finalizeInitiativeIfReady = () => {};
    rollEnemyInitiatives();
`, context);

const initiative = vm.runInContext(`({
    formula: rolledFormula,
    participant: currentTableCampaign.combat.initiativeRequest.participants[0]
})`, context);

if (initiative.formula !== "1d12+1d8+1") {
    throw new Error(`Fórmula de iniciativa incorreta: ${initiative.formula}`);
}
if (!initiative.participant.rolled || initiative.participant.attribute !== "corpo" || initiative.participant.attributeValue !== 1) {
    throw new Error(`Registro de iniciativa incorreto: ${JSON.stringify(initiative.participant)}`);
}

const playerInitiative = vm.runInContext(`(() => {
    currentTableRole = "player";
    currentTableCharacter = { id: "player-initiative", name: "Agente", attributes: { corpo: 2, foco: 4, nexo: 3 }, skills: [{ id: "presteza", name: "Presteza", training: "1d8", bonus: 2, penalty: 1 }] };
    currentTableCampaign.combat = { initiativeRequest: { active: true, participants: [{ type: "player", characterId: "player-initiative", rolled: false }] } };
    refreshCurrentTableCampaign = () => true;
    refreshCurrentTableCharacter = () => true;
    rollDiceExpression = formula => formula === "1d12"
        ? { total: 7, details: [{ type: "dice", formula, rolls: [7] }] }
        : { total: 5, details: [{ type: "dice", formula, rolls: [5] }] };
    let published = null;
    addRollChatMessage = (label, formula, total) => { published = { label, formula, total }; };
    addSystemChatMessage = () => {};
    saveTableCampaign = () => {};
    closeCurrentPanel = () => {};
    finalizeInitiativeIfReady = () => {};
    rollPlayerInitiative("corpo");
    currentTableRole = "master";
    return { published, participant: currentTableCampaign.combat.initiativeRequest.participants[0] };
})()`, context);
if (playerInitiative.published.total !== 15 || playerInitiative.participant.attribute !== "corpo" || playerInitiative.participant.attributeValue !== 2 || !playerInitiative.published.formula.includes("1d12") || !playerInitiative.published.formula.includes("1d8")) {
    throw new Error(`Iniciativa atual do jogador incorreta: ${JSON.stringify(playerInitiative)}`);
}

const bodyDistribution = vm.runInContext(`(() => {
    let remaining = 24;
    const allocations = [];
    for (const current of [10, 10, 10]) {
        const applied = applyDamageAmountToBodyPart(current, remaining);
        allocations.push(applied);
        remaining -= applied;
    }
    const enemy = { head: 10, torso: 10, limb: 10 };
    initializeEnemyBody(enemy);
    return { allocations, remaining, mode: enemy.lifeMode, head: enemy.body.head, rightLeg: enemy.body.rightLeg };
})()`, context);
if (JSON.stringify(bodyDistribution.allocations) !== JSON.stringify([10, 10, 4]) || bodyDistribution.remaining !== 0 || bodyDistribution.mode !== "body" || bodyDistribution.head !== 10 || bodyDistribution.rightLeg !== 10) {
    throw new Error(`Distribuição de dano por membros incorreta: ${JSON.stringify(bodyDistribution)}`);
}

const skillRolls = vm.runInContext(`(() => {
    const formulas = [];
    rollDiceExpression = formula => ({
        total: formula === "1d12" ? 7 : 5,
        details: [{ type: "dice", formula, rolls: [formula === "1d12" ? 7 : 5] }],
        expression: (formulas.push(formula), formula)
    });
    addRollChatMessage = (label, formula, total, detail, metadata) => formulas.push({ label, formula, total, metadata });
    const enemy = currentTableCampaign.enemies[0];
    rollEnemySkill(enemy, "Luta", { rollKind: "attack" });
    rollEnemySkill(enemy, "Presteza");
    return formulas;
})()`, context);

if (skillRolls[2]?.formula !== "1d12+1d8+1" || skillRolls[5]?.formula !== "1d12+1d8+1") {
    throw new Error(`Fórmulas de perícia incorretas: ${JSON.stringify(skillRolls)}`);
}
const criticalRoll = vm.runInContext(`(() => {
    rollDiceExpression = formula => formula === "1d12"
        ? { total: 12, details: [{ type: "dice", formula, rolls: [12] }] }
        : { total: 9, details: [{ type: "dice", formula, rolls: [4, 5] }] };
    return rollEnemyTrainedTest(currentTableCampaign.enemies[0], "Luta");
})()`, context);
if (!criticalRoll.critical || criticalRoll.formula !== "1d12+2d8+1" || criticalRoll.total !== 22) {
    throw new Error(`Crítico de criatura incorreto: ${JSON.stringify(criticalRoll)}`);
}
if (!vm.runInContext("ENEMY_CONDITION_CATALOG.length >= 20", context)) {
    throw new Error("A lista de condições da criatura está incompleta.");
}
if (!vm.runInContext("addEnemyDamageDie('2d12 + 6') === '3d12 + 6'", context)) {
    throw new Error("O dado adicional da Investida não foi aplicado corretamente.");
}
if (!vm.runInContext("addEnemyDamageDice('2d12 + 1d8 + 6', 2) === '4d12 + 1d8 + 6'", context)) {
    throw new Error("Os dois dados adicionais do crítico não foram aplicados ao dano principal.");
}

const enemyActionPoints = vm.runInContext(`(() => {
    const enemy = { pa: 3, paAtual: 3, status: { paAtual: 3, paMax: 3 } };
    saveTableCampaign = () => {};
    const firstAttack = spendEnemyActionPoints(enemy, 1);
    const afterFirst = enemy.paAtual;
    enemy.status.paAtual = 0;
    enemy.paAtual = 0;
    const attackWithoutPA = spendEnemyActionPoints(enemy, 1);
    return { firstAttack, afterFirst, savedPA: enemy.paAtual, attackWithoutPA };
})()`, context);
if (!enemyActionPoints.firstAttack || enemyActionPoints.afterFirst !== 2 || enemyActionPoints.attackWithoutPA || enemyActionPoints.savedPA !== 0) {
    throw new Error(`Consumo de PA da criatura incorreto: ${JSON.stringify(enemyActionPoints)}`);
}

const enemyDamage = vm.runInContext(`(() => {
    const enemy = { id: "damaged-enemy", enemyId: "damaged-enemy", name: "Alvo", pv: 40, rd: 3, status: { pvAtual: 40, pvMax: 40 } };
    const message = { id: "damage-message", rollKind: "damage", total: 10 };
    currentTableCampaign.enemies = [enemy];
    currentTableCampaign.chatMessages = [message];
    currentTableCampaign.combat = {};
    pendingDamageApplication = { messageId: message.id, damage: 10 };
    saveTableCampaign = () => {};
    cancelDamageTargetSelection = () => { pendingDamageApplication = null; };
    renderCombatPositions = () => {};
    renderPublicChat = () => {};
    addSystemChatMessage = () => {};
    applyDamageToEnemy(enemy);
    return { pv: enemy.status.pvAtual, application: message.damageApplication, applied: message.applied };
})()`, context);
if (enemyDamage.pv !== 33 || !enemyDamage.applied || enemyDamage.application.pvBefore !== 40 || enemyDamage.application.pvAfter !== 33) {
    throw new Error(`Dano nos PV atuais da criatura incorreto: ${JSON.stringify(enemyDamage)}`);
}

const enemyCondition = vm.runInContext(`(() => {
    const enemy = { id: "condition-enemy", enemyId: "condition-enemy", conditions: [] };
    currentTableCampaign.enemies = [enemy];
    addConditionToEnemy(enemy, ENEMY_CONDITION_CATALOG.find(item => item.id === "sangramento"));
    addConditionToEnemy(enemy, ENEMY_CONDITION_CATALOG.find(item => item.id === "sangramento"));
    return enemy.conditions[0];
})()`, context);
if (enemyCondition.id !== "sangramento" || enemyCondition.stacks !== 2) {
    throw new Error(`Condição da ameaça não foi aplicada ou acumulada: ${JSON.stringify(enemyCondition)}`);
}

const fierceBiteAttack = vm.runInContext(`(() => {
    const enemy = { id: "bite-enemy", enemyId: "bite-enemy", name: "Predador" };
    currentTableCampaign.enemies = [enemy];
    currentTableCampaign.chatMessages = [{
        id: "strong-hit",
        rollKind: "attack",
        attackVariant: "strong",
        attackApplication: { attackerEnemyId: "bite-enemy", targetCharacterId: "target-player", hit: true }
    }];
    return latestSuccessfulStrongAttack(enemy);
})()`, context);
if (fierceBiteAttack?.id !== "strong-hit") {
    throw new Error(`Mordida Feroz não reconheceu o ataque forte acertado: ${JSON.stringify(fierceBiteAttack)}`);
}

const greaterDodge = vm.runInContext(`(() => {
    const enemy = {
        id: "wolf-instance",
        enemyId: "wolf-instance",
        name: "Lobisomem",
        corpo: 2,
        defense: 12,
        rd: 4,
        pa: 3,
        paAtual: 3,
        status: { paAtual: 3 },
        skills: { Presteza: 2 },
        abilities: [{ id: "esquiva-maior", name: "Esquiva Maior" }],
        abilityState: { esquivaMaiorArmed: true }
    };
    currentTableCampaign.enemies = [enemy];
    currentTableCampaign.chatMessages = [{ id: "attack-message", type: "roll" }];
    currentTableCampaign.combat = {
        round: 1,
        pendingEnemyAttack: {
            id: "enemy-reaction",
            active: true,
            resolved: false,
            messageId: "attack-message",
            attackResult: 30,
            targetEnemyId: "wolf-instance",
            attackerName: "Jogador"
        }
    };
    refreshCurrentTableCampaign = () => true;
    rollDiceExpression = formula => ({ expression: formula, total: 8, details: [] });
    closeCurrentPanel = () => {};
    renderPublicChat = () => {};
    addSystemChatMessage = () => {};
    addRollChatMessage = () => {};
    saveTableCampaign = () => {};
    answerEnemyAttackReaction("dodge");
    return {
        rd: currentTableCampaign.combat.damageContext.damageReduction,
        armed: enemy.abilityState.esquivaMaiorArmed,
        uses: enemy.abilityState.esquivaMaiorSceneUses,
        usedRound: enemy.abilityState.esquivaMaiorUsedRound,
        reaction: currentTableCampaign.chatMessages[0].attackApplication.reaction
    };
})()`, context);

if (greaterDodge.rd !== 8 || greaterDodge.armed !== false || greaterDodge.uses !== 1 || greaterDodge.usedRound !== 1 || greaterDodge.reaction !== "Esquiva Maior") {
    throw new Error(`Esquiva Maior incorreta: ${JSON.stringify(greaterDodge)}`);
}

vm.runInContext(fs.readFileSync("ameacas.js", "utf8"), context, { filename: "ameacas.js" });
const abilityCatalog = vm.runInContext("window.OrdemThreatRules.abilityCatalog.map(ability => ability.id)", context);
if (!["investida", "mordida-feroz", "esquiva-maior"].every(id => abilityCatalog.includes(id))) {
    throw new Error(`Biblioteca de habilidades incompleta: ${JSON.stringify(abilityCatalog)}`);
}
const deathGodPreset = vm.runInContext(`(() => {
    const god = window.OrdemThreatRules.deathGodPreset();
    return { corpo: god.corpo, foco: god.foco, nexo: god.nexo, skills: god.skills, pv: god.pv, rd: god.rd, abilities: god.abilities.map(a => a.id) };
})()`, context);
if (deathGodPreset.corpo !== 8 || deathGodPreset.foco !== 8 || deathGodPreset.nexo !== 6 || Object.values(deathGodPreset.skills).reduce((a, b) => a + b, 0) !== 24 || deathGodPreset.pv !== 440 || deathGodPreset.rd !== 25 || !["reliquia", "cronos", "segunda-fase", "conjurador"].every(id => deathGodPreset.abilities.includes(id))) {
    throw new Error(`Deus da Morte incorreto: ${JSON.stringify(deathGodPreset)}`);
}
const passiveThreat = vm.runInContext(`(() => {
    const enemy = { pv: 20, head: 4, torso: 4, limb: 3, rd: 2, abilities: [{ id: "reliquia" }, { id: "camada-extra" }] };
    applyEnemyPassiveStats(enemy);
    return enemy;
})()`, context);
if (passiveThreat.pv !== 40 || passiveThreat.head !== 8 || passiveThreat.torso !== 8 || passiveThreat.limb !== 6 || passiveThreat.rd !== 5) {
    throw new Error(`Passivas de ameaça incorretas: ${JSON.stringify(passiveThreat)}`);
}
for (const marker of ["startEnemyAbilityTargetSelection", "resolveEnemyAbilityTarget", "openEnemySummonSelector", "openEnemyGrimoire", 'rollKind:"ritual-damage"', 'enemyHasAbility(enemy,"apice-do-poder")', "envelheceu 3 anos"]) {
    if (!mesaSource.includes(marker)) throw new Error(`Fluxo de habilidade ausente: ${marker}`);
}
const playerCritical = vm.runInContext(`(() => {
    const original = rollDiceExpression;
    let rolls = [12, 4, 7];
    rollDiceExpression = formula => {
        const amount = Number(String(formula).match(/^(\\d+)d/)?.[1]) || 1;
        const values = rolls.splice(0, amount);
        return { total: values.reduce((sum, value) => sum + value, 0), details: [{ type: "dice", formula, rolls: values }] };
    };
    const result = rollCharacterTrainedTest("1d8", 2);
    rollDiceExpression = original;
    return result;
})()`, context);
if (!playerCritical.critical || playerCritical.formula !== "1d12+2d8+2" || playerCritical.total !== 25) {
    throw new Error(`Crítico do jogador incorreto: ${JSON.stringify(playerCritical)}`);
}
if (!mesaSource.includes("O mestre pode adicionar a criatura manualmente") || !mesaSource.includes("O mestre pode adicionar o Morto-vivo manualmente")) {
    throw new Error("Invocador ou Possessão ainda tenta adicionar a ameaça automaticamente.");
}
if (!mesaSource.includes('const enemyClassicHTML=enemyLifeMode==="classic"')) {
    throw new Error("O sistema de vida clássico não está sendo ocultado no modo por membros.");
}
for (const id of ["ferocidade", "atrair", "ilusorio", "regenerativo", "vampirismo", "aplicador", "espinhoso"]) {
    if (!abilityCatalog.includes(id)) throw new Error(`Nova habilidade ausente da biblioteca: ${id}`);
}
for (const id of ["aura-opressora", "devorador-de-condicoes", "ultimo-suspiro", "metamorfose", "predador"]) {
    if (!abilityCatalog.includes(id)) throw new Error(`Habilidade aprovada ausente da biblioteca: ${id}`);
}
for (const id of ["travar", "fantasmagorico"]) {
    if (!abilityCatalog.includes(id)) throw new Error(`Habilidade da Telopsia ausente da biblioteca: ${id}`);
}
for (const marker of ["oppressivePenalties", "openDevourCondition", "triggerEnemyLastBreath", "triggerEnemyMetamorphosis", 'enemyHasAbility(attacker,"predador")']) {
    if (!mesaSource.includes(marker)) throw new Error(`Automação de habilidade aprovada ausente: ${marker}`);
}

const auraStart=mesaSource.indexOf("function processEnemyRoundAbilities()");
const auraEnd=mesaSource.indexOf("function triggerEnemyMetamorphosis",auraStart);
const auraBlock=mesaSource.slice(auraStart,auraEnd);
if (!(auraBlock.indexOf("saveTableCampaign();")<auraBlock.indexOf("Aura Opressora •"))) throw new Error("Aura Opressora não persiste o mapa de penalidades antes das rolagens.");
if (!/oppressivePenalties=currentTableCampaign\.combat\.oppressivePenalties\|\|\{\}/.test(auraBlock)) throw new Error("Aura Opressora não reconstrói defensivamente o mapa após as mensagens.");
for (const marker of ["processEnemyRoundAbilities", "resolveEnemyAbilityTargetRouter", "illusoryPenalties", "Vampirismo", "applyApplicatorCondition", "Espinhoso de", 'ids.includes("ferocidade")']) {
    if (!mesaSource.includes(marker)) throw new Error(`Automação de nova habilidade ausente: ${marker}`);
}
for (const marker of ["openNpcControlSheet", "Ataque em conjunto", "Curar 2d8 + 4", "+3 no próximo teste", "npcInstanceId", 'type==="npc"']) {
    if (!mesaSource.includes(marker)) throw new Error(`Sistema de NPC aliado ausente: ${marker}`);
}
const threatEditorSource = fs.readFileSync("ameacas.js", "utf8");
for (const marker of ["function telopsia()", 'systemId:"telopsia-na8"', "assets/telopsia-idle.webm", "consumeFantasmagorico", "travarSceneUses", "Travar •"]) {
    if (!threatEditorSource.includes(marker) && !mesaSource.includes(marker)) throw new Error(`Automação da Telopsia ausente: ${marker}`);
}
for (const marker of ["assets/threats/lobisomem-normal.webp", "assets/threats/lobisomem-machucado.webp", "data.length<=150000"]) {
    if (!threatEditorSource.includes(marker)) throw new Error(`Persistência de fotos de ameaça ausente: ${marker}`);
}
if (!mesaSource.includes("function hydrateEnemyMedia") || !fs.existsSync("assets/threats/lobisomem-normal.webp") || !fs.existsSync("assets/threats/lobisomem-machucado.webp")) {
    throw new Error("Fotos padrão ou sincronização visual do Lobisomem ausentes.");
}
const wolfAbilityMatch=threatEditorSource.match(/const WOLF_ABILITY_IDS=\[([^\]]+)\]/);
const wolfAbilityIds=wolfAbilityMatch?[...wolfAbilityMatch[1].matchAll(/"([^"]+)"/g)].map(match=>match[1]):[];
const expectedWolfAbilities=["esquiva-maior","investida","mordida-feroz","ferocidade","predador"];
if (JSON.stringify(wolfAbilityIds)!==JSON.stringify(expectedWolfAbilities)) throw new Error(`Habilidades do Lobisomem incorretas: ${JSON.stringify(wolfAbilityIds)}`);
if (!mesaSource.includes('enemy?.systemId==="lobisomem-na6"') || !mesaSource.includes("wolfIds.has")) throw new Error("Instâncias existentes do Lobisomem não são normalizadas para as cinco habilidades oficiais.");
for (const marker of ["persistNpc", "npcRole", "npcLevel", "NPC Aliado"]) {
    if (!threatEditorSource.includes(marker)) throw new Error(`Editor de NPC aliado ausente: ${marker}`);
}
const heartRules = vm.runInContext(`(() => { const classic={level:10,lifeMode:"classic",attributes:{corpo:5},status:{pvAtual:0,pvMax:75}};ensureCharacterHeart(classic);const body={level:10,lifeMode:"body",attributes:{corpo:5},body:{chest:25,chestMax:25}};ensureCharacterHeart(body);return{classicPV:classic.status.pvMax,classicHeart:classic.heart.max,bodyHeart:body.heart.max}; })()`, context);
if (heartRules.classicPV !== 100 || heartRules.classicHeart !== 25 || heartRules.bodyHeart !== 25) {
    throw new Error(`Regra do Coração incorreta: ${JSON.stringify(heartRules)}`);
}
const heartOverflow = vm.runInContext(`(() => { const originalSave=saveDamagedCharacter,originalFinish=finishDamageApplication;saveDamagedCharacter=()=>true;finishDamageApplication=()=>{};currentTableCampaign={combat:{},chatMessages:[]};pendingDamageApplication={messageId:"heart-test",damage:35,attackName:"Teste"};const character={id:"heart-character",name:"Teste",level:10,lifeMode:"classic",attributes:{corpo:5},status:{pvAtual:10,pvMax:100,pvTemp:0},heart:{current:25,max:25},damageReduction:{total:0},conditions:[]};applyClassicDamageToCharacter(character);const result={pv:character.status.pvAtual,heart:character.heart.current,dead:character.conditions.some(c=>c.id==="morto")};saveDamagedCharacter=originalSave;finishDamageApplication=originalFinish;pendingDamageApplication=null;return result;})()`, context);
if (heartOverflow.pv !== 0 || heartOverflow.heart !== 0 || !heartOverflow.dead) throw new Error(`Transbordamento para o Coração incorreto: ${JSON.stringify(heartOverflow)}`);
const baseSystemSource = fs.readFileSync("sistema-base-v2.js", "utf8");
if (!baseSystemSource.includes("const pvMax=(9*level)+(corpo*2)")) throw new Error("Fórmula nova de PV clássico ausente.");

console.log(JSON.stringify({
    ok: true,
    clickOpenedSheet: true,
    numericTemplateId: true,
    moveAndRemove: true,
    initiativeFormula: initiative.formula,
    initiativeSavedBeforeChat: true,
    playerInitiativeUsesBodyAndReadiness: true,
    bodyDamageDistribution: true,
    skillFormula: skillRolls[0],
    conditionCatalog: true,
    chargeDamageDie: true,
    enemyAttackConsumesPA: true,
    enemyCurrentPVReduced: true,
    enemyConditions: true,
    fierceBiteTarget: true,
    reusableAbilityCatalog: true,
    deathGodPreset: true,
    passiveThreatAbilities: true,
    greaterDodge: true,
    targetedThreatAbilities: true,
    summonChoice: true,
    enemyGrimoire: true,
    deathTouch: true,
    apexImmunity: true
    ,playerCriticalTraining: true
    ,manualSummons: true
    ,exclusiveLifeSystem: true
    ,alliedNpcSystem: true
    ,newThreatAbilities: true
    ,approvedThreatAbilities: true
    ,heartLifeSystem: heartRules
    ,heartOverflow
}, null, 2));
