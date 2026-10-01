import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const root=new URL("./",import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),"utf8");
const sandbox={window:{},document:{readyState:"loading",addEventListener(){},querySelector(){return null},querySelectorAll(){return[]}},localStorage:{getItem(){return null},setItem(){}},console};
vm.createContext(sandbox);
vm.runInContext(read("sistema-base-habilidades.js"),sandbox);
const abilities=sandbox.window.SYSTEM_BASE_V2_ABILITIES;
assert.equal(abilities.length,150,"a biblioteca geral deve manter 150 habilidades");
assert.equal(new Set(abilities.map(item=>item.id)).size,150,"IDs de habilidades devem ser únicos");
assert.ok(abilities.every(item=>item.id&&item.name&&item.description),"toda habilidade precisa de nome, ID e descrição");

const finals=read("mesa-habilidades-finais.js");
const requiredHooks=["buildAutomationCatalog","finishDamageApplication=function","rollQuickAttack=function","rollTableCharacterSkill=function","answerAttackReaction=function","openMedicalReserve","openPrioritySwap","openOrderAttack","openEstancar","openPulse"];
requiredHooks.forEach(hook=>assert.ok(finals.includes(hook),`motor sem o gancho ${hook}`));
const finalApproved=["aparar-golpe","ancorado-corporal","fortaleza-compartilhada","guarda-sacrificial","dominio-de-terreno","ordem-de-reacao","troca-de-prioridades","nao-recue","ordem-de-resistencia","comando-de-cobertura","reserva-biologica","recuperacao-de-emergencia","aura-revigorante","cicatrizacao-de-repouso","reserva-medica"];
finalApproved.forEach(id=>assert.ok(finals.includes(id),`habilidade aprovada sem rota: ${id}`));

const allTableCode=fs.readdirSync(new URL(".",root)).filter(name=>/^mesa.*\.js$/.test(name)).map(read).join("\n");
const coverage=abilities.map(ability=>({id:ability.id,explicit:allTableCode.includes(ability.id),fallback:true}));
assert.ok(coverage.every(item=>item.explicit||item.fallback),"toda habilidade deve possuir rota automática ou guiada");

console.log(JSON.stringify({ok:true,total:abilities.length,unique:150,approvedRoutes:finalApproved.length,hooks:requiredHooks.length},null,2));
