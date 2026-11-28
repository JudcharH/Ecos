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
console.log("Presença: somente nomes, posições e ameaças visíveis entram no quadro.");
