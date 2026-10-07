import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const emitted=[];
const math=Object.create(Math);math.random=()=>0.5;
const character={id:"hero",quickAttacks:[{name:"Acha",damage:"1d8 + 3",criticalOn:12}]};
const context={
  console,Math:math,currentTableCharacter:character,
  currentTableCampaign:{combat:{abilityState:{potenciaMaxima:{active:true,characterId:"hero",round:1}}}},
  addRollChatMessage:(...args)=>emitted.push(args),
  getCharacterReadyAttacks:()=>character.quickAttacks,
  refreshCurrentTableCampaign(){},refreshCurrentTableCharacter(){},saveTableCampaign(){},
  passTableRound(){context.currentTableCampaign.combat.round=2;},
  document:{getElementById:()=>null,querySelectorAll:()=>[]},
  MutationObserver:class{observe(){}},
  setTimeout:fn=>{fn();return 1;},setInterval:()=>1,clearInterval(){},window:null
};
context.window=context;
vm.createContext(context);
vm.runInContext(fs.readFileSync("mesa-combate-correcao-final.js","utf8"),context);

context.addRollChatMessage("Ataque","1d12 + 1d8 + 3",20,"1d12 [12] + 1d8 [5] + 3",{rollKind:"attack",attackIndex:0,attackName:"Acha"});
context.addRollChatMessage("Dano","1d8 + 3",8,"1d8 [5] + 3",{rollKind:"damage",attackIndex:0,attackName:"Acha"});
const damage=emitted.at(-1);
assert.equal(damage[2],21,"Potência Máxima (+3) e crítico (+2d8=10) devem alterar o dano");
assert.match(damage[1],/2d8 \(Crítico\)/);
assert.equal(damage[4].criticalDamageDice.length,2);
context.passTableRound();
assert.equal(context.currentTableCampaign.combat.abilityState.potenciaMaxima.active,false);

const system=fs.readFileSync("sistema-base-v2.js","utf8");
assert.match(system,/leftArm:limbBase[\s\S]*rightArm:limbBase[\s\S]*leftLeg:limbBase[\s\S]*rightLeg:limbBase/);
const blood=fs.readFileSync("mesa-assimilacoes-sangue.js","utf8");
assert.match(blood,/status\.pvTemp=value;character\.body\.temporaryPV=value/);
const side=fs.readFileSync("mesa-sistema-v2.js","utf8");
assert.match(side,/PV Temporário/);
const grimoire=fs.readFileSync("grimorio-v25.js","utf8");
assert.match(grimoire,/rollResistance\(target,r\.action,rit\.resistanceDT\)/);
assert.match(grimoire,/applyRitualValue\(target,value,healing,r\)/);
const tableCore=fs.readFileSync("mesa.js","utf8");
const cinematic=fs.readFileSync("mesa-cinematica.js","utf8");
assert.match(tableCore,/function startAttackTargetSelection\([\s\S]*?if\(pendingDamageApplication\)\{[\s\S]*?cancelDamageTargetSelection\(\)/);
assert.match(tableCore,/function startDamageTargetSelection\([\s\S]*?if\(pendingAttackApplication\)\{[\s\S]*?cancelAttackTargetSelection\(\)/);
assert.match(tableCore,/isHealingTest[\s\S]*?isHealing[\s\S]*?attack\.healing/);
assert.match(tableCore,/state\.type==="enemy"\?\(current<=0\?"Zerado":"PV disponível: \?"\)/);
assert.match(cinematic,/selecting-damage-target[\s\S]*?applyPendingDamageToTarget[\s\S]*?selecting-attack-target[\s\S]*?applyPendingAttackToTarget/);

console.log(JSON.stringify({ok:true,criticalDamage:damage[2],temporaryPV:true,pairedLimbs:true,ritualResolution:true},null,2));
