import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {webcrypto} from "node:crypto";
const rows=new Map();
const auth={currentUser:{uid:"master"},authStateReady:async()=>{}};
const snapshot=key=>({exists:()=>rows.has(key),data:()=>rows.get(key)});
const db={
 doc:(_db,...path)=>path.join("/"),getFirestore:()=>({}),
 getDoc:async ref=>snapshot(ref),setDoc:async (ref,value)=>rows.set(ref,value),
 runTransaction:async (_db,f)=>f({get:async key=>snapshot(key),set:(key,v)=>rows.set(key,v)})
};
const modules={app:{getApps:()=>[{}]},auth:{getAuth:()=>auth},firestore:db};
const context={window:{},crypto:webcrypto,URL,location:{href:"https://example.test/campanhas.html"},mockSdk:async name=>modules[name]};
const source=fs.readFileSync(new URL("./eco-campaign-invites.js",import.meta.url),"utf8");
vm.runInNewContext(source.replace(/^const sdk=.*;$/m,"const sdk=mockSdk;"),context);
const api=context.window.ECO_CAMPAIGN_INVITES;
const input={id:"aaa",name:"Teste",systemId:"paranormal",maxPlayers:4,masterPassword:"privada",players:[{name:"privado"}],combat:{round:8}};
const {code,url}=await api.publish(input);
assert.match(code,/^[A-F0-9]{24}$/);
assert.equal(new URL(url).searchParams.get("convite"),code);
assert.equal((await api.publish(input)).code,code);
assert.deepEqual(Object.keys(rows.get("ecoCampaigns/master_aaa")).sort(),["description","inviteCode","maxPlayers","name","ownerUid","systemId"]);
auth.currentUser={uid:"player"};
const guest=await api.accept(code.toLowerCase());
assert.equal(guest.sharedGuest,true);
assert.equal(guest.name,"Teste");
assert.equal(guest.players.length,0);
assert.equal(rows.get("ecoCampaigns/master_aaa/members/player").inviteCode,code);
await assert.rejects(api.publish(guest),/Só o dono/);
await assert.rejects(api.accept("3GM7U8W7"),/não é um convite online/);
auth.currentUser=null;
await assert.rejects(api.accept(code),/Entre na sua conta/);
console.log("Convite: link, código, autenticação e dados compartilhados verificados com SDK simulado.");
