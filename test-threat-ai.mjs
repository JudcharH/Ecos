import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const enemy={id:"wolf",name:"Lobisomem",position:1,nexo:2,ecoIntelligence:true,basicAttack:"1d6",strongAttack:"1d8",status:{paAtual:3},defense:10};
const players=[{characterId:"tank",position:1},{characterId:"medic",position:3}];
const characters={tank:{id:"tank",conditions:[]},medic:{id:"medic",conditions:[]}};
const calls=[];
let participant={type:"enemy",enemyId:"wolf"};
const fight={active:true,round:1,currentTurnIndex:0};
const context={
    window:{}, document:{hidden:false}, currentTableRole:"master",
    currentTableCampaign:{combat:fight,enemies:[enemy],players,chatMessages:[]},
    pendingAttackApplication:null,pendingDamageApplication:null,pendingBodyDamageApplication:null,pendingEnemyAbilityTarget:null,
    getLiveCharacter:id=>characters[id], isDeadAbilityTarget:()=>false,
    normalizeEnemyAbilityId:x=>String(x).toLowerCase(),enemyCurrentActionPoints:e=>e.status.paAtual,
    getCurrentTurnParticipant:()=>participant,refreshCurrentTableCampaign:()=>{},saveTableCampaign:()=>{},
    passCurrentCombatTurn:()=>calls.push("pass"),
    answerEnemyAttackReaction:type=>calls.push(type),
};
vm.runInNewContext(fs.readFileSync(new URL("./mesa-eco-ameacas.js",import.meta.url),"utf8"),context);
const ai=context.window.ECO_THREAT_AI;
assert.deepEqual([0,3,4,6,7,10].map(ai.tier),["low","low","medium","medium","strategist","strategist"]);
assert.equal(ai.selectAction(enemy,players,fight,[]).player.characterId,"tank");
enemy.nexo=5;
characters.medic.conditions=["caido"];
assert.equal(ai.selectAction(enemy,players,fight,[]).player.characterId,"medic");
enemy.nexo=8;
characters.medic.conditions=[];
const heals=[{type:"roll",rollKind:"healing",characterId:"medic",applied:true}];
assert.equal(ai.selectAction(enemy,players,fight,heals).player.characterId,"medic");
enemy.strongAttackPositions=[1];
enemy.basicAttackPositions=[1];
assert.equal(ai.selectAction(enemy,players,fight,heals).player.characterId,"tank");
assert.equal(ai.reaction(enemy,{attackResult:14}),"dodge");
assert.equal(ai.reaction(enemy,{attackResult:30}),"block");
assert.equal(ai.reaction(enemy,{attackResult:30,noBlock:true}),"dodge");
assert.equal(ai.reaction(enemy,{attackResult:7,attackerCharacterId:"tank"}),"counter");
assert.equal(ai.reaction(enemy,{desprevenido:true}),"surprised");

const roll=(e,k,kind,p)=>{
    calls.push(kind);
    if(kind==="attack")fight.pendingAttack={id:"a",active:true,attackerEnemyId:e.id,targetCharacterId:p.characterId};
    else fight.damageContext.consumed=true;
};
participant={type:"player",characterId:"tank"};
ai.tick(roll);
assert.deepEqual(calls,[]);
participant={type:"enemy",enemyId:"wolf"};
enemy.ecoIntelligence=false;
ai.tick(roll);
assert.deepEqual(calls,[]);
enemy.ecoIntelligence=true;
ai.tick(roll);
ai.tick(roll);
assert.deepEqual(calls,["attack"]);
assert.equal(fight.ecoPendingAction.requestId,"a");
Object.assign(fight.pendingAttack,{active:false,resolved:true,hit:true});
fight.damageContext={active:true,attackRequestId:"a"};
ai.tick(roll);
assert.deepEqual(calls,["attack","damage"]);
fight.pendingEnemyAttack={id:"incoming",active:true,attackResult:15,targetEnemyId:"wolf"};
participant={type:"player",characterId:"tank"};
ai.tick(roll);
assert.deepEqual(calls,["attack","damage","dodge"]);
console.log("Eco: faixas NEX, alvo, alcance, reações e fluxo de turno verificados.");
