import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const root=new URL("./",import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),"utf8");
const html=read("configuracoes.html");
const pages=fs.readdirSync(new URL(".",root)).filter(name=>name.endsWith(".html"));

assert.equal((html.match(/class="settings-tab/g)||[]).length,5,"configurações deve possuir cinco seções");
assert.equal((html.match(/class="theme-choice/g)||[]).length,5,"deve haver cinco temas");
assert.ok(html.includes('id="googleSignIn"'),"login do Google ausente");
assert.ok(html.includes('id="languageSelect"'),"seletor de idioma ausente");
for(const page of pages)assert.ok(read(page).includes("eco-settings.js"),`${page} não carrega as preferências globais`);

const storage=new Map();
const documentElement={dataset:{},classList:{toggle(name,value){this[name]=value}}};
const sandbox={
  localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},
  document:{documentElement},
  CustomEvent:class{constructor(name,options){this.type=name;this.detail=options.detail}},
  window:{dispatchEvent(){}},
};
vm.createContext(sandbox);
vm.runInContext(read("eco-settings.js"),sandbox);
const settings=sandbox.window.ECO_SETTINGS;
settings.save({theme:"sangue",language:"en",masterVolume:.5,musicVolume:.4});
assert.equal(documentElement.dataset.theme,"sangue");
assert.equal(documentElement.lang,"en");
assert.equal(settings.effectiveMusicVolume(.5),.1,"volume deve combinar mesa, geral e música");
settings.save({muted:true});
assert.equal(settings.effectiveMusicVolume(1),0,"silenciar deve zerar a música");
assert.ok(read("mesa.js").includes("effectiveMusicVolume"),"mesa não aplica o volume global");
assert.ok(read("configuracoes.js").includes("GoogleAuthProvider"),"Firebase Google não preparado");
assert.ok(read("configuracoes.js").includes("createUserWithEmailAndPassword"),"criação de conta não preparada");

console.log(JSON.stringify({ok:true,sections:5,themes:5,pages:pages.length,audio:true,firebasePrepared:true},null,2));
