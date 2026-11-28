(function(){
"use strict";
const str=(v,n=100)=>typeof v==="string"?v.slice(0,n):"";
const pos=v=>Number.isInteger(v)&&v>=1&&v<=6?v:0;
const art=v=>typeof v==="string"&&/^\/?assets\/[a-z0-9_./-]+$/i.test(v)?v.slice(0,240):"";
const player=(v,id)=>({characterId:id,name:str(v.name)||"Personagem",position:pos(v.position),photo:art(v.photo)});
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
    let next;
    if(s.owner)next={board:JSON.stringify(project(c))};
    else{
        const entry=(c.players||[]).find(p=>String(p.characterId)===String(character.id));
        next={name:str(character.name)||"Personagem",position:pos(entry?.position),photo:art(character.photo||entry?.photo)};
    }
    clearTimeout(timer);
    timer=setTimeout(async ()=>{
        if(scope!==s||s.auth.currentUser?.uid!==s.uid)return;
        const signature=JSON.stringify(next);
        if(signature===s.sent)return;
        s.sent=signature;
        try{await s.api.setDoc(s.write,next);}
        catch(error){if(s.sent===signature)s.sent=null;status("Mesa online: não foi possível enviar a atualização.");console.error(error?.code);}
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
        const s=scope={auth,api,uid,owner,localId:campaign.id,roster:[],board:null,write:owner?board:api.doc(db,"ecoCampaigns",id,"presence",uid)};
        api.onSnapshot(api.collection(db,"ecoCampaigns",id,"presence"),snap=>{
            s.roster=snap.docs.map(doc=>({...doc.data(),uid:doc.id}));
            apply(s);
            status("Mesa online • presença e ameaças");
        },failed);
        if(!owner)api.onSnapshot(board,snap=>{
            try{s.board=snap.exists()?JSON.parse(snap.data().board):{players:[],enemies:[]};apply(s);}
            catch(error){failed(error);}
        },failed);
        sync();
    }catch(error){status("Mesa online: "+window.ECO_CAMPAIGN_INVITES.errorText(error));}
}
window.ECO_ONLINE_TABLE={start,sync,project};
})();
