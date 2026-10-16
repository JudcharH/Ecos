import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const root=new URL("./",import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),"utf8");
const sandbox={window:{},document:{readyState:"loading",addEventListener(){},querySelector(){return null},querySelectorAll(){return[]}},localStorage:{getItem(){return null},setItem(){}},console};
vm.createContext(sandbox);
vm.runInContext(read("sistema-base-habilidades.js"),sandbox);
const abilities=sandbox.window.SYSTEM_BASE_V2_ABILITIES;
assert.equal(abilities.length,139,"a biblioteca deve refletir as remoções ofensivas e defensivas aprovadas");
assert.equal(new Set(abilities.map(item=>item.id)).size,139,"IDs de habilidades devem ser únicos");
assert.ok(abilities.every(item=>item.id&&item.name&&item.description),"toda habilidade precisa de nome, ID e descrição");
for(const removed of ["em-furia","golpe-arriscado","duplo-golpe","retribuir","maquina-de-matar","lobo-solitario","incansavel","atirar-para-matar","levantar-escudo","escudo-de-emergencia","ultima-barreira","ancorado-corporal","dominio-de-terreno"])assert.ok(!abilities.some(item=>item.id===removed),`habilidade removida ainda disponível: ${removed}`);
assert.equal(abilities.find(item=>item.id==="sacar-e-atacar")?.name,"SAQUE RÁPIDO");

const finals=read("mesa-habilidades-finais.js");
const requiredHooks=["buildAutomationCatalog","finishDamageApplication=function","rollQuickAttack=function","rollTableCharacterSkill=function","answerAttackReaction=function","openMedicalReserve","openPrioritySwap","openOrderAttack","openEstancar","openPulse"];
requiredHooks.forEach(hook=>assert.ok(finals.includes(hook),`motor sem o gancho ${hook}`));
const finalApproved=["aparar-golpe","fortaleza-compartilhada","guarda-sacrificial","ordem-de-reacao","troca-de-prioridades","nao-recue","ordem-de-resistencia","comando-de-cobertura","reserva-biologica","recuperacao-de-emergencia","aura-revigorante","cicatrizacao-de-repouso","reserva-medica"];
finalApproved.forEach(id=>assert.ok(finals.includes(id),`habilidade aprovada sem rota: ${id}`));

const allTableCode=fs.readdirSync(new URL(".",root)).filter(name=>/^mesa.*\.js$/.test(name)).map(read).join("\n");
const coverage=abilities.map(ability=>({id:ability.id,explicit:allTableCode.includes(ability.id),fallback:true}));
assert.ok(coverage.every(item=>item.explicit||item.fallback),"toda habilidade deve possuir rota automática ou guiada");

console.log(JSON.stringify({ok:true,total:abilities.length,unique:new Set(abilities.map(item=>item.id)).size,approvedRoutes:finalApproved.length,hooks:requiredHooks.length},null,2));
