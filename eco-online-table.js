(function(){
"use strict";
const str=(v,n=100)=>typeof v==="string"?v.slice(0,n):"";
const pos=v=>Number.isInteger(v)&&v>=1&&v<=6?v:0;
const art=v=>typeof v==="string"&&/^\/?assets\/[a-z0-9_./-]+$/i.test(v)?v.slice(0,240):"";
const player=(v,id)=>({characterId:id,name:str(v.name)||"Personagem",position:pos(v.position),photo:art(v.photo)});
const integer=(v,max=100000)=>Math.min(max,Math.max(0,Math.trunc(Number(v)||0)));
function projectSheet(c){
    const status=c.status||{},attributes=c.attributes||{};
    const skills=Array.isArray(c.skills)?c.skills:[];
    const attacks=[c.attacks,c.quickAttacks,c.ataquesRapidos].find(Array.isArray)||[];
    return {
        name:str(c.name)||"Personagem",level:integer(c.level,100),
        attributes:Object.fromEntries(["corpo","foco","nexo","presteza"].filter(key=>attributes[key]!=null).map(key=>[key,integer(attributes[key],100)])),
        status:Object.fromEntries(["pvAtual","pvMax","pmAtual","pmMax","paAtual","paMax","defense","rd","pvTemp"].map(key=>[key,integer(status[key])])),
        conditions:(Array.isArray(c.conditions)?c.conditions:[]).slice(0,40).map(v=>str(typeof v==="string"?v:v?.name||v?.id)).filter(Boolean),
        skills:skills.slice(0,50).map(v=>({name:str(v?.name||v?.id),training:str(v?.training||v?.treino,24)})),
        attacks:attacks.slice(0,30).map(v=>({name:str(v?.name),attack:str(v?.attack||v?.roll,100),damage:str(v?.damage||v?.dano,100)}))
    };
}
function project(c){
    return {
        players:(c.players||[]).filter(v=>!v.onlinePresence&&v.characterId).slice(0,12).map(v=>player(v,str(v.characterId))),
        enemies:(c.enemies||[]).filter(v=>pos(v.position)&&(v.enemyId||v.id)).slice(0,12).map(v=>({
            enemyId:str(v.enemyId||v.id),name:str(v.name)||"Ameaça",position:pos(v.position),
            size:Math.max(1,Math.min(6,Math.trunc(Number(v.size)||1))),photo:art(v.photo),type:str(v.type,20)
        }))
    };
}
let scope,timer,applying=false;
async function send(s,ref,payload,key){
    const signature=JSON.stringify(payload);
    if(signature===s[key])return;
    s[key]=signature;
    try{await s.api.setDoc(ref,payload);}
    catch(error){
        if(s[key]===signature)s[key]=null;
        status("Mesa online: não foi possível enviar a atualização.");
        console.error(error?.code);
    }
}
function status(message){
    let label=document.getElementById("ecoOnlineStatus");
    if(!label)return;
    label.hidden=false;
    label.textContent=message;
}
function sync(){
    const s=scope,c=currentTableCampaign;
    if(!s||applying||c?.id!==s.localId||s.auth.currentUser?.uid!==s.uid)return;
    const character=currentTableCharacter;
    if(!s.owner&&!character)return;
    let next,sheet;
    if(s.owner)next={board:JSON.stringify(project(c))};
    else{
        const entry=(c.players||[]).find(p=>String(p.characterId)===String(character.id));
        next={name:str(character.name)||"Personagem",position:pos(entry?.position),photo:art(character.photo||entry?.photo)};
        sheet={sheet:JSON.stringify(projectSheet(character))};
    }
    clearTimeout(timer);
    timer=setTimeout(async ()=>{
        if(scope!==s||s.auth.currentUser?.uid!==s.uid)return;
        await send(s,s.write,next,"sent");
        if(sheet&&scope===s&&s.auth.currentUser?.uid===s.uid)await send(s,s.sheetRef,sheet,"sheetSent");
    },180);
}
function apply(s){
    if(scope!==s||s.auth.currentUser?.uid!==s.uid||currentTableCampaign?.id!==s.localId)return;
    applying=true;
    try{
        refreshCurrentTableCampaign();
        const local=(currentTableCampaign.players||[]).filter(v=>!v.onlinePresence);
        const joined=s.roster.filter(v=>s.owner||v.uid!==s.uid).map(v=>({...player(v,"eco-player-"+v.uid),onlinePresence:true}));
        if(!s.owner&&s.board){
            currentTableCampaign.enemies=s.board.enemies||[];
            joined.push(...(s.board.players||[]).map(v=>({...v,onlinePresence:true})));
        }
        currentTableCampaign.players=[...local,...joined];
        saveTableCampaign();
        renderCombatPositions();
        document.dispatchEvent(new CustomEvent("eco:campaign-render"));
    }finally{applying=false;}
}
async function start(){
    const campaign=currentTableCampaign,id=campaign?.sharedCampaignId;
    if(!id||(!campaign.sharedGuest&&currentTableRole!=="master"))return;
    status("Mesa online: conectando…");
    const failed=error=>{status("Mesa online indisponível. Confira as regras de sincronização.");console.error(error?.code);};
    try{
        const {auth,db,api,uid}=await window.ECO_CAMPAIGN_INVITES.connect();
        const access=await api.getDoc(api.doc(db,"ecoCampaigns",id));
        if(!access.exists())throw new Error("Campanha indisponível.");
        const owner=currentTableRole==="master"&&!campaign.sharedGuest&&access.data().ownerUid===uid;
        if(currentTableRole==="master"&&!owner)throw new Error("Conta sem acesso online de mestre.");
        const board=api.doc(db,"ecoCampaigns",id,"session","board");
        const s=scope={auth,api,uid,owner,localId:campaign.id,roster:[],board:null,sheets:new Map(),sheetRef:api.doc(db,"ecoCampaigns",id,"sheets",uid),write:owner?board:api.doc(db,"ecoCampaigns",id,"presence",uid)};
        api.onSnapshot(api.collection(db,"ecoCampaigns",id,"presence"),snap=>{
            s.roster=snap.docs.map(doc=>({...doc.data(),uid:doc.id}));
            apply(s);
            status("Mesa online • presença e ameaças");
        },failed);
        if(owner)api.onSnapshot(api.collection(db,"ecoCampaigns",id,"sheets"),snap=>{
            const sheets=new Map();
            for(const doc of snap.docs){
                try{
                    const payload=JSON.parse(doc.data().sheet);
                    if(payload&&typeof payload==="object")sheets.set("eco-player-"+doc.id,projectSheet(payload));
                }catch(error){console.warn("Ficha de mesa inválida",error?.name);}
            }
            s.sheets=sheets;
            document.getElementById("ecoRemoteSheetView")?.dispatchEvent(new Event("eco:sheet"));
        },failed);
        if(!owner)api.onSnapshot(board,snap=>{
            try{s.board=snap.exists()?JSON.parse(snap.data().board):{players:[],enemies:[]};apply(s);}
            catch(error){failed(error);}
        },failed);
        sync();
    }catch(error){status("Mesa online: "+window.ECO_CAMPAIGN_INVITES.errorText(error));}
}
function getSheet(id){
    const s=scope;
    return s?.owner&&s.auth.currentUser?.uid===s.uid&&s.localId===currentTableCampaign?.id?s.sheets.get(id):undefined;
}
window.ECO_ONLINE_TABLE={start,sync,project,projectSheet,getSheet};
})();
