(function(){
"use strict";
const version="10.14.1";
const sdk=name=>import("https://www.gstatic.com/firebasejs/"+version+"/firebase-"+name+".js");
const normalize=code=>String(code||"").trim().toUpperCase();
const validCode=code=>/^[0-9A-F]{24}$/.test(code);
const newCode=()=>Array.from(crypto.getRandomValues(new Uint8Array(12)),b=>b.toString(16).padStart(2,"0")).join("").toUpperCase();
const text=(value,max)=>String(value??"").slice(0,max);
const preview=campaign=>({
    name:text(campaign.name,120)||"Campanha",
    description:text(campaign.description,800),
    systemId:text(campaign.systemId,80),
    maxPlayers:Math.max(1,Math.min(12,Math.trunc(Number(campaign.maxPlayers)||4)))
});
let connection;
async function connect(){
    connection||=Promise.all([sdk("app"),sdk("auth"),sdk("firestore")]).then(async ([appSdk,authSdk,dbSdk])=>{
        const app=appSdk.getApps()[0]||appSdk.initializeApp(window.ECO_FIREBASE_CONFIG);
        const auth=authSdk.getAuth(app);
        await auth.authStateReady();
        return {auth,db:dbSdk.getFirestore(app),api:dbSdk};
    }).catch(error=>{connection=null;throw error});
    const result=await connection;
    if(!result.auth.currentUser)throw Object.assign(new Error("Entre na sua conta do ECO em Configurações e tente novamente."),{code:"eco/sign-in"});
    return {...result,uid:result.auth.currentUser.uid};
}
async function publish(campaign){
    if(campaign.sharedGuest)throw new Error("Só o dono pode compartilhar esta campanha.");
    const {db,api,uid}=await connect();
    if(!/^[a-zA-Z0-9_-]{1,80}$/.test(String(campaign.id)))throw new Error("Identificador de campanha inválido.");
    const sharedId=uid+"_"+campaign.id;
    const ref=api.doc(db,"ecoCampaigns",sharedId);
    const code=await api.runTransaction(db,async tx=>{
        const snap=await tx.get(ref),existing=snap.exists()?snap.data():null;
        if(existing&&existing.ownerUid!==uid)throw new Error("Esta conta não é dona da campanha compartilhada.");
        const code=existing?.inviteCode||newCode();
        tx.set(ref,{...preview(campaign),ownerUid:uid,inviteCode:code});
        tx.set(api.doc(db,"ecoInvites",code),{campaignId:sharedId,ownerUid:uid});
        return code;
    });
    const url=new URL("campanhas.html",location.href);
    url.searchParams.set("convite",code);
    return {code,url:url.href,sharedId};
}
async function accept(input){
    const code=normalize(input);
    if(!validCode(code))throw new Error("Este código não é um convite online. Peça ao mestre um novo convite pelo botão Convidar.");
    const {db,api,uid}=await connect();
    const invite=await api.getDoc(api.doc(db,"ecoInvites",code));
    if(!invite.exists())throw new Error("Convite não encontrado ou revogado.");
    const {campaignId,ownerUid}=invite.data(),ref=api.doc(db,"ecoCampaigns",campaignId);
    if(uid!==ownerUid){
        const member=api.doc(db,"ecoCampaigns",campaignId,"members",uid);
        const existing=await api.getDoc(member);
        if(!existing.exists())await api.setDoc(member,{inviteCode:code});
    }
    const snap=await api.getDoc(ref);
    if(!snap.exists())throw new Error("A campanha não está mais disponível.");
    return {id:"online_"+campaignId,...preview(snap.data()),inviteCode:code,sharedGuest:true,sharedCampaignId:campaignId,players:[]};
}
function errorText(error){
    if(error?.code==="permission-denied")return "O Firestore ainda não autorizou este convite. Confira se as regras de compartilhamento do ECO foram publicadas.";
    if(error?.code==="unavailable")return "Não consegui conectar ao Firestore. Tente novamente.";
    return error?.message||"Não foi possível acessar o convite.";
}
window.ECO_CAMPAIGN_INVITES={connect,publish,accept,errorText,normalize,validCode,preview};
})();
