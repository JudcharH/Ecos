import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const source=fs.readFileSync(new URL("./eco-online-table.js",import.meta.url),"utf8");
const box={window:{}};
vm.runInNewContext(source,box);
const campaign={
 masterPassword:"secret",chatMessages:[{text:"private"}],combat:{round:8},
 players:[{characterId:"hero",name:"Sentinela",position:2,photo:"data:image/png;base64,private",journal:"private"},{characterId:"cached",onlinePresence:true}],
 enemies:[{id:"wolf",name:"Lobisomem",position:1,size:2,photo:"assets/wolf.webp",description:"secret",status:{pvAtual:32}},{id:"hidden",name:"Oculto"}]
};
const result=JSON.parse(JSON.stringify(box.window.ECO_ONLINE_TABLE.project(campaign)));
assert.deepEqual(result.players,[{characterId:"hero",name:"Sentinela",position:2,photo:""}]);
assert.deepEqual(result.enemies,[{enemyId:"wolf",name:"Lobisomem",position:1,size:2,photo:"assets/wolf.webp",type:""}]);
const select=box.window.ECO_ONLINE_TABLE.projectSheet;
const sheet=select({name:"Sentinela",level:4,status:{pvAtual:16,pvMax:20},attributes:{corpo:2},notes:"privado",photo:"data:image/png;base64,privado",attacks:[{name:"Teste",roll:"1d12",damage:"1d6",image:"dados privados"}]});
assert.equal(sheet.status.pvAtual,16);
assert.equal(sheet.attributes.corpo,2);
assert.equal(sheet.attacks[0].attack,"1d12");
assert.deepEqual(JSON.parse(JSON.stringify(select(sheet))),JSON.parse(JSON.stringify(sheet)));
assert.doesNotMatch(JSON.stringify(sheet),/privado/);
const api=box.window.ECO_ONLINE_TABLE;
const combat=api.projectCombat({
    round:2,active:true,onlineEncounterId:"fight",currentTurnIndex:1,
    turnOrder:[{type:"enemy",enemyId:"wolf"},{type:"player",characterId:"eco-player-guest",name:"Sentinela",rolled:true,result:15}],
    pendingAttack:{id:"private"},initiativeRequest:null
});
assert.equal(combat.turnOrder[1].characterId,"eco-player-guest");
assert.equal(combat.turnOrder[1].result,15);
assert.equal(api.turnKey(combat),"fight:2:1");
assert.equal(api.turnKey({...combat,waitingNextRound:true}),"");
assert.doesNotMatch(JSON.stringify(combat),/private|pendingAttack/);
const victim={status:{paAtual:3,pvAtual:9,pvTemp:2},heart:{current:4},body:{temporaryPV:2}};
const receipt={id:"atk-1",hit:true,damage:15,blockBonus:1,paCost:1};
assert.equal(api.applyReceipt(victim,receipt,1),true);
assert.equal(victim.status.paAtual,2);
assert.equal(victim.status.pvTemp,0);
assert.equal(victim.status.pvAtual,0);
assert.equal(victim.heart.current,2);
assert.equal(api.safeDamageFormula(" 2d8 + 3 "),"2d8+3");
assert.equal(api.safeDamageFormula("100d999"),"");
const body={lifeMode:"body",status:{pvAtual:12,paAtual:2},heart:{current:4},body:{leftArm:2,rightArm:2,chest:12}};
assert.equal(api.applyReceipt(body,{...receipt,id:"atk-body",damage:3,blockBonus:0},0),true);
assert.equal(body.body.leftArm,0);
assert.equal(body.body.rightArm,1);
assert.equal(body.status.pvAtual,9);
assert.equal(api.applyReceipt(victim,receipt,1),false);
assert.equal(victim.heart.current,2);
console.log("Presença: somente nomes, posições e ameaças visíveis entram no quadro.");
