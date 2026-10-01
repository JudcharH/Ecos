import fs from "node:fs";import vm from "node:vm";import assert from "node:assert/strict";
const root=new URL("./",import.meta.url),read=n=>fs.readFileSync(new URL(n,root),"utf8"),sandbox={window:{}};vm.createContext(sandbox);vm.runInContext(read("assimilacoes-morte.js"),sandbox);
const list=sandbox.window.ECO_DEATH_ASSIMILATIONS;assert.equal(list.length,40);assert.equal(new Set(list.map(x=>x.id)).size,40);assert.ok(list.every(x=>x.element==="morte"&&x.permanentCost?.type==="pv"&&x.name&&x.description&&x.activationType));
const engine=read("mesa-assimilacoes-morte.js");for(const hook of ["passTableRound=function","applyPendingDamageToTarget=function","rollTableCharacterSkill=function","Destino Compartilhado","Negar Fim","Dano Tardio","Vórtice Vivo","Lodo Sepulcral"])assert.ok(engine.includes(hook),`gancho ausente: ${hook}`);
assert.ok(read("editor-ficha.html").includes("assimilacoes-morte.js"));assert.ok(read("mesa.html").includes("mesa-assimilacoes-morte.js"));
console.log(JSON.stringify({ok:true,total:40,unique:40,hooks:8},null,2));
