(function(){
"use strict";
const id=enemy=>String(enemy?.enemyId??enemy?.id??"");
const tier=nex=>Number(nex)>=7?"strategist":Number(nex)>=4?"medium":"low";
const labels={low:"Baixa",medium:"Média",strategist:"Estrategista"};
const intelligence=enemy=>tier(enemy?.nexo??enemy?.attributes?.nexo??enemy?.nex??0);
const enabled=enemy=>enemy?.ecoIntelligence===true;
const conditions=entity=>(entity?.conditions||[]).map(item=>normalizeEnemyAbilityId(typeof item==="string"?item:item.id||item.name));
const cannotAct=entity=>conditions(entity).some(item=>["paralisia","paralisia-total","morrendo","morto","inconsciente","controlado"].includes(item));
const waiting=request=>request?.active===true&&request.resolved!==true;
const reserveFor=enemy=>intelligence(enemy)==="strategist"?2:1;
const hasReady=(enemy,ability)=>enemyHasAbility(enemy,ability)&&enemyAbilityAvailability(enemy,ability).enabled;

function targetPositions(enemy,kind){
    const positions=(enemy?.attackProfiles?.[kind]?.targetPositions??enemy?.[kind+"AttackPositions"]);
    if(!Array.isArray(positions)||positions.length===0)return [1,2,3,4,5,6];
    return positions.map(Number).filter(position=>Number.isInteger(position)&&position>=1&&position<=6);
}

function selectAction(enemy,players,combat,messages,reserve=0){
    const level=intelligence(enemy),pa=enemyCurrentActionPoints(enemy)-reserve;
    const lock=combat.abilityState?.caiDentro?.[id(enemy)];
    const lastHit=combat.pendingEnemyAttack;
    const options=[];
    for(const player of players){
        const position=Number(player.position),character=getLiveCharacter(player.characterId)||(player.onlinePresence?window.ECO_ONLINE_TABLE?.targetModel(player.characterId):null);
        if(!character||!Number.isInteger(position)||position<1||position>6||isDeadAbilityTarget(character))continue;
        if(lock?.active&&Number(lock.round)===Number(combat.round)&&String(lock.characterId)!==String(player.characterId))continue;
        const status=conditions(character);
        if(pa<(status.includes("protegido")?2:1))continue;
        let score=7-position;
        if(lastHit?.hit&&String(lastHit.targetEnemyId)===id(enemy)&&String(lastHit.attackerCharacterId)===String(player.characterId))score+=3;
        if(level!=="low"&&status.includes("caido"))score+=8;
        if(level!=="low"&&status.includes("vulneravel"))score+=5;
        if(level==="strategist"&&messages.slice(-30).some(message=>message.type==="roll"&&["heal","healing"].includes(message.rollKind)&&message.applied&&String(message.characterId)===String(player.characterId)))score+=10;
        for(const kind of ["basic","strong"]){
            if(kind==="strong"&&enemy.strongAttackLimit==="1/rodada"&&enemy.ecoStrongRound===combat.round)continue;
            const origins=enemy.attackProfiles?.[kind]?.sourcePositions;
            if(Array.isArray(origins)&&origins.length&&!origins.map(Number).includes(Number(enemy.position)))continue;
            if(!String(enemy[kind+"Attack"]||"").trim()||!targetPositions(enemy,kind).includes(position))continue;
            options.push({kind,player,score:score+(kind==="strong"&&(level!=="low"||enemyHasAbility(enemy,"mordida-feroz"))?1:0)});
        }
    }
    return options.sort((a,b)=>b.score-a.score)[0]||null;
}

function reposition(enemy,enemies,players,combat,messages,reserve){
    if(intelligence(enemy)==="low"||conditions(enemy).includes("imobilizado")||enemyCurrentActionPoints(enemy)<reserve+2)return false;
    const anchor=Number(enemy.position),size=Math.max(1,Number(enemy.size)||1);
    if(!Number.isInteger(anchor)||anchor<1||anchor>6)return false;
    for(const position of [anchor-1,anchor+1]){
        if(position-size+1<1||position>6)continue;
        if(enemies.some(other=>id(other)!==id(enemy)&&position-size+1<=Number(other.position)&&position>=Number(other.position)-Math.max(1,Number(other.size)||1)+1))continue;
        const projected={...enemy,position,status:{...enemy.status,paAtual:enemyCurrentActionPoints(enemy)-1}};
        if(!selectAction(projected,players,combat,messages,reserve)||!spendEnemyActionPoints(enemy,1))continue;
        const live=(currentTableCampaign.enemies||[]).find(item=>id(item)===id(enemy));
        if(!live)return false;
        placeEntityAtPosition("enemy",live,position);
        return true;
    }
    return false;
}

function reaction(enemy,request){
    if(request.desprevenido)return "surprised";
    if(cannotAct(enemy)||conditions(enemy).includes("desprevenido")||enemyCurrentActionPoints(enemy)<1)return "guard";
    const defense=Math.max(0,(Number(enemy.defense)||0)-(Number(enemy.combatPressure)||0));
    if(Number(request.attackResult)<defense){
        const position=Number((currentTableCampaign?.players||[]).find(player=>String(player.characterId)===String(request.attackerCharacterId))?.position);
        return intelligence(enemy)==="strategist"&&Boolean(enemy.basicAttack)&&targetPositions(enemy,"basic").includes(position)?"counter":"guard";
    }
    if(hasReady(enemy,"esquiva-maior")||enemyAbilityState(enemy).esquivaMaiorArmed)return "dodge";
    if(intelligence(enemy)==="low")return request.noBlock?"dodge":"block";
    const gap=Number(request.attackResult)-defense;
    return request.noBlock||gap<=(intelligence(enemy)==="strategist"?9:5)?"dodge":"block";
}

function useTacticalAbility(enemy,choice,combat){
    const liveTarget=getLiveCharacter(choice.player.characterId);
    const status=conditions(liveTarget);
    const candidates=[
        ["investida",true],
        ["travar",intelligence(enemy)!=="low"&&!status.includes("paralisia")],
        ["atrair",intelligence(enemy)==="strategist"&&Number(choice.player.position)>2],
        ["ilusorio",intelligence(enemy)!=="low"&&!combat.illusoryPenalties?.[choice.player.characterId]],
        ["agarrao-necrotico",!status.includes("paralisia")]
    ];
    for(const [ability,use] of candidates){
        if(!use||!hasReady(enemy,ability))continue;
        if(ability==="investida")useEnemyAbility(enemy,ability,enemy.position);
        else{
            pendingEnemyAbilityTarget={enemyId:id(enemy),id:ability,position:enemy.position};
            try{resolveEnemyAbilityTargetRouter("player",choice.player);}
            finally{if(pendingEnemyAbilityTarget)cancelEnemyAbilityTargetSelection();}
        }
        return true;
    }
    return false;
}

function queueCounter(enemy){
    refreshCurrentTableCampaign();
    const combat=currentTableCampaign.combat,request=combat.pendingEnemyAttack;
    if(!request?.resolved||request.hit||request.reaction?.type!=="counter")return;
    combat.ecoCounter={enemyId:id(enemy),targetId:String(request.attackerCharacterId),requestId:request.id};
    saveTableCampaign();
}

function queueDamage(enemy,player,kind,previousRequestId,counter=false){
    const combat=currentTableCampaign.combat,updated=combat?.pendingAttack;
    if(!updated?.id||updated.id===previousRequestId||String(updated.attackerEnemyId)!==id(enemy))return false;
    updated.ecoAction={enemyId:id(enemy),targetId:String(player.characterId),requestId:updated.id,kind,counter};
    combat.ecoPendingAction=updated.ecoAction;
    saveTableCampaign();
    return true;
}

function mount(root,enemy,render){
    for(const anchor of root.querySelectorAll('.master-next-round, .master-scene-dock [data-pass-turn]')){
        const button=document.createElement("button");
        button.type="button";
        button.className="eco-intelligence-button";
        button.textContent="Eco "+(enabled(enemy)?"ligado":"desligado");
        button.title=enemy?"Inteligência: "+labels[intelligence(enemy)]:"Selecione uma ameaça";
        button.setAttribute("aria-label",button.textContent+(enemy?" • "+enemy.name+" • "+labels[intelligence(enemy)]:""));
        button.setAttribute("aria-pressed",String(enabled(enemy)));
        button.disabled=!enemy;
        button.onclick=()=>{
            if(currentTableRole!=="master")return;
            refreshCurrentTableCampaign();
            const live=(currentTableCampaign?.enemies||[]).find(item=>id(item)===id(enemy));
            if(!live)return;
            live.ecoIntelligence=!enabled(live);
            saveTableCampaign();
            if(!enabled(live))checkPendingEnemyAttackReaction();
            render();
        };
        anchor.before(button);
    }
}

function tick(roll){
    if(currentTableRole!=="master"||!currentTableCampaign)return;
    refreshCurrentTableCampaign();
    const combat=currentTableCampaign.combat;
    if(!combat?.active||(currentTableCampaign.sceneMode||"combat")!=="combat")return;
    if(pendingAttackApplication||pendingDamageApplication||pendingBodyDamageApplication||pendingEnemyAbilityTarget)return;
    const enemies=currentTableCampaign.enemies||[];
    const enemyRequest=combat.pendingEnemyAttack;
    if(waiting(enemyRequest)){
        const target=enemies.find(item=>id(item)===String(enemyRequest.targetEnemyId));
        if(enabled(target)){
            const type=reaction(target,enemyRequest);
            if(type==="dodge"&&hasReady(target,"esquiva-maior"))useEnemyAbility(target,"esquiva-maior",target.position);
            answerEnemyAttackReaction(type);
        }
        return;
    }
    const request=combat.pendingAttack;
    if(window.ECO_ONLINE_TABLE?.isWaiting(combat))return;
    if(waiting(request)||combat.counterAttackOpportunity?.active&&combat.counterAttackOpportunity.originalAttackId===request?.id&&combat.ecoPendingAction?.requestId===request?.id)return;
    const action=request?.ecoAction||combat.ecoPendingAction;
    if(action){
        const enemy=enemies.find(item=>id(item)===action.enemyId);
        const player=(currentTableCampaign.players||[]).find(item=>String(item.characterId)===action.targetId);
        const context=combat.damageContext;
        const requestId=action.requestId||request?.id;
        if(enemy&&player&&request?.id===requestId&&request.resolved&&request.hit&&!(context?.attackRequestId===requestId&&context.consumed)){
            if(context?.attackRequestId!==requestId||!context.active){
                combat.damageContext={active:true,consumed:false,attackRequestId:requestId,targetCharacterId:request.targetCharacterId,reaction:request.reaction?.type,damageReduction:request.reaction?.reactionRD??0};
            }
            saveTableCampaign();
            roll(enemy,action.kind,"damage",player,action.counter===true);
            const live=(currentTableCampaign.enemies||[]).find(item=>id(item)===action.enemyId);
            if(!player.onlinePresence&&enabled(live)&&action.kind==="strong"&&hasReady(live,"mordida-feroz"))useEnemyAbility(live,"mordida-feroz",live.position);
        }else if(enemy&&request?.id===requestId&&request.resolved&&!request.hit){
            const state=enemyAbilityState(enemy);
            state.criticalDamageDice=0;
            state.criticalAttackVariant=null;
            saveTableCampaign();
        }
        if(currentTableCampaign.combat.pendingAttack?.id===requestId)delete currentTableCampaign.combat.pendingAttack.ecoAction;
        delete currentTableCampaign.combat.ecoPendingAction;
        saveTableCampaign();
        return;
    }
    const counter=combat.ecoCounter;
    if(counter){
        delete combat.ecoCounter;
        saveTableCampaign();
        const enemy=(currentTableCampaign.enemies||[]).find(item=>id(item)===counter.enemyId);
        const player=(currentTableCampaign.players||[]).find(item=>String(item.characterId)===counter.targetId);
        const model=player&&(getLiveCharacter(player.characterId)||(player.onlinePresence?window.ECO_ONLINE_TABLE?.targetModel(player.characterId):null));
        if(enabled(enemy)&&player&&model&&targetPositions(enemy,"basic").includes(Number(player.position))&&!isDeadAbilityTarget(model)){
            const protectedTarget=conditions(model).includes("protegido");
            if(!protectedTarget||enemyCurrentActionPoints(enemy)>0){
                roll(enemy,"basic","attack",player,true);
                queueDamage(enemy,player,"basic",request?.id,true);
            }
        }
        return;
    }
    if(combat.waitingNextRound)return;
    const participant=getCurrentTurnParticipant();
    if(participant?.type!=="enemy")return;
    const enemy=enemies.find(item=>id(item)===String(participant.enemyId??participant.id));
    if(!enabled(enemy))return;
    const reserve=reserveFor(enemy);
    const canAct=!cannotAct(enemy)&&!isDeadAbilityTarget(enemy);
    if(canAct&&hasReady(enemy,"cronos")&&enemyCurrentActionPoints(enemy)<=reserve+1){useEnemyAbility(enemy,"cronos",enemy.position);return;}
    const choice=canAct&&selectAction(enemy,currentTableCampaign.players||[],combat,currentTableCampaign.chatMessages||[],reserve);
    if(!choice){
        if(canAct&&reposition(enemy,enemies,currentTableCampaign.players||[],combat,currentTableCampaign.chatMessages||[],reserve))return;
        passCurrentCombatTurn();return;
    }
    const abilityTurn=combat.round+":"+combat.currentTurnIndex;
    if(enemy.ecoAbilityTurn!==abilityTurn){
        enemy.ecoAbilityTurn=abilityTurn;
        saveTableCampaign();
        if(!choice.player.onlinePresence&&useTacticalAbility(enemy,choice,combat))return;
    }
    const before=request?.id;
    roll(enemy,choice.kind,"attack",choice.player);
    if(queueDamage(enemy,choice.player,choice.kind,before)){
        const live=(currentTableCampaign.enemies||[]).find(item=>id(item)===id(enemy));
        if(live&&choice.kind==="strong")live.ecoStrongRound=combat.round;
        saveTableCampaign();
    }else passCurrentCombatTurn();
}

function allocateBodyDamage(){
    while(pendingBodyDamageApplication?.type==="player"){
        const state=pendingBodyDamageApplication,target=getPendingBodyDamageTarget();
        if(!target)return;
        const order=["leftArm","rightArm","leftLeg","rightLeg","head","chest"];
        const available=bodyDamageParts(target,"player");
        const part=order.find(key=>available.some(item=>item.id===key&&item.current>(state.allocations[key]||0)));
        if(!part){finishBodyDamageDistribution();return;}
        const before=state.remaining;
        allocatePendingBodyDamage(part);
        if(pendingBodyDamageApplication===state&&state.remaining>=before)return;
    }
}

function install(roll){
    const run=()=>{
        if(currentTableRole!=="master"||!currentTableCampaign?.combat?.active)return;
        const locks=navigator.locks;
        if(locks)locks.request("eco-threat-turn:"+currentTableCampaign.id,{ifAvailable:true},lock=>{if(lock)tick(roll)}).catch(console.error);
        else tick(roll);
    };
    window.setInterval(run,500);
    window.addEventListener("storage",event=>{if(event.key===TABLE_CAMPAIGN_STORAGE)run();});
}

window.ECO_THREAT_AI={tier,intelligence,enabled,targetPositions,selectAction,reaction,mount,install,tick,queueCounter,reserveFor,allocateBodyDamage};
})();
