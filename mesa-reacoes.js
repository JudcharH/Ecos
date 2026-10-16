/*==========================================================
= MESA - REAÇÕES, HABILIDADES E AVISOS DE AÇÃO
==========================================================*/
(function(){
    "use strict";

    const REACTION_IDS = [
        "desvio-absoluto",
        "pele-dura",
        "revidar",
        "devolver-ataque"
    ];

    const KNOWN_PASSIVES = new Set([
        "sempre-alerta",
        "corrida-imparavel",
        "sacar-e-atacar"
    ]);

    const DEFAULT_COSTS = {
        "desvio-absoluto": { resource:"pa", amount:2 },
        "pele-dura": { resource:"pa", amount:1 },
        "revidar": { resource:"pa", amount:1 },
        "devolver-ataque": { resource:"pa", amount:1 },
        "postura-defensiva": { resource:"pa", amount:1 },
        "em-furia": { resource:"pa", amount:1 },
        "ataque-especial": { resource:"pd", amount:2 },
        "golpe-arriscado": { resource:"pd", amount:2 }
    };

    let lastNoticeId = null;
    let noticeTimer = null;
    let unreactableTargetSelection = null;

    function slug(value){
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g,"")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g,"-")
            .replace(/^-+|-+$/g,"");
    }

    function abilitiesOf(character){
        if(!character) return [];

        const lists = [
            character.abilities,
            character.acquiredAbilities,
            character.systemData?.abilities,
            character.skills?.abilities
        ];

        const list = lists.find(Array.isArray) || [];

        return list.map(ability => {
            if(typeof normalizeCharacterAbility === "function"){
                return normalizeCharacterAbility(ability);
            }

            if(typeof ability === "string"){
                return {
                    id:slug(ability),
                    name:ability,
                    description:""
                };
            }

            return ability || null;
        }).filter(Boolean);
    }

    function abilityId(ability){
        return slug(
            ability?.id ||
            ability?.abilityId ||
            ability?.name ||
            ability?.title
        );
    }

    function abilityName(ability){
        return String(
            ability?.name ||
            ability?.title ||
            "Habilidade"
        );
    }

    function abilityText(ability){
        return [
            ability?.description,
            ability?.effect,
            ability?.usage,
            ability?.use,
            ability?.type,
            ability?.activationType,
            ability?.category,
            ability?.kind,
            ability?.cost
        ]
            .filter(value => typeof value === "string")
            .join(" ");
    }

    function abilityById(character,id){
        const wanted = slug(id);

        return abilitiesOf(character)
            .find(ability => abilityId(ability) === wanted) || null;
    }

    function hasAbility(character,id){
        return Boolean(
            abilityById(character,id)
        );
    }

    function isPassive(ability){
        const id = abilityId(ability);
        const type = slug(
            ability?.type ||
            ability?.activationType ||
            ability?.category ||
            ability?.kind
        );
        const text = abilityText(ability).toLowerCase();

        return (
            ability?.passive === true ||
            type === "passivo" ||
            type === "passive" ||
            KNOWN_PASSIVES.has(id) ||
            /\bpassiv[ao]\b/i.test(text) ||
            /\buso\s*livre\b/i.test(text)
        );
    }

    function parseAbilityCost(ability){
        const id = abilityId(ability);

        for(const cost of [
            ability?.useCost,
            ability?.activationCost,
            ability?.cost
        ]){
            if(cost && typeof cost === "object"){
                const resource = slug(cost.type);
                if(resource === "pa" || resource === "pd"){
                    return {
                        resource,
                        amount:Math.max(0,Number(cost.value) || 0),
                        variable:Boolean(cost.variable)
                    };
                }
            }
        }

        const numericSources = [
            ["pa",ability?.paCost],
            ["pa",ability?.costPA],
            ["pa",ability?.actionPointCost],
            ["pd",ability?.pdCost],
            ["pd",ability?.costPD]
        ];

        for(const [resource,value] of numericSources){
            if(value !== null && value !== undefined && Number.isFinite(Number(value))){
                return {
                    resource,
                    amount:Math.max(0,Number(value) || 0),
                    variable:false
                };
            }
        }

        const text = abilityText(ability);
        const range = text.match(/(\d+)\s*(?:ou|a|\+)\s*(\d+)?\s*PD\b/i);
        if(range){
            return {
                resource:"pd",
                amount:Math.max(0,Number(range[1]) || 0),
                variable:true
            };
        }

        const pdMatch = text.match(/(?:uso|custo)?\s*(\d+)\s*PD\b/i);
        if(pdMatch){
            return {
                resource:"pd",
                amount:Math.max(0,Number(pdMatch[1]) || 0),
                variable:/\+|adicional|cada\s+\+?2\s*PD/i.test(text)
            };
        }

        const paMatch = text.match(/(?:uso|custo)?\s*(\d+)\s*PA\b/i);
        if(paMatch){
            return {
                resource:"pa",
                amount:Math.max(0,Number(paMatch[1]) || 0),
                variable:false
            };
        }

        return DEFAULT_COSTS[id] || {
            resource:"pa",
            amount:0,
            variable:false
        };
    }

    function getResourceCurrent(character,resource){
        const field = resource === "pd"
            ? "pdAtual"
            : "paAtual";

        return Math.max(
            0,
            Number(character?.status?.[field]) || 0
        );
    }

    function spendResource(character,resource,amount){
        const normalizedResource = resource === "pd" ? "pd" : "pa";
        const field = normalizedResource === "pd"
            ? "pdAtual"
            : "paAtual";
        const label = normalizedResource.toUpperCase();
        const cost = Math.max(0,Number(amount) || 0);

        character.status = character.status || {};

        const current = Math.max(
            0,
            Number(character.status[field]) || 0
        );

        if(current < cost){
            addSystemChatMessage(
                `${character.name || "O personagem"} não possui ${label} suficiente.`
            );
            return false;
        }

        character.status[field] = current - cost;

        const saved = saveDamagedCharacter(character);

        if(saved){
            refreshCurrentTableCharacter();
            refreshOpenCharacterPanel();
        }

        return saved;
    }

    function aggressorOf(request){
        if(!request?.attackerCharacterId) return null;
        return getLiveCharacter(request.attackerCharacterId);
    }

    function defenseOf(character){
        return Math.max(
            0,
            Number(character?.defense?.total) || 0
        );
    }

    function rdOf(character){
        return Math.max(
            0,
            Number(character?.damageReduction?.total) || 0
        );
    }

    function attackFormula(attack){
        return (
            attack?.attack ||
            attack?.roll ||
            attack?.test ||
            attack?.formula ||
            "1d20"
        );
    }

    function ensureNoticeStyle(){
        if(document.getElementById("tableActionNoticeStyle")) return;

        const style = document.createElement("style");
        style.id = "tableActionNoticeStyle";
        style.textContent = `
            .table-action-layer{
                position:fixed;inset:0;z-index:5000;display:flex;
                align-items:center;justify-content:center;padding:20px;
                background:rgba(3,3,8,.08);cursor:pointer
            }
            .table-action-card{
                width:min(410px,calc(100vw - 40px));min-height:210px;
                display:flex;flex-direction:column;align-items:center;
                justify-content:center;gap:8px;padding:26px 30px;
                border-radius:22px;
                background:radial-gradient(circle at 50% 0%,rgba(130,70,230,.20),transparent 55%),linear-gradient(180deg,rgba(23,23,33,.98),rgba(10,10,16,.98));
                border:1px solid rgba(180,125,255,.52);
                box-shadow:0 0 0 1px rgba(255,255,255,.035) inset,0 24px 80px rgba(0,0,0,.70),0 0 35px rgba(105,45,190,.30);
                text-align:center;animation:tableActionIn .34s cubic-bezier(.2,.85,.25,1.2)
            }
            .table-action-card.leaving{animation:tableActionOut .22s ease forwards}
            .table-action-icon{
                width:54px;height:54px;display:flex;align-items:center;
                justify-content:center;border-radius:16px;
                background:rgba(120,65,215,.17);
                border:1px solid rgba(180,125,255,.32);
                font-size:27px;color:#D5B5FF
            }
            .table-action-kind{
                font-family:'Orbitron',sans-serif;font-size:9px;
                font-weight:800;letter-spacing:2.2px;text-transform:uppercase;
                color:#B98AFF
            }
            .table-action-title{
                font-family:'Orbitron',sans-serif;font-size:17px;
                line-height:1.35;color:white
            }
            .table-action-detail{
                max-width:330px;font-size:12px;line-height:1.55;
                color:var(--text2,#B9B9C6)
            }
            .table-action-hint{margin-top:7px;font-size:9px;color:var(--text3,#777786)}
            .ability-card-footer{
                display:flex;align-items:center;justify-content:space-between;
                gap:12px;margin-top:12px
            }
            .ability-card-footer span{font-size:10px;color:var(--primaryLight,#C9A6FF)}
            @keyframes tableActionIn{
                from{opacity:0;transform:scale(.78) translateY(18px);filter:blur(4px)}
                to{opacity:1;transform:scale(1);filter:blur(0)}
            }
            @keyframes tableActionOut{
                to{opacity:0;transform:scale(.92) translateY(-8px);filter:blur(3px)}
            }
        `;
        document.head.appendChild(style);
    }

    function closeNotice(){
        const layer = document.querySelector(".table-action-layer");
        if(!layer) return;

        layer.querySelector(".table-action-card")
            ?.classList.add("leaving");

        setTimeout(() => layer.remove(),210);

        if(noticeTimer){
            clearTimeout(noticeTimer);
            noticeTimer = null;
        }
    }

    function showNotice(notice){
        if(!notice?.id || notice.id === lastNoticeId) return;

        lastNoticeId = notice.id;
        ensureNoticeStyle();
        closeNotice();

        const layer = document.createElement("div");
        layer.className = "table-action-layer";
        layer.innerHTML = `
            <div class="table-action-card">
                <div class="table-action-icon">${escapeTableHTML(notice.icon || "✦")}</div>
                <span class="table-action-kind">${escapeTableHTML(notice.kind || "Ação")}</span>
                <strong class="table-action-title">${escapeTableHTML(notice.title || "Ação realizada")}</strong>
                ${notice.detail ? `<p class="table-action-detail">${escapeTableHTML(notice.detail)}</p>` : ""}
                <small class="table-action-hint">Clique em qualquer lugar para fechar</small>
            </div>
        `;

        layer.addEventListener("click",closeNotice,{ once:true });
        document.body.appendChild(layer);
        noticeTimer = setTimeout(closeNotice,4200);
    }

    function publishNotice({ kind="Ação",icon="✦",title,detail="" }){
        refreshCurrentTableCampaign();
        if(!currentTableCampaign) return;

        const notice = {
            id:`action_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
            kind,
            icon,
            title,
            detail,
            createdAt:Date.now()
        };

        currentTableCampaign.actionNotification = notice;
        saveTableCampaign();
        showNotice(notice);
    }

    function checkNotice(){
        refreshCurrentTableCampaign();
        const notice = currentTableCampaign?.actionNotification;
        if(notice && notice.id !== lastNoticeId){
            showNotice(notice);
        }
    }

    function installAbilityMenu(){
        if(typeof playerMenuItems === "undefined" || !Array.isArray(playerMenuItems)) return;

        if(!playerMenuItems.some(item => item.id === "abilities")){
            const index = playerMenuItems.findIndex(item => item.id === "attacks");
            playerMenuItems.splice(
                index >= 0 ? index + 1 : 1,
                0,
                { id:"abilities",icon:"✦",label:"Habilidades" }
            );
        }

        if(currentTableRole === "player"){
            createRoleMenu();
        }
    }

    function costLabel(ability){
        if(isPassive(ability)) return "Passiva";

        const id = abilityId(ability);
        if(REACTION_IDS.includes(id)) return "Usada como reação";

        const cost = parseAbilityCost(ability);
        const suffix = cost.variable ? " ou mais" : "";
        return `${cost.amount} ${cost.resource.toUpperCase()}${suffix}`;
    }

    function renderAbilityCard(ability,passive){
        const id = abilityId(ability);
        const reactionOnly = REACTION_IDS.includes(id);

        return `
            <div class="table-panel-card">
                <h3>${escapeTableHTML(abilityName(ability))}</h3>
                <p>${escapeTableHTML(ability.description || ability.effect || "Sem descrição.")}</p>
                <div class="ability-card-footer">
                    <span>${escapeTableHTML(costLabel(ability))}</span>
                    ${
                        !passive && !reactionOnly
                            ? `<button type="button" class="primary-button use-table-ability" data-ability-id="${escapeTableHTML(id)}">Usar</button>`
                            : ""
                    }
                </div>
            </div>
        `;
    }

    function openAbilitiesPanel(){
        refreshCurrentTableCharacter();

        const character = currentTableCharacter;
        const abilities = abilitiesOf(character);
        const passive = abilities.filter(isPassive);
        const active = abilities.filter(ability => !isPassive(ability));

        openTablePanel(
            "PERSONAGEM",
            "Habilidades",
            `
                <div class="table-panel-section">
                    <h3 class="table-panel-section-title">Passivas</h3>
                    <div class="table-panel-list">
                        ${
                            passive.length
                                ? passive.map(ability => renderAbilityCard(ability,true)).join("")
                                : '<div class="editor-empty-state"><p>Nenhuma habilidade passiva.</p></div>'
                        }
                    </div>
                </div>

                <div class="table-panel-section">
                    <h3 class="table-panel-section-title">Ativas</h3>
                    <div class="table-panel-list">
                        ${
                            active.length
                                ? active.map(ability => renderAbilityCard(ability,false)).join("")
                                : '<div class="editor-empty-state"><p>Nenhuma habilidade ativa.</p></div>'
                        }
                    </div>
                </div>
            `
        );

        document
            .querySelectorAll(".use-table-ability")
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () => useMenuAbility(button.dataset.abilityId)
                );
            });
    }

    function savePendingAbilityEffect(character,effect){
        refreshCurrentTableCampaign();

        currentTableCampaign.combat = currentTableCampaign.combat || {};
        currentTableCampaign.combat.abilityEffects =
            currentTableCampaign.combat.abilityEffects || {};

        currentTableCampaign.combat.abilityEffects[character.id] = {
            ...effect,
            characterId:character.id,
            createdAt:Date.now()
        };

        saveTableCampaign();
    }

    function openAttackSpecialPanel(ability){
        refreshCurrentTableCharacter();
        const character = currentTableCharacter;
        const availablePD = getResourceCurrent(character,"pd");
        const maxSpend = Math.floor(availablePD / 2) * 2;

        if(maxSpend < 2){
            addSystemChatMessage(
                `${character.name || "O personagem"} não possui PD suficiente para Ataque Especial.`
            );
            return;
        }

        const options = [];

        for(let spend=2;spend<=maxSpend;spend+=2){
            const points = spend / 2;

            for(let attackPoints=0;attackPoints<=points;attackPoints++){
                const damagePoints = points - attackPoints;
                options.push({
                    spend,
                    attackBonus:attackPoints * 5,
                    damageBonus:damagePoints * 5
                });
            }
        }

        openTablePanel(
            "HABILIDADE",
            abilityName(ability),
            `
                <div class="table-panel-card">
                    <h3>Distribuir o bônus</h3>
                    <p>Cada 2 PD concedem +5 para o ataque ou para o dano.</p>
                    <p>PD atual: <strong>${availablePD}</strong></p>
                </div>
                <div class="table-panel-list">
                    ${options.map((option,index) => `
                        <button
                            type="button"
                            class="table-panel-card attack-special-choice"
                            data-index="${index}">
                            <h3>${option.spend} PD</h3>
                            <p>+${option.attackBonus} no ataque • +${option.damageBonus} no dano</p>
                        </button>
                    `).join("")}
                </div>
            `
        );

        document
            .querySelectorAll(".attack-special-choice")
            .forEach(button => {
                button.addEventListener("click",() => {
                    const option = options[Number(button.dataset.index)];
                    if(!option) return;

                    refreshCurrentTableCharacter();
                    const liveCharacter = currentTableCharacter;

                    if(!spendResource(liveCharacter,"pd",option.spend)) return;

                    savePendingAbilityEffect(liveCharacter,{
                        type:"attack-special",
                        abilityId:"ataque-especial",
                        attackBonus:option.attackBonus,
                        damageBonus:option.damageBonus,
                        attackConsumed:false,
                        damageConsumed:false,
                        active:true
                    });

                    publishNotice({
                        kind:"Habilidade",
                        icon:"🗡",
                        title:`${liveCharacter.name} utilizou ${abilityName(ability)}`,
                        detail:`+${option.attackBonus} no ataque e +${option.damageBonus} no dano.`
                    });

                    addSystemChatMessage(
                        `${liveCharacter.name} utilizou ${abilityName(ability)} e gastou ${option.spend} PD.`
                    );

                    closeCurrentPanel();
                });
            });
    }

    function addUnreactableAttackRoll(character,attack,index,label){
        const formula = resolveCharacterFormula(
            attackFormula(attack),
            character
        );
        const result = rollDiceExpression(formula);

        if(!result) return;

        addRollChatMessage(
            `${label} • ${attack.name || "Ataque"}`,
            formula,
            result.total,
            result.detail || "",
            {
                rollKind:"attack",
                attackIndex:index,
                attackName:attack.name || "Ataque",
                applied:false,
                isUnreactableAttack:true,
                unreactableReason:label
            }
        );

        closeCurrentPanel();

        publishNotice({
            kind:"Ataque",
            icon:"⚔",
            title:`${character.name} preparou ${label}`,
            detail:"Escolha o alvo. Ele não poderá reagir."
        });
    }

    function openAttackOpportunityPanel(ability){
        refreshCurrentTableCharacter();
        const character = currentTableCharacter;
        const attacks = getCharacterReadyAttacks(character);
        const cost = parseAbilityCost(ability);

        openTablePanel(
            "HABILIDADE",
            abilityName(ability),
            `
                <div class="table-panel-card">
                    <h3>Ataque sem reação</h3>
                    <p>Escolha um ataque pronto. Depois selecione o alvo no mapa.</p>
                </div>
                <div class="table-panel-list">
                    ${
                        attacks.length
                            ? attacks.map((attack,index) => `
                                <button
                                    type="button"
                                    class="table-panel-card opportunity-attack-choice"
                                    data-index="${index}">
                                    <h3>${escapeTableHTML(attack.name || `Ataque ${index + 1}`)}</h3>
                                    <p>${escapeTableHTML(String(attackFormula(attack)))}</p>
                                </button>
                            `).join("")
                            : '<div class="editor-empty-state"><p>Nenhum ataque pronto foi encontrado.</p></div>'
                    }
                </div>
            `
        );

        document
            .querySelectorAll(".opportunity-attack-choice")
            .forEach(button => {
                button.addEventListener("click",() => {
                    const attack = attacks[Number(button.dataset.index)];
                    if(!attack) return;

                    refreshCurrentTableCharacter();
                    const liveCharacter = currentTableCharacter;

                    if(cost.amount > 0 && !spendResource(liveCharacter,cost.resource,cost.amount)) return;

                    addUnreactableAttackRoll(
                        liveCharacter,
                        attack,
                        Number(button.dataset.index),
                        abilityName(ability)
                    );
                });
            });
    }

    function useMenuAbility(id){
        refreshCurrentTableCharacter();

        const character = currentTableCharacter;
        const ability = abilityById(character,id);
        if(!ability || isPassive(ability)) return;

        const normalizedId = abilityId(ability);

        if(normalizedId === "ataque-especial"){
            openAttackSpecialPanel(ability);
            return;
        }

        if(normalizedId === "ataque-de-oportunidade"){
            openAttackOpportunityPanel(ability);
            return;
        }

        const cost = parseAbilityCost(ability);

        if(cost.variable){
            addSystemChatMessage(
                `${abilityName(ability)} possui custo variável e ainda precisa de uma escolha específica.`
            );
            return;
        }

        if(!spendResource(character,cost.resource,cost.amount)) return;

        publishNotice({
            kind:"Habilidade",
            icon:"✦",
            title:`${character.name || "Personagem"} utilizou ${abilityName(ability)}`,
            detail:cost.amount
                ? `Custo: ${cost.amount} ${cost.resource.toUpperCase()}`
                : "Sem custo"
        });

        addSystemChatMessage(
            `${character.name || "O personagem"} utilizou ${abilityName(ability)}` +
            `${cost.amount ? ` e gastou ${cost.amount} ${cost.resource.toUpperCase()}` : ""}.`
        );

        openAbilitiesPanel();
    }

    const previousHandleMenuAction = handleMenuAction;
    handleMenuAction = function(action,button){
        if(action === "abilities"){
            clearActiveMenuButtons();
            button?.classList.add("active");
            openAbilitiesPanel();
            return;
        }

        previousHandleMenuAction(action,button);
    };

    function finishOriginalAttack(request,character,options={}){
        const baseDefense = defenseOf(character);
        const baseRD = rdOf(character);

        request.reaction = {
            type:"ability",
            abilityId:options.abilityId || null,
            abilityName:options.abilityName || "Habilidade",
            paCost:Math.max(0,Number(options.paCost) || 0),
            baseDefense,
            finalDefense:baseDefense,
            baseRD,
            reactionRD:baseRD,
            answeredAt:Date.now()
        };

        request.hit = options.forceMiss === true
            ? false
            : Number(request.attackResult) >= baseDefense;

        request.resolved = true;
        request.active = false;
        request.updatedAt = Date.now();

        if(request.hit){
            currentTableCampaign.combat.damageContext = {
                id:`damage_${Date.now()}`,
                active:true,
                attackRequestId:request.id,
                attackName:request.attackName,
                attackerCharacterId:request.attackerCharacterId || null,
                targetCharacterId:character.id,
                targetName:character.name || "Alvo",
                reaction:"ability",
                abilityId:options.abilityId || null,
                damageReduction:baseRD,
                flatReduction:Math.max(0,Number(options.flatReduction) || 0),
                damageMultiplier:Number.isFinite(Number(options.damageMultiplier))
                    ? Math.max(0,Number(options.damageMultiplier))
                    : 1,
                consumed:false,
                createdAt:Date.now()
            };
        }
        else{
            currentTableCampaign.combat.damageContext = null;
        }

        currentTableCampaign.combat.updatedAt = Date.now();

        markAttackMessageAsApplied(request);
        saveTableCampaign();
        closeCurrentPanel();
        refreshCurrentTableCharacter();
        refreshOpenCharacterPanel();
        renderPublicChat();
        publishAttackResult(request,character);
    }

    const previousPublishAttackResult = publishAttackResult;
    publishAttackResult = function(request,target){
        const reactionType = request?.reaction?.type;

        if(reactionType === "counter"){
            const attack = Number(request.attackResult) || 0;
            const defense = Number(request.reaction.finalDefense) || 0;

            addSystemChatMessage(
                request.hit
                    ? `${target.name || "O alvo"} escolheu Contra-atacar. Ataque ${attack} contra Defesa ${defense}: o ataque acertou.`
                    : `${target.name || "O alvo"} escolheu Contra-atacar. Ataque ${attack} contra Defesa ${defense}: o ataque errou.`
            );
            return;
        }

        if(reactionType === "ability"){
            const name = request.reaction.abilityName || request.reaction.abilityId || "Habilidade";
            const attack = Number(request.attackResult) || 0;
            const defense = Number(request.reaction.finalDefense) || 0;

            addSystemChatMessage(
                request.hit
                    ? `${target.name || "O alvo"} utilizou ${name}. Ataque ${attack} contra Defesa ${defense}: o ataque acertou.`
                    : `${target.name || "O alvo"} utilizou ${name}. O ataque errou.`
            );
            return;
        }

        previousPublishAttackResult(request,target);
    };

    function rollReactionAttack(attack){
        const formula = resolveCharacterFormula(
            attackFormula(attack),
            currentTableCharacter
        );
        const roll = rollDiceExpression(formula);
        return roll ? { ...roll,formula } : null;
    }

    function addReactionRoll({character,attack,index,result,target,label,hit,comparison,value,abilityId}){
        addRollChatMessage(
            `${label} • ${attack.name || "Ataque"}`,
            result.formula,
            result.total,
            result.detail || "",
            {
                rollKind:"attack",
                attackIndex:index,
                attackName:attack.name || "Ataque",
                applied:true,
                isCounterAttack:true,
                isUnreactableAttack:true,
                forcedTargetCharacterId:target?.id || null
            }
        );

        refreshCurrentTableCampaign();

        const message = [...(currentTableCampaign.chatMessages || [])]
            .reverse()
            .find(item =>
                item.type === "roll" &&
                item.characterId === character.id &&
                item.attackName === (attack.name || "Ataque") &&
                Number(item.total) === Number(result.total)
            );

        if(message){
            message.applied = true;
            message.attackApplication = {
                targetCharacterId:target?.id || null,
                targetName:target?.name || "Agressor",
                attackResult:Number(result.total) || 0,
                finalDefense:Number(value) || 0,
                reaction:abilityId,
                comparisonLabel:comparison,
                hit:Boolean(hit),
                unreactable:true
            };
            saveTableCampaign();
            renderPublicChat();
        }
    }

    function openReactionAttackChoice(id,ability,request){
        const attacks = getCharacterReadyAttacks(currentTableCharacter);
        const aggressor = aggressorOf(request);

        if(!aggressor){
            addSystemChatMessage("O agressor não possui uma ficha válida.");
            return;
        }

        openTablePanel(
            "REAÇÃO",
            abilityName(ability),
            `
                <div class="table-panel-card">
                    <h3>Alvo: ${escapeTableHTML(aggressor.name || "Agressor")}</h3>
                    <p>Escolha um dos ataques prontos da sua ficha. O agressor não poderá reagir.</p>
                </div>
                <div class="table-panel-list">
                    ${
                        attacks.length
                            ? attacks.map((attack,index) => `
                                <button type="button" class="table-panel-card advanced-reaction-attack" data-index="${index}">
                                    <h3>${escapeTableHTML(attack.name || `Ataque ${index + 1}`)}</h3>
                                    <p>${escapeTableHTML(String(attackFormula(attack)))}</p>
                                </button>
                            `).join("")
                            : '<div class="editor-empty-state"><p>Nenhum ataque pronto foi encontrado.</p></div>'
                    }
                </div>
            `
        );

        document.querySelectorAll(".advanced-reaction-attack")
            .forEach(button => {
                button.addEventListener("click",() => {
                    const index = Number(button.dataset.index);
                    resolveReactionAttack(id,ability,request,attacks[index],index,aggressor);
                });
            });
    }

    function resolveReactionAttack(id,ability,request,attack,index,aggressor){
        if(!attack) return;

        const result = rollReactionAttack(attack);
        if(!result) return;

        const name = abilityName(ability);
        const cost = parseAbilityCost(ability).amount;

        if(id === "revidar"){
            const defense = defenseOf(aggressor);
            const success = Number(result.total) >= defense;

            addReactionRoll({
                character:currentTableCharacter,
                attack,index,result,target:aggressor,label:name,
                hit:success,comparison:"Defesa",value:defense,abilityId:id
            });

            finishOriginalAttack(request,currentTableCharacter,{
                abilityId:id,
                abilityName:name,
                paCost:cost,
                damageMultiplier:success ? 0.5 : 1
            });

            publishNotice({
                kind:"Reação",icon:"↩",
                title:`${currentTableCharacter.name} utilizou ${name}`,
                detail:success
                    ? `Acertou ${aggressor.name}; o dano original será reduzido pela metade.`
                    : `Errou contra ${aggressor.name}; o ataque original continua.`
            });
            return;
        }

        const originalResult = Number(request.attackResult) || 0;
        const success = Number(result.total) > originalResult;

        addReactionRoll({
            character:currentTableCharacter,
            attack,index,result,target:aggressor,label:name,
            hit:success,comparison:"Ataque original",value:originalResult,abilityId:id
        });

        finishOriginalAttack(request,currentTableCharacter,{
            abilityId:id,
            abilityName:name,
            paCost:cost,
            forceMiss:success
        });

        publishNotice({
            kind:"Reação",icon:"⇄",
            title:`${currentTableCharacter.name} utilizou ${name}`,
            detail:success
                ? `Superou o ataque original e atingiu ${aggressor.name}.`
                : "Não superou o ataque original."
        });
    }

    openAttackReactionAbilityPanel = function(){
        refreshCurrentTableCharacter();

        const character = currentTableCharacter;
        const abilities = REACTION_IDS
            .map(id => abilityById(character,id))
            .filter(Boolean);

        if(!abilities.length){
            openTablePanel("REAÇÃO","Habilidades",`
                <div class="editor-empty-state">
                    <p>Nenhuma habilidade de reação disponível.</p>
                    <button type="button" id="returnToAttackReaction" class="secondary-button">Voltar</button>
                </div>
            `);

            document.getElementById("returnToAttackReaction")
                ?.addEventListener("click",() => {
                    const request = currentTableCampaign?.combat?.pendingAttack;
                    if(request) openAttackReactionPanel(request);
                });
            return;
        }

        const currentPA = getResourceCurrent(character,"pa");

        openTablePanel("REAÇÃO","Escolher Habilidade",`
            <div class="table-panel-list">
                ${abilities.map(ability => {
                    const cost = parseAbilityCost(ability).amount;
                    const id = abilityId(ability);
                    return `
                        <button type="button" class="table-panel-card reaction-ability-choice" data-ability-id="${escapeTableHTML(id)}" ${cost > currentPA ? "disabled" : ""}>
                            <h3>${escapeTableHTML(abilityName(ability))}</h3>
                            <p>${escapeTableHTML(ability.description || ability.effect || "")}</p>
                            <span class="reaction-ability-cost">${cost} PA</span>
                        </button>
                    `;
                }).join("")}
            </div>
        `);

        document.querySelectorAll(".reaction-ability-choice")
            .forEach(button => {
                button.addEventListener("click",() => selectAttackReactionAbility(button.dataset.abilityId));
            });
    };

    selectAttackReactionAbility = function(id){
        refreshCurrentTableCampaign();
        refreshCurrentTableCharacter();

        const request = currentTableCampaign?.combat?.pendingAttack;
        const character = currentTableCharacter;

        if(!request || !character || request.targetCharacterId !== character.id || request.resolved === true) return;

        const normalizedId = slug(id);
        const ability = abilityById(character,normalizedId);

        if(!ability){
            addSystemChatMessage("A habilidade selecionada não foi encontrada.");
            return;
        }

        const cost = parseAbilityCost(ability).amount;
        if(!spendResource(character,"pa",cost)) return;

        if(normalizedId === "desvio-absoluto"){
            finishOriginalAttack(request,character,{
                abilityId:normalizedId,
                abilityName:abilityName(ability),
                paCost:cost,
                forceMiss:true
            });

            publishNotice({
                kind:"Reação",icon:"◇",
                title:`${character.name} utilizou ${abilityName(ability)}`,
                detail:"O ataque errou automaticamente."
            });
            return;
        }

        if(normalizedId === "pele-dura"){
            const round=Math.max(0,Number(currentTableCampaign.combat?.round)||0),uses=currentTableCampaign.combat.reactionAbilityUses||(currentTableCampaign.combat.reactionAbilityUses={}),key=`pele-dura:${character.id}:${round}`;
            if(uses[key]){character.status=character.status||{};character.status.paAtual=Math.max(0,Number(character.status.paAtual)||0)+cost;saveDamagedCharacter(character);addSystemChatMessage("Pele Dura já foi utilizada nesta rodada.");return;}
            uses[key]=Date.now();
            finishOriginalAttack(request,character,{abilityId:normalizedId,abilityName:abilityName(ability),paCost:cost,damageMultiplier:0.5});
            publishNotice({kind:"Reação",icon:"🛡",title:`${character.name} utilizou ${abilityName(ability)}`,detail:"O dano deste ataque será reduzido pela metade."});
            return;
        }

        currentTableCampaign.combat.reactionAbilityContext = {
            id:`reaction_${Date.now()}`,
            active:true,
            abilityId:normalizedId,
            originalAttackId:request.id,
            defenderCharacterId:character.id,
            aggressorCharacterId:request.attackerCharacterId || null,
            createdAt:Date.now()
        };

        saveTableCampaign();
        openReactionAttackChoice(normalizedId,ability,request);
    };

    function markRollAppliedDirectly(message,target,hit){
        message.applied = true;
        message.appliedAt = Date.now();
        message.attackApplication = {
            targetCharacterId:target.id,
            targetName:target.name || "Alvo",
            attackResult:Number(message.total) || 0,
            baseDefense:defenseOf(target),
            finalDefense:defenseOf(target),
            reaction:"sem-reacao",
            hit:Boolean(hit),
            unreactable:true
        };
    }

    function resolveUnreactableAttack(message,target){
        refreshCurrentTableCampaign();

        const liveMessage = (currentTableCampaign.chatMessages || [])
            .find(item => item.id === message.id) || message;

        const attackResult = Number(liveMessage.total) || 0;
        const defense = defenseOf(target);
        const hit = attackResult >= defense;

        markRollAppliedDirectly(liveMessage,target,hit);

        if(hit){
            currentTableCampaign.combat.damageContext = {
                id:`damage_${Date.now()}`,
                active:true,
                attackRequestId:liveMessage.id,
                attackName:liveMessage.attackName || "Ataque",
                attackerCharacterId:liveMessage.characterId || null,
                targetCharacterId:target.id,
                targetName:target.name || "Alvo",
                reaction:"sem-reacao",
                damageReduction:rdOf(target),
                flatReduction:0,
                damageMultiplier:1,
                consumed:false,
                createdAt:Date.now()
            };
        }

        saveTableCampaign();
        renderPublicChat();

        addSystemChatMessage(
            hit
                ? `${liveMessage.author || "O atacante"} realizou um ataque sem reação contra ${target.name}. Ataque ${attackResult} contra Defesa ${defense}: acertou.`
                : `${liveMessage.author || "O atacante"} realizou um ataque sem reação contra ${target.name}. Ataque ${attackResult} contra Defesa ${defense}: errou.`
        );

        publishNotice({
            kind:"Ataque",icon:"⚔",
            title:`${liveMessage.author || "O atacante"} atacou ${target.name}`,
            detail:hit ? "O alvo não pôde reagir e o ataque acertou." : "O alvo não pôde reagir, mas o ataque errou."
        });
    }

    const previousStartAttackTargetSelection = startAttackTargetSelection;
    startAttackTargetSelection = function(messageId){
        refreshCurrentTableCampaign();

        const message = (currentTableCampaign?.chatMessages || [])
            .find(item => item.id === messageId);

        if(!message){
            previousStartAttackTargetSelection(messageId);
            return;
        }

        if(message.isCounterAttack && message.forcedTargetCharacterId){
            const target = getLiveCharacter(message.forcedTargetCharacterId);

            if(!target){
                addSystemChatMessage("O agressor definido para o Contra-ataque não foi encontrado.");
                return;
            }

            resolveUnreactableAttack(message,target);
            return;
        }

        if(message.isUnreactableAttack){
            unreactableTargetSelection = { messageId:message.id };

            pendingAttackApplication = {
                messageId:message.id,
                attackResult:Math.max(0,Number(message.total) || 0),
                attackName:message.attackName || "Ataque",
                attackIndex:message.attackIndex ?? null,
                attackerCharacterId:message.characterId || null,
                attackerName:message.author || "Atacante",
                unreactable:true
            };

            document.querySelector(".table-play-area")
                ?.classList.add("selecting-attack-target");

            markAttackTargets();
            addLocalAttackNotice("Selecione o alvo. Este ataque não permite reação.");
            return;
        }

        previousStartAttackTargetSelection(messageId);
    };

    const previousApplyPendingAttackToTarget = applyPendingAttackToTarget;
    applyPendingAttackToTarget = function(type,entity){
        if(pendingAttackApplication?.unreactable === true || unreactableTargetSelection){
            if(type !== "player" || !entity?.characterId){
                addLocalAttackNotice("Selecione um personagem jogador.");
                return;
            }

            const target = getLiveCharacter(entity.characterId);
            const message = (currentTableCampaign?.chatMessages || [])
                .find(item => item.id === pendingAttackApplication?.messageId);

            if(!target || !message){
                addLocalAttackNotice("O alvo ou a rolagem não foi encontrado.");
                return;
            }

            cancelAttackTargetSelection();
            unreactableTargetSelection = null;
            resolveUnreactableAttack(message,target);
            return;
        }

        previousApplyPendingAttackToTarget(type,entity);
    };

    const previousCreateAttackReactionRequest = createAttackReactionRequest;
    createAttackReactionRequest = function(target){
        const attacker = pendingAttackApplication?.attackerName || currentTableCharacter?.name || "Atacante";
        const attack = pendingAttackApplication?.attackName || "Ataque";

        previousCreateAttackReactionRequest(target);

        publishNotice({
            kind:"Ataque",icon:"⚔",
            title:`${attacker} atacou ${target?.name || "o alvo"}`,
            detail:attack
        });
    };

    const previousAnswerAttackReaction = answerAttackReaction;
    answerAttackReaction = function(type){
        const dodge = type === "dodge";
        const character = currentTableCharacter;
        const always = dodge && hasAbility(character,"sempre-alerta");
        const agility = Math.max(0,Number(character?.attributes?.agi) || 0);

        previousAnswerAttackReaction(type);

        if(!always) return;

        refreshCurrentTableCampaign();
        const context = currentTableCampaign?.combat?.damageContext;

        if(context && context.active === true && context.targetCharacterId === character?.id){
            context.flatReduction = agility * 2;
            context.automaticAbility = "sempre-alerta";
            saveTableCampaign();

            publishNotice({
                kind:"Passiva",icon:"👁",
                title:`${character.name} ativou Sempre Alerta`,
                detail:`O dano será reduzido em ${agility * 2}.`
            });
        }
    };

    const previousAddRollChatMessage = addRollChatMessage;
    addRollChatMessage = function(label,formula,total,detail,metadata={}){
        refreshCurrentTableCampaign();
        refreshCurrentTableCharacter();

        const character = currentTableCharacter;
        const effect = currentTableCampaign?.combat?.abilityEffects?.[character?.id];

        let adjustedTotal = Number(total) || 0;
        let adjustedDetail = detail || "";

        if(effect?.active && effect.type === "attack-special"){
            if(metadata.rollKind === "attack" && !effect.attackConsumed){
                adjustedTotal += Math.max(0,Number(effect.attackBonus) || 0);
                adjustedDetail += ` • Ataque Especial +${Math.max(0,Number(effect.attackBonus) || 0)}`;
                effect.attackConsumed = true;
            }
            else if(metadata.rollKind === "damage" && !effect.damageConsumed){
                adjustedTotal += Math.max(0,Number(effect.damageBonus) || 0);
                adjustedDetail += ` • Ataque Especial +${Math.max(0,Number(effect.damageBonus) || 0)}`;
                effect.damageConsumed = true;
            }

            if(effect.attackConsumed && effect.damageConsumed){
                effect.active = false;
            }

            saveTableCampaign();
        }

        return previousAddRollChatMessage(label,formula,adjustedTotal,adjustedDetail,metadata);
    };

    const previousApplyClassicDamageToCharacter = applyClassicDamageToCharacter;
    applyClassicDamageToCharacter = function(character){
        const context = currentTableCampaign?.combat?.damageContext;
        const matches = context && context.active === true && context.consumed !== true && context.targetCharacterId === character?.id && pendingDamageApplication;

        if(!matches){
            previousApplyClassicDamageToCharacter(character);
            return;
        }

        const original = Math.max(0,Number(pendingDamageApplication.damage) || 0);
        const rd = Math.max(0,Number(context.damageReduction) || 0);
        const flat = Math.max(0,Number(context.flatReduction) || 0);
        const multiplier = Number.isFinite(Number(context.damageMultiplier))
            ? Math.max(0,Number(context.damageMultiplier))
            : 1;

        const final = Math.floor(Math.max(0,Math.max(0,original - rd) - flat) * multiplier);

        context.damageReduction = Math.max(0,original - final);
        context.calculation = {
            originalDamage:original,
            baseRD:rd,
            flatReduction:flat,
            multiplier,
            finalDamage:final
        };

        saveTableCampaign();
        previousApplyClassicDamageToCharacter(character);
    };

    installAbilityMenu();
    ensureNoticeStyle();
    checkNotice();

    window.addEventListener("storage",event => {
        if(event.key === TABLE_CAMPAIGN_STORAGE){
            setTimeout(checkNotice,30);
        }
    });

    setInterval(checkNotice,700);
})();
