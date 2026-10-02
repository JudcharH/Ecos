const settings=window.ECO_SETTINGS,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const I18N={"pt-BR":{back:"← Voltar",settings:"CONFIGURAÇÕES",settings_intro:"Conta, aparência, áudio e preferências do ECO.",account:"Conta",appearance:"Aparência",audio:"Áudio",language:"Idioma",about:"Sobre",account_intro:"Entre para sincronizar fichas, campanhas e preferências.",cloud_pending:"Nuvem ainda não conectada",cloud_pending_text:"Adicione a configuração pública do Firebase para ativar contas e sincronização.",offline_profile:"Perfil local",not_connected:"Nenhuma conta conectada",local_only:"Dados somente neste dispositivo",name:"Nome",password:"Senha",sign_in:"Entrar",create_account:"Criar conta",google_sign_in:"Continuar com Google",sign_out:"Sair",auto_sync:"Sincronização automática",auto_sync_text:"Envia alterações e restaura dados ao entrar em outro dispositivo.",sync_now:"Sincronizar agora",appearance_intro:"Escolha a identidade elemental do site.",reduce_motion:"Reduzir movimentos",reduce_motion_text:"Desativa partículas e animações da interface.",audio_intro:"Controle a música da mesa e os efeitos do sistema.",master_volume:"Volume geral",music_volume:"Música da mesa",effect_volume:"Efeitos",mute_all:"Silenciar tudo",mute_all_text:"Mantém os níveis salvos para quando o som for reativado.",language_intro:"Escolha o idioma da interface.",interface_language:"Idioma da interface",translation_note:"A área de configurações já é bilíngue. As regras serão traduzidas gradualmente sem alterar nomes oficiais.",about_intro:"Informações do projeto e desta versão.",about_description:"Sistema de RPG alterado para fichas, campanhas, mesas, ameaças e regras paranormais.",version:"Versão:",storage:"Armazenamento:",content:"Conteúdo atual:",final_notes:"Informações finais",final_notes_text:"Créditos, licença, atualizações e informações adicionais serão organizados aqui conforme o sistema for concluído."},en:{back:"← Back",settings:"SETTINGS",settings_intro:"Account, appearance, audio and ECO preferences.",account:"Account",appearance:"Appearance",audio:"Audio",language:"Language",about:"About",account_intro:"Sign in to sync characters, campaigns and preferences.",cloud_pending:"Cloud not connected yet",cloud_pending_text:"Add the public Firebase configuration to enable accounts and synchronization.",offline_profile:"Local profile",not_connected:"No account connected",local_only:"Data only on this device",name:"Name",password:"Password",sign_in:"Sign in",create_account:"Create account",google_sign_in:"Continue with Google",sign_out:"Sign out",auto_sync:"Automatic sync",auto_sync_text:"Uploads changes and restores data when signing in on another device.",sync_now:"Sync now",appearance_intro:"Choose the site's elemental identity.",reduce_motion:"Reduce motion",reduce_motion_text:"Disables particles and interface animations.",audio_intro:"Control table music and system effects.",master_volume:"Master volume",music_volume:"Table music",effect_volume:"Effects",mute_all:"Mute all",mute_all_text:"Keeps saved levels for when audio is enabled again.",language_intro:"Choose the interface language.",interface_language:"Interface language",translation_note:"Settings are bilingual. Rules will be translated gradually without changing official names.",about_intro:"Project and version information.",about_description:"Modified RPG system for characters, campaigns, tables, threats and paranormal rules.",version:"Version:",storage:"Storage:",content:"Current content:",final_notes:"Final information",final_notes_text:"Credits, license, updates and additional information will be organized here as the system is completed."}};
function toast(text){const el=$("#settingsToast");el.textContent=text;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),3200)}function translate(lang){const d=I18N[lang]||I18N["pt-BR"];$$("[data-i18n]").forEach(el=>{if(d[el.dataset.i18n])el.textContent=d[el.dataset.i18n]})}function render(){const s=settings.load();translate(s.language);$$(".theme-choice").forEach(b=>b.classList.toggle("active",b.dataset.theme===s.theme));for(const id of ["masterVolume","musicVolume","effectVolume"]){const v=Math.round(Number(s[id])*100);$("#"+id).value=v;$("#"+id+"Value").textContent=v+"%"}$("#muted").checked=!!s.muted;$("#reduceMotion").checked=!!s.reduceMotion;$("#autoSync").checked=s.autoSync!==false;$("#languageSelect").value=s.language}
$$(".settings-tab").forEach(b=>b.onclick=()=>{$$(".settings-tab").forEach(x=>x.classList.toggle("active",x===b));$$(".settings-section").forEach(x=>x.classList.toggle("active",x.dataset.section===b.dataset.tab))});$$(".theme-choice").forEach(b=>b.onclick=()=>{settings.save({theme:b.dataset.theme});render()});for(const id of ["masterVolume","musicVolume","effectVolume"])$("#"+id).oninput=e=>{settings.save({[id]:Number(e.target.value)/100});render()};$("#muted").onchange=e=>settings.save({muted:e.target.checked});$("#reduceMotion").onchange=e=>settings.save({reduceMotion:e.target.checked});$("#autoSync").onchange=e=>settings.save({autoSync:e.target.checked});$("#languageSelect").onchange=e=>{settings.save({language:e.target.value});render()};
let auth=null,db=null,currentUser=null,syncInFlight=null,lastAutoUser="";
const SYNC_META_KEY="eco_cloud_sync_v1";
const config=window.ECO_FIREBASE_CONFIG;
const configured=!!(config?.apiKey&&config?.projectId&&config?.authDomain);
$("#firebaseWarning").classList.toggle("hidden",configured);

