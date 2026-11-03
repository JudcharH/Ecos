import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const source=fs.readFileSync(new URL("./mesa-ficha-v3.js",import.meta.url),"utf8");
const context={window:{},console,Date,Math,structuredClone,CustomEvent:class{},document:{dispatchEvent(){}}};
vm.createContext(context);
vm.runInContext(source,context);
const api=context.window.ECO_SHEET_V3;

assert.equal(api.VERSION,3);
assert.equal(api.ACTION_WORDS.length,15);
assert.equal(api.ENHANCEMENTS.length,8);
assert.equal(api.WEAPONS.destructive_range.damage,"4d10");
assert.equal(api.WEAPONS.unarmed.spaces,0);

const character={
 id:"test",name:"Teste",level:1,attributes:{corpo:5,foco:3,nexo:1},
 status:{pvAtual:20,pvMax:20,pmAtual:10,pmMax:10,paAtual:4,paMax:4},
 skills:[],conditions:[],attacks:[],inventory:[],abilities:[],assimilations:[],ecoV3:{version:0}
};
api.migrate(character);
assert.equal(api.maxPV(character),20);
assert.equal(api.maxPM(character),10);
assert.equal(api.heartMax(character),4);
assert.deepEqual({...api.bodyMaximums(character)},{head:8,chest:20,leftArm:8,rightArm:8,leftLeg:10,rightLeg:10});
assert.equal(api.capacity(character),12);
assert.equal(character.attacks.length,1);
assert.equal(character.attacks[0].name,"Desarmado");
assert.equal(character.abilities.length,0);
assert.equal(character.assimilations.length,0);
assert(character.ecoV3.powerCatalog.some(power=>power.id==="redencao"&&power.activation==="Passiva"));
assert(character.ecoV3.powerCatalog.some(power=>power.id==="avidez"&&power.activation==="Ativação"));
assert(character.ecoV3.powerCatalog.some(power=>power.id==="predador"&&power.activation==="Passiva"));
assert(character.ecoV3.powerCatalog.some(power=>power.id==="recuperar-folego"&&power.category==="Assimilação"));
assert(character.ecoV3.powerCatalog.some(power=>power.id==="aproveitador"&&power.activation==="Ativação"));
assert(!character.ecoV3.powerCatalog.some(power=>["mutacao-reativa","prontidao"].includes(power.id)));

character.ecoV3.powers.push({...character.ecoV3.powerCatalog.find(power=>power.id==="tensao")});
character.ecoV3.powers.push({...character.ecoV3.powerCatalog.find(power=>power.id==="combatador")});
character.ecoV3.powers.push({...character.ecoV3.powerCatalog.find(power=>power.id==="tanque")});
character.ecoV3.powers.push({...character.ecoV3.powerCatalog.find(power=>power.id==="paramedico")});
api.migrate(character);
assert.equal(api.effectiveAttribute(character,"corpo"),6);
assert.equal(api.itemSkillBonus(character,"Luta"),2);
assert.equal(character.damageReduction.total,2);
assert(character.attacks.some(attack=>attack.sourcePower==="paramedico"&&attack.healing==="2d6 + nexo"));

character.level=10;
api.syncVitals(character,true);
assert.equal(api.maxPV(character),56);
assert.equal(api.maxPM(character),37);
assert.equal(api.heartMax(character),12);

character.status.pvAtual=0;
api.updateLifeConditions(character);
assert(character.conditions.some(item=>item.id==="morrendo"&&item.locked));
assert(character.conditions.some(item=>item.id==="sangramento"&&item.locked));

character.status.pvAtual=1;
api.updateLifeConditions(character);
assert(!character.conditions.some(item=>item.id==="morrendo"));
assert(!character.conditions.some(item=>item.id==="sangramento"&&item.source==="eco-v3-death"));

console.log(JSON.stringify({ok:true,version:api.VERSION,actions:api.ACTION_WORDS.length,enhancements:api.ENHANCEMENTS.length,weapons:Object.keys(api.WEAPONS).length,pvLevel10:api.maxPV(character),pmLevel10:api.maxPM(character)},null,2));
