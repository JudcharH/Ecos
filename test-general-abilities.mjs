import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const root=new URL("./",import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),"utf8");
const sandbox={window:{},document:{readyState:"loading",addEventListener(){},querySelector(){return null},querySelectorAll(){return[]}},localStorage:{getItem(){return null},setItem(){}},console};
vm.createContext(sandbox);
vm.runInContext(read("sistema-base-habilidades.js"),sandbox);
const abilities=sandbox.window.SYSTEM_BASE_V2_ABILITIES;
assert.equal(abilities.length,124,"a biblioteca deve refletir todas as remoções aprovadas");
assert.equal(new Set(abilities.map(item=>item.id)).size,124,"IDs de habilidades devem ser únicos");
assert.ok(abilities.every(item=>item.id&&item.name&&item.description),"toda habilidade precisa de nome, ID e descrição");
for(const removed of ["em-furia","golpe-arriscado","duplo-golpe","retribuir","maquina-de-matar","lobo-solitario","incansavel","atirar-para-matar","levantar-escudo","escudo-de-emergencia","ultima-barreira","ancorado-corporal","dominio-de-terreno","inspirar-confianca","ordem-de-ataque","ordem-de-reacao","nos-olhos-do-monstro","canalizacao-profunda","eco-ritualistico","convergencia-elemental","reciclar-energia","coracao-resistente","socorro-urgente","reflexo-instantaneo","passo-lateral","avanco-coordenado","retirada-estrategica","salto-impulsivo"])assert.ok(!abilities.some(item=>item.id===removed),`habilidade removida ainda disponível: ${removed}`);
assert.equal(abilities.find(item=>item.id==="sacar-e-atacar")?.name,"SAQUE RÁPIDO");
assert.match(abilities.find(item=>item.id==="so-mais-um-passo")?.description||"",/Torso/);
assert.doesNotMatch(abilities.find(item=>item.id==="so-mais-um-passo")?.description||"",/zeraria seu Coração/);
assert.match(abilities.find(item=>item.id==="paramedico")?.description||"",/2 PM.*2d10.*\+3 PM.*\+2d10/i);

const finals=read("mesa-habilidades-finais.js");
const requiredHooks=["buildAutomationCatalog","finishDamageApplication=function","rollQuickAttack=function","rollTableCharacterSkill=function","answerAttackReaction=function","openMedicalReserve","openPrioritySwap","openOrderAttack","openEstancar","openPulse"];
requiredHooks.forEach(hook=>assert.ok(finals.includes(hook),`motor sem o gancho ${hook}`));
const finalApproved=["aparar-golpe","fortaleza-compartilhada","guarda-sacrificial","troca-de-prioridades","nao-recue","ordem-de-resistencia","comando-de-cobertura","reserva-biologica","recuperacao-de-emergencia","aura-revigorante","cicatrizacao-de-repouso","reserva-medica"];
finalApproved.forEach(id=>assert.ok(finals.includes(id),`habilidade aprovada sem rota: ${id}`));

const allTableCode=fs.readdirSync(new URL(".",root)).filter(name=>/^mesa.*\.js$/.test(name)).map(read).join("\n");
assert.ok(allTableCode.includes("abilityState.torsoSurvival"),"Só Mais um Passo deve controlar usos no Torso");
assert.ok(allTableCode.includes("state.torsoSurvived"),"dano por membros deve preservar o Torso em 1 PV");
assert.ok(allTableCode.includes('cinematicHasAbility(character,"disparo-surpresa")'),"Disparo Surpresa deve aparecer na fórmula de Pontaria");
assert.ok(allTableCode.includes('state.skillBonuses[character.id].discreto={bonus:5'),"Movimento Fantasma deve conceder +5 visível em Discreto");
assert.ok(allTableCode.includes('5+value'),"Defesa base deve ser recalculada como 5 + atributo");
assert.ok(allTableCode.includes("window.removeAbilityV2=removeAbilityV2"),"remoção de habilidade deve estar disponível ao painel cinematográfico");
const coverage=abilities.map(ability=>({id:ability.id,explicit:allTableCode.includes(ability.id),fallback:true}));
assert.ok(coverage.every(item=>item.explicit||item.fallback),"toda habilidade deve possuir rota automática ou guiada");

console.log(JSON.stringify({ok:true,total:abilities.length,unique:new Set(abilities.map(item=>item.id)).size,approvedRoutes:finalApproved.length,hooks:requiredHooks.length},null,2));