function friendlyError(error){
 const code=String(error?.code||"");
 if(code.includes("permission-denied"))return"O Firestore bloqueou a sincronização. Publique as regras de acesso do usuário.";
 if(code.includes("resource-exhausted")||code.includes("invalid-argument"))return"Os dados ficaram grandes demais para um único backup. Remova imagens muito pesadas e tente novamente.";
 if(code.includes("unavailable")||code.includes("network-request-failed"))return"Não foi possível acessar a nuvem agora. Confira a conexão e tente novamente.";
 if(code.includes("popup-closed-by-user"))return"O login com Google foi cancelado.";
 if(code.includes("unauthorized-domain"))return"Este endereço ainda não está autorizado no Firebase.";
 return error?.message||"Ocorreu um erro inesperado.";
}

if(!configured){
 $$("#emailAuthForm button,#syncNow").forEach(b=>b.disabled=true);
}else{
 const [{initializeApp},{getAuth,GoogleAuthProvider,signInWithPopup,createUserWithEmailAndPassword,signInWithEmailAndPassword,updateProfile,onAuthStateChanged,signOut},{getFirestore,doc,setDoc,getDoc,serverTimestamp}]=await Promise.all([
  import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"),
  import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"),
  import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js")
 ]);
 const app=initializeApp(config);auth=getAuth(app);db=getFirestore(app);

 function localData(){
  const data={};
  [...Array(localStorage.length).keys()].map(i=>localStorage.key(i)).filter(Boolean).sort().forEach(key=>{
   if(/^(ordem_|eco_)/.test(key)&&key!==settings.key&&key!==SYNC_META_KEY)data[key]=localStorage.getItem(key);
  });
  return data;
 }
 function hasGameData(data){return Object.entries(data).some(([,value])=>value&&value!=="[]"&&value!=="{}");}
 const stableHash=window.ECO_SYNC_CORE.hash;
 function getMeta(){try{return JSON.parse(localStorage.getItem(SYNC_META_KEY)||"null")}catch{return null}}
 function setMeta(value){localStorage.setItem(SYNC_META_KEY,JSON.stringify(value))}
 function applyCloud(cloud){
  if(cloud.settings)settings.save(cloud.settings);
  const data=cloud.localData||{};
  Object.keys(localData()).forEach(key=>localStorage.removeItem(key));
  Object.entries(data).forEach(([key,value])=>{if(typeof value==="string")localStorage.setItem(key,value)});
  const hash=cloud.contentHash||stableHash({settings:cloud.settings||settings.load(),localData:data});
  setMeta({uid:currentUser.uid,hash,syncedAt:Number(cloud.clientUpdatedAt)||Date.now()});
  render();return hash;
 }
 async function performSync(manual=false){
  if(!currentUser){if(manual)toast("Entre em uma conta primeiro.");return}
  $("#syncState").textContent="Firebase • sincronizando…";
  try{
   const ref=doc(db,"users",currentUser.uid),remote=await getDoc(ref),data=localData(),localSettings=settings.load();
   const localHash=stableHash({settings:localSettings,localData:data}),meta=getMeta();
   if(remote.exists()){
    const cloud=remote.data(),cloudHash=cloud.contentHash||stableHash({settings:cloud.settings||{},localData:cloud.localData||{}});
    const cloudTime=Number(cloud.clientUpdatedAt)||0,sameDevice=meta?.uid===currentUser.uid;
    const decision=window.ECO_SYNC_CORE.decide({remoteExists:true,sameDevice,hasLocalData:hasGameData(data),localHash,metaHash:meta?.hash,cloudHash,cloudTime,metaTime:Number(meta?.syncedAt||0)});
    if(decision==="download"){
     applyCloud(cloud);
     $("#syncState").textContent="Firebase • dados restaurados";
     if(manual)toast("Dados restaurados da nuvem.");
     return;
    }
    if(decision==="noop"){
     $("#syncState").textContent="Firebase • sincronizado";
     if(manual)toast("Os dados já estão sincronizados.");
     return;
    }
   }
   const now=Date.now();
   await setDoc(ref,{displayName:currentUser.displayName||$("#authName").value||"Jogador",email:currentUser.email,settings:localSettings,localData:data,contentHash:localHash,clientUpdatedAt:now,updatedAt:serverTimestamp()});
   setMeta({uid:currentUser.uid,hash:localHash,syncedAt:now});
   $("#syncState").textContent="Firebase • sincronizado";
   if(manual)toast("Dados sincronizados.");
  }catch(error){
   console.error("ECO sync",error);$("#syncState").textContent="Firebase • erro de sincronização";toast(friendlyError(error));
  }
 }
 function sync(manual=false){if(syncInFlight)return syncInFlight;syncInFlight=performSync(manual).finally(()=>syncInFlight=null);return syncInFlight}

 $("#emailAuthForm").onsubmit=async e=>{e.preventDefault();try{const email=$("#authEmail").value,password=$("#authPassword").value;if(e.submitter?.value==="signup"){const result=await createUserWithEmailAndPassword(auth,email,password);if($("#authName").value)await updateProfile(result.user,{displayName:$("#authName").value})}else await signInWithEmailAndPassword(auth,email,password)}catch(error){toast(friendlyError(error))}};
 $("#googleSignIn").onclick=()=>signInWithPopup(auth,new GoogleAuthProvider()).catch(error=>toast(friendlyError(error)));
 $("#signOut").onclick=async()=>{await signOut(auth);toast("Conta desconectada.")};
 $("#syncNow").onclick=()=>sync(true);
 onAuthStateChanged(auth,async user=>{
  currentUser=user;$("#signOut").classList.toggle("hidden",!user);
  $("#accountName").textContent=user?.displayName||user?.email||I18N[settings.load().language].offline_profile;
  $("#accountEmail").textContent=user?.email||I18N[settings.load().language].not_connected;
  $("#accountAvatar").textContent=(user?.displayName||user?.email||"E")[0].toUpperCase();
  $("#syncState").textContent=user?"Firebase • conectado":I18N[settings.load().language].local_only;
  $("#storageMode").textContent=user?"Firebase + local":"local";
  if(user&&settings.load().autoSync!==false&&lastAutoUser!==user.uid){lastAutoUser=user.uid;await sync(false)}
  if(!user)lastAutoUser="";
 });
}
render();
