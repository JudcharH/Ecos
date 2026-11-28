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
        name:str(c.name)||"Personagem",title:str(c.title),photo:art(c.photo),level:Math.max(1,integer(c.level,100)),lifeMode:c.lifeMode==="body"?"body":"classic",
        heart:{current:integer(c.heart?.current),max:integer(c.heart?.max)},
        damageReduction:Object.fromEntries(["total","general","corporal","perfurante","sangue","morte","energia","conhecimento","medo"].filter(key=>c.damageReduction?.[key]!=null).map(key=>[key,integer(c.damageReduction[key])])),
        ecoV3:{powers:(Array.isArray(c.ecoV3?.powers)?c.ecoV3.powers:[]).slice(0,32).map(v=>({name:str(v?.name),description:str(v?.description,160),category:str(v?.category,30),element:str(v?.element,30)}))},
        attributes:Object.fromEntries(["corpo","foco","nexo","presteza","vig"].filter(key=>attributes[key]!=null).map(key=>[key,integer(attributes[key],100)])),
        defense:{total:integer(c.defense?.total??status.defense)},
        combatPressure:integer(c.combatPressure),
        status:Object.fromEntries(["pvAtual","pvMax","pmAtual","pmMax","paAtual","paMax","defense","rd","pvTemp"].map(key=>[key,integer(status[key])])),
        conditions:(Array.isArray(c.conditions)?c.conditions:[]).slice(0,40).map(v=>str(typeof v==="string"?v:v?.name||v?.id)).filter(Boolean),
        skills:skills.slice(0,50).map(v=>({name:str(v?.name||v?.id),training:str(v?.training||v?.treino,24),bonus:integer(v?.bonus,100),penalty:integer(v?.penalty??v?.penalidade,100)})),
        attacks:attacks.slice(0,30).map(v=>({
            name:str(v?.name),attack:str(v?.attack||v?.roll,100),damage:str(v?.damage||v?.dano,100),
            skill:str(v?.skill||v?.skillName,30),isHealing:v?.isHealing===true,extraPA:integer(v?.extraPA,5),
            ignoreRD:integer(v?.ignoreRD,100),targetPositions:Array.isArray(v?.targetPositions)?v.targetPositions.map(pos).filter(Boolean).slice(0,6):[]
        }))
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
function projectCombat(combat={}){
    const participants=list=>(Array.isArray(list)?list:[]).slice(0,24).filter(v=>["player","enemy"].includes(v?.type)).map(v=>{
        const id=str(v.type==="player"?v.characterId:v.enemyId||v.id);
        return {id,type:v.type,[v.type==="player"?"characterId":"enemyId"]:id,name:str(v.name),position:pos(v.position),rolled:v.rolled===true,result:v.rolled===true&&Number.isFinite(v.result)?v.result:null};
    }).filter(v=>v.id);
    const request=combat.initiativeRequest;
    const attack=combat.pendingAttack,receipt=combat.onlineDamage;
    return {
        onlineEncounterId:str(combat.onlineEncounterId),
        active:combat.active===true,round:integer(combat.round),currentTurnIndex:integer(combat.currentTurnIndex,23),
        waitingNextRound:combat.waitingNextRound===true,
        turnOrder:participants(combat.turnOrder),
        onlineAttack:attack?.onlineTarget&&attack.active?{
            id:str(attack.id),target:str(attack.targetCharacterId),name:str(attack.attackName),
            attacker:str(attack.attackerName),enemyId:str(attack.attackerEnemyId),total:integer(attack.attackResult)
        }:combat.onlineAttack||null,
        onlineDamage:receipt?{
            id:str(receipt.id),target:str(receipt.target),name:str(receipt.name),hit:receipt.hit===true,
            damage:integer(receipt.damage),blockBonus:integer(receipt.blockBonus),paCost:integer(receipt.paCost,6),acked:receipt.acked===true,
            outgoing:receipt.outgoing===true,landed:receipt.landed===true,
            attackTotal:integer(receipt.attackTotal),rolledDamage:integer(receipt.rolledDamage)
        }:null,
        initiativeRequest:request?.active&&request.id?{id:str(request.id),active:true,participants:participants(request.participants)}:null
    };
}
function turnKey(c){
    return c?.active&&!c.waitingNextRound&&c.onlineEncounterId?
        [c.onlineEncounterId,c.round,c.currentTurnIndex].join(":"):"";
}
function guestCommand(kind,value,keyOverride){
    if(!currentTableCampaign?.sharedGuest)return false;
    const s=scope,combat=currentTableCampaign.combat;
    if(!s||s.owner||s.auth.currentUser?.uid!==s.uid){
        status("Aguardando conexão com a mesa online.");
        return true;
    }
    const key=keyOverride||(kind==="initiative"?combat?.initiativeRequest?.id:turnKey(combat));
    if(!key)return true;
    const payload={kind,key,value:kind==="initiative"?Math.max(-500,Math.min(500,Math.trunc(Number(value)||0))):kind==="reaction"?integer(value,32):0};
    void s.api.setDoc(s.commandRef,payload).catch(error=>{status("Não foi possível enviar a ação ao mestre.");console.error(error?.code);});
    return true;
}
function applyCommand(s,uid,command){
    if(scope!==s||!s.owner||s.auth.currentUser?.uid!==s.uid||currentTableCampaign?.id!==s.localId)return false;
    refreshCurrentTableCampaign();
    const c=currentTableCampaign.combat,id="eco-player-"+uid;
    if(command.kind==="strike"){
        const key=turnKey(c),sheet=getSheet(id);
        const used=c.onlineStrikeLog?.key===key?c.onlineStrikeLog.nonces:[];
        if(!sheet||!key||key!==command.key||c.turnOrder?.[c.currentTurnIndex]?.characterId!==id||
            c.pendingAttack?.active||c.pendingEnemyAttack?.active||c.damageContext?.active||isWaiting(c)||used.includes(command.nonce)||used.length>=100||
            pendingAttackApplication||pendingDamageApplication||pendingBodyDamageApplication)return false;
        const target=(currentTableCampaign.enemies||[]).find(v=>String(v.enemyId||v.id)===command.target);
        const strike=prepareStrike(sheet,command.value,target);
        if(!strike||sheet.status.paAtual<1+strike.attack.extraPA)return false;
        c.onlineStrikeLog={key,nonces:[...used,command.nonce]};
        saveTableCampaign();
        launchStrike(id,sheet,target,strike,command.nonce,1+strike.attack.extraPA);
        return true;
    }
    if(command.kind==="ack"&&c?.onlineDamage?.id===command.key&&c.onlineDamage.target===id&&!c.onlineDamage.acked){
        const request=c.pendingAttack,counter=request?.id===command.key?request.onlineCounter:null;
        c.onlineDamage.acked=true;
        if(request?.id===command.key)delete request.onlineCounter;
        saveTableCampaign();
        if(counter){
            const sheet=getSheet(id),target=(currentTableCampaign.enemies||[]).find(v=>String(v.enemyId||v.id)===String(counter.enemyId));
            const strike=sheet&&sheet.status.pvAtual>0&&prepareStrike(sheet,counter.index,target);
            if(strike&&sheet.status.paAtual>=strike.attack.extraPA)launchStrike(id,sheet,target,strike,"counter-"+command.key,strike.attack.extraPA,true);
        }
        return true;
    }
    if(command.kind==="reaction"){
        const request=c?.pendingAttack,sheet=getSheet(id);
        if(!sheet||!request?.onlineTarget||!request.active||request.resolved||request.id!==command.key||request.targetCharacterId!==id)return false;
        const counterIndex=Number.isInteger(command.value)&&command.value>=3&&command.value<=32?command.value-3:null;
        const type=counterIndex!==null?"counter":["guard","block","dodge"][command.value];
        if(!type||(type!=="guard"&&sheet.status.paAtual<1))return false;
        if(counterIndex!==null){
            const target=(currentTableCampaign.enemies||[]).find(v=>String(v.enemyId||v.id)===String(request.attackerEnemyId));
            const strike=prepareStrike(sheet,counterIndex,target);
            if(!strike||sheet.status.paAtual<1+strike.attack.extraPA)return false;
            request.onlineCounter={index:counterIndex,enemyId:request.attackerEnemyId};
        }
        const defense=Math.max(0,sheet.defense.total-sheet.combatPressure);
        const finalDefense=defense+(type==="dodge"?Math.max(0,Number(rollDodgeReadiness(sheet)?.total)||0):0);
        const blockBonus=type==="block"?integer(sheet.attributes.vig):0,paCost=type==="guard"?0:1;
        Object.assign(request,{active:false,resolved:true,hit:Number(request.attackResult)>=finalDefense,
            reaction:{type,finalDefense,baseDefense:defense,reactionRD:blockBonus,blockBonus,paCost}});
        markAttackMessageAsApplied(request);
        if(request.hit)c.damageContext={active:true,consumed:false,attackRequestId:request.id,targetCharacterId:id,reaction:type};
        else c.onlineDamage={id:request.id,target:id,name:request.attackName,hit:false,damage:0,blockBonus,paCost,acked:false};
        saveTableCampaign();
        return true;
    }
    if(command.kind==="initiative"){
        const request=c?.initiativeRequest;
        const participant=request?.participants?.find(v=>v.type==="player"&&v.characterId===id);
        if(!request?.active||request.id!==command.key||!participant||participant.rolled||!Number.isInteger(command.value)||Math.abs(command.value)>500)return false;
        participant.rolled=true;participant.result=command.value;
        saveTableCampaign();
        finalizeInitiativeIfReady();
        return true;
    }
    if(command.kind==="pass"&&turnKey(c)&&turnKey(c)===command.key&&c.turnOrder?.[c.currentTurnIndex]?.characterId===id&&!c.pendingAttack?.active&&!c.pendingEnemyAttack?.active&&(!c.onlineDamage||c.onlineDamage.acked)){
        passCurrentCombatTurn();
        return true;
    }
    return false;
}
function safeDamageFormula(value){
    const formula=String(value||"").replace(/\s/g,"").toLowerCase();
    if(formula.length>100||!/^\d{1,3}(?:d\d{1,3})?(?:[+-]\d{1,3}(?:d\d{1,3})?)*$/.test(formula))return "";
    return [...formula.matchAll(/(\d+)d(\d+)/g)].every(([,dice,sides])=>Number(dice)<=30&&Number(sides)<=100&&Number(sides)>0)?formula:"";
}
function prepareStrike(sheet,index,target){
    const attack=sheet.attacks[index];
    if(!attack||attack.isHealing||!target||!pos(target.position)||Number(target.status?.pvAtual??target.pv??1)<=0||
        (attack.targetPositions.length&&!attack.targetPositions.includes(target.position)))return null;
    const formula=safeDamageFormula(resolveCharacterFormula(attack.damage,sheet));
    return formula?{attack,formula}:null;
}
function launchStrike(id,sheet,target,strike,nonce,cost,counter=false){
    const {attack,formula}=strike;
    const skill=sheet.skills.find(v=>normalizeEnemyAbilityId(v.name)===normalizeEnemyAbilityId(attack.skill));
    const ranged=normalizeEnemyAbilityId(attack.skill)==="pontaria";
    const roll=rollCharacterTrainedTest(/^(?:0|1d4|1d8|1d12)$/.test(skill?.training)?skill.training:"0",
        integer(sheet.attributes[ranged?"foco":"corpo"],100)+(skill?.bonus||0)-(skill?.penalty||0));
    if(!roll)return;
    const name=counter?"Contra-ataque • "+attack.name:attack.name;
    addRollChatMessage(`Ataque online • ${name} • ${sheet.name}`,roll.formula,roll.total,enemyRollDetail(roll),{rollKind:"attack",attackName:name,applied:false});
    pendingAttackApplication={messageId:currentTableCampaign.chatMessages?.at(-1)?.id,attackName:name,attackResult:roll.total,attackerCharacterId:id,attackerName:sheet.name,attackSkill:attack.skill,
        onlineStrike:{nonce,formula:roll.critical?addEnemyDamageDice(formula,2):formula,cost,ignoreRD:attack.ignoreRD}};
    resolveAttackAgainstEnemy(target);
}
function chooseStrike(index,kind){
    if(currentTableRole!=="player"||!currentTableCampaign?.sharedGuest)return false;
    const s=scope,c=currentTableCampaign.combat,character=currentTableCharacter;
    if(kind!=="attack"){status("Na mesa online, o dano é resolvido depois da reação.");return true;}
    const key=turnKey(c),attack=projectSheet(character||{}).attacks[index];
    if(!s||s.owner||s.auth.currentUser?.uid!==s.uid||!key||!canPassCurrentTurn()||!attack||attack.isHealing){
        status("Espere seu turno para atacar na mesa online.");return true;
    }
    const targets=(currentTableCampaign.enemies||[]).filter(v=>pos(v.position)&&(!attack.targetPositions.length||attack.targetPositions.includes(v.position)));
    openTablePanel("ATAQUE ONLINE",attack.name||"Ataque",targets.length?`<div class="table-panel-list">${targets.map((v,i)=>`<button type="button" class="table-panel-card" data-online-target="${i}">${escapeTableHTML(v.name)}</button>`).join("")}</div>`:"<p>Nenhuma ameaça está no alcance.</p>");
    document.querySelectorAll("[data-online-target]").forEach(button=>button.onclick=async()=>{
        if(button.disabled)return;
        document.querySelectorAll("[data-online-target]").forEach(item=>item.disabled=true);
        const target=targets[Number(button.dataset.onlineTarget)];
        try{
            await s.api.setDoc(s.sheetRef,{sheet:JSON.stringify(projectSheet(currentTableCharacter))});
            await s.api.setDoc(s.commandRef,{kind:"strike",key,value:index,target:String(target.enemyId||target.id),nonce:crypto.randomUUID()});
            closeCurrentPanel();
            status("Ataque enviado • aguardando resolução do mestre");
        }catch(error){status("Não foi possível enviar o ataque.");button.disabled=false;console.error(error?.code);}
    });
    return true;
}
function finishStrike(request){
    const strike=request.onlineStrike,c=currentTableCampaign.combat;
    if(!strike||c.onlineDamage?.id===strike.nonce)return;
    const receipt=c.onlineDamage={id:strike.nonce,target:request.attackerCharacterId,name:request.attackName,hit:false,damage:0,blockBonus:0,paCost:strike.cost,acked:false,outgoing:true,landed:request.hit===true,attackTotal:request.attackResult,rolledDamage:0};
    if(request.hit){
        const result=rollDiceExpression(strike.formula),enemy=(currentTableCampaign.enemies||[]).find(v=>String(v.enemyId||v.id)===String(request.targetEnemyId));
        if(result&&enemy){
            receipt.rolledDamage=result.total;
            saveTableCampaign();
            addRollChatMessage(`Dano online • ${request.attackName}`,strike.formula,result.total,enemyRollDetail(result),{rollKind:"damage",applied:false});
            pendingDamageApplication={messageId:currentTableCampaign.chatMessages?.at(-1)?.id,damage:result.total,attackName:request.attackName,attackerCharacterId:request.attackerCharacterId,ignoreRD:strike.ignoreRD};
            applyDamageToEnemy(enemy);
        }
    }
    saveTableCampaign();
}
let scope,timer,applying=false;
function targetModel(id){
    const sheet=getSheet(id);
    return sheet?{...sheet,id}:null;
}
function isWaiting(c){
    return Boolean(c?.onlineDamage&&!c.onlineDamage.acked);
}
function blocksMasterAdvance(c){
    return isWaiting(c)||Boolean(c?.pendingAttack?.onlineTarget&&(c.pendingAttack.active||c.damageContext?.active))||
        Boolean(c?.pendingEnemyAttack?.onlineStrike&&(c.pendingEnemyAttack.active||c.damageContext?.active));
}
function queueDamage(entry,data){
    const c=currentTableCampaign?.combat,request=c?.pendingAttack;
    if(!scope?.owner||!entry?.onlinePresence||!request?.onlineTarget||request.active||!request.hit||request.targetCharacterId!==entry.characterId||isWaiting(c)||c.damageContext?.consumed)return false;
    c.onlineDamage={id:request.id,target:entry.characterId,name:request.attackName,hit:true,damage:integer(data.damage),
        blockBonus:request.reaction?.blockBonus||0,paCost:request.reaction?.paCost||0,acked:false};
    if(c.damageContext){c.damageContext.consumed=true;c.damageContext.active=false;}
    return true;
}
function applyReceipt(character,receipt,rd){
    const seen=Array.isArray(character.ecoOnlineReceipts)?character.ecoOnlineReceipts:[];
    if(seen.includes(receipt.id))return false;
    const status=character.status;
    status.paAtual=Math.max(0,integer(status.paAtual)-receipt.paCost);
    const damage=Math.max(0,receipt.damage-rd-receipt.blockBonus);
    const absorbed=Math.min(Math.max(integer(status.pvTemp),integer(character.body?.temporaryPV)),damage);
    const remaining=damage-absorbed,before=integer(status.pvAtual);
    status.pvTemp=Math.max(0,Math.max(integer(status.pvTemp),integer(character.body?.temporaryPV))-absorbed);
    if(character.body)character.body.temporaryPV=status.pvTemp;
    let heartLoss=Math.max(0,remaining-before);
    if(character.lifeMode==="body"&&character.body&&before>0&&remaining>0){
        let unspent=remaining,vitalityLoss=0;
        for(const part of ["leftArm","rightArm","leftLeg","rightLeg","head","chest"]){
            const limb=character.bodyState?.[part];
            if(limb?.type==="missing")continue;
            const source=limb?.type==="prosthetic"?limb:character.body;
            const key=source===limb?"currentPV":part;
            const available=integer(source[key]),loss=Math.min(available,unspent);
            if(!loss)continue;
            source[key]=available-loss;
            unspent-=loss;
            vitalityLoss+=part.endsWith("Arm")||part.endsWith("Leg")?Math.ceil(loss*.75):loss;
            if(!unspent||part==="chest"&&source[key]===0)break;
        }
        status.pvAtual=Math.max(0,before-vitalityLoss);
        heartLoss=status.pvAtual===0?unspent:0;
    }else status.pvAtual=Math.max(0,before-remaining);
    if(character.heart)character.heart.current=Math.max(0,integer(character.heart.current)-heartLoss);
    if(receipt.hit)character.combatPressure=integer(character.combatPressure)+2;
    character.ecoOnlineReceipts=[...seen.slice(-39),receipt.id];
    return true;
}
async function receiveCombat(s){
    if(scope!==s||s.owner||s.auth.currentUser?.uid!==s.uid)return;
    const own="eco-player-"+s.uid,attack=s.combat?.onlineAttack,receipt=s.combat?.onlineDamage;
    if(s.combat?.active&&s.combat.onlineEncounterId&&s.combat.round>1&&s.combat.turnOrder.some(v=>v.characterId===own)){
        refreshCurrentTableCharacter();
        const character=currentTableCharacter,roundKey=s.combat.onlineEncounterId+":"+s.combat.round;
        if(character?.status&&character.ecoOnlineRound!==roundKey){
            character.ecoOnlineRound=roundKey;
            character.combatPressure=0;
            character.status.paAtual=integer(character.status.paMax);
            saveDamagedCharacter(character);
            document.dispatchEvent(new CustomEvent("eco:v3-render"));
        }
    }
    if(attack?.target===own&&s.shownAttack!==attack.id){
        s.shownAttack=attack.id;
        const buttons=[["Guardar",0],["Bloquear",1],["Esquivar",2]];
        const threat=(currentTableCampaign.enemies||[]).find(v=>String(v.enemyId||v.id)===attack.enemyId);
        const sheet=projectSheet(currentTableCharacter||{});
        if(threat)sheet.attacks.forEach((candidate,index)=>{
            if(!candidate.isHealing&&sheet.status.paAtual>=1+candidate.extraPA&&(!candidate.targetPositions.length||candidate.targetPositions.includes(threat.position))){
                buttons.push(["Contra-atacar • "+candidate.name,index+3]);
            }
        });
        openTablePanel("REAÇÃO ONLINE",attack.name||"Ataque",`<div class="table-panel-card"><strong>${escapeTableHTML(attack.attacker||"Ameaça")}</strong><p>Resultado do ataque: ${attack.total}</p></div><div class="attack-reaction-grid">${buttons.map(([label,index])=>`<button type="button" class="attack-reaction-button" data-eco-reaction="${index}" ${index&&integer(currentTableCharacter?.status?.paAtual)<1?"disabled":""}>${escapeTableHTML(label)}</button>`).join("")}</div>`);
        document.querySelectorAll("[data-eco-reaction]").forEach(button=>button.onclick=()=>{guestCommand("reaction",Number(button.dataset.ecoReaction),attack.id);closeCurrentPanel();});
    }
    if(receipt?.target!==own||receipt.acked||s.processing===receipt.id)return;
    s.processing=receipt.id;
    try{
        refreshCurrentTableCharacter();
        const character=currentTableCharacter;
        if(!character)return;
        ensureCharacterHeart(character);
        if(applyReceipt(character,receipt,characterDamageReductionFor(character,"impacto"))){
            if(character.heart.current<=0)markCharacterDead(character);
            if(!saveDamagedCharacter(character))throw new Error("Não foi possível salvar a ficha.");
            document.dispatchEvent(new CustomEvent("eco:v3-render"));
        }
        // Publish the updated resources before allowing the master to continue.
        await s.api.setDoc(s.sheetRef,{sheet:JSON.stringify(projectSheet(character))});
        await s.api.setDoc(s.commandRef,{kind:"ack",key:receipt.id,value:0});
        status(receipt.outgoing?(receipt.landed?`Seu ataque acertou (${receipt.attackTotal}) • dano rolado: ${receipt.rolledDamage}.`:`Seu ataque errou (${receipt.attackTotal}).`):receipt.hit?`Acertou • ${receipt.name||"Ataque"}`:"Ataque errou.");
    }catch(error){status("Não foi possível confirmar o resultado online.");console.error(error?.code||error?.message);}
    finally{s.processing=null;}
}
const sceneLimit=560000;
const sceneModes=["combat","dialogue","rest"];
const safeScene=value=>art(value)|| (typeof value==="string"&&value.length<=sceneLimit&&/^data:image\/(?:webp|jpeg|png);base64,[a-z0-9+/=]+$/i.test(value)?value:"");
async function encodeScene(ref){
    const safe=safeScene(ref);
    if(safe||!String(ref).startsWith("eco-scene:"))return safe;
    const blob=await readTableSceneBlob(ref.slice(10));
    if(!blob)throw new Error("Cenário local não encontrado.");
    const source=URL.createObjectURL(blob);
    try{
        const image=new Image();image.src=source;await image.decode();
        const canvas=document.createElement("canvas"),context=canvas.getContext("2d");
        for(const width of [1440,1024,720,480]){
            const scale=Math.min(1,width/Math.max(image.naturalWidth,image.naturalHeight));
            canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
            context.drawImage(image,0,0,canvas.width,canvas.height);
            const data=safeScene(canvas.toDataURL("image/webp",.75));
            if(data)return data;
        }
        throw new Error("Não foi possível compactar o cenário.");
    }finally{URL.revokeObjectURL(source);}
}
function syncScene(s){
    const mode=activeTableSceneMode(),ref=tableSceneForMode(mode);
    const key=mode+":"+ref;
    if(key===s.sceneKey)return;
    s.sceneKey=key;
    void encodeScene(ref).then(async image=>{
        if(scope!==s||s.sceneKey!==key||s.auth.currentUser?.uid!==s.uid)return;
        await s.api.setDoc(s.sceneRef,{mode,image});
    }).catch(error=>{
        if(scope===s&&s.sceneKey===key){s.sceneKey=null;status("Não foi possível compartilhar o cenário.");}
        console.error(error?.code||error?.message);
    });
}
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
    if(s.owner){next={board:JSON.stringify(project(c))};syncScene(s);}
    else{
        const entry=(c.players||[]).find(p=>String(p.characterId)===String(character.id));
        next={name:str(character.name)||"Personagem",position:pos(entry?.position),photo:art(character.photo||entry?.photo)};
        sheet={sheet:JSON.stringify(projectSheet(character))};
    }
    clearTimeout(timer);
    timer=setTimeout(async ()=>{
        if(scope!==s||s.auth.currentUser?.uid!==s.uid)return;
        await send(s,s.write,next,"sent");
        if(s.owner&&scope===s&&s.auth.currentUser?.uid===s.uid&&currentTableCampaign?.id===s.localId){
            await send(s,s.combatRef,{view:JSON.stringify(projectCombat(currentTableCampaign.combat))},"combatSent");
        }
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
        if(!s.owner&&s.scene)currentTableCampaign.sceneMode=s.scene.mode;
        if(!s.owner&&s.combat){
            const own="eco-player-"+s.uid,localId=currentTableCharacter?.id;
            const map=v=>v.type==="player"&&v.characterId===own&&localId?{...v,id:localId,characterId:localId}:v;
            const {turnOrder,initiativeRequest}=s.combat;
            currentTableCampaign.combat={...s.combat,turnOrder:turnOrder.map(map),initiativeRequest:initiativeRequest?{...initiativeRequest,participants:initiativeRequest.participants.map(map)}:null};
        }
        currentTableCampaign.players=[...local,...joined];
        saveTableCampaign();
        renderCombatPositions();
        document.dispatchEvent(new CustomEvent("eco:campaign-render"));
        if(!s.owner&&s.combat)checkInitiativeRequest();
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
        const s=scope={auth,api,uid,owner,localId:campaign.id,roster:[],board:null,sheets:new Map(),sceneRef:api.doc(db,"ecoCampaigns",id,"session","scene"),sheetRef:api.doc(db,"ecoCampaigns",id,"sheets",uid),write:owner?board:api.doc(db,"ecoCampaigns",id,"presence",uid)};
        s.combatRef=api.doc(db,"ecoCampaigns",id,"session","combatView");
        s.commandRef=api.doc(db,"ecoCampaigns",id,"combatInputs",uid);
        if(owner)api.onSnapshot(api.collection(db,"ecoCampaigns",id,"combatInputs"),snap=>{
            for(const change of snap.docChanges()){
                if(change.type==="removed")continue;
                const command=change.doc.data(),uid=change.doc.id;
                if(command.kind==="ack"){
                    void api.getDocFromServer(api.doc(db,"ecoCampaigns",id,"sheets",uid)).then(updated=>{
                        if(updated.exists())s.sheets.set("eco-player-"+uid,projectSheet(JSON.parse(updated.data().sheet)));
                        applyCommand(s,uid,command);
                    }).catch(failed);
                }else applyCommand(s,uid,command);
            }
        },failed);
        else api.onSnapshot(s.combatRef,snap=>{
            if(scope!==s||!snap.exists())return;
            try{s.combat=projectCombat(JSON.parse(snap.data().view));apply(s);void receiveCombat(s);}
            catch(error){failed(error);}
        },failed);
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
            document.dispatchEvent(new Event("eco:sheet"));
        },failed);
        if(!owner)api.onSnapshot(s.sceneRef,snap=>{
            if(scope!==s||s.auth.currentUser?.uid!==s.uid)return;
            const value=snap.data();
            if(!value||!sceneModes.includes(value.mode))return;
            s.scene={mode:value.mode,image:safeScene(value.image)};
            apply(s);
            loadScene();
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
function getScene(mode){
    const s=scope;
    return s&&!s.owner&&s.auth.currentUser?.uid===s.uid&&s.localId===currentTableCampaign?.id&&s.scene?.mode===mode?s.scene.image:undefined;
}
window.ECO_ONLINE_TABLE={start,sync,project,projectSheet,getSheet,getScene,projectCombat,turnKey,guestCommand,targetModel,queueDamage,isWaiting,blocksMasterAdvance,applyReceipt,chooseStrike,finishStrike,safeDamageFormula};
})();
