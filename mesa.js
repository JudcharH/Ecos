/*==========================================================
=                    MESA.JS - PARTE 1
==========================================================*/

document.addEventListener(
    "DOMContentLoaded",
    initTable
);


/*==========================================================
=                    STORAGE
==========================================================*/

const TABLE_CAMPAIGN_STORAGE =
    "ordem_campaigns";

const TABLE_CHARACTER_STORAGE =
    "ordem_characters";

const TABLE_ROLE_STORAGE =
    "ordem_table_role";

const TABLE_CHARACTER_CURRENT =
    "ordem_table_character";


/*==========================================================
=                    ESTADO
==========================================================*/

let tableCampaigns = [];

let tableCharacters = [];

let currentTableCampaign = null;

let currentTableCharacter = null;

let currentTableRole = null;

let selectedPosition = null;

let lastInitiativeRequestShown = null;

let pendingDamageApplication = null;

let pendingBodyDamageApplication = null;

let pendingAttackApplication = null;

let pendingEnemyAbilityTarget = null;

let lastAttackReactionShown = null;

/*==========================================================
=                    ELEMENTOS
==========================================================*/

const tableCampaignName =
    document.getElementById(
        "tableCampaignName"
    );

const tableCampaignLabel =
    document.getElementById(
        "tableCampaignLabel"
    );

const tableRoleName =
    document.getElementById(
        "tableRoleName"
    );

const tableRoleIcon =
    document.getElementById(
        "tableRoleIcon"
    );

const sidebarRoleTitle =
    document.getElementById(
        "sidebarRoleTitle"
    );

const tableMenu =
    document.getElementById(
        "tableMenu"
    );

const leaveTableButton =
    document.getElementById(
        "leaveTable"
    );

const sceneBackground =
    document.getElementById(
        "sceneBackground"
    );

const tablePanelOverlay =
    document.getElementById(
        "tablePanelOverlay"
    );

const tableSidePanel =
    document.getElementById(
        "tableSidePanel"
    );

const tablePanelLabel =
    document.getElementById(
        "tablePanelLabel"
    );

const tablePanelTitle =
    document.getElementById(
        "tablePanelTitle"
    );

const tablePanelContent =
    document.getElementById(
        "tablePanelContent"
    );

const closeTablePanel =
    document.getElementById(
        "closeTablePanel"
    );

const positionModal =
    document.getElementById(
        "positionModal"
    );

const positionModalTitle =
    document.getElementById(
        "positionModalTitle"
    );

const positionModalBody =
    document.getElementById(
        "positionModalBody"
    );

const closePositionModal =
    document.getElementById(
        "closePositionModal"
    );

const diceModal =
    document.getElementById(
        "diceModal"
    );

const closeDiceModal =
    document.getElementById(
        "closeDiceModal"
    );

const campaignMusicPlayer =
    document.getElementById(
        "campaignMusicPlayer"
    );

const sceneUploadInput =
    document.getElementById(
        "sceneUploadInput"
    );

const musicUploadInput =
    document.getElementById(
        "musicUploadInput"
    );


/*==========================================================
=                    INICIALIZAÇÃO
==========================================================*/

function initTable(){

    loadTableStorage();

    discoverTableSession();

    if(!currentTableCampaign){

        return;

    }

    initializeCombatState();

    initializePublicChat();

    fillTableHeader();

    loadScene();

    loadMusic();

    createRoleMenu();

    bindTableEvents();

    renderCombatPositions();

    renderPublicChat();

    checkInitiativeRequest();

    checkPendingAttackReaction();

    checkPendingEnemyAttackReaction();

}


/*==========================================================
=                    CARREGAR STORAGE
==========================================================*/

function loadTableStorage(){

    try{

        tableCampaigns =
            JSON.parse(
                localStorage.getItem(
                    TABLE_CAMPAIGN_STORAGE
                )
            ) || [];

    }
    catch(error){

        console.error(
            "Erro ao carregar campanhas:",
            error
        );

        tableCampaigns = [];

    }

    try{

        tableCharacters =
            JSON.parse(
                localStorage.getItem(
                    TABLE_CHARACTER_STORAGE
                )
            ) || [];

    }
    catch(error){

        console.error(
            "Erro ao carregar fichas:",
            error
        );

        tableCharacters = [];

    }

}


/*==========================================================
=                    DESCOBRIR SESSÃO
==========================================================*/

function discoverTableSession(){

    const params =
        new URLSearchParams(
            window.location.search
        );

    const campaignId =
        params.get("campaign") ||
        localStorage.getItem(
            "ordem_current_campaign"
        );

    currentTableRole =
        params.get("role") ||
        localStorage.getItem(
            TABLE_ROLE_STORAGE
        );

    const characterId =
        params.get("character") ||
        localStorage.getItem(
            TABLE_CHARACTER_CURRENT
        );

    if(!campaignId){

        window.location.href =
            "campanhas.html";

        return;

    }

    currentTableCampaign =
        tableCampaigns.find(
            campaign =>
                String(campaign.id) ===
                String(campaignId)
        ) || null;

    if(!currentTableCampaign){

        window.location.href =
            "campanhas.html";

        return;

    }

    if(
        currentTableRole !== "player" &&
        currentTableRole !== "master"
    ){

        window.location.href =
            `mesa-login.html?campaign=${encodeURIComponent(
                currentTableCampaign.id
            )}`;

        return;

    }

    if(currentTableRole === "player"){

        currentTableCharacter =
            tableCharacters.find(
                character =>
                    String(character.id) ===
                    String(characterId)
            ) || null;

        if(!currentTableCharacter){

            window.location.href =
                `mesa-login.html?campaign=${encodeURIComponent(
                    currentTableCampaign.id
                )}`;

            return;

        }

    }

}


/*==========================================================
=                    CABEÇALHO
==========================================================*/

function fillTableHeader(){

    if(tableCampaignName){

        tableCampaignName.textContent =
            currentTableCampaign.name ||
            "Campanha";

    }

    if(tableCampaignLabel){

        tableCampaignLabel.textContent =
            currentTableRole === "master"
                ? "CONTROLE DO MESTRE"
                : "CAMPANHA";

    }

    if(currentTableRole === "master"){

        if(tableRoleName){

            tableRoleName.textContent =
                "Mestre";

        }

        if(tableRoleIcon){

            tableRoleIcon.textContent =
                "♛";

        }

        if(sidebarRoleTitle){

            sidebarRoleTitle.textContent =
                "MESTRE";

        }

    }
    else{

        if(tableRoleName){

            tableRoleName.textContent =
                currentTableCharacter?.name ||
                "Jogador";

        }

        if(tableRoleIcon){

            tableRoleIcon.textContent =
                "◇";

        }

        if(sidebarRoleTitle){

            sidebarRoleTitle.textContent =
                "JOGADOR";

        }

    }

}


/*==========================================================
=                    MENUS
==========================================================*/

const playerMenuItems = [

    {
        id:"character",
        icon:"👤",
        label:"Ficha"
    },

    {
        id:"attacks",
        icon:"⚔",
        label:"Ataques"
    },

    {
        id:"inventory",
        icon:"🎒",
        label:"Inventário"
    },

    {
        id:"conditions",
        icon:"◈",
        label:"Condições"
    },

    {
        id:"grimoire",
        icon:"✦",
        label:"Grimório"
    },

    {
        id:"dice",
        icon:"🎲",
        label:"Dados"
    },

    {
        id:"notes",
        icon:"📝",
        label:"Anotações"
    }

];


const masterMenuItems = [


    {
    id:"initiative",
    icon:"⚡",
    label:"Iniciativa"
},

{
    id:"next-round",
    icon:"⟳",
    label:"Passar Rodada"
},

    {
        id:"enemies",
        icon:"☠",
        label:"Ameaças"
    },

    {
        id:"npcs",
        icon:"♟",
        label:"NPCs"
    },

    {
        id:"map",
        icon:"🗺",
        label:"Mapa"
    },

    {
        id:"music",
        icon:"♫",
        label:"Música"
    },

    {
        id:"grimoire",
        icon:"✦",
        label:"Grimório"
    },

    {
        id:"dice",
        icon:"🎲",
        label:"Dados"
    },

    {
        id:"notes",
        icon:"📝",
        label:"Anotações"
    }

];


/*==========================================================
=                    CRIAR MENU
==========================================================*/

function createRoleMenu(){

    if(!tableMenu){

        return;

    }

    tableMenu.innerHTML = "";

    const items =
        currentTableRole === "master"
            ? masterMenuItems
            : playerMenuItems;

    items.forEach(item => {

        const button =
            document.createElement(
                "button"
            );

        button.type = "button";

        button.className =
            "table-menu-button";

        button.dataset.panel =
            item.id;

        button.innerHTML = `

            <span class="table-menu-icon">
                ${item.icon}
            </span>

            <span class="table-menu-label">
                ${item.label}
            </span>

        `;

        button.addEventListener(
            "click",
            () => handleMenuAction(
                item.id,
                button
            )
        );

        tableMenu.appendChild(
            button
        );

    });

}


/*==========================================================
=                    AÇÃO DO MENU
==========================================================*/

function handleMenuAction(
    action,
    button
){

    clearActiveMenuButtons();

    if(button){

        button.classList.add(
            "active"
        );

    }

    switch(action){

        case "initiative":

    openInitiativeControlPanel();

    break;


case "next-round":

    openNextRoundConfirmation();

    break;

        case "character":

            openCharacterPanel();

            break;


        case "attacks":

            openAttacksPanel();

            break;


        case "inventory":

            openInventoryPanel();

            break;


        case "conditions":

            openConditionsPanel();

            break;


        case "grimoire":

            openGrimoirePanel();

            break;


        case "dice":

            openDicePanel();

            break;


        case "notes":

            openNotesPanel();

            break;


        case "enemies":

            openEnemiesPanel();

            break;


        case "npcs":

            openNPCPanel();

            break;

        case "allies":

            openAlliesPanel();

            break;


        case "map":

            openMapPanel();

            break;


        case "music":

            openMusicPanel();

            break;

    }

}

/*==========================================================
=              PAINEL DE INICIATIVA
==========================================================*/

function openInitiativeControlPanel(){

    if(
        currentTableRole !== "master"
    ){

        return;

    }


    const combat =
        currentTableCampaign.combat;


    const pending =
        combat.initiativeRequest?.active ===
        true;


    const participants =
        Array.isArray(
            combat.turnOrder
        )
            ? combat.turnOrder
            : [];


    openTablePanel(
        "COMBATE",
        "Iniciativa",
        `

        <div class="table-panel-section">

            <div class="table-panel-card">

                <h3>
                    Estado atual
                </h3>

                <p>
                    Combate:
                    <strong>
                        ${
                            combat.active
                                ? "Ativo"
                                : "Inativo"
                        }
                    </strong>
                </p>

                <p>
                    Rodada:
                    <strong>
                        ${combat.round || 0}
                    </strong>
                </p>

                <p>
                    Solicitação:
                    <strong>
                        ${
                            pending
                                ? "Aguardando jogadores"
                                : "Nenhuma"
                        }
                    </strong>
                </p>

            </div>


            <button
                type="button"
                id="requestInitiativeButton"
                class="primary-button full-button">

                ${
                    pending
                        ? "Solicitar novamente"
                        : "Solicitar iniciativa"
                }

            </button>


            ${
                participants.length
                    ? `

                        <div class="table-panel-card">

                            <h3>
                                Ordem atual
                            </h3>

                            ${participants
                                .map(
                                    (participant,index) => `

                                        <p>

                                            ${index + 1}.
                                            ${escapeTableHTML(
                                                participant.name ||
                                                "Participante"
                                            )}

                                            ${
                                                participant.result !==
                                                undefined
                                                    ? `— ${participant.result}`
                                                    : ""
                                            }

                                        </p>

                                    `
                                )
                                .join("")}

                        </div>

                    `
                    : ""
            }


            ${
                combat.active
                    ? `

                        <button
                            type="button"
                            id="endCombatButton"
                            class="secondary-button full-button">

                            Encerrar combate

                        </button>

                    `
                    : ""
            }

        </div>

        `
    );


    document
        .getElementById(
            "requestInitiativeButton"
        )
        ?.addEventListener(
            "click",
            requestInitiativeRolls
        );


    document
        .getElementById(
            "endCombatButton"
        )
        ?.addEventListener(
            "click",
            endTableCombat
        );

}

/*==========================================================
=              SOLICITAR INICIATIVA
==========================================================*/

function requestInitiativeRolls(){

    if(
        currentTableRole !== "master"
    ){

        return;

    }


    const players =
        Array.isArray(
            currentTableCampaign.players
        )
            ? currentTableCampaign.players
            : [];


    const enemies =
        Array.isArray(
            currentTableCampaign.enemies
        )
            ? currentTableCampaign.enemies
            : [];


    const expectedParticipants = [];


    players.forEach(player => {

        if(!player.characterId){

            return;

        }


        expectedParticipants.push({

            type:"player",

            id:player.characterId,

            characterId:
                player.characterId,

            name:
                player.name ||
                "Jogador",

            position:
                Number(
                    player.position
                ) || null,

            rolled:false,

            result:null

        });

    });


    enemies.forEach(enemy => {

        expectedParticipants.push({

            type:"enemy",

            id:
                enemy.enemyId ||
                enemy.id,

            enemyId:
                enemy.enemyId ||
                enemy.id,

            name:
                enemy.name ||
                "Ameaça",

            position:
                Number(
                    enemy.position
                ) || null,

            rolled:false,

            result:null

        });

    });


    currentTableCampaign.combat.active =
        false;


    currentTableCampaign.combat.round =
        0;


    currentTableCampaign.combat.currentTurnIndex =
        0;


    currentTableCampaign.combat.turnOrder =
        [];


    currentTableCampaign.combat.initiativeRequest = {

        id:
            `initiative_${Date.now()}`,

        active:true,

        requestedAt:
            Date.now(),

        requestedBy:"master",

        participants:
            expectedParticipants

    };


    currentTableCampaign.combat.updatedAt =
        Date.now();


    saveTableCampaign();

    rollEnemyInitiatives();

    saveTableCampaign();


    addSystemChatMessage(
        "O mestre solicitou testes de iniciativa."
    );


    openInitiativeControlPanel();

}

/*==========================================================
=              CONFIRMAR NOVA RODADA
==========================================================*/

function openNextRoundConfirmation(){

    if(
        currentTableRole !== "master"
    ){

        return;

    }


    const combat =
        currentTableCampaign.combat;


    const nextRound =
        Math.max(
            1,
            Number(
                combat.round
            ) + 1
        );


    openTablePanel(
        "COMBATE",
        "Passar Rodada",
        `

        <div class="table-panel-section">

            <div class="table-panel-card">

                <h3>
                    Iniciar Rodada ${nextRound}
                </h3>

                <p>
                    Todos os jogadores e ameaças recuperarão o PA máximo.
                </p>

                <p>
                    O turno voltará ao primeiro participante da iniciativa.
                </p>

            </div>


            <button
                type="button"
                id="confirmNextRoundButton"
                class="primary-button full-button">

                Confirmar nova rodada

            </button>

        </div>

        `
    );


    document
        .getElementById(
            "confirmNextRoundButton"
        )
        ?.addEventListener(
            "click",
            passTableRound
        );

}

/*==========================================================
=              RESTAURAR PA DOS JOGADORES
==========================================================*/

function restorePlayersActionPoints(){

    const players =
        Array.isArray(
            currentTableCampaign.players
        )
            ? currentTableCampaign.players
            : [];


    players.forEach(player => {

        const characterId =
            player.characterId;


        if(!characterId){

            return;

        }


        const character =
            getLiveCharacter(characterId) ||
            tableCharacters.find(
                item =>
                    item.id ===
                    characterId
            );


        if(!character){

            return;

        }


        if(
            !character.status ||
            typeof character.status !== "object"
        ){

            character.status = {};

        }


        const maximum =
            Math.max(
                0,
                Number(
                    character.status.paMax
                ) || 0
            );


        character.status.paAtual =
            maximum;

        saveDamagedCharacter(character);

    });

}

/*==========================================================
=              RESTAURAR PA DAS AMEAÇAS
==========================================================*/

function restoreEnemiesActionPoints(){

    const enemies =
        Array.isArray(
            currentTableCampaign.enemies
        )
            ? currentTableCampaign.enemies
            : [];


    enemies.forEach(enemy => {

        /*
            Suporta ameaça com status.
        */

        if(
            enemy.status &&
            typeof enemy.status === "object"
        ){

            const maximum =
                Math.max(
                    0,
                    Number(
                        enemy.status.paMax
                    ) || 0
                );


            enemy.status.paAtual =
                maximum;


            return;

        }


        /*
            Suporta ameaça com PA diretamente.
        */

        const maximum =
            Math.max(
                0,
                Number(
                    enemy.paMax
                ) || 0
            );


        enemy.paAtual =
            maximum;

    });

}


/*==========================================================
=              LIMPAR BOTÃO ATIVO
==========================================================*/

function clearActiveMenuButtons(){

    document
        .querySelectorAll(
            ".table-menu-button"
        )
        .forEach(button => {

            button.classList.remove(
                "active"
            );

        });

}


/*==========================================================
=                    EVENTOS BASE
==========================================================*/

function bindTableEvents(){

    // Delegação robusta: o token de ameaça sempre abre sua ficha para o Mestre,
    // mesmo quando o token grande ultrapassa visualmente o slot âncora.
    document.addEventListener("click",event=>{
        const token=event.target.closest?.(".combat-token[data-enemy-instance-id]");
        if(!token || currentTableRole!=="master") return;
        if(pendingAttackApplication || pendingDamageApplication) return;
        const id=token.dataset.enemyInstanceId;
        const enemies=Array.isArray(currentTableCampaign?.enemies)?currentTableCampaign.enemies:[];
        const enemy=enemies.find(item=>String(item.enemyId||item.id)===String(id));
        if(!enemy) return;
        event.preventDefault();
        event.stopPropagation();
        openEnemyControlSheet(enemy,Number(enemy.position)||Number(token.dataset.enemyPosition)||1);
    },true);

    leaveTableButton?.addEventListener(
        "click",
        leaveTable
    );

    closeTablePanel?.addEventListener(
        "click",
        closeCurrentPanel
    );

    closePositionModal?.addEventListener(
        "click",
        closeCurrentPositionModal
    );

    closeDiceModal?.addEventListener(
        "click",
        () => {

            diceModal?.classList.add(
                "hidden"
            );

            clearActiveMenuButtons();

        }
    );

    tablePanelOverlay?.addEventListener(
        "click",
        event => {

            if(
                event.target ===
                tablePanelOverlay
            ){

                closeCurrentPanel();

            }

        }
    );

    positionModal?.addEventListener(
        "click",
        event => {

            if(
                event.target ===
                positionModal
            ){

                closeCurrentPositionModal();

            }

        }
    );

}


/*==========================================================
=                    SAIR DA MESA
==========================================================*/

function leaveTable(){

    localStorage.removeItem(
        TABLE_ROLE_STORAGE
    );

    localStorage.removeItem(
        TABLE_CHARACTER_CURRENT
    );

    window.location.href =
        "campanhas.html";

}


/*==========================================================
=                    PAINEL GENÉRICO
==========================================================*/

function openTablePanel(
    label,
    title,
    content
){

    if(
        !tablePanelOverlay ||
        !tablePanelContent
    ){

        return;

    }

    if(tablePanelLabel){

        tablePanelLabel.textContent =
            label;

    }

    if(tablePanelTitle){

        tablePanelTitle.textContent =
            title;

    }

    delete tablePanelContent.dataset.ecoPanelKind;

    tablePanelContent.innerHTML =
        content;

    tablePanelOverlay
        .classList
        .remove("hidden");

}


/*==========================================================
=                    FECHAR PAINEL
==========================================================*/

function closeCurrentPanel(){

    tablePanelOverlay
        ?.classList
        .add("hidden");

    clearActiveMenuButtons();

}


/*==========================================================
=              FECHAR POSIÇÃO
==========================================================*/

function closeCurrentPositionModal(){

    positionModal
        ?.classList
        .add("hidden");

    selectedPosition = null;

}

/*==========================================================
=              HABILIDADES DE REAÇÃO
==========================================================*/

const ATTACK_REACTION_ABILITY_IDS = [

    "desvio-absoluto",

    "revidar",

    "devolver-ataque",

    "sempre-alerta"

];


/*==========================================================
=                    CENÁRIO
==========================================================*/

let activeSceneObjectURL="";

function renderEmptyScene(){
    if(!sceneBackground)return;
    sceneBackground.innerHTML=`<div class="scene-placeholder"><span>✦</span><strong>Nenhum cenário definido</strong><small>O mestre pode adicionar um mapa ou imagem de cenário.</small></div>`;
}

async function loadScene(){

    if(!sceneBackground){

        return;

    }

    const scene =
        currentTableCampaign.scene ||
        currentTableCampaign.background ||
        "";

    if(!scene){renderEmptyScene();return;}

    let source=scene;
    if(String(scene).startsWith("eco-scene:")){
        try{
            const blob=await readTableSceneBlob(String(scene).slice(10));
            if(!blob){renderEmptyScene();return;}
            if(activeSceneObjectURL)URL.revokeObjectURL(activeSceneObjectURL);
            activeSceneObjectURL=URL.createObjectURL(blob);source=activeSceneObjectURL;
        }catch(error){console.error("Falha ao carregar cenário armazenado",error);renderEmptyScene();return;}
    }

    sceneBackground.innerHTML = "";

    const image =
        document.createElement("img");

    image.src = source;

    image.alt =
        "Cenário da campanha";

    image.addEventListener("load",()=>{
        const width=Math.max(1,sceneBackground.clientWidth),height=Math.max(1,sceneBackground.clientHeight);
        image.classList.toggle("scene-image-low-resolution",image.naturalWidth<width||image.naturalHeight<height);
    });
    image.addEventListener("error",()=>renderEmptyScene());

    sceneBackground.appendChild(
        image
    );

}


/*==========================================================
=                    MÚSICA
==========================================================*/

function loadMusic(){

    if(
        !campaignMusicPlayer ||
        !currentTableCampaign.music
    ){

        return;

    }

    campaignMusicPlayer.src =
        currentTableCampaign.music;

    campaignMusicPlayer.volume = window.ECO_SETTINGS
        ? window.ECO_SETTINGS.effectiveMusicVolume(Number(currentTableCampaign.musicVolume ?? .5))
        : Number(currentTableCampaign.musicVolume) || .5;

}

/*==========================================================
=                    MESA.JS - PARTE 2
==========================================================*/

/*==========================================================
=                    FICHA DO JOGADOR
==========================================================*/

/*==========================================================
=                    FICHA DO JOGADOR
==========================================================*/

function openCharacterPanel(){

    refreshCurrentTableCharacter();


    if(!currentTableCharacter){

        return;

    }


    const character =
        currentTableCharacter;


    const attrs =
        character.attributes || {};


    const status =
        character.status || {};


    const defense =
        character.defense || {};


    const damageReduction =
        character.damageReduction || {};


    const lifeMode =
        character.lifeMode === "body"
            ? "body"
            : "classic";


    const defenseTotal =
        Math.max(
            0,
            Number(
                defense.total
            ) || 0
        );


    const rdTotal =
        Math.max(
            0,
            Number(
                damageReduction.total
            ) || 0
        );


    const lifeHTML =
        lifeMode === "body"
            ? createTableBodyLifeHTML(
                character
            )
            : createTableClassicLifeHTML(
                character
            );


    const html = `

        <div class="table-character-sheet">

            <div class="table-character-sheet-content">


                <div class="table-panel-section">

                    <h3 class="table-panel-section-title">

                        ${escapeTableHTML(
                            character.name ||
                            "Personagem"
                        )}

                    </h3>


                    <div class="table-panel-card">

                        <p>

                            Origem:

                            <strong>

                                ${
                                    character.origin
                                        ? escapeTableHTML(
                                            character.origin
                                        )
                                        : "—"
                                }

                            </strong>

                        </p>


                        <p>

                            Nível:

                            <strong>

                                ${Number(
                                    character.level
                                ) || 1}

                            </strong>

                        </p>


                        <p>

                            Sistema de Vida:

                            <strong>

                                ${
                                    lifeMode === "body"
                                        ? "Partes do Corpo"
                                        : "PV Clássico"
                                }

                            </strong>

                        </p>

                    </div>

                </div>


                <div class="table-panel-section">

                    <h3 class="table-panel-section-title">
                        Recursos
                    </h3>


                    <div class="table-panel-list">

                        ${lifeHTML}


                        <div class="table-panel-item">

                            <strong>
                                PD
                            </strong>

                            <span>

                                ${status.pdAtual ?? 0}
                                /
                                ${status.pdMax ?? 0}

                            </span>

                        </div>


                        <div class="table-panel-item">

                            <strong>
                                PA
                            </strong>

                            <span>

                                ${status.paAtual ?? 0}
                                /
                                ${status.paMax ?? 0}

                            </span>

                        </div>


                        <div class="table-panel-item table-defense-item">

                            <strong>
                                Defesa
                            </strong>

                            <span>
                                ${defenseTotal}
                            </span>

                        </div>


                        <div class="table-panel-item table-rd-item">

                            <strong>
                                RD
                            </strong>

                            <span>
                                ${rdTotal}
                            </span>

                        </div>

                    </div>

                </div>


                <div class="table-panel-section">

                    <h3 class="table-panel-section-title">
                        Atributos
                    </h3>


                    <div class="table-panel-list">

                        <div class="table-panel-item">

                            <strong>Corpo</strong>

                            <span>
                                ${attrs.corpo ?? character.corpo ?? 0}
                            </span>

                        </div>


                        <div class="table-panel-item">

                            <strong>Foco</strong>

                            <span>
                                ${attrs.foco ?? character.foco ?? 0}
                            </span>

                        </div>


                        <div class="table-panel-item">

                            <strong>Nexo</strong>

                            <span>
                                ${attrs.nexo ?? character.nexo ?? 0}
                            </span>

                        </div>


                    </div>

                </div>


                ${createTableConditionsSummary(
                    character
                )}


                ${createTableSkillsSummary(
                    character
                )}

            </div>

        </div>

    `;


    openTablePanel(
        "PERSONAGEM",
        "Ficha",
        html
    );


    bindTableCharacterSkillButtons();

}

/*==========================================================
=              VIDA CLÁSSICA NA MESA
==========================================================*/

function ensureCharacterHeart(character){
    if(!character)return null;const level=Math.max(1,Number(character.level)||1),corpo=Math.max(0,Number(character.attributes?.corpo??character.attributes?.for)||0),classicMax=(9*level)+(corpo*2),legacyMax=(7*level)+corpo,bodyMax=Math.max(0,Number(character.bodyMaximums?.chest??character.body?.chestMax??((2*level)+corpo))||0);
    character.status=character.status&&typeof character.status==="object"?character.status:{};if(character.lifeMode!=="body"){const oldMax=Math.max(0,Number(character.status.pvMax)||0),oldCurrent=Math.max(0,Number(character.status.pvAtual)||0);if(!oldMax||oldMax===legacyMax){character.status.pvMax=classicMax;character.status.pvAtual=oldMax>0&&oldCurrent>=oldMax?classicMax:Math.min(classicMax,oldCurrent);}else character.status.pvMax=oldMax;}const heartMax=character.lifeMode==="body"?Math.max(1,bodyMax||Math.ceil(classicMax/4)):Math.ceil(Math.max(0,Number(character.status.pvMax)||classicMax)/4);
    character.heart=character.heart&&typeof character.heart==="object"?character.heart:{};const existingMax=Math.max(0,Number(character.heart.max)||0),existingCurrent=Number(character.heart.current);character.heart.max=heartMax;character.heart.current=Number.isFinite(existingCurrent)?Math.min(heartMax,Math.max(0,existingCurrent)):(existingMax?Math.min(heartMax,existingMax):heartMax);return character.heart;
}
function markCharacterDead(character){character.conditions=Array.isArray(character.conditions)?character.conditions:[];if(!character.conditions.some(condition=>normalizeEnemyAbilityId(typeof condition==="string"?condition:condition.id||condition.name)==="morto"))character.conditions.push({id:"morto",name:"Morto",description:"O Coração chegou a 0 PV.",source:"coracao"});character.status=character.status||{};character.status.paAtual=0;}
function trySoMaisUmPasso(character){
    const abilities=[character?.abilities,character?.acquiredAbilities,character?.habilidades].find(Array.isArray)||[];
    if(!abilities.some(ability=>normalizeEnemyAbilityId(typeof ability==="string"?ability:ability.id||ability.name)==="so-mais-um-passo"))return false;
    const combat=currentTableCampaign?.combat;if(!combat)return false;
    combat.abilityState=combat.abilityState||{};combat.abilityState.heartSurvival=combat.abilityState.heartSurvival||{};
    const key=character.id,uses=Math.max(0,Number(combat.abilityState.heartSurvival[key])||0),limit=Math.max(1,Number(character.attributes?.corpo??character.attributes?.for)||1);
    if(uses>=limit)return false;
    combat.abilityState.heartSurvival[key]=uses+1;character.heart.current=1;
    addSystemChatMessage(`${character.name} utilizou Só Mais um Passo e permaneceu com 1 PV no Coração (${uses+1}/${limit}).`);
    return true;
}

function createTableClassicLifeHTML(
    character
){

    ensureCharacterHeart(character);
    const status =
        character.status || {};


    return `

        <div class="table-panel-item table-life-item">

            <strong>
                PV
            </strong>

            <span>

                ${status.pvAtual ?? 0}
                /
                ${status.pvMax ?? 0}

            </span>

        </div>

        <div class="table-panel-item table-life-item">
            <strong>Coração</strong>
            <span>${character.heart.current} / ${character.heart.max}</span>
        </div>


        <div class="table-panel-item">

            <strong>
                PV Temporário
            </strong>

            <span>
                ${status.pvTemp ?? 0}
            </span>

        </div>

    `;

}

/*==========================================================
=              PARTES DO CORPO NA MESA
==========================================================*/

function createTableBodyLifeHTML(
    character
){

    ensureCharacterHeart(character);
    const body =
        character.body || {};


    const bodyState =
        character.bodyState || {};


    const parts = [

        {
            id:"head",
            label:"Cabeça",
            value:
                body.head
        },

        {
            id:"chest",
            label:"Torso",
            value:
                body.chest
        },

        {
            id:"leftArm",
            label:"Braço Esquerdo",
            value:
                body.leftArm
        },

        {
            id:"rightArm",
            label:"Braço Direito",
            value:
                body.rightArm
        },

        {
            id:"leftLeg",
            label:"Perna Esquerda",
            value:
                body.leftLeg
        },

        {
            id:"rightLeg",
            label:"Perna Direita",
            value:
                body.rightLeg
        }

    ];


    const rows =
        parts
            .map(part => {

                const state =
                    bodyState[part.id] || {
                        type:"natural"
                    };


                return createTableBodyPartRow(
                    part,
                    state
                );

            })
            .join("");


    return `

        <div class="table-body-life">

            <div class="table-body-life-header">

                <strong>
                    Partes do Corpo
                </strong>

                <span>
                    PV atual
                </span>

            </div>


            ${rows}

            <div class="table-panel-item table-body-part heart">
                <strong>Coração</strong>
                <span>${character.heart.current} / ${character.heart.max}</span>
            </div>


            <div class="table-panel-item table-body-temp">

                <strong>
                    PV Temporário
                </strong>

                <span>
                    ${body.temporaryPV ?? 0}
                </span>

            </div>

        </div>

    `;

}

/*==========================================================
=              LINHA DA PARTE DO CORPO
==========================================================*/

function createTableBodyPartRow(
    part,
    state
){

    if(
        state.type === "missing"
    ){

        return `

            <div class="table-panel-item table-body-part missing">

                <strong>
                    ${escapeTableHTML(
                        part.label
                    )}
                </strong>

                <span>
                    Ausente
                </span>

            </div>

        `;

    }


    if(
        state.type === "prosthetic"
    ){

        const currentPV =
            Math.max(
                0,
                Number(
                    state.currentPV ??
                    part.value
                ) || 0
            );


        const maximumPV =
            Math.max(
                0,
                Number(
                    state.maxPV
                ) || 0
            );


        return `

            <div class="table-panel-item table-body-part prosthetic">

                <div class="table-body-part-name">

                    <strong>

                        ${escapeTableHTML(
                            part.label
                        )}

                    </strong>

                    <small>

                        ${escapeTableHTML(
                            state.name ||
                            "Prótese"
                        )}

                    </small>

                </div>

                <span>

                    ${currentPV}
                    /
                    ${maximumPV}

                </span>

            </div>

        `;

    }


    const currentPV =
        Math.max(
            0,
            Number(
                part.value
            ) || 0
        );


    const maximumPV =
        getTableBodyPartMaximum(
            part.id,
            currentPV,
            state
        );


    return `

        <div class="table-panel-item table-body-part natural">

            <strong>

                ${escapeTableHTML(
                    part.label
                )}

            </strong>

            <span>

                ${currentPV}
                /
                ${maximumPV}

            </span>

        </div>

    `;

}

/*==========================================================
=              MÁXIMO DA PARTE DO CORPO
==========================================================*/

function getTableBodyPartMaximum(
    partId,
    currentPV,
    state
){

    if(
        state.type === "prosthetic"
    ){

        return Math.max(
            0,
            Number(
                state.maxPV
            ) || 0
        );

    }


    if(
        state.type === "missing"
    ){

        return 0;

    }


    const character =
        currentTableCharacter;


    const level =
        Math.max(
            1,
            Number(
                character?.level
            ) || 1
        );


    const vig =
        Math.max(
            0,
            Number(
                character
                    ?.attributes
                    ?.vig
            ) || 0
        );


    const vigByLevel =
        vig * level;


    const base =
        (
            partId === "head" ||
            partId === "chest"
        )
            ? 2
            : 1;


    /*
        Se futuramente o editor salvar o máximo,
        ele terá prioridade.
    */

    const savedMaximum =
        Number(
            character
                ?.bodyMaximums
                ?.[partId]
        );


    if(
        Number.isFinite(
            savedMaximum
        )
    ){

        return Math.max(
            0,
            savedMaximum
        );

    }


    return Math.max(
        currentPV,
        base + vigByLevel
    );

}

/*==========================================================
=              CONDIÇÕES NA FICHA LATERAL
==========================================================*/

function createTableConditionsSummary(
    character
){

    const conditions =
        Array.isArray(
            character.conditions
        )
            ? character.conditions
            : [];


    if(!conditions.length){

        return "";

    }


    return `

        <div class="table-panel-section">

            <h3 class="table-panel-section-title">
                Condições
            </h3>


            <div class="table-panel-list">

                ${
                    conditions
                        .map(condition => {

                            const name =
                                typeof condition ===
                                "string"
                                    ? condition
                                    : condition.name ||
                                      "Condição";


                            return `

                                <div class="table-panel-item">

                                    <strong>

                                        ${escapeTableHTML(
                                            name
                                        )}

                                    </strong>

                                </div>

                            `;

                        })
                        .join("")
                }

            </div>

        </div>

    `;

}

/*==========================================================
=              PERÍCIAS NA FICHA LATERAL
==========================================================*/

function createTableSkillsSummary(
    character
){

    const skills =
        Array.isArray(
            character.skills
        )
            ? character.skills
            : [];


    if(!skills.length){

        return "";

    }


    return `

        <div class="table-panel-section">

            <h3 class="table-panel-section-title">
                Perícias
            </h3>


            <div class="table-panel-list">

                ${
                    skills
                        .map(skill => {

                            const training =
                                skill.training &&
                                skill.training !== "0"
                                    ? skill.training
                                    : "Sem treino";


                            return `

                                <button
                                    type="button"
                                    class="table-panel-item table-skill-button"
                                    data-skill="${escapeTableHTML(
                                        skill.id ||
                                        skill.name ||
                                        ""
                                    )}">

                                    <strong>

                                        ${escapeTableHTML(
                                            skill.name ||
                                            "Perícia"
                                        )}

                                    </strong>

                                    <span>

                                        ${escapeTableHTML(
                                            training
                                        )}

                                    </span>

                                </button>

                            `;

                        })
                        .join("")
                }

            </div>

        </div>

    `;

}

/*==========================================================
=              ATUALIZAR PAINEL DA FICHA
==========================================================*/

function refreshOpenCharacterPanel(){

    if(
        !tablePanelOverlay ||
        tablePanelOverlay
            .classList
            .contains("hidden")
    ){

        return;

    }


    if(
        tablePanelTitle
            ?.textContent
            ?.trim() !== "Ficha"
    ){

        return;

    }


    openCharacterPanel();

}

function bindTableCharacterSkillButtons(){

    document
        .querySelectorAll(
            ".table-skill-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    refreshCurrentTableCharacter();


                    rollTableCharacterSkill(
                        currentTableCharacter,
                        button.dataset.skill
                    );

                }
            );

        });

}


/*==========================================================
=                    ATAQUES
==========================================================*/

function openAttacksPanel(){

        refreshCurrentTableCharacter();

    if(!currentTableCharacter){

        return;

    }

    const attacks =
        Array.isArray(
            currentTableCharacter.attacks
        )
            ? currentTableCharacter.attacks
            : [];

    if(attacks.length === 0){

        openTablePanel(
            "COMBATE",
            "Ataques",
            `

            <div class="editor-empty-state">

                <span>⚔</span>

                <p>
                    Nenhum ataque rápido configurado.
                </p>

            </div>

            `
        );

        return;

    }

    const html = attacks
        .slice(0,4)
        .map(
            (attack,index) => `

                <div class="table-panel-card">

                    <h3>
                        ${index + 1}.
                        ${escapeTableHTML(
                            attack.name ||
                            "Ataque"
                        )}
                    </h3>

                    <p>
                        Ataque:
                        ${escapeTableHTML(
                            attack.roll ||
                            "—"
                        )}
                    </p>

                    <p>
                        Dano:
                        ${escapeTableHTML(
                            attack.damage ||
                            "—"
                        )}
                    </p>

                    <div
                        style="
                            display:grid;
                            grid-template-columns:1fr 1fr;
                            gap:8px;
                            margin-top:12px;
                        "
                    >

                        <button
                            type="button"
                            class="primary-button"
                            onclick="rollQuickAttack(${index}, 'attack')">

                            Ataque

                        </button>

                        <button
                            type="button"
                            class="secondary-button"
                            onclick="rollQuickAttack(${index}, 'damage')">

                            Dano

                        </button>

                    </div>

                </div>

            `
        )
        .join("");

    openTablePanel(
        "COMBATE",
        "Ataques",
        `

        <div class="table-panel-list">
            ${html}
        </div>

        `
    );

}


/*==========================================================
=                    INVENTÁRIO
==========================================================*/

function openInventoryPanel(){

    refreshCurrentTableCharacter();

    if(!currentTableCharacter){

        return;

    }

    const inventory =
        Array.isArray(
            currentTableCharacter.inventory
        )
            ? currentTableCharacter.inventory
            : [];

    if(inventory.length === 0){

        openTablePanel(
            "PERSONAGEM",
            "Inventário",
            `

            <div class="editor-empty-state">

                <span>🎒</span>

                <p>
                    O inventário está vazio.
                </p>

            </div>

            `
        );

        return;

    }

    const html = inventory
        .map(item => `

            <div class="table-panel-card">

                <h3>
                    ${escapeTableHTML(
                        item.name ||
                        "Item"
                    )}
                </h3>

                ${
                    item.category
                        ? `
                            <p>
                                ${escapeTableHTML(
                                    item.category
                                )}
                            </p>
                        `
                        : ""
                }

                ${
                    item.description
                        ? `
                            <p>
                                ${escapeTableHTML(
                                    item.description
                                )}
                            </p>
                        `
                        : ""
                }

            </div>

        `)
        .join("");

    openTablePanel(
        "PERSONAGEM",
        "Inventário",
        `

        <div class="table-panel-list">
            ${html}
        </div>

        `
    );

}


/*==========================================================
=                    CONDIÇÕES
==========================================================*/

function openConditionsPanel(){

    refreshCurrentTableCharacter();


    if(!currentTableCharacter){

        return;

    }

    const conditions =
        Array.isArray(
            currentTableCharacter.conditions
        )
            ? currentTableCharacter.conditions
            : [];

    if(conditions.length === 0){

        openTablePanel(
            "ESTADO",
            "Condições",
            `

            <div class="editor-empty-state">

                <span>◈</span>

                <p>
                    Nenhuma condição ativa.
                </p>

            </div>

            `
        );

        return;

    }

    const html =
        conditions
            .map((condition,index) => {

                const name =
                    typeof condition === "string"
                        ? condition
                        : condition.name;

                return `

                    <div class="table-panel-card">

                        <h3>
                            ${escapeTableHTML(
                                name || "Condição"
                            )}
                        </h3>

                        ${
                            typeof condition === "object" &&
                            condition.description
                                ? `
                                    <p>
                                        ${escapeTableHTML(
                                            condition.description
                                        )}
                                    </p>
                                `
                                : ""
                        }

                        ${
                            typeof condition === "object" &&
                            ["mordida-feroz","agarrao-necrotico"].includes(condition.source)
                                ? `<button type="button" class="primary-button enemy-condition-escape" data-condition-index="${index}" style="margin-top:10px">Testar Manobra</button>`
                                : ""
                        }

                    </div>

                `;

            })
            .join("");

    openTablePanel(
        "ESTADO",
        "Condições",
        `

        <div class="table-panel-list">
            ${html}
        </div>

        `
    );

    document.querySelectorAll(".enemy-condition-escape").forEach(button=>button.addEventListener("click",()=>attemptEnemyConditionEscape(Number(button.dataset.conditionIndex))));

}

function attemptEnemyConditionEscape(index){
    refreshCurrentTableCampaign();
    refreshCurrentTableCharacter();
    const character=currentTableCharacter,condition=character?.conditions?.[index];
    if(!character||!condition||!["mordida-feroz","agarrao-necrotico"].includes(condition.source))return;
    const enemy=(currentTableCampaign.enemies||[]).find(item=>String(item.enemyId||item.id)===String(condition.escapeEnemyId));
    if(!enemy){character.conditions.splice(index,1);saveDamagedCharacter(character);openConditionsPanel();return;}
    const playerRoll=rollCharacterManobra(character),skill=enemySkillData(enemy,"Manobra"),training=enemyTrainingDie(skill.rank),modifier=(Number(enemy.corpo)||0)+skill.bonus-skill.penalty,formula=`1d12${training!=="0"?`+${training}`:""}${modifier>=0?"+":""}${modifier}`,enemyResult=rollDiceExpression(formula);
    if(!playerRoll.result||!enemyResult)return;
    addRollChatMessage(`Manobra para escapar • ${character.name}`,playerRoll.formula,playerRoll.result.total,enemyRollDetail(playerRoll.result));
    addRollChatMessage(`Manobra de oposição • ${enemy.name}`,formula,enemyResult.total,enemyRollDetail(enemyResult));
    if(playerRoll.result.total>enemyResult.total){const removed=condition.name||"a condição";character.conditions.splice(index,1);saveDamagedCharacter(character);addSystemChatMessage(`${character.name} venceu a disputa de Manobra e removeu ${removed}.`);}else addSystemChatMessage(`${enemy.name} venceu a disputa. ${character.name} continua sob o efeito.`);
    openConditionsPanel();
}


/*==========================================================
=                    GRIMÓRIO
==========================================================*/

function openGrimoirePanel(){

     refreshCurrentTableCharacter();


    let grimoire = [];

    if(
        currentTableRole === "player" &&
        currentTableCharacter
    ){

        grimoire =
            Array.isArray(
                currentTableCharacter.grimoire
            )
                ? currentTableCharacter.grimoire
                : [];

    }

    if(grimoire.length === 0){

        openTablePanel(
            "PARANORMAL",
            "Grimório",
            `

            <div class="editor-empty-state">

                <span>✦</span>

                <p>
                    Nenhum ritual disponível.
                </p>

            </div>

            `
        );

        return;

    }

    const html =
        grimoire
            .map(ritual => `

                <div class="table-panel-card">

                    <h3>
                        ${escapeTableHTML(
                            ritual.name ||
                            "Ritual"
                        )}
                    </h3>

                    ${
                        ritual.element
                            ? `
                                <p>
                                    Elemento:
                                    ${escapeTableHTML(
                                        ritual.element
                                    )}
                                </p>
                            `
                            : ""
                    }

                    ${
                        ritual.description
                            ? `
                                <p>
                                    ${escapeTableHTML(
                                        ritual.description
                                    )}
                                </p>
                            `
                            : ""
                    }

                </div>

            `)
            .join("");

    openTablePanel(
        "PARANORMAL",
        "Grimório",
        `

        <div class="table-panel-list">
            ${html}
        </div>

        `
    );

}


/*==========================================================
=                    DADOS
==========================================================*/

function openDicePanel(){

    diceModal
        ?.classList
        .remove("hidden");

}


/*==========================================================
=                    ANOTAÇÕES
==========================================================*/

function openNotesPanel(){

    const storageKey =
        currentTableRole === "master"
            ? `ordem_notes_master_${currentTableCampaign.id}`
            : `ordem_notes_${currentTableCampaign.id}_${currentTableCharacter?.id || "player"}`;

    const savedNotes =
        localStorage.getItem(
            storageKey
        ) || "";

    openTablePanel(
        "SESSÃO",
        "Anotações",
        `

        <div class="table-panel-section">

            <textarea
                id="tableNotesTextarea"
                placeholder="Escreva suas anotações..."
                style="
                    min-height:420px;
                    resize:vertical;
                "
            >${escapeTableHTML(savedNotes)}</textarea>

            <button
                type="button"
                id="saveTableNotes"
                class="primary-button">

                Salvar Anotações

            </button>

        </div>

        `
    );

    document
        .getElementById(
            "saveTableNotes"
        )
        ?.addEventListener(
            "click",
            () => {

                const text =
                    document
                        .getElementById(
                            "tableNotesTextarea"
                        )
                        ?.value || "";

                localStorage.setItem(
                    storageKey,
                    text
                );

            }
        );

}


/*==========================================================
=              ROLAR ATAQUE RÁPIDO
==========================================================*/
function rollQuickAttack(
    index,
    type
){

    refreshCurrentTableCharacter();


    if(!currentTableCharacter){

        return;

    }


    const attack =
        currentTableCharacter
            .attacks?.[index];


    if(!attack){

        return;

    }


    let formula =
        type === "damage"
            ? attack.damage
            : attack.roll;


    if(!formula){

        return;

    }


    /*
        Substitui FOR, AGI, INT,
        VIG e PRE pelos valores atuais.
    */

    formula =
        resolveCharacterFormula(
            formula,
            currentTableCharacter
        );

    const npcAssist=currentTableCampaign?.combat?.npcAssists?.[currentTableCharacter.id];
    if(npcAssist&&Number(npcAssist.round)===enemyCombatRound()){
        if(type==="attack"&&npcAssist.attackBonus){formula=`${formula} + ${Number(npcAssist.attackBonus)}`;npcAssist.attackBonus=0;}
        if(type==="damage"&&npcAssist.damageDice){formula=addEnemyDamageDice(formula,Number(npcAssist.damageDice)||1);npcAssist.damageDice=0;}
        saveTableCampaign();
    }


    const result =
        rollDiceExpression(
            formula
        );


    if(!result){

        addSystemChatMessage(
            `Não foi possível interpretar: ${formula}`
        );

        return;

    }

    let playerCritical=false;
    if(type==="attack"){
        const mainRoll=Number(result.details?.find(part=>part.type==="dice")?.rolls?.[0])||0;
        playerCritical=mainRoll===12;
    }


    const detail =
        result.details
            .map(part => {

                if(
                    part.type === "dice"
                ){

                    return `${part.formula} [${part.rolls.join(", ")}]`;

                }


                return String(
                    part.value
                );

            })
            .join(" + ");


addRollChatMessage(

    type === "damage"
        ? `Dano • ${attack.name || "Ataque"}`
        : `Ataque • ${attack.name || "Ataque"}`,

    formula,

    result.total,

    detail,

    {
        rollKind:
            type,

        attackIndex:
            index,

        attackName:
            attack.name ||
            "Ataque",

        attackSkill:
            attack.skill ||
            attack.skillName ||
            attack.testSkill ||
            null,

        playerCritical,

        applied:
            false
    }

);

}


/*==========================================================
=              ROLAR FÓRMULA SIMPLES
==========================================================*/

function rollFormulaToChat(
    formula,
    label
){

    const result =
        parseSimpleDiceFormula(
            formula
        );

    if(!result){

        addSystemChatMessage(
            `Não foi possível interpretar: ${formula}`
        );

        return;

    }

    addRollChatMessage(
        label,
        formula,
        result.total,
        result.detail
    );

}


/*==========================================================
=              INTERPRETAR DADOS
==========================================================*/

function parseSimpleDiceFormula(formula){

    const clean =
        String(formula)
            .replace(/\s+/g,"")
            .toLowerCase();

    const match =
        clean.match(
            /^(\d*)d(\d+)([+-]\d+)?$/
        );

    if(!match){

        return null;

    }

    const amount =
        Number(match[1]) || 1;

    const sides =
        Number(match[2]);

    const modifier =
        Number(match[3]) || 0;

    if(
        amount < 1 ||
        sides < 2 ||
        amount > 100
    ){

        return null;

    }

    const rolls = [];

    let sum = 0;

    for(
        let i=0;
        i<amount;
        i++
    ){

        const roll =
            Math.floor(
                Math.random() * sides
            ) + 1;

        rolls.push(roll);

        sum += roll;

    }

    return {

        total:
            sum + modifier,

        detail:
            `[${rolls.join(", ")}]${
                modifier
                    ? ` ${modifier >= 0 ? "+" : ""}${modifier}`
                    : ""
            }`

    };

}


/*==========================================================
=              PROTEÇÃO HTML
==========================================================*/

function escapeTableHTML(value){

    return String(value)
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");

}

/*==========================================================
=                    MESA.JS - PARTE 3
==========================================================*/

/*==========================================================
=                    AMEAÇAS
==========================================================*/

function openEnemiesPanel(){

    if(currentTableRole !== "master"){

        return;

    }

    let enemies = [];

    try{

        enemies =
            JSON.parse(
                localStorage.getItem(
                    "ordem_threats"
                )
            ) || [];

    }
    catch{

        enemies = [];

    }

    if(!Array.isArray(enemies)){

        enemies = [];

    }

    enemies=enemies.filter(enemy=>enemy.type!=="npc");

    if(enemies.length === 0){

        openTablePanel(
            "CONTROLE",
            "Ameaças",
            `

            <div class="editor-empty-state">

                <span>☠</span>

                <p>
                    Nenhuma ameaça criada.
                </p>

            </div>

            `
        );

        return;

    }

    const html =
        enemies
            .map(enemy => `

                <div class="table-panel-card">

                    <h3>
                        ${escapeTableHTML(
                            enemy.name ||
                            "Ameaça"
                        )}
                    </h3>

                    ${
                        enemy.element
                            ? `
                                <p>
                                    Elemento:
                                    ${escapeTableHTML(
                                        enemy.element
                                    )}
                                </p>
                            `
                            : ""
                    }

                    ${
                        enemy.level
                            ? `
                                <p>
                                    Nível:
                                    ${escapeTableHTML(
                                        enemy.level
                                    )}
                                </p>
                            `
                            : ""
                    }

                    <button
                        type="button"
                        class="primary-button enemy-place-button"
                        data-enemy-id="${escapeTableHTML(
                            enemy.id
                        )}"
                        style="margin-top:12px;width:100%;">

                        Colocar no Cenário

                    </button>

                </div>

            `)
            .join("");

    openTablePanel(
        "CONTROLE",
        "Ameaças",
        `

        <div class="table-panel-list">
            ${html}
        </div>

        `
    );

    document
        .querySelectorAll(
            ".enemy-place-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    startEnemyPlacement(
                        button.dataset.enemyId
                    );

                }
            );

        });

}


/*==========================================================
=              INICIAR POSICIONAMENTO AMEAÇA
==========================================================*/

function startEnemyPlacement(enemyId){

    let enemies = [];

    try{

        enemies =
            JSON.parse(
                localStorage.getItem(
                    "ordem_threats"
                )
            ) || [];

    }
    catch{

        enemies = [];

    }

    const enemy =
        enemies.find(
            item =>
                String(item.id) ===
                String(enemyId)
        );

    if(!enemy){

        return;

    }

    closeCurrentPanel();

    openPositionSelector(
        "enemy",
        enemy
    );

}


/*==========================================================
=                    NPCs
==========================================================*/

function openNPCPanel(){

    if(currentTableRole !== "master"){

        return;

    }

    let npcs=[];
    try{npcs=(JSON.parse(localStorage.getItem("ordem_threats")||"[]")||[]).filter(item=>item.type==="npc");}catch{npcs=[];}

    if(npcs.length === 0){

        openTablePanel(
            "CONTROLE",
            "NPCs",
            `

            <div class="editor-empty-state">

                <span>♟</span>

                <p>
                    Nenhum NPC disponível nesta campanha.
                </p>

            </div>

            `
        );

        return;

    }

    const html =
        npcs
            .map(npc => `

                <div class="table-panel-card">

                    <h3>
                        ${escapeTableHTML(
                            npc.name ||
                            "NPC"
                        )}
                    </h3>

                    ${
                        npc.description
                            ? `
                                <p>
                                    ${escapeTableHTML(
                                        npc.description
                                    )}
                                </p>
                            `
                            : ""
                    }

                    <button
                        type="button"
                        class="primary-button npc-place-button"
                        data-npc-id="${escapeTableHTML(
                            npc.id
                        )}"
                        style="margin-top:12px;width:100%;">

                        ${(currentTableCampaign.npcs||[]).some(item=>String(item.templateId||item.id)===String(npc.id))?"Já está entre os aliados":"Adicionar aos Aliados"}

                    </button>

                </div>

            `)
            .join("");

    openTablePanel(
        "CONTROLE",
        "NPCs",
        `

        <div class="table-panel-list">
            ${html}
        </div>

        `
    );

    document
        .querySelectorAll(
            ".npc-place-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const npc =
                        npcs.find(
                            item =>
                                String(item.id) ===
                                String(button.dataset.npcId)
                        );

                    if(!npc){

                        return;

                    }

                    if(!Array.isArray(currentTableCampaign.npcs))currentTableCampaign.npcs=[];
                    if(currentTableCampaign.npcs.some(item=>String(item.templateId||item.id)===String(npc.id))){
                        addSystemChatMessage(`${npc.name||"O NPC"} já está disponível em Aliados.`);
                        return;
                    }
                    const level=Math.max(1,Math.min(3,Number(npc.npcLevel)||1)),instanceId=`npc-instance-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
                    currentTableCampaign.npcs.push({...npc,id:instanceId,npcId:instanceId,templateId:npc.id,position:null,size:1,pv:level*25,status:{pvAtual:level*25,pvMax:level*25},helpState:{}});
                    saveTableCampaign();
                    addSystemChatMessage(`${npc.name||"O NPC"} foi adicionado aos Aliados da campanha.`);
                    openNPCPanel();

                }
            );

        });

}

function openAlliesPanel(){
    refreshCurrentTableCampaign();
    const npcs=Array.isArray(currentTableCampaign?.npcs)?currentTableCampaign.npcs:[];
    if(!npcs.length){
        openTablePanel("ALIADOS","Aliados",`<div class="editor-empty-state"><span>♟</span><p>O mestre ainda não adicionou aliados à campanha.</p></div>`);
        return;
    }
    openTablePanel("ALIADOS","Solicitar ajuda",`<div class="table-panel-list">${npcs.map(npc=>`<button type="button" class="table-panel-card ally-open-button" data-ally-id="${escapeTableHTML(npc.npcId||npc.id)}" style="width:100%;text-align:left"><h3>${escapeTableHTML(npc.name||"NPC")}</h3><p>${escapeTableHTML(npcRoleLabel(npc.npcRole))} • Nível ${Math.max(1,Math.min(3,Number(npc.npcLevel)||1))}${npcUsedThisRound(npc)?" • Ajuda já usada nesta rodada":" • Ajuda disponível"}</p></button>`).join("")}</div>`);
    document.querySelectorAll(".ally-open-button").forEach(button=>button.addEventListener("click",()=>{const npc=npcs.find(item=>String(item.npcId||item.id)===String(button.dataset.allyId));if(npc)openNpcControlSheet(npc,null)}));
}


/*==========================================================
=                    MAPA
==========================================================*/

function openMapPanel(){

    if(currentTableRole !== "master"){

        return;

    }

    openTablePanel(
        "CENÁRIO",
        "Mapa",
        `

        <div class="table-panel-section">

            <h3 class="table-panel-section-title">
                Cenário Atual
            </h3>

            <div class="table-panel-card">

                <p>
                    Troque a imagem exibida no centro da mesa.
                </p>

                <button
                    type="button"
                    id="uploadSceneButton"
                    class="primary-button"
                    style="width:100%;margin-top:12px;">

                    Selecionar Cenário

                </button>

                <button
                    type="button"
                    id="removeSceneButton"
                    class="secondary-button"
                    style="width:100%;margin-top:10px;">

                    Remover Cenário

                </button>

            </div>

        </div>

        `
    );

    document
        .getElementById(
            "uploadSceneButton"
        )
        ?.addEventListener(
            "click",
            () => {

                sceneUploadInput?.click();

            }
        );

    document
        .getElementById(
            "removeSceneButton"
        )
        ?.addEventListener(
            "click",
            removeScene
        );

}


/*==========================================================
=              UPLOAD DO CENÁRIO
==========================================================*/

sceneUploadInput?.addEventListener(
    "change",
    async () => {

        const file =
            sceneUploadInput.files?.[0];

        if(!file){

            return;

        }

        const previousScene=currentTableCampaign.scene||"";
        try{
            const image=await tableSceneFileToBlob(file),sceneKey=`${currentTableCampaign.id}:${Date.now()}`;
            await writeTableSceneBlob(sceneKey,image);
            currentTableCampaign.scene=`eco-scene:${sceneKey}`;
            if(saveTableCampaign()===false){currentTableCampaign.scene=previousScene;await deleteTableSceneBlob(sceneKey);throw new Error("Não foi possível salvar a referência da imagem.");}
            if(String(previousScene).startsWith("eco-scene:"))await deleteTableSceneBlob(String(previousScene).slice(10));
            await loadScene();
            closeCurrentPanel();
            addSystemChatMessage("O mestre alterou o cenário.");
        }catch(error){
            console.error("Falha ao adicionar cenário",error);
            addSystemChatMessage("Não foi possível adicionar o cenário. Tente uma imagem PNG, JPG ou WEBP de até 20 MB.");
        }finally{
            sceneUploadInput.value="";
        }

    }
);


/*==========================================================
=              REMOVER CENÁRIO
==========================================================*/

async function removeScene(){

    const previousScene=currentTableCampaign.scene||"";
    currentTableCampaign.scene = "";

    saveTableCampaign();

    if(String(previousScene).startsWith("eco-scene:"))await deleteTableSceneBlob(String(previousScene).slice(10));
    if(activeSceneObjectURL){URL.revokeObjectURL(activeSceneObjectURL);activeSceneObjectURL="";}
    renderEmptyScene();

    closeCurrentPanel();

    addSystemChatMessage(
        "O cenário foi removido."
    );

}


/*==========================================================
=                    MÚSICA
==========================================================*/

function openMusicPanel(){

    if(currentTableRole !== "master"){

        return;

    }

    const volume =
        Number(
            currentTableCampaign.musicVolume
        );

    const safeVolume =
        Number.isFinite(volume)
            ? volume
            : .5;

    openTablePanel(
        "ÁUDIO",
        "Música",
        `

        <div class="table-panel-section">

            <div class="table-panel-card">

                <h3>
                    Música da Campanha
                </h3>

                <p>
                    Escolha um arquivo de áudio para tocar durante a sessão.
                </p>

                <button
                    type="button"
                    id="uploadMusicButton"
                    class="primary-button"
                    style="width:100%;margin-top:12px;">

                    Selecionar Música

                </button>

            </div>

            <div class="table-panel-card">

                <h3>
                    Volume
                </h3>

                <input
                    type="range"
                    id="tableMusicVolume"
                    min="0"
                    max="100"
                    value="${Math.round(
                        safeVolume * 100
                    )}">

            </div>

            <div
                style="
                    display:grid;
                    grid-template-columns:1fr 1fr;
                    gap:10px;
                "
            >

                <button
                    type="button"
                    id="playTableMusic"
                    class="primary-button">

                    ▶ Tocar

                </button>

                <button
                    type="button"
                    id="pauseTableMusic"
                    class="secondary-button">

                    ⏸ Pausar

                </button>

            </div>

            <button
                type="button"
                id="removeTableMusic"
                class="secondary-button"
                style="width:100%;">

                Remover Música

            </button>

        </div>

        `
    );

    document
        .getElementById(
            "uploadMusicButton"
        )
        ?.addEventListener(
            "click",
            () => {

                musicUploadInput?.click();

            }
        );

    document
        .getElementById(
            "playTableMusic"
        )
        ?.addEventListener(
            "click",
            playTableMusic
        );

    document
        .getElementById(
            "pauseTableMusic"
        )
        ?.addEventListener(
            "click",
            pauseTableMusic
        );

    document
        .getElementById(
            "removeTableMusic"
        )
        ?.addEventListener(
            "click",
            removeTableMusic
        );

    document
        .getElementById(
            "tableMusicVolume"
        )
        ?.addEventListener(
            "input",
            event => {

                const value =
                    Number(
                        event.target.value
                    ) / 100;

                currentTableCampaign.musicVolume =
                    value;

                if(campaignMusicPlayer){

                    campaignMusicPlayer.volume = window.ECO_SETTINGS
                        ? window.ECO_SETTINGS.effectiveMusicVolume(value)
                        : value;

                }

                saveTableCampaign();

            }
        );

}


/*==========================================================
=              UPLOAD DE MÚSICA
==========================================================*/

musicUploadInput?.addEventListener(
    "change",
    async () => {

        const file =
            musicUploadInput.files?.[0];

        if(!file){

            return;

        }

        const audio =
            await tableFileToBase64(
                file
            );

        currentTableCampaign.music =
            audio;

        if(
            currentTableCampaign.musicVolume ===
            undefined
        ){

            currentTableCampaign.musicVolume =
                .5;

        }

        saveTableCampaign();

        loadMusic();

        addSystemChatMessage(
            "O mestre alterou a música da campanha."
        );

        musicUploadInput.value = "";

    }
);


/*==========================================================
=              TOCAR MÚSICA
==========================================================*/

async function playTableMusic(){

    if(
        !campaignMusicPlayer ||
        !currentTableCampaign.music
    ){

        addSystemChatMessage(
            "Nenhuma música foi selecionada."
        );

        return;

    }

    try{

        await campaignMusicPlayer.play();

        currentTableCampaign.musicPlaying =
            true;

        saveTableCampaign();

    }
    catch(error){

        console.error(
            "Não foi possível iniciar o áudio:",
            error
        );

    }

}


/*==========================================================
=              PAUSAR MÚSICA
==========================================================*/

function pauseTableMusic(){

    campaignMusicPlayer?.pause();

    currentTableCampaign.musicPlaying =
        false;

    saveTableCampaign();

}


/*==========================================================
=              REMOVER MÚSICA
==========================================================*/

function removeTableMusic(){

    currentTableCampaign.music = "";

    currentTableCampaign.musicPlaying =
        false;

    saveTableCampaign();

    if(campaignMusicPlayer){

        campaignMusicPlayer.pause();

        campaignMusicPlayer.removeAttribute(
            "src"
        );

        campaignMusicPlayer.load();

    }

    closeCurrentPanel();

    addSystemChatMessage(
        "A música da campanha foi removida."
    );

}


/*==========================================================
=              SELETOR DE POSIÇÃO
==========================================================*/

function openPositionSelector(
    type,
    entity
){

    if(!positionModal){

        return;

    }

    selectedPosition = {

        type,

        entity

    };

    if(positionModalTitle){

        positionModalTitle.textContent =
            type === "enemy"
                ? "Posicionar Ameaça"
                : "Posicionar NPC";

    }

    let positions = [];

    if(type === "enemy"){

        positions = [1,2,3,4,5,6];

    }
    else{

        positions = [1,2,3];

    }

    if(type==="enemy"){
        const size=Math.max(1,Number(entity.size)||1);
        positions=positions.filter(position=>{
            const wanted=[];
            for(let i=0;i<size;i++) wanted.push(position-i);
            if(wanted.some(p=>p<1)) return false;
            const current=Array.isArray(currentTableCampaign.enemies)?currentTableCampaign.enemies:[];
            return !current.some(item=>{
                const anchor=Number(item.position),itemSize=Math.max(1,Number(item.size)||1),slots=[];
                for(let i=0;i<itemSize;i++) slots.push(anchor-i);
                return slots.some(p=>wanted.includes(p));
            });
        });
    }

    const buttons =
        positions
            .map(position => `

                <button
                    type="button"
                    class="position-select-button"
                    data-position="${position}">

                    Posição ${position}

                </button>

            `)
            .join("");

    positionModalBody.innerHTML = `

        <div class="table-panel-card">

            <h3>
                ${escapeTableHTML(
                    entity.name ||
                    "Entidade"
                )}
            </h3>

            <p>
                Escolha a posição que será ocupada.
            </p>

        </div>

        <div
            style="
                display:grid;
                grid-template-columns:repeat(2,1fr);
                gap:10px;
            "
        >

            ${buttons}

        </div>

    `;

    positionModal
        .classList
        .remove("hidden");

    document
        .querySelectorAll(
            ".position-select-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    placeEntityAtPosition(
                        type,
                        entity,
                        Number(
                            button.dataset.position
                        )
                    );

                }
            );

        });

}


/*==========================================================
=              COLOCAR ENTIDADE NA POSIÇÃO
==========================================================*/

function placeEntityAtPosition(type,entity,position){
    if(type==="enemy"){
        if(!Array.isArray(currentTableCampaign.enemies))currentTableCampaign.enemies=[];
        const size=Math.max(1,Number(entity.size)||1),occupied=[];
        for(let i=0;i<size;i++)occupied.push(position-i);
        if(occupied.some(p=>p<1||p>6)){alert("Esta criatura precisa de "+size+" posições consecutivas.");return;}
        const entityId=entity.enemyId||entity.id;
        const existing=currentTableCampaign.enemies.find(
            item=>String(item.enemyId||item.id)===String(entityId)
        );
        const collision=currentTableCampaign.enemies.some(item=>{
            if(existing&&String(item.enemyId||item.id)===String(entityId))return false;
            const anchor=Number(item.position),itemSize=Math.max(1,Number(item.size)||1),slots=[];
            for(let i=0;i<itemSize;i++)slots.push(anchor-i);
            return slots.some(p=>occupied.includes(p));
        });
        if(collision){alert("Não há espaço livre suficiente nessas posições.");return;}
        if(existing){
            const moved=Number(existing.position)!==Number(position);
            existing.position=position;
            existing.occupiedPositions=occupied;
            if(moved&&enemyHasAbility(existing,"investida")){
                const state=enemyAbilityState(existing);
                state.investidaMovedRound=enemyCombatRound();
                state.investidaArmed=false;
            }
        }else{
            const instanceId="enemy-instance-"+Date.now()+"-"+Math.random().toString(36).slice(2,7);
            const paMax=Math.max(0,Number(entity.pa)||0);
            const placedEnemy=applyEnemyPassiveStats(JSON.parse(JSON.stringify(entity)));
            currentTableCampaign.enemies.push({...placedEnemy,id:instanceId,enemyId:instanceId,templateId:entity.id,position,occupiedPositions:occupied,paMax,paAtual:paMax,status:{pvAtual:Number(placedEnemy.pv)||0,pvMax:Number(placedEnemy.pv)||0,paAtual:paMax,paMax}});
        }
    }else{
        if(!Array.isArray(currentTableCampaign.npcs))currentTableCampaign.npcs=[];
        const entityId=entity.npcId||entity.id,existing=currentTableCampaign.npcs.find(npc=>String(npc.npcId||npc.id)===String(entityId));
        currentTableCampaign.npcs=currentTableCampaign.npcs.filter(npc=>npc.position!==position&&String(npc.npcId||npc.id)!==String(entityId));
        const level=Math.max(1,Math.min(3,Number(entity.npcLevel)||1)),instanceId=existing?.npcId||`npc-instance-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
        currentTableCampaign.npcs.push({...existing,...entity,id:instanceId,npcId:instanceId,templateId:entity.id,position,size:1,pv:level*25,status:existing?.status||{pvAtual:level*25,pvMax:level*25},helpState:existing?.helpState||{}});
    }
    saveTableCampaign();closeCurrentPositionModal();renderCombatPositions();
    addSystemChatMessage(`${entity.name||"Entidade"} foi colocado na posição ${position}.`);
}

/*==========================================================
=              SALVAR CAMPANHA
==========================================================*/

function saveTableCampaign(){

    const index =
        tableCampaigns.findIndex(
            campaign =>
                campaign.id ===
                currentTableCampaign.id
        );

    if(index === -1){

        return;

    }

    currentTableCampaign.updatedAt =
        Date.now();

    tableCampaigns[index] =
        currentTableCampaign;

    try{
        localStorage.setItem(
            TABLE_CAMPAIGN_STORAGE,
            JSON.stringify(
                tableCampaigns
            )
        );
        return true;
    }catch(error){
        console.error("Falha ao salvar campanha",error);
        return false;
    }

}


/*==========================================================
=              ARQUIVO -> BASE64
==========================================================*/

function tableFileToBase64(file){

    return new Promise(
        (resolve,reject) => {

            const reader =
                new FileReader();

            reader.onload =
                () => resolve(
                    reader.result
                );

            reader.onerror =
                reject;

            reader.readAsDataURL(
                file
            );

        }
    );

}

function tableSceneFileToDataURL(file){
    if(!file||!/^image\/(png|jpe?g|webp)$/i.test(file.type||""))return Promise.reject(new Error("Formato de imagem inválido."));
    if(file.size>20*1024*1024)return Promise.reject(new Error("Imagem maior que 20 MB."));
    return new Promise((resolve,reject)=>{
        const url=URL.createObjectURL(file),image=new Image();
        image.onload=()=>{
            try{
                const maxWidth=1920,maxHeight=1080,scale=Math.min(1,maxWidth/image.naturalWidth,maxHeight/image.naturalHeight),width=Math.max(1,Math.round(image.naturalWidth*scale)),height=Math.max(1,Math.round(image.naturalHeight*scale)),canvas=document.createElement("canvas"),context=canvas.getContext("2d",{alpha:false});
                canvas.width=width;canvas.height=height;
                context.imageSmoothingEnabled=true;context.imageSmoothingQuality="high";context.drawImage(image,0,0,width,height);
                URL.revokeObjectURL(url);
                resolve(canvas.toDataURL("image/webp",.86));
            }catch(error){URL.revokeObjectURL(url);reject(error);}
        };
        image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("A imagem não pôde ser lida."));};
        image.src=url;
    });
}

function tableSceneFileToBlob(file){
    if(!file||!/^image\/(png|jpe?g|webp)$/i.test(file.type||""))return Promise.reject(new Error("Formato de imagem inválido."));
    if(file.size>20*1024*1024)return Promise.reject(new Error("Imagem maior que 20 MB."));
    return new Promise((resolve,reject)=>{
        const url=URL.createObjectURL(file),image=new Image();
        image.onload=()=>{
            try{
                const maxWidth=1920,maxHeight=1080,scale=Math.min(1,maxWidth/image.naturalWidth,maxHeight/image.naturalHeight),width=Math.max(1,Math.round(image.naturalWidth*scale)),height=Math.max(1,Math.round(image.naturalHeight*scale)),canvas=document.createElement("canvas"),context=canvas.getContext("2d",{alpha:false});
                canvas.width=width;canvas.height=height;context.imageSmoothingEnabled=true;context.imageSmoothingQuality="high";context.drawImage(image,0,0,width,height);
                URL.revokeObjectURL(url);canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("Falha ao processar cenário.")),"image/webp",.86);
            }catch(error){URL.revokeObjectURL(url);reject(error);}
        };
        image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("A imagem não pôde ser lida."));};image.src=url;
    });
}

function openTableSceneDatabase(){
    return new Promise((resolve,reject)=>{const request=indexedDB.open("eco_table_assets",1);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains("scenes"))db.createObjectStore("scenes")};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error("Falha ao abrir armazenamento de cenários."));});
}
async function writeTableSceneBlob(key,blob){const db=await openTableSceneDatabase();return new Promise((resolve,reject)=>{const tx=db.transaction("scenes","readwrite");tx.objectStore("scenes").put(blob,key);tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>{db.close();reject(tx.error)}});}
async function readTableSceneBlob(key){const db=await openTableSceneDatabase();return new Promise((resolve,reject)=>{const tx=db.transaction("scenes","readonly"),request=tx.objectStore("scenes").get(key);request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(request.error);tx.oncomplete=()=>db.close()});}
async function deleteTableSceneBlob(key){if(!key)return;try{const db=await openTableSceneDatabase();await new Promise((resolve,reject)=>{const tx=db.transaction("scenes","readwrite");tx.objectStore("scenes").delete(key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close();}catch(error){console.warn("Não foi possível remover o cenário antigo",error);}}

/*==========================================================
=                    MESA.JS - PARTE 4
==========================================================*/

/*==========================================================
=              PARTICIPANTE DO TURNO ATUAL
==========================================================*/

function getCurrentTurnParticipant(){

    const combat =
        currentTableCampaign
            ?.combat;


    if(
        !combat ||
        combat.active !== true ||
        !Array.isArray(
            combat.turnOrder
        ) ||
        combat.turnOrder.length === 0
    ){

        return null;

    }


    const index =
        Math.max(
            0,
            Number(
                combat.currentTurnIndex
            ) || 0
        );


    return (
        combat.turnOrder[index] ||
        null
    );

}


/*==========================================================
=              VERIFICAR TOKEN DO TURNO
==========================================================*/

function isEntityCurrentTurn(
    entity,
    type
){

    if(!entity){

        return false;

    }


    const participant =
        getCurrentTurnParticipant();


    if(!participant){

        return false;

    }


    if(type === "player"){

        return (
            participant.type === "player" &&
            participant.characterId ===
            entity.characterId
        );

    }


    if(type === "enemy"){

        const enemyId =
            entity.enemyId ||
            entity.id;


        return (
            participant.type === "enemy" &&
            (
                String(participant.enemyId) ===
                String(enemyId) ||
                String(participant.id) ===
                String(enemyId)
            )
        );

    }


    return false;

}


/*==========================================================
=              PODE PASSAR O TURNO
==========================================================*/

function canPassCurrentTurn(){

    const participant =
        getCurrentTurnParticipant();


    if(!participant){

        return false;

    }


    if(
        currentTableRole === "master"
    ){

        return true;

    }


    return (
        currentTableRole === "player" &&
        participant.type === "player" &&
        participant.characterId ===
        currentTableCharacter?.id
    );

}

/*==========================================================
=              PASSAR TURNO
==========================================================*/

function passCurrentCombatTurn(){

    refreshCurrentTableCampaign();


    const combat =
        currentTableCampaign
            ?.combat;


    if(
        !combat ||
        combat.active !== true ||
        !Array.isArray(
            combat.turnOrder
        ) ||
        combat.turnOrder.length === 0
    ){

        return;

    }


    if(!canPassCurrentTurn()){

        addSystemChatMessage(
            "Você não pode passar este turno."
        );

        return;

    }


    const currentParticipant =
        getCurrentTurnParticipant();


    const nextIndex =
        Number(
            combat.currentTurnIndex
        ) + 1;


    /*
        Chegou ao final da ordem.
        O mestre precisa passar a rodada.
    */

    if(
        nextIndex >=
        combat.turnOrder.length
    ){

        combat.currentTurnIndex =
            combat.turnOrder.length - 1;


        combat.waitingNextRound =
            true;


        combat.updatedAt =
            Date.now();


        saveTableCampaign();


        renderCombatPositions();


        addSystemChatMessage(
            "Todos os participantes agiram. O mestre deve passar a rodada."
        );


        return;

    }


    combat.currentTurnIndex =
        nextIndex;


    combat.waitingNextRound =
        false;


    combat.updatedAt =
        Date.now();

    const incomingParticipant=combat.turnOrder[nextIndex];
    if(incomingParticipant?.type==="enemy"){
        const incomingEnemy=(currentTableCampaign.enemies||[]).find(item=>String(item.enemyId||item.id)===String(incomingParticipant.enemyId||incomingParticipant.id));
        if(incomingEnemy) incomingEnemy.combatPressure=0;
    }
    else{
        const incomingCharacter=getLiveCharacter(incomingParticipant?.characterId||incomingParticipant?.id);
        if(incomingCharacter){
            incomingCharacter.combatPressure=0;
            const pendingPA=Math.max(0,Number(incomingCharacter.nextRoundTemporaryPA)||0);
            if(pendingPA){incomingCharacter.status=incomingCharacter.status||{};incomingCharacter.status.paAtual=Math.max(0,Number(incomingCharacter.status.paAtual)||0)+pendingPA;incomingCharacter.nextRoundTemporaryPA=0;addSystemChatMessage(`${incomingCharacter.name} recebeu +${pendingPA} PA temporário de Dor é uma Bênção.`);}
            saveDamagedCharacter(incomingCharacter);
        }
    }


    saveTableCampaign();


    renderCombatPositions();


    const nextParticipant =
        getCurrentTurnParticipant();


    addSystemChatMessage(
        `${currentParticipant?.name || "Participante"} passou o turno. Agora é a vez de ${nextParticipant?.name || "outro participante"}.`
    );

}

/*==========================================================
=              RENDERIZAR POSIÇÕES
==========================================================*/

function renderCombatPositions(){

    renderPlayerPositions();

    renderEnemyPositions();

    renderNPCPositions();

}


/*==========================================================
=              JOGADORES
==========================================================*/

function renderPlayerPositions(){

    const playerSlots =
        document.querySelectorAll(
            ".player-position"
        );

    playerSlots.forEach(slot => {

        const position =
            Number(
                slot.dataset.position
            );

        const tokenSlot =
            slot.querySelector(
                ".position-token-slot"
            );

        if(!tokenSlot){

            return;

        }

        const player =
            Array.isArray(
                currentTableCampaign.players
            )
                ? currentTableCampaign.players.find(
                    item =>
                        Number(item.position) ===
                        position
                )
                : null;

        renderPositionSlot(
            slot,
            tokenSlot,
            player,
            "player",
            position
        );

    });

}


/*==========================================================
=              AMEAÇAS
==========================================================*/

function renderEnemyPositions(){
    const enemySlots=[...document.querySelectorAll(".enemy-position")];
    enemySlots.forEach(slot=>{
        slot.classList.remove("enemy-anchor","enemy-covered");
        slot.style.zIndex="";
        const tokenSlot=slot.querySelector(".position-token-slot");
        if(tokenSlot){
            tokenSlot.style.width="";
            tokenSlot.style.height="";
            tokenSlot.style.borderRadius="";
            tokenSlot.style.overflow="";
            tokenSlot.style.zIndex="";
        }
    });
    const enemies=Array.isArray(currentTableCampaign.enemies)?currentTableCampaign.enemies:[];
    enemySlots.forEach(slot=>{
        const position=Number(slot.dataset.position);
        const tokenSlot=slot.querySelector(".position-token-slot");
        if(!tokenSlot)return;
        const enemy=enemies.find(item=>Number(item.position)===position);
        if(enemy){
            renderPositionSlot(slot,tokenSlot,enemy,"enemy",position);
            const size=Math.max(1,Number(enemy.size)||1);
            if(size>1){
                slot.classList.add("enemy-anchor");
                slot.style.zIndex="30";
                const base=72;
                const diameter=base*Math.sqrt(size);
                tokenSlot.style.width=diameter+"px";
                tokenSlot.style.height=diameter+"px";
                tokenSlot.style.borderRadius="50%";
                tokenSlot.style.overflow="visible";
                tokenSlot.style.zIndex="30";
                for(let i=1;i<size;i++){
                    const covered=enemySlots.find(s=>Number(s.dataset.position)===position-i);
                    if(covered)covered.classList.add("enemy-covered");
                }
            }
        }else{
            const covered=enemies.some(item=>{
                const anchor=Number(item.position),size=Math.max(1,Number(item.size)||1);
                return position<anchor&&position>anchor-size;
            });
            if(!covered)renderPositionSlot(slot,tokenSlot,null,"enemy",position);
        }
    });
}
/*==========================================================
=              NPCs
==========================================================*/

function renderNPCPositions(){

    const npcSlots =
        document.querySelectorAll(
            ".npc-position"
        );

    npcSlots.forEach(slot => {

        const position =
            Number(
                slot.dataset.npcPosition
            );

        const tokenSlot =
            slot.querySelector(
                ".position-token-slot"
            );

        if(!tokenSlot){

            return;

        }

        const npc =
            Array.isArray(
                currentTableCampaign.npcs
            )
                ? currentTableCampaign.npcs.find(
                    item =>
                        Number(item.position) ===
                        position
                )
                : null;

        renderPositionSlot(
            slot,
            tokenSlot,
            npc,
            "npc",
            position
        );

    });

}


/*==========================================================
=              RENDERIZAR SLOT
==========================================================*/

function renderPositionSlot(
    container,
    tokenSlot,
    entity,
    type,
    position
){

    tokenSlot.innerHTML = "";

    container
    .querySelectorAll(
        ".combat-turn-indicator, .combat-pass-turn-button"
    )
    .forEach(element => element.remove());

    container.classList.toggle(
        "occupied",
        Boolean(entity)
    );

    const currentTurn =
    isEntityCurrentTurn(
        entity,
        type
    );


container.classList.toggle(
    "current-turn",
    currentTurn
);

    if(entity){

        const token =
            document.createElement("div");

        token.className =
            "combat-token";
        if(type==="enemy"){
            token.dataset.enemyInstanceId=entity.enemyId||entity.id||"";
            token.dataset.enemyPosition=String(position);
        }

        let photo = "";

        if(currentTurn){

    token.classList.add(
        "current-turn"
    );

}


if(
    type === "player" &&
    entity.characterId
){

    const character =
        getLiveCharacter(
            entity.characterId
        );


    if(character){

        photo =
            getCharacterCurrentPhoto(
                character
            );

    }

}
else{

    if(type === "enemy"){
        entity = hydrateEnemyMedia(entity);
    }

    const enemyIsWounded =
        type === "enemy" &&
        Array.isArray(entity.conditions) &&
        entity.conditions.some(condition =>
            String(
                typeof condition === "string"
                    ? condition
                    : condition.id || condition.name || ""
            ).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase() ===
            "machucado"
        );

    photo =
        (enemyIsWounded
            ? entity.woundedPhoto
            : "") ||
        entity.photo ||
        entity.image ||
        "";

}

        if(photo){

            const image =
                document.createElement("img");

            image.src = photo;

            image.alt =
                entity.name || "Token";

            token.appendChild(image);

        }
        else{

            const fallback =
                document.createElement("div");

            fallback.className =
                "combat-token-fallback";

            fallback.textContent =
                type === "enemy"
                    ? "☠"
                    : type === "npc"
                        ? "♟"
                        : "👤";

            token.appendChild(
                fallback
            );

        }

        const name =
            document.createElement("span");

        name.className =
            "combat-token-name";

        name.textContent =
            entity.name ||
            "Sem nome";

        token.appendChild(name);

 



        tokenSlot.appendChild(
            token
        );

        if(currentTurn){

    const turnIndicator =
        document.createElement(
            "span"
        );

    turnIndicator.className =
        "combat-turn-indicator";

    const isOwnTurn =
        type === "player" &&
        entity.characterId ===
        currentTableCharacter?.id;

    turnIndicator.textContent =
        isOwnTurn
            ? "SUA VEZ"
            : "TURNO";

    container.appendChild(
        turnIndicator
    );


    if(canPassCurrentTurn()){

        const passButton =
            document.createElement(
                "button"
            );

        passButton.type =
            "button";

        passButton.className =
            "combat-pass-turn-button";

        passButton.textContent =
            "Passar";

        passButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                passCurrentCombatTurn();

            }
        );

        container.appendChild(
            passButton
        );

    }

}

const openEntityFromToken = event => {
    event.preventDefault();
    event.stopPropagation();

    if(pendingEnemyAbilityTarget){

        resolveEnemyAbilityTargetRouter(type,entity);

        return;

    }

    if(pendingAttackApplication){

        applyPendingAttackToTarget(
            type,
            entity
        );

        return;

    }


    if(pendingDamageApplication){

        applyPendingDamageToTarget(
            type,
            entity
        );

        return;

    }


    if(type==="npc"){
        openNpcControlSheet(entity,position);
    }else if(type==="enemy" && currentTableRole==="master"){
        openEnemyControlSheet(entity,position);
    }else{
        openOccupiedPosition(type,entity,position);
    }
};
token.onclick=openEntityFromToken;
tokenSlot.onclick=openEntityFromToken;

        return;

    }

    const marker =
        document.createElement("span");

    marker.className =
        "empty-position-marker";

    marker.textContent = "○";

    tokenSlot.appendChild(
        marker
    );

    tokenSlot.onclick = () => {

        handleEmptyPosition(
            type,
            position
        );

    };

}


/*==========================================================
=              POSIÇÃO VAZIA
==========================================================*/

function handleEmptyPosition(
    type,
    position
){

    if(type === "player"){

        if(currentTableRole === "player"){

            placeCurrentPlayer(
                position
            );

            return;

        }

        if(currentTableRole === "master"){

            openPlayerPlacementPanel(
                position
            );

        }

        return;

    }

    if(currentTableRole !== "master"){

        return;

    }

    if(type === "enemy"){

        openEnemiesForPosition(
            position
        );

        return;

    }

    if(type === "npc"){

        openNPCsForPosition(
            position
        );

    }

}


/*==========================================================
=              JOGADOR ENTRA NA POSIÇÃO
==========================================================*/

function placeCurrentPlayer(position){

    if(
        !currentTableCharacter ||
        !Array.isArray(
            currentTableCampaign.players
        )
    ){

        return;

    }

    const occupied =
        currentTableCampaign.players.some(
            player =>
                Number(player.position) ===
                position &&
                player.characterId !==
                currentTableCharacter.id
        );

    if(occupied){

        addSystemChatMessage(
            `A posição ${position} já está ocupada.`
        );

        return;

    }

    const player =
        currentTableCampaign.players.find(
            item =>
                item.characterId ===
                currentTableCharacter.id
        );

    if(!player){

        return;

    }

    player.position =
        position;

    player.name =
        currentTableCharacter.name;

    player.photo =
        currentTableCharacter.photo || "";

    saveTableCampaign();

    renderCombatPositions();

    addSystemChatMessage(
        `${currentTableCharacter.name} moveu para a posição ${position}.`
    );

}


/*==========================================================
=              MESTRE ESCOLHE JOGADOR
==========================================================*/

function openPlayerPlacementPanel(position){

    const players =
        Array.isArray(
            currentTableCampaign.players
        )
            ? currentTableCampaign.players
            : [];

    if(players.length === 0){

        openTablePanel(
            "POSIÇÃO",
            `Posição ${position}`,
            `

            <div class="editor-empty-state">

                <span>👤</span>

                <p>
                    Nenhum jogador está vinculado à campanha.
                </p>

            </div>

            `
        );

        return;

    }

    const html =
        players
            .map(player => `

                <button
                    type="button"
                    class="table-panel-card player-position-choice"
                    data-character-id="${escapeTableHTML(
                        player.characterId
                    )}"
                    style="
                        width:100%;
                        text-align:left;
                        cursor:pointer;
                    "
                >

                    <h3>
                        ${escapeTableHTML(
                            player.name ||
                            "Personagem"
                        )}
                    </h3>

                    <p>
                        ${
                            player.position
                                ? `Posição atual: ${player.position}`
                                : "Fora do cenário"
                        }
                    </p>

                </button>

            `)
            .join("");

    openTablePanel(
        "POSIÇÃO",
        `Posição ${position}`,
        `

        <div class="table-panel-list">

            ${html}

        </div>

        `
    );

    document
        .querySelectorAll(
            ".player-position-choice"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    moveCampaignPlayer(
                        button.dataset.characterId,
                        position
                    );

                    closeCurrentPanel();

                }
            );

        });

}


/*==========================================================
=              MOVER JOGADOR
==========================================================*/

function moveCampaignPlayer(
    characterId,
    position
){

    const players =
        currentTableCampaign.players;

    const occupied =
        players.find(
            player =>
                Number(player.position) ===
                position &&
                player.characterId !==
                characterId
        );

    if(occupied){

        addSystemChatMessage(
            `A posição ${position} já está ocupada por ${occupied.name}.`
        );

        return;

    }

    const player =
        players.find(
            item =>
                item.characterId ===
                characterId
        );

    if(!player){

        return;

    }

    player.position =
        position;

    saveTableCampaign();

    renderCombatPositions();

    addSystemChatMessage(
        `${player.name} foi movido para a posição ${position}.`
    );

}


/*==========================================================
=              AMEAÇAS PARA POSIÇÃO
==========================================================*/

function openEnemiesForPosition(position){

    let enemies = [];

    try{

        enemies =
            JSON.parse(
                localStorage.getItem(
                    "ordem_threats"
                )
            ) || [];

    }
    catch{

        enemies = [];

    }

    if(enemies.length === 0){

        openEnemiesPanel();

        return;

    }

    const html =
        enemies
            .map(enemy => `

                <button
                    type="button"
                    class="table-panel-card enemy-position-choice"
                    data-enemy-id="${escapeTableHTML(
                        enemy.id
                    )}"
                    style="
                        width:100%;
                        text-align:left;
                        cursor:pointer;
                    "
                >

                    <h3>
                        ${escapeTableHTML(
                            enemy.name ||
                            "Ameaça"
                        )}
                    </h3>

                    <p>
                        Clique para posicionar.
                    </p>

                </button>

            `)
            .join("");

    openTablePanel(
        "AMEAÇAS",
        `Posição ${position}`,
        `

        <div class="table-panel-list">
            ${html}
        </div>

        `
    );

    document
        .querySelectorAll(
            ".enemy-position-choice"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const enemy =
                        enemies.find(
                            item =>
                                String(item.id) ===
                                String(button.dataset.enemyId)
                        );

                    if(!enemy){

                        return;

                    }

                    placeEntityAtPosition(
                        "enemy",
                        enemy,
                        position
                    );

                    closeCurrentPanel();

                }
            );

        });

}


/*==========================================================
=              NPCs PARA POSIÇÃO
==========================================================*/

function openNPCsForPosition(position){

    let npcs=[];try{npcs=(JSON.parse(localStorage.getItem("ordem_threats")||"[]")||[]).filter(item=>item.type==="npc");}catch{npcs=[];}

    if(npcs.length === 0){

        openNPCPanel();

        return;

    }

    const html =
        npcs
            .map(npc => `

                <button
                    type="button"
                    class="table-panel-card npc-position-choice"
                    data-npc-id="${escapeTableHTML(
                        npc.id
                    )}"
                    style="
                        width:100%;
                        text-align:left;
                        cursor:pointer;
                    "
                >

                    <h3>
                        ${escapeTableHTML(
                            npc.name ||
                            "NPC"
                        )}
                    </h3>

                    <p>
                        Clique para posicionar.
                    </p>

                </button>

            `)
            .join("");

    openTablePanel(
        "NPC",
        `Posição ${position}`,
        `

        <div class="table-panel-list">
            ${html}
        </div>

        `
    );

    document
        .querySelectorAll(
            ".npc-position-choice"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const npc =
                        npcs.find(
                            item =>
                                String(item.id) ===
                                String(
                                    button.dataset.npcId
                                )
                        );

                    if(!npc){

                        return;

                    }

                    placeEntityAtPosition(
                        "npc",
                        npc,
                        position
                    );

                    closeCurrentPanel();

                }
            );

        });

}


/*==========================================================
=              POSIÇÃO OCUPADA
==========================================================*/

function openOccupiedPosition(
    type,
    entity,
    position
){

    if(type==="enemy" && currentTableRole==="master"){
        openEnemyControlSheet(entity,position);
        return;
    }

    if(!positionModal){

        return;

    }

    if(positionModalTitle){

        positionModalTitle.textContent =
            entity.name ||
            `Posição ${position}`;

    }

    const canControl =
        currentTableRole === "master" ||
        (
            type === "player" &&
            currentTableCharacter &&
            entity.characterId ===
                currentTableCharacter.id
        );

    positionModalBody.innerHTML = `

        <div class="table-panel-card">

            <h3>
                ${escapeTableHTML(
                    entity.name ||
                    "Entidade"
                )}
            </h3>

            <p>
                Posição ${position}
            </p>

        </div>

        ${
            canControl
                ? `

                    <div
                        style="
                            display:grid;
                            grid-template-columns:1fr 1fr;
                            gap:10px;
                        "
                    >

                        <button
                            type="button"
                            id="movePositionEntity"
                            class="primary-button">

                            Mover

                        </button>

                        <button
                            type="button"
                            id="removePositionEntity"
                            class="secondary-button">

                            Remover

                        </button>

                    </div>

                `
                : ""
        }

    `;

    positionModal.classList.remove(
        "hidden"
    );

    if(canControl){

        document
            .getElementById(
                "movePositionEntity"
            )
            ?.addEventListener(
                "click",
                () => {

                    startMoveEntity(
                        type,
                        entity
                    );

                }
            );

        document
            .getElementById(
                "removePositionEntity"
            )
            ?.addEventListener(
                "click",
                () => {

                    removeEntityFromScene(
                        type,
                        entity
                    );

                }
            );

    }

}


function enemyTrainingDie(rank){return ({1:"1d4",2:"1d8",3:"1d12"})[Number(rank)||0]||"0";}
function enemySkillAttribute(name){return ["Manobra","Fortitude","Luta","Presteza"].includes(name)?"corpo":["Disciplina","Discreto","Interação","Intimidação","Percepção","Pilotagem","Pontaria","Vontade","Sorte"].includes(name)?"foco":"nexo";}
function normalizeEnemyAbilityId(value){return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}
function hydrateEnemyAbilities(enemy){const wolfIds=new Set(["esquiva-maior","investida","mordida-feroz","ferocidade","predador"]),isWolf=enemy?.systemId==="lobisomem-na6"||enemy?.templateId==="lobisomem-pronto"||enemy?.id==="lobisomem-pronto";if(Array.isArray(enemy.abilities)&&enemy.abilities.length){if(isWolf)enemy.abilities=enemy.abilities.filter(ability=>wolfIds.has(normalizeEnemyAbilityId(ability.id||ability.name)));return enemy.abilities;}let library=[];try{library=JSON.parse(localStorage.getItem("ordem_threats")||"[]")}catch{library=[]}const template=library.find(item=>String(item.id)===String(enemy.templateId||enemy.id)||item.systemId&&item.systemId===enemy.systemId);enemy.abilities=Array.isArray(template?.abilities)?template.abilities.map(ability=>({...ability})):[];if(isWolf)enemy.abilities=enemy.abilities.filter(ability=>wolfIds.has(normalizeEnemyAbilityId(ability.id||ability.name)));return enemy.abilities;}
function hydrateEnemyMedia(enemy){if(!enemy)return enemy;let library=[];try{library=JSON.parse(localStorage.getItem("ordem_threats")||"[]")}catch{library=[]}const template=library.find(item=>String(item.id)===String(enemy.templateId||enemy.id)||item.systemId&&item.systemId===enemy.systemId);if(!template)return enemy;if(template.photo)enemy.photo=template.photo;if(template.woundedPhoto)enemy.woundedPhoto=template.woundedPhoto;if(template.combatMedia?.idle)enemy.combatMedia={...(enemy.combatMedia||{}),...template.combatMedia};return enemy;}
function enemyHasAbility(enemy,id){return hydrateEnemyAbilities(enemy).some(ability=>normalizeEnemyAbilityId(ability.id||ability.name)===id);}
function applyEnemyPassiveStats(enemy){if(!enemy||enemy.passiveStatsApplied)return enemy;const ids=hydrateEnemyAbilities(enemy).map(ability=>normalizeEnemyAbilityId(ability.id||ability.name));if(ids.includes("reliquia")){enemy.pv=(Number(enemy.pv)||0)*2;enemy.head=(Number(enemy.head)||0)*2;enemy.torso=(Number(enemy.torso)||0)*2;enemy.limb=(Number(enemy.limb)||0)*2;}if(ids.includes("camada-extra"))enemy.rd=(Number(enemy.rd)||0)+3;if(ids.includes("ferocidade")){enemy.basicAttack=addEnemyDamageDice(enemy.basicAttack,1);enemy.strongAttack=addEnemyDamageDice(enemy.strongAttack,1);enemy.ferocityApplied=true;}enemy.passiveStatsApplied=true;return enemy;}
function enemyAbilityState(enemy){enemy.abilityState=enemy.abilityState&&typeof enemy.abilityState==="object"?enemy.abilityState:{};return enemy.abilityState;}
function enemyCombatRound(){return Math.max(0,Number(currentTableCampaign?.combat?.round)||0);}
function addEnemyDamageDice(formula,extraDice=1){let changed=false;return String(formula||"").replace(/(\d*)d(\d+)/i,(match,amount,sides)=>{if(changed)return match;changed=true;return `${(Number(amount)||1)+Math.max(0,Number(extraDice)||0)}d${sides}`;});}
function addEnemyDamageDie(formula){return addEnemyDamageDice(formula,1);}
function enemyCurrentActionPoints(enemy){return Math.max(0,Number(enemy?.status?.paAtual??enemy?.paAtual??enemy?.pa)||0);}
function healEnemy(enemy,amount,source="Regeneração"){
    if(!enemy)return 0;const value=Math.max(0,Number(amount)||0);if(!value)return 0;
    if(enemy.lifeMode==="body"){
        initializeEnemyBody(enemy);const candidates=bodyDamageParts(enemy,"enemy").map(part=>({...part,max:Math.max(0,Number(enemy.bodyMaximums?.[part.id])||0)})).filter(part=>part.current<part.max&&part.state.type!=="missing").sort((a,b)=>(b.max-b.current)-(a.max-a.current));
        const part=candidates[0];if(!part)return 0;const healed=Math.min(value,part.max-part.current);if(part.state.type==="prosthetic")part.state.currentPV=part.current+healed;else enemy.body[part.id]=part.current+healed;saveTableCampaign();renderCombatPositions();addSystemChatMessage(`${enemy.name} recuperou ${healed} PV em ${part.label} por ${source}.`);return healed;
    }
    enemy.status=enemy.status&&typeof enemy.status==="object"?enemy.status:{};const before=Math.max(0,Number(enemy.status.pvAtual??enemy.pv)||0),max=Math.max(before,Number(enemy.status.pvMax??enemy.pv)||0),after=Math.min(max,before+value);enemy.status.pvAtual=after;enemy.status.pvMax=max;if(after===before)return 0;saveTableCampaign();renderCombatPositions();addSystemChatMessage(`${enemy.name} recuperou ${after-before} PV por ${source}.`);return after-before;
}
function processEnemyRoundAbilities(){
    const round=enemyCombatRound();currentTableCampaign.combat=currentTableCampaign.combat||{};currentTableCampaign.combat.oppressivePenalties={};
    /*
        As mensagens de rolagem recarregam a campanha do localStorage.
        Persiste o mapa vazio antes delas para a Aura Opressora não perder
        a referência e interromper a passagem de rodada com TypeError.
    */
    saveTableCampaign();
    (currentTableCampaign?.enemies||[]).forEach(enemy=>{
        const state=enemyAbilityState(enemy);
        if(enemyHasAbility(enemy,"regenerativo")&&state.regenerativoRound!==round){state.regenerativoRound=round;healEnemy(enemy,Math.max(0,Number(enemy.corpo)||0),"Regenerativo");}
        if(enemyHasAbility(enemy,"aura-opressora")){(currentTableCampaign.players||[]).forEach(player=>{const character=getLiveCharacter(player.characterId);if(!character)return;const enemyRoll=rollEnemyTrainedTest(enemy,"Vontade"),playerRoll=rollCharacterVontade(character);if(!enemyRoll||!playerRoll.result)return;addRollChatMessage(`Aura Opressora • ${enemy.name}`,enemyRoll.formula,enemyRoll.total,enemyRollDetail(enemyRoll));addRollChatMessage(`Resistência de Vontade • ${character.name}`,playerRoll.formula,playerRoll.result.total,enemyRollDetail(playerRoll.result));if(enemyRoll.total>=playerRoll.result.total){currentTableCampaign.combat=currentTableCampaign.combat||{};currentTableCampaign.combat.oppressivePenalties=currentTableCampaign.combat.oppressivePenalties||{};const penalty=Math.max(0,Number(enemy.nexo)||0),previous=currentTableCampaign.combat.oppressivePenalties[character.id];if(!previous||penalty>previous.penalty)currentTableCampaign.combat.oppressivePenalties[character.id]={penalty,enemyName:enemy.name,round};saveTableCampaign();addSystemChatMessage(`${character.name} falhou contra a Aura Opressora de ${enemy.name} e terá -${penalty} no próximo ataque.`);}});}
    });saveTableCampaign();
}
function triggerEnemyMetamorphosis(enemy){if(!enemy||!enemyHasAbility(enemy,"metamorfose"))return false;const state=enemyAbilityState(enemy);if(state.metamorfoseActive)return false;state.metamorfoseActive=true;enemy.corpo=(Number(enemy.corpo)||0)+1;enemy.foco=(Number(enemy.foco)||0)+1;saveTableCampaign();addSystemChatMessage(`${enemy.name} ativou Metamorfose: +1 Corpo e +1 Foco pelo restante da cena.`);return true;}
function triggerEnemyLastBreath(enemy){if(!enemy||!enemyHasAbility(enemy,"ultimo-suspiro"))return false;const state=enemyAbilityState(enemy);if(state.ultimoSuspiroUsed)return false;state.ultimoSuspiroUsed=true;state.ultimoSuspiroReady=true;enemy.status=enemy.status||{};enemy.status.paAtual=Math.max(1,Number(enemy.status.paAtual)||0);enemy.paAtual=enemy.status.paAtual;saveTableCampaign();addSystemChatMessage(`${enemy.name} ativou Último Suspiro e recebeu 1 PA para realizar sua última ação.`);return true;}
function damageCharacterFromAbility(character,amount,source){
    if(!character)return 0;const value=Math.max(0,Number(amount)||0);if(!value)return 0;
    if(character.lifeMode==="body"){
        ensureCharacterHeart(character);if(Math.max(0,Number(character.body?.chest)||0)<=0){const before=Math.max(0,Number(character.heart.current)||0),dealt=Math.min(before,value);character.heart.current=Math.max(0,before-dealt);if(character.heart.current<=0&&dealt>0&&!trySoMaisUmPasso(character))markCharacterDead(character);saveDamagedCharacter(character);addSystemChatMessage(`${source} causou ${dealt} de dano no Coração de ${character.name}.`);return dealt;}
        const parts=bodyDamageParts(character,"player").filter(part=>part.current>0).sort((a,b)=>b.current-a.current),part=parts[0];if(!part)return 0;const dealt=Math.min(value,part.current);if(part.state.type==="prosthetic")part.state.currentPV=part.current-dealt;else character.body[part.id]=part.current-dealt;let heartDamage=0;if(part.id==="chest"&&part.current-dealt<=0&&value>dealt){const before=Math.max(0,Number(character.heart.current)||0);heartDamage=Math.min(before,value-dealt);character.heart.current=Math.max(0,before-heartDamage);if(character.heart.current<=0&&heartDamage>0&&!trySoMaisUmPasso(character))markCharacterDead(character);}saveDamagedCharacter(character);addSystemChatMessage(`${source} causou ${dealt} de dano em ${BODY_PART_LABELS[part.id]} de ${character.name}${heartDamage?` e ${heartDamage} no Coração`:""}.`);return dealt+heartDamage;
    }
    ensureCharacterHeart(character);const before=Math.max(0,Number(character.status.pvAtual)||0),pvDamage=Math.min(before,value),overflow=Math.max(0,value-pvDamage),heartBefore=Math.max(0,Number(character.heart.current)||0),heartDamage=Math.min(heartBefore,overflow);character.status.pvAtual=Math.max(0,before-pvDamage);character.heart.current=Math.max(0,heartBefore-heartDamage);if(character.heart.current<=0&&heartDamage>0&&!trySoMaisUmPasso(character))markCharacterDead(character);saveDamagedCharacter(character);addSystemChatMessage(`${source} causou ${pvDamage} de dano em ${character.name}${heartDamage?` e ${heartDamage} no Coração`:""}.`);return pvDamage+heartDamage;
}
function spendEnemyActionPoints(enemy,cost=1){
    const amount=Math.max(0,Number(cost)||0),current=enemyCurrentActionPoints(enemy);
    if(!enemy||current<amount)return false;
    enemy.status=enemy.status&&typeof enemy.status==="object"?enemy.status:{};
    enemy.status.paAtual=Math.max(0,current-amount);
    enemy.paAtual=enemy.status.paAtual;
    saveTableCampaign();
    return true;
}
function enemySkillData(enemy,name){
    const skills=enemy.skills&&typeof enemy.skills==="object"?enemy.skills:{};
    if(Array.isArray(skills)){
        const skill=skills.find(item=>String(item.id||item.name||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()===String(name).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase())||{};
        let rank=Number(skill.level??skill.rank??0)||0;
        if(!rank){const training=String(skill.training||skill.treino||"");rank=training==="1d12"?3:training==="1d8"?2:training==="1d4"?1:0;}
        return{rank,bonus:Number(skill.bonus)||0,penalty:Math.abs(Number(skill.penalty??skill.penalidade)||0)};
    }
    const value=skills[name]??skills[String(name).toLowerCase()]??0;
    return typeof value==="object"
        ?{rank:Number(value.level??value.rank??0)||0,bonus:Number(value.bonus)||0,penalty:Math.abs(Number(value.penalty??value.penalidade)||0)}
        :{rank:Number(value)||0,bonus:0,penalty:0};
}
function enemyRollDetail(result){return (result.details||[]).map(part=>part.type==="dice"?`${part.formula} [${(part.rolls||[]).join(", ")}]`:String(part.value??"")).filter(Boolean).join(" + ");}
function rollEnemyTrainedTest(enemy,name,attributeOverride=null){
    const skill=enemySkillData(enemy,name),attribute=attributeOverride||enemySkillAttribute(name),attributeValue=Number(enemy[attribute]??enemy.attributes?.[attribute])||0,training=enemyTrainingDie(skill.rank),modifier=attributeValue+skill.bonus-skill.penalty;
    const principal=rollDiceExpression("1d12");if(!principal)return null;
    const principalRoll=Number(principal.details?.find(part=>part.type==="dice")?.rolls?.[0])||Number(principal.total)||0,critical=principalRoll===12;
    const trainingCount=training==="0"?0:(critical?2:1),trainingSides=Number(training.replace("1d",""))||0,trainingFormula=trainingCount?`${trainingCount}d${trainingSides}`:"0",trainingResult=trainingCount?rollDiceExpression(trainingFormula):null,trainingTotal=Number(trainingResult?.total)||0,total=principalRoll+trainingTotal+modifier;
    const formula=`1d12${trainingCount?`+${trainingFormula}`:""}${modifier>=0?"+":""}${modifier}`;
    const details=[{type:"dice",formula:"1d12",rolls:[principalRoll]}];if(trainingCount)details.push({type:"dice",formula:trainingFormula,rolls:trainingResult?.details?.find(part=>part.type==="dice")?.rolls||[]});if(modifier)details.push({type:"number",value:modifier});
    return{total,formula,details,critical,principalRoll,trainingFormula,trainingTotal,attribute,attributeValue,modifier};
}
function rollCharacterTrainedTest(trainingValue,modifier=0){
    const training=String(trainingValue||"0"),principal=rollDiceExpression("1d12");if(!principal)return null;
    const principalRoll=Number(principal.details?.find(part=>part.type==="dice")?.rolls?.[0])||Number(principal.total)||0,critical=principalRoll===12,match=training.match(/1d(4|8|12)/i),sides=Number(match?.[1])||0,count=sides?(critical?2:1):0,trainingFormula=count?`${count}d${sides}`:"0",trainingResult=count?rollDiceExpression(trainingFormula):null,trainingTotal=Number(trainingResult?.total)||0,numericModifier=Number(modifier)||0;
    const formula=`1d12${count?`+${trainingFormula}`:""}${numericModifier>=0?"+":""}${numericModifier}`,details=[{type:"dice",formula:"1d12",rolls:[principalRoll]}];if(count)details.push({type:"dice",formula:trainingFormula,rolls:trainingResult?.details?.find(part=>part.type==="dice")?.rolls||[]});if(numericModifier)details.push({type:"number",value:numericModifier});
    return{total:principalRoll+trainingTotal+numericModifier,formula,details,critical,principalRoll,trainingFormula,trainingTotal};
}
function rollEnemySkill(enemy,name,metadata={}){
    const result=rollEnemyTrainedTest(enemy,name);if(!result)return null;
    const flatBonus=Number(metadata.flatBonus)||0;if(flatBonus){result.total+=flatBonus;result.formula+=`+${flatBonus}`;result.details.push({type:"number",value:flatBonus});}
    if(result.critical&&metadata.rollKind==="attack"){
        const state=enemyAbilityState(enemy);state.criticalDamageDice=2;state.criticalAttackVariant=metadata.attackVariant||null;state.criticalAttackRound=enemyCombatRound();saveTableCampaign();
    }
    const label=`${metadata.label||`${name} • ${enemy.name||"Criatura"}`}${result.critical?" • CRÍTICO":""}`;
    addRollChatMessage(label,result.formula,result.total,`${enemyRollDetail(result)}${result.critical?" • d12 principal = 12 • dado de treino adicional":""}`,{...metadata,enemyCritical:result.critical});
    return result;
}
const ENEMY_CONDITION_CATALOG=[
    {id:"sangramento",name:"Sangramento",icon:"🩸",stackable:true,description:"Sofre dano de sangramento por rodada."},
    {id:"envenenamento",name:"Envenenamento",icon:"☠️",stackable:true,description:"Sofre dano por rodada e penalidade física."},
    {id:"chamas",name:"Chamas",icon:"🔥",description:"Sofre dano por rodada até apagar as chamas."},
    {id:"paralisia",name:"Paralisia",icon:"⚡",description:"Fracassa automaticamente em testes."},
    {id:"paralisia-total",name:"Paralisia Total",icon:"⚡",description:"Fica completamente incapaz de agir."},
    {id:"imobilizado",name:"Imobilizado",icon:"⛓️",description:"Recebe penalidade em testes físicos e Defesa."},
    {id:"caido",name:"Caído",icon:"⬇️",description:"Recebe penalidade física e na Defesa."},
    {id:"enjoado",name:"Enjoado",icon:"🤢",description:"Recebe penalidade em testes físicos."},
    {id:"morrendo",name:"Morrendo",icon:"🩸",description:"Fica inconsciente e sem PA."},
    {id:"machucado",name:"Machucado",icon:"🩹",description:"Ativa a aparência machucada."},
    {id:"debilitado",name:"Debilitado",icon:"🦴",description:"Recebe menos PA por rodada."},
    {id:"enfraquecido",name:"Enfraquecido",icon:"💢",description:"Recebe penalidade em testes de Corpo."},
    {id:"lento",name:"Lento",icon:"🐌",description:"Recebe penalidade de velocidade."},
    {id:"cansado",name:"Cansado",icon:"😵",description:"Habilidades custam o dobro."},
    {id:"controlado",name:"Controlado",icon:"🧠",description:"Entrega suas ações ao controlador."},
    {id:"cego",name:"Cego",icon:"👁️",description:"Recebe penalidades ligadas à visão."},
    {id:"surdo",name:"Surdo",icon:"🔇",description:"Recebe penalidades ligadas à audição."},
    {id:"traumatizado",name:"Traumatizado",icon:"🧠",description:"Recebe penalidade em Vontade."},
    {id:"penumbra",name:"Penumbra",icon:"🌑",description:"Recebe penalidade em Percepção e Reflexos."},
    {id:"vulneravel",name:"Vulnerável",icon:"🎯",description:"Sofre efeitos ampliados de dano bônus."},
    {id:"desprevenido",name:"Desprevenido",icon:"😶",description:"Não pode reagir e perde Defesa."},
    {id:"confuso",name:"Confuso",icon:"🌀",description:"Move-se e age de forma imprevisível."}
];
function addConditionToEnemy(enemy,definition){
    if(!enemy||!definition)return null;
    const enemyId=enemy.enemyId||enemy.id,liveEnemy=(currentTableCampaign.enemies||[]).find(item=>String(item.enemyId||item.id)===String(enemyId))||enemy;
    liveEnemy.conditions=Array.isArray(liveEnemy.conditions)?liveEnemy.conditions:[];
    const existing=liveEnemy.conditions.find(item=>String(typeof item==="string"?item:item.id)===definition.id);
    if(existing&&definition.stackable&&typeof existing==="object")existing.stacks=Math.max(1,Number(existing.stacks)||1)+1;
    else if(!existing)liveEnemy.conditions.push({...definition,stacks:1});
    if(definition.id==="machucado")triggerEnemyMetamorphosis(liveEnemy);
    return liveEnemy;
}
function openEnemyConditionSelector(enemy,position){
    document.getElementById("enemyConditionSelector")?.remove();
    const modal=document.createElement("div");
    modal.id="enemyConditionSelector";
    modal.className="table-modal";
    modal.innerHTML=`<div class="table-modal-content"><div class="table-modal-header"><div><span class="table-panel-label">CONDIÇÕES</span><h2>Adicionar condição</h2></div><button type="button" class="table-panel-close enemy-condition-close">✕</button></div><div class="table-panel-list">${ENEMY_CONDITION_CATALOG.map(condition=>`<button type="button" class="table-panel-card enemy-condition-choice" data-condition="${condition.id}" style="width:100%;text-align:left;cursor:pointer"><h3>${condition.icon} ${escapeTableHTML(condition.name)}</h3><p>${escapeTableHTML(condition.description)}</p></button>`).join("")}</div></div>`;
    document.body.appendChild(modal);
    const close=()=>modal.remove();
    modal.querySelector(".enemy-condition-close")?.addEventListener("click",close);
    modal.addEventListener("click",event=>{if(event.target===modal)close();});
    modal.querySelectorAll(".enemy-condition-choice").forEach(button=>button.addEventListener("click",()=>{
        const definition=ENEMY_CONDITION_CATALOG.find(item=>item.id===button.dataset.condition);if(!definition)return;
        const liveEnemy=addConditionToEnemy(enemy,definition);if(!liveEnemy)return;
        saveTableCampaign();renderCombatPositions();close();openEnemyControlSheet(liveEnemy,position);
    }));
}
function latestSuccessfulStrongAttack(enemy){const id=String(enemy.enemyId||enemy.id),name=String(enemy.name||"").toLowerCase();return[...(currentTableCampaign?.chatMessages||[])].reverse().find(message=>{const sameEnemy=String(message.enemyInstanceId||message.attackApplication?.attackerEnemyId||"")===id||String(message.label||"").toLowerCase().includes(name),strong=message.attackVariant==="strong"||normalizeEnemyAbilityId(message.attackName)==="ataque-forte";return sameEnemy&&strong&&message.attackApplication?.hit===true&&message.attackApplication?.targetCharacterId&&message.mordidaFerozUsed!==true;})||null;}
function latestSuccessfulEnemyAttack(enemy){const id=String(enemy.enemyId||enemy.id);return[...(currentTableCampaign?.chatMessages||[])].reverse().find(message=>String(message.enemyInstanceId||message.attackApplication?.attackerEnemyId||"")===id&&message.attackApplication?.hit===true&&message.attackApplication?.targetCharacterId)||null;}
function enemyAbilityAvailability(enemy,id){const state=enemyAbilityState(enemy),round=enemyCombatRound(),pa=enemyCurrentActionPoints(enemy),nexo=Math.max(0,Number(enemy.nexo)||0);if(id==="investida")return{enabled:state.investidaMovedRound===round&&state.investidaUsedRound!==round&&!state.investidaArmed,label:state.investidaArmed?"Preparada":"Usar"};if(id==="mordida-feroz"){const last=Number(state.mordidaLastUsedRound);return{enabled:Boolean(latestSuccessfulStrongAttack(enemy))&&(!Number.isFinite(last)||round-last>=2),label:"Usar"};}if(id==="esquiva-maior"){const limit=Math.max(0,Number(enemy.corpo)||0),used=Math.max(0,Number(state.esquivaMaiorSceneUses)||0);return{enabled:state.esquivaMaiorUsedRound!==round&&used<limit&&!state.esquivaMaiorArmed,label:state.esquivaMaiorArmed?"Preparada":"Preparar"};}if(id==="cronos")return{enabled:!state.cronosUsedScene,label:"Usar"};if(id==="invocador")return{enabled:pa>=2&&(Number(state.invocadorUses)||0)<nexo,label:"Invocar • 2 PA"};if(id==="possessao")return{enabled:pa>=1&&(Number(state.possessaoUses)||0)<nexo,label:"Escolher morto • 1 PA"};if(id==="agarrao-necrotico"){const last=Number(state.agarraoLastRound);return{enabled:!Number.isFinite(last)||round-last>=2,label:"Escolher alvo"};}if(id==="atrair"){const last=Number(state.atrairLastRound);return{enabled:!Number.isFinite(last)||round-last>=2,label:"Escolher alvo"};}if(id==="ilusorio")return{enabled:state.ilusorioUsedRound!==round,label:"Escolher alvo"};if(id==="devorador-de-condicoes"){const used=Math.max(0,Number(state.devoradorUses)||0),limit=Math.max(0,Number(enemy.corpo)||0);return{enabled:used<limit&&(enemy.conditions||[]).length>0,label:"Devorar condição"};}if(id==="conjurador")return{enabled:true,label:"Abrir grimório"};return{enabled:false,label:"Passiva"};}
const baseEnemyAbilityAvailability=enemyAbilityAvailability;
enemyAbilityAvailability=function(enemy,id){if(id==="travar"){const state=enemyAbilityState(enemy),round=enemyCombatRound(),used=Math.max(0,Number(state.travarSceneUses)||0),limit=Math.max(0,Number(enemy.foco)||0);return{enabled:state.travarUsedRound!==round&&used<limit,label:"Escolher alvo"}}return baseEnemyAbilityAvailability(enemy,id)};
function renderEnemyAbilityCards(enemy){const abilities=hydrateEnemyAbilities(enemy);if(!abilities.length)return"<p>Nenhuma habilidade.</p>";return abilities.map(ability=>{const id=normalizeEnemyAbilityId(ability.id||ability.name),availability=enemyAbilityAvailability(enemy,id),state=enemyAbilityState(enemy);let status="";if(id==="investida"&&state.investidaArmed)status="Próximo dano recebe +1 dado.";if(["mordida-feroz","agarrao-necrotico","atrair"].includes(id))status="Recarga: 2 rodadas.";if(id==="esquiva-maior")status=`Usos na cena: ${Number(state.esquivaMaiorSceneUses)||0}/${Math.max(0,Number(enemy.corpo)||0)}.`;if(id==="invocador")status=`Usos: ${Number(state.invocadorUses)||0}/${Math.max(0,Number(enemy.nexo)||0)}.`;if(id==="possessao")status=`Usos: ${Number(state.possessaoUses)||0}/${Math.max(0,Number(enemy.nexo)||0)}.`;if(id==="devorador-de-condicoes")status=`Usos: ${Number(state.devoradorUses)||0}/${Math.max(0,Number(enemy.corpo)||0)}.`;const active=["investida","mordida-feroz","esquiva-maior","cronos","invocador","possessao","agarrao-necrotico","atrair","ilusorio","devorador-de-condicoes","conjurador"].includes(id);return`<div class="table-panel-card"><h3>${escapeTableHTML(ability.name||"Habilidade")}</h3><p>${escapeTableHTML(ability.description||"")}</p>${status?`<p><strong>${escapeTableHTML(status)}</strong></p>`:""}${active?`<button type="button" class="primary-button enemy-use-ability" data-ability="${id}" ${availability.enabled?"":"disabled"}>${escapeTableHTML(availability.label)}</button>`:""}</div>`;}).join("");}
const baseRenderEnemyAbilityCards=renderEnemyAbilityCards;
renderEnemyAbilityCards=function(enemy){let html=baseRenderEnemyAbilityCards(enemy),state=enemyAbilityState(enemy),focus=Math.max(0,Number(enemy.foco)||0);html=html.replace(/(<h3>Travar<\/h3><p>.*?<\/p>)(<\/div>)/,`$1<p><strong>Usos na cena: ${Number(state.travarSceneUses)||0}/${focus}.</strong></p><button type="button" class="primary-button enemy-use-ability" data-ability="travar" ${enemyAbilityAvailability(enemy,"travar").enabled?"":"disabled"}>${enemyAbilityAvailability(enemy,"travar").label}</button>$2`);html=html.replace(/(<h3>Fantasmagórico<\/h3><p>.*?<\/p>)(<\/div>)/,`$1<p><strong>Usos na cena: ${Number(state.fantasmagoricoSceneUses)||0}/${focus}.</strong></p>$2`);return html};
function rollCharacterManobra(character){const skills=Array.isArray(character?.skills)?character.skills:[],skill=skills.find(item=>normalizeEnemyAbilityId(item.id||item.name)==="manobra")||{},training=String(skill.training||skill.treino||"0"),attributeValue=Number(character?.attributes?.corpo??character?.attributes?.for??0)||0,bonus=Number(skill.bonus)||0,penalty=Math.abs(Number(skill.penalty??skill.penalidade)||0),result=rollCharacterTrainedTest(training,attributeValue+bonus-penalty);return{formula:result?.formula||"",result};}
function rollCharacterVontade(character){const skills=Array.isArray(character?.skills)?character.skills:[],skill=skills.find(item=>normalizeEnemyAbilityId(item.id||item.name)==="vontade")||{},training=String(skill.training||skill.treino||"0"),attributeValue=Number(character?.attributes?.foco??character?.attributes?.pre??0)||0,bonus=Number(skill.bonus)||0,penalty=Math.abs(Number(skill.penalty??skill.penalidade)||0),result=rollCharacterTrainedTest(training,attributeValue+bonus-penalty);return{formula:result?.formula||"",result};}
function enemyLibrary(){try{return JSON.parse(localStorage.getItem("ordem_threats")||"[]")||[];}catch{return[];}}
function isDeadAbilityTarget(character){if(!character)return false;const conditions=Array.isArray(character.conditions)?character.conditions:[];return Number(character.status?.pvAtual??character.pvAtual??1)<=0||conditions.some(condition=>["morto","morrendo"].includes(normalizeEnemyAbilityId(typeof condition==="string"?condition:condition.id||condition.name)));}
function cancelEnemyAbilityTargetSelection(){pendingEnemyAbilityTarget=null;document.querySelector(".table-play-area")?.classList.remove("selecting-attack-target");document.querySelectorAll(".attack-target-selectable").forEach(element=>element.classList.remove("attack-target-selectable"));document.querySelector(".attack-selection-notice")?.remove();}
function startEnemyAbilityTargetSelection(enemy,id,position){pendingEnemyAbilityTarget={enemyId:enemy.enemyId||enemy.id,id,position};closeCurrentPanel();document.querySelector(".table-play-area")?.classList.add("selecting-attack-target");markAttackTargets();const notices={possessao:"Selecione no mapa um personagem morto.",atrair:"Selecione o alvo de Atrair.",travar:"Selecione o alvo de Travar.",ilusorio:"Selecione o alvo de Ilusório."};addLocalAttackNotice(notices[id]||"Selecione no mapa o alvo do Agarrão Necrótico.");}
function resolveEnemyAbilityTarget(type,entity){const pending=pendingEnemyAbilityTarget;if(!pending)return;if(type!=="player"){addSystemChatMessage("Essa habilidade precisa escolher um jogador como alvo.");return;}refreshCurrentTableCampaign();const enemy=(currentTableCampaign.enemies||[]).find(item=>String(item.enemyId||item.id)===String(pending.enemyId)),target=getLiveCharacter(entity.characterId||entity.id);if(!enemy||!target){cancelEnemyAbilityTargetSelection();return;}if(pending.id==="possessao"){if(!isDeadAbilityTarget(target)){addSystemChatMessage(`${target.name||"O alvo"} ainda não morreu.`);return;}if(!spendEnemyActionPoints(enemy,1))return;const state=enemyAbilityState(enemy);state.possessaoUses=(Number(state.possessaoUses)||0)+1;saveTableCampaign();cancelEnemyAbilityTargetSelection();addSystemChatMessage(`${enemy.name} usou Possessão em ${target.name}. O mestre pode adicionar o Morto-vivo manualmente à mesa.`);openEnemyControlSheet(enemy,pending.position);return;}if(pending.id==="agarrao-necrotico"){const enemyRoll=rollEnemyTrainedTest(enemy,"Manobra"),playerRoll=rollCharacterManobra(target);if(!enemyRoll||!playerRoll.result)return;const state=enemyAbilityState(enemy);state.agarraoLastRound=enemyCombatRound();saveTableCampaign();cancelEnemyAbilityTargetSelection();addRollChatMessage(`Agarrão Necrótico • ${enemy.name}`,enemyRoll.formula,enemyRoll.total,enemyRollDetail(enemyRoll));addRollChatMessage(`Resistência de Manobra • ${target.name}`,playerRoll.formula,playerRoll.result.total,enemyRollDetail(playerRoll.result));if(enemyRoll.total>=playerRoll.result.total){target.conditions=Array.isArray(target.conditions)?target.conditions:[];target.conditions=target.conditions.filter(condition=>!(normalizeEnemyAbilityId(typeof condition==="string"?condition:condition.id||condition.name)==="paralisia"&&condition.source==="agarrao-necrotico"));target.conditions.push({id:"paralisia",name:"Paralisia",description:`Preso pelo Agarrão Necrótico de ${enemy.name}.`,source:"agarrao-necrotico",escapeEnemyId:enemy.enemyId||enemy.id});saveDamagedCharacter(target);addSystemChatMessage(`${target.name} recebeu Paralisia pelo Agarrão Necrótico.`);}else addSystemChatMessage(`${target.name} venceu a disputa e escapou do Agarrão Necrótico.`);openEnemyControlSheet(enemy,pending.position);}}
function resolveEnemyAbilityTargetRouter(type,entity){
    const pending=pendingEnemyAbilityTarget;if(!pending||!["atrair","travar","ilusorio"].includes(pending.id)){resolveEnemyAbilityTarget(type,entity);return;}if(type!=="player"){addSystemChatMessage("Essa habilidade precisa escolher um jogador como alvo.");return;}
    refreshCurrentTableCampaign();const enemy=(currentTableCampaign.enemies||[]).find(item=>String(item.enemyId||item.id)===String(pending.enemyId)),target=getLiveCharacter(entity.characterId||entity.id);if(!enemy||!target){cancelEnemyAbilityTargetSelection();return;}const state=enemyAbilityState(enemy),position=pending.position;
    if(pending.id==="ilusorio"){currentTableCampaign.combat=currentTableCampaign.combat||{};currentTableCampaign.combat.illusoryPenalties=currentTableCampaign.combat.illusoryPenalties||{};currentTableCampaign.combat.illusoryPenalties[target.id]={penalty:Math.max(0,Number(enemy.nexo)||0),enemyId:enemy.enemyId||enemy.id,enemyName:enemy.name,round:enemyCombatRound()};state.ilusorioUsedRound=enemyCombatRound();saveTableCampaign();cancelEnemyAbilityTargetSelection();addSystemChatMessage(`${enemy.name} usou Ilusório em ${target.name}. O próximo ataque terá -${Math.max(0,Number(enemy.nexo)||0)}.`);openEnemyControlSheet(enemy,position);return;}
    if(pending.id==="travar"){const enemyRoll=rollEnemyTrainedTest(enemy,"Vontade"),playerRoll=rollCharacterVontade(target);if(!enemyRoll||!playerRoll.result)return;state.travarUsedRound=enemyCombatRound();state.travarSceneUses=(Number(state.travarSceneUses)||0)+1;cancelEnemyAbilityTargetSelection();addRollChatMessage(`Travar • ${enemy.name}`,enemyRoll.formula,enemyRoll.total,enemyRollDetail(enemyRoll));addRollChatMessage(`Resistência de Vontade • ${target.name}`,playerRoll.formula,playerRoll.result.total,enemyRollDetail(playerRoll.result));if(enemyRoll.total>=playerRoll.result.total){target.conditions=Array.isArray(target.conditions)?target.conditions:[];target.conditions=target.conditions.filter(condition=>normalizeEnemyAbilityId(typeof condition==="string"?condition:condition.id||condition.name)!=="paralisia");target.conditions.push({id:"paralisia",name:"Paralisia",description:`Travado por ${enemy.name}.`,source:"travar",escapeEnemyId:enemy.enemyId||enemy.id});saveDamagedCharacter(target);addSystemChatMessage(`${enemy.name} venceu Travar. ${target.name} recebeu Paralisia.`);}else addSystemChatMessage(`${target.name} resistiu a Travar.`);saveTableCampaign();openEnemyControlSheet(enemy,position);return;}
    const enemyRoll=rollEnemyTrainedTest(enemy,"Vontade"),playerRoll=rollCharacterVontade(target);if(!enemyRoll||!playerRoll.result)return;state.atrairLastRound=enemyCombatRound();cancelEnemyAbilityTargetSelection();addRollChatMessage(`Atrair • ${enemy.name}`,enemyRoll.formula,enemyRoll.total,enemyRollDetail(enemyRoll));addRollChatMessage(`Resistência de Vontade • ${target.name}`,playerRoll.formula,playerRoll.result.total,enemyRollDetail(playerRoll.result));if(enemyRoll.total>=playerRoll.result.total){const player=(currentTableCampaign.players||[]).find(item=>item.characterId===target.id);if(player){const old=player.position,occupant=(currentTableCampaign.players||[]).find(item=>item!==player&&Number(item.position)===1);if(occupant)occupant.position=old;player.position=1;}addSystemChatMessage(`${enemy.name} venceu Atrair. ${target.name} avançou até a posição 1.`);}else addSystemChatMessage(`${target.name} resistiu a Atrair.`);saveTableCampaign();renderCombatPositions();openEnemyControlSheet(enemy,position);
}
function openDevourCondition(enemy,position){const conditions=Array.isArray(enemy.conditions)?enemy.conditions:[];if(!conditions.length)return;openTablePanel("HABILIDADE",`Devorador de Condições • ${enemy.name}`,`<div class="table-panel-list">${conditions.map((condition,index)=>`<button type="button" class="table-panel-card enemy-devour-condition" data-index="${index}" style="width:100%;text-align:left"><h3>${escapeTableHTML(typeof condition==="string"?condition:condition.name||"Condição")}</h3><p>Remover e recuperar 1d10 PV.</p></button>`).join("")}</div>`);document.querySelectorAll(".enemy-devour-condition").forEach(button=>button.addEventListener("click",()=>{refreshCurrentTableCampaign();const live=(currentTableCampaign.enemies||[]).find(item=>String(item.enemyId||item.id)===String(enemy.enemyId||enemy.id))||enemy;if(!enemyAbilityAvailability(live,"devorador-de-condicoes").enabled)return;const index=Number(button.dataset.index),removed=(live.conditions||[]).splice(index,1)[0],state=enemyAbilityState(live),roll=rollDiceExpression("1d10");state.devoradorUses=(Number(state.devoradorUses)||0)+1;saveTableCampaign();if(roll){addRollChatMessage(`Devorador de Condições • ${live.name}`,"1d10",roll.total,enemyRollDetail(roll));healEnemy(live,roll.total,"Devorador de Condições");}addSystemChatMessage(`${live.name} devorou ${typeof removed==="string"?removed:removed?.name||"uma condição"}.`);openEnemyControlSheet(live,position);}));}
function useNewEnemyAbility(enemy,id,position){if(!["atrair","travar","ilusorio","devorador-de-condicoes"].includes(id))return false;refreshCurrentTableCampaign();const live=(currentTableCampaign.enemies||[]).find(item=>String(item.enemyId||item.id)===String(enemy.enemyId||enemy.id))||enemy;if(!enemyAbilityAvailability(live,id).enabled)return true;if(id==="devorador-de-condicoes"){openDevourCondition(live,position);return true;}startEnemyAbilityTargetSelection(live,id,position);return true;}
function openEnemySummonSelector(enemy,position){const summons=enemyLibrary().filter(item=>item.type==="creature"&&Number(item.na)<=5&&String(item.id)!==String(enemy.templateId||enemy.id));if(!summons.length){addSystemChatMessage("Não existe uma criatura de até NV 5 disponível para Invocador.");return;}openTablePanel("HABILIDADE","Invocador",`<div class="table-panel-list">${summons.map(item=>`<button type="button" class="table-panel-card enemy-summon-choice" data-enemy-id="${escapeTableHTML(item.id)}" style="width:100%;text-align:left;cursor:pointer"><h3>${escapeTableHTML(item.name||"Criatura")}</h3><p>NV ${Number(item.na)||0} • ${escapeTableHTML(item.element||"Sem elemento")}</p></button>`).join("")}</div>`);document.querySelectorAll(".enemy-summon-choice").forEach(button=>button.addEventListener("click",()=>{refreshCurrentTableCampaign();const live=(currentTableCampaign.enemies||[]).find(item=>String(item.enemyId||item.id)===String(enemy.enemyId||enemy.id));if(!live||!enemyAbilityAvailability(live,"invocador").enabled||!spendEnemyActionPoints(live,2))return;const state=enemyAbilityState(live);state.invocadorUses=(Number(state.invocadorUses)||0)+1;saveTableCampaign();const summon=enemyLibrary().find(item=>String(item.id)===String(button.dataset.enemyId));if(!summon)return;startEnemyPlacement(summon.id);addSystemChatMessage(`${live.name} usou Invocador. Escolha a posição de ${summon.name}.`);}));}
function openEnemyGrimoire(enemy){const grimoire=Array.isArray(enemy.grimoire)?enemy.grimoire:[];openTablePanel("PARANORMAL",`Grimório • ${enemy.name||"Ameaça"}`,grimoire.length?`<div class="table-panel-list">${grimoire.map((ritual,index)=>`<div class="table-panel-card"><h3>${escapeTableHTML(ritual.name||"Ritual")}</h3>${ritual.element?`<p>Elemento: ${escapeTableHTML(ritual.element)}</p>`:""}${ritual.description?`<p>${escapeTableHTML(ritual.description)}</p>`:""}<button type="button" class="primary-button enemy-cast-ritual" data-index="${index}">Conjurar</button></div>`).join("")}</div>`:`<div class="editor-empty-state"><span>✦</span><p>Nenhum ritual foi adicionado ao grimório desta ameaça.</p></div>`);document.querySelectorAll(".enemy-cast-ritual").forEach(button=>button.addEventListener("click",()=>{const ritual=grimoire[Number(button.dataset.index)];if(!ritual)return;const raw=ritual.damage||ritual.formula||ritual.roll||"",formula=String(raw).replace(/Corpo/gi,Number(enemy.corpo)||0).replace(/Foco/gi,Number(enemy.foco)||0).replace(/Nexo/gi,Number(enemy.nexo)||0),result=formula?rollDiceExpression(formula):null;if(result)addRollChatMessage(`Ritual • ${ritual.name||"Ritual"} • ${enemy.name}`,formula,result.total,enemyRollDetail(result),{rollKind:"ritual-damage",isRitual:true,element:ritual.element,enemyInstanceId:enemy.enemyId||enemy.id,applied:false});else addSystemChatMessage(`${enemy.name} conjurou ${ritual.name||"um ritual"}.`);}));}
function useEnemyAbility(enemy,id,position){refreshCurrentTableCampaign();const liveEnemy=(currentTableCampaign.enemies||[]).find(item=>String(item.enemyId||item.id)===String(enemy.enemyId||enemy.id))||enemy,state=enemyAbilityState(liveEnemy),round=enemyCombatRound(),availability=enemyAbilityAvailability(liveEnemy,id);if(!availability.enabled)return;if(id==="cronos"){liveEnemy.status=liveEnemy.status||{};liveEnemy.status.paAtual=enemyCurrentActionPoints(liveEnemy)+3;liveEnemy.paAtual=liveEnemy.status.paAtual;state.cronosUsedScene=true;saveTableCampaign();addSystemChatMessage(`${liveEnemy.name} usou Cronos e recebeu +3 PA nesta rodada.`);openEnemyControlSheet(liveEnemy,position);return;}if(id==="invocador"){if(!spendEnemyActionPoints(liveEnemy,2))return;state.invocadorUses=(Number(state.invocadorUses)||0)+1;saveTableCampaign();addSystemChatMessage(`${liveEnemy.name} usou Invocador. O mestre pode adicionar a criatura manualmente à mesa.`);openEnemyControlSheet(liveEnemy,position);return;}if(id==="possessao"||id==="agarrao-necrotico"){startEnemyAbilityTargetSelection(liveEnemy,id,position);return;}if(id==="conjurador"){openEnemyGrimoire(liveEnemy);return;}if(id==="investida"){state.investidaArmed=true;state.investidaUsedRound=round;saveTableCampaign();addSystemChatMessage(`${liveEnemy.name} preparou Investida. O próximo dano recebe +1 dado.`);openEnemyControlSheet((currentTableCampaign.enemies||[]).find(item=>String(item.enemyId||item.id)===String(liveEnemy.enemyId||liveEnemy.id))||liveEnemy,position);return;}if(id==="esquiva-maior"){state.esquivaMaiorArmed=true;saveTableCampaign();addSystemChatMessage(`${liveEnemy.name} preparou Esquiva Maior. Ela será ativada somente se a criatura escolher Esquivar como reação.`);openEnemyControlSheet((currentTableCampaign.enemies||[]).find(item=>String(item.enemyId||item.id)===String(liveEnemy.enemyId||liveEnemy.id))||liveEnemy,position);return;}if(id==="mordida-feroz"){const message=latestSuccessfulStrongAttack(liveEnemy),target=message?.attackApplication?.targetCharacterId?getLiveCharacter(message.attackApplication.targetCharacterId):null;if(!message||!target)return;const enemyRank=enemySkillData(liveEnemy,"Manobra"),enemyTraining=enemyTrainingDie(enemyRank.rank),enemyModifier=(Number(liveEnemy.corpo)||0)+enemyRank.bonus-enemyRank.penalty,enemyFormula=`1d12${enemyTraining!=="0"?`+${enemyTraining}`:""}${enemyModifier>=0?"+":""}${enemyModifier}`,enemyResult=rollDiceExpression(enemyFormula),playerRoll=rollCharacterManobra(target);if(!enemyResult||!playerRoll.result)return;state.mordidaLastUsedRound=round;message.mordidaFerozUsed=true;saveTableCampaign();addRollChatMessage(`Mordida Feroz • ${liveEnemy.name}`,enemyFormula,enemyResult.total,enemyRollDetail(enemyResult));addRollChatMessage(`Resistência de Manobra • ${target.name}`,playerRoll.formula,playerRoll.result.total,enemyRollDetail(playerRoll.result));if(enemyResult.total>=playerRoll.result.total){target.conditions=Array.isArray(target.conditions)?target.conditions:[];target.conditions=target.conditions.filter(condition=>normalizeEnemyAbilityId(typeof condition==="string"?condition:condition.id||condition.name)!=="caido");target.conditions.push({id:"caido",name:"Caído",description:`Derrubado por ${liveEnemy.name}. Use Testar Manobra para se levantar.`,source:"mordida-feroz",escapeEnemyId:liveEnemy.enemyId||liveEnemy.id});saveDamagedCharacter(target);addSystemChatMessage(`${liveEnemy.name} venceu a disputa de Manobra. ${target.name} recebeu Caído.`);}else addSystemChatMessage(`${target.name} venceu a disputa de Manobra e resistiu à Mordida Feroz.`);openEnemyControlSheet((currentTableCampaign.enemies||[]).find(item=>String(item.enemyId||item.id)===String(liveEnemy.enemyId||liveEnemy.id))||liveEnemy,position);}}
function npcRound(){return Math.max(0,Number(currentTableCampaign?.combat?.round)||0);}
function npcAssistMap(){currentTableCampaign.combat=currentTableCampaign.combat||{};currentTableCampaign.combat.npcAssists=currentTableCampaign.combat.npcAssists||{};return currentTableCampaign.combat.npcAssists;}
function npcUsedThisRound(npc){return Number(npc?.helpState?.usedRound)===npcRound();}
function markNpcUsed(npc,action){npc.helpState=npc.helpState||{};npc.helpState.usedRound=npcRound();npc.helpState.action=action;npc.helpState.usedAt=Date.now();saveTableCampaign();if(action==="npc-attack"){const level=Math.max(1,Math.min(3,Number(npc.npcLevel)||1)),extra=npc.helpState.critical?2:0,formula=`${level+extra}d8+${level*2}`;setTimeout(()=>{const result=rollDiceExpression(formula);if(result)addRollChatMessage(`Dano • ${npc.name}${extra?" • CRÍTICO":""}`,formula,result.total,enemyRollDetail(result),{rollKind:"damage",npcInstanceId:npc.npcId||npc.id,applied:false});},0);}}
function npcRoleLabel(role){return({combat:"Combate",support:"Suporte",investigative:"Investigativo"})[role]||"Aliado";}
function openNpcControlSheet(npc,position){refreshCurrentTableCampaign();npc=(currentTableCampaign.npcs||[]).find(item=>String(item.npcId||item.id)===String(npc.npcId||npc.id))||npc;const level=Math.max(1,Math.min(3,Number(npc.npcLevel)||1)),used=npcUsedThisRound(npc),hp=Math.max(0,Number(npc.status?.pvAtual??npc.pv)||0),max=level*25,player=currentTableCharacter;let actions="";if(currentTableRole==="player"&&player&&!used){if(npc.npcRole==="combat")actions=`<button class="primary-button npc-help-action" data-action="joint">Ataque em conjunto</button><button class="secondary-button npc-help-action" data-action="protect">Proteção</button>`;else if(npc.npcRole==="support")actions=`<button class="primary-button npc-help-action" data-action="heal">Curar 2d8 + 4</button><button class="secondary-button npc-help-action" data-action="condition">Retirar condição</button>`;else actions=`<button class="primary-button npc-help-action" data-action="test">+3 no próximo teste</button><button class="secondary-button npc-help-action" data-action="analysis">Análise</button>`;}if(currentTableRole==="master"&&!used)actions=`<button class="primary-button npc-help-action" data-action="npc-attack">Rolar ataque</button><button class="secondary-button npc-help-action" data-action="npc-damage">Rolar dano</button>`;openTablePanel("NPC ALIADO",npc.name||"NPC",`<div class="table-panel-card"><h3>${escapeTableHTML(npc.name||"NPC")}</h3><p>${npcRoleLabel(npc.npcRole)} • Nível ${level}</p><p>PV: <strong>${hp}/${max}</strong></p><p>${used?"Ação desta rodada já utilizada.":"Disponível: 1 ajuda ou ação nesta rodada."}</p></div><div style="display:grid;gap:8px">${actions||""}</div>${currentTableRole==="master"?`<button id="npcRemoveControl" class="secondary-button" style="width:100%;margin-top:12px">Remover dos Aliados</button>`:""}`);document.querySelectorAll(".npc-help-action").forEach(button=>button.addEventListener("click",()=>useNpcAction(npc,button.dataset.action,position)));document.getElementById("npcRemoveControl")?.addEventListener("click",()=>{currentTableCampaign.npcs=(currentTableCampaign.npcs||[]).filter(item=>String(item.npcId||item.id)!==String(npc.npcId||npc.id));saveTableCampaign();closeCurrentPanel();renderCombatPositions()});}
function useNpcAction(npc,action,position){refreshCurrentTableCampaign();npc=(currentTableCampaign.npcs||[]).find(item=>String(item.npcId||item.id)===String(npc.npcId||npc.id))||npc;if(npcUsedThisRound(npc))return;const character=currentTableCharacter,assists=npcAssistMap();if(action==="joint"&&character){assists[character.id]={...(assists[character.id]||{}),attackBonus:3,damageDice:1,round:npcRound(),sourceNpc:npc.name};markNpcUsed(npc,action);addSystemChatMessage(`${npc.name} ajudará ${character.name}: +3 no próximo ataque e +1 dado no dano principal.`);}else if(action==="protect"&&character){assists[character.id]={...(assists[character.id]||{}),defenseBonus:4,rdBonus:3,round:npcRound(),sourceNpc:npc.name};markNpcUsed(npc,action);addSystemChatMessage(`${npc.name} protegeu ${character.name}: +4 Defesa e +3 RD até o próximo turno.`);}else if(action==="heal"&&character){const result=rollDiceExpression("2d8+4");character.status=character.status||{};const max=Math.max(0,Number(character.status.pvMax)||0),before=Math.max(0,Number(character.status.pvAtual)||0);character.status.pvAtual=Math.min(max,before+(Number(result?.total)||0));saveDamagedCharacter(character);markNpcUsed(npc,action);addRollChatMessage(`Cura de ${npc.name} • ${character.name}`,"2d8+4",result?.total||0,enemyRollDetail(result||{}));}else if(action==="condition"&&character){const conditions=Array.isArray(character.conditions)?character.conditions:[];if(!conditions.length){addSystemChatMessage(`${character.name} não possui condições para remover.`);return;}openTablePanel("AJUDA",`Remover condição • ${npc.name}`,`<div class="table-panel-list">${conditions.map((condition,index)=>`<button class="table-panel-card npc-condition-choice" data-index="${index}"><h3>${escapeTableHTML(typeof condition==="string"?condition:condition.name||"Condição")}</h3></button>`).join("")}</div>`);document.querySelectorAll(".npc-condition-choice").forEach(button=>button.addEventListener("click",()=>{character.conditions.splice(Number(button.dataset.index),1);saveDamagedCharacter(character);markNpcUsed(npc,"condition");addSystemChatMessage(`${npc.name} removeu uma condição de ${character.name}.`);openNpcControlSheet(npc,position)}));return;}else if(action==="test"&&character){assists[character.id]={...(assists[character.id]||{}),testBonus:3,round:npcRound(),sourceNpc:npc.name};markNpcUsed(npc,action);addSystemChatMessage(`${npc.name} concedeu +3 no próximo teste de ${character.name}.`);}else if(action==="analysis"&&character){markNpcUsed(npc,action);addSystemChatMessage(`${character.name} solicitou uma Análise de ${npc.name}. O mestre deve revelar uma habilidade, atributo, PV ou outra informação da criatura.`);}else if(action==="npc-attack"){const level=Math.max(1,Math.min(3,Number(npc.npcLevel)||1)),training=[0,"1d4","1d8","1d12"][level],result=rollCharacterTrainedTest(training,level*2);if(!result)return;npc.helpState=npc.helpState||{};npc.helpState.critical=result.critical;markNpcUsed(npc,action);addRollChatMessage(`Ataque • ${npc.name}${result.critical?" • CRÍTICO":""}`,result.formula,result.total,enemyRollDetail(result),{rollKind:"attack",npcInstanceId:npc.npcId||npc.id,applied:false});}else if(action==="npc-damage"){const level=Math.max(1,Math.min(3,Number(npc.npcLevel)||1)),extra=npc.helpState?.critical?2:0,formula=`${level+extra}d8+${level*2}`,result=rollDiceExpression(formula);if(!result)return;npc.helpState.critical=false;markNpcUsed(npc,action);addRollChatMessage(`Dano • ${npc.name}${extra?" • CRÍTICO":""}`,formula,result.total,enemyRollDetail(result),{rollKind:"damage",npcInstanceId:npc.npcId||npc.id,applied:false});}openNpcControlSheet(npc,position);}

function openEnemyControlSheet(enemy,position){
    const requestedEnemyId=enemy?.enemyId||enemy?.id;
    refreshCurrentTableCampaign();
    enemy=hydrateEnemyMedia((currentTableCampaign.enemies||[]).find(item=>String(item.enemyId||item.id)===String(requestedEnemyId))||enemy);
    if(enemyHasAbility(enemy,"ferocidade")&&!enemy.ferocityApplied){enemy.basicAttack=addEnemyDamageDice(enemy.basicAttack,1);enemy.strongAttack=addEnemyDamageDice(enemy.strongAttack,1);enemy.ferocityApplied=true;saveTableCampaign();}
    if((enemy.conditions||[]).some(condition=>normalizeEnemyAbilityId(typeof condition==="string"?condition:condition.id||condition.name)==="machucado"))triggerEnemyMetamorphosis(enemy);
    const skills=enemy.skills&&typeof enemy.skills==="object"?enemy.skills:{};
    const hp=Number(enemy.status?.pvAtual ?? enemy.pv ?? 0),max=Number(enemy.status?.pvMax ?? enemy.pv ?? 0),conditions=Array.isArray(enemy.conditions)?enemy.conditions:[];
    const enemyLifeMode=enemy.lifeMode==="body"?"body":"classic";
    const enemyClassicHTML=enemyLifeMode==="classic"?`<div class="table-panel-card"><h3>PV</h3><div style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end"><label>Atual<input id="enemyHpCurrent" type="number" value="${hp}"></label><label>Máximo<input id="enemyHpMax" type="number" value="${max}"></label><button id="enemySaveHp" class="primary-button">Aplicar</button></div></div>`:"";
    const enemyBodyHTML=enemyLifeMode==="body"?`<div class="table-panel-card"><h3>Partes do Corpo</h3><div class="table-panel-list">${bodyDamageParts(enemy,"enemy").map(part=>`<div class="table-panel-item"><strong>${escapeTableHTML(part.label)}</strong><span>${part.current}/${Number(enemy.bodyMaximums?.[part.id])||part.current}</span></div>`).join("")}</div></div>`:"";
    const skillEntries=Array.isArray(skills)?skills.map(item=>[item.name||item.id,enemySkillData(enemy,item.name||item.id).rank]):Object.entries(skills).map(([name])=>[name,enemySkillData(enemy,name).rank]);
    const skillButtons=skillEntries.filter(([,rank])=>rank>0).map(([name,rank])=>`<button type="button" class="secondary-button enemy-skill-roll" data-skill="${escapeTableHTML(name)}">${escapeTableHTML(name)} • ${enemyTrainingDie(rank)}</button>`).join("");
    const conditionList=conditions.length?conditions.map((condition,index)=>{const value=typeof condition==="string"?{name:condition}:condition;return`<div class="table-panel-card" style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center"><span>${escapeTableHTML(value.icon||"○")} ${escapeTableHTML(value.name||"Condição")}${Number(value.stacks)>1?` ×${Number(value.stacks)}`:""}</span><button type="button" class="secondary-button enemy-condition-remove" data-index="${index}">Remover</button></div>`}).join(""):"<p>Nenhuma condição ativa.</p>";
    const hasActionPoint=enemyCurrentActionPoints(enemy)>=1;
    const attackCard=(kind,title,damage)=>`<div class="table-panel-card"><h3>${title}</h3><p>Dano: ${escapeTableHTML(damage||"—")}</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px"><button type="button" class="primary-button enemy-quick-attack" data-attack="${kind}" data-roll="attack" ${hasActionPoint?"":"disabled"}>Acertar • 1 PA</button><button type="button" class="secondary-button enemy-quick-attack" data-attack="${kind}" data-roll="damage">Dano</button></div></div>`;
    const isWounded=conditions.some(condition=>String(typeof condition==="string"?condition:condition.id||condition.name||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()==="machucado"),currentPhoto=(isWounded?enemy.woundedPhoto:"")||enemy.photo||"";
    openTablePanel("AMEAÇA",enemy.name||"Criatura",`
      <div class="table-panel-card enemy-control-sheet"><div style="display:flex;gap:14px;align-items:center">${currentPhoto?`<img src="${currentPhoto}" alt="" style="width:82px;height:82px;object-fit:cover;border-radius:18px">`:"<div style='font-size:42px'>👹</div>"}<div><h3>${escapeTableHTML(enemy.name||"Criatura")}</h3><p>${escapeTableHTML(enemy.element||"")} • NA ${Number(enemy.na)||0} • Tamanho ${Math.max(1,Number(enemy.size)||1)}</p></div></div></div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px"><div class="table-panel-card"><span>DEFESA</span><h3>${Number(enemy.defense)||0}</h3></div><div class="table-panel-card"><span>RD</span><h3>${Number(enemy.rd)||0}</h3></div><div class="table-panel-card"><span>PA</span><h3>${enemy.status?.paAtual ?? enemy.paAtual ?? enemy.pa ?? 0}/${enemy.status?.paMax ?? enemy.paMax ?? enemy.pa ?? 0}</h3></div></div>
      <div class="table-panel-card"><h3>Sistema de vida</h3><p>${enemyLifeMode==="body"?"Partes do Corpo":"PV Clássico"}</p><button id="enemyToggleLifeMode" type="button" class="secondary-button">Usar ${enemyLifeMode==="body"?"PV clássico":"sistema de membros"}</button></div>
      ${enemyClassicHTML}
      ${enemyBodyHTML}
      <div><h3 style="margin-bottom:8px">Ataques rápidos</h3>${attackCard("basic","Ataque básico",enemy.basicAttack)}${attackCard("strong","Ataque forte",enemy.strongAttack)}</div>
      <div class="table-panel-card"><h3>Perícias</h3><div style="display:grid;gap:8px">${skillButtons||"<p>Nenhuma perícia treinada.</p>"}</div></div>
      <div><h3 style="margin-bottom:8px">Habilidades</h3>${renderEnemyAbilityCards(enemy)}</div>
      <div class="table-panel-card"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h3>Condições</h3><button id="enemyAddCondition" type="button" class="primary-button" aria-label="Adicionar condição" style="width:42px;padding:0">＋</button></div><div style="display:grid;gap:8px;margin-top:10px">${conditionList}</div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button id="enemyMoveFromSheet" class="secondary-button">Mover</button><button id="enemyRemoveFromSheet" class="secondary-button">Remover da mesa</button></div>`);
    document.getElementById("enemySaveHp")?.addEventListener("click",()=>{enemy.status=enemy.status||{};enemy.status.pvAtual=Math.max(0,Number(document.getElementById("enemyHpCurrent")?.value)||0);enemy.status.pvMax=Math.max(0,Number(document.getElementById("enemyHpMax")?.value)||0);saveTableCampaign();openEnemyControlSheet(enemy,position)});
    document.getElementById("enemyToggleLifeMode")?.addEventListener("click",()=>{if(enemy.lifeMode==="body")enemy.lifeMode="classic";else initializeEnemyBody(enemy);saveTableCampaign();openEnemyControlSheet(enemy,position)});
    document.querySelectorAll(".enemy-quick-attack").forEach(button=>button.addEventListener("click",()=>{refreshCurrentTableCampaign();const liveEnemy=(currentTableCampaign.enemies||[]).find(item=>String(item.enemyId||item.id)===String(enemy.enemyId||enemy.id))||enemy,attackName=button.dataset.attack==="strong"?"Ataque forte":"Ataque básico",enemyInstanceId=liveEnemy.enemyId||liveEnemy.id,attackVariant=button.dataset.attack,secondPhase=enemyHasAbility(liveEnemy,"segunda-fase")&&(liveEnemy.conditions||[]).some(condition=>normalizeEnemyAbilityId(typeof condition==="string"?condition:condition.id||condition.name)==="machucado");if(button.dataset.roll==="attack"){if(!spendEnemyActionPoints(liveEnemy,1)){addSystemChatMessage(`${liveEnemy.name||"A criatura"} não possui PA suficiente para atacar.`);openEnemyControlSheet(liveEnemy,position);return;}rollEnemySkill(liveEnemy,"Luta",{label:`Ataque • ${attackName} • ${liveEnemy.name||"Criatura"}`,rollKind:"attack",attackName,enemyInstanceId,attackVariant,flatBonus:secondPhase?3:0,applied:false});openEnemyControlSheet(liveEnemy,position);return}const state=enemyAbilityState(liveEnemy),raw=button.dataset.attack==="strong"?liveEnemy.strongAttack:liveEnemy.basicAttack,investidaDice=state.investidaArmed?1:0,criticalDice=state.criticalDamageDice&&(!state.criticalAttackVariant||state.criticalAttackVariant===attackVariant)?Number(state.criticalDamageDice)||0:0,phaseDice=secondPhase?1:0,extraDice=investidaDice+criticalDice+phaseDice,boosted=extraDice?addEnemyDamageDice(raw,extraDice):raw,resolved=String(boosted||"").replace(/Corpo/gi,Number(liveEnemy.corpo)||0),result=rollDiceExpression(resolved);if(!result)return;if(state.investidaArmed)state.investidaArmed=false;if(criticalDice){state.criticalDamageDice=0;state.criticalAttackVariant=null;}if(extraDice)saveTableCampaign();const bonuses=[investidaDice?"Investida +1 dado":"",criticalDice?"Crítico +2 dados":"",phaseDice?"Segunda Fase +1 dado":""].filter(Boolean).join(" • ");addRollChatMessage(`Dano • ${attackName} • ${liveEnemy.name||"Criatura"}${bonuses?` • ${bonuses}`:""}`,resolved,result.total,enemyRollDetail(result),{rollKind:"damage",attackName,enemyInstanceId,attackVariant,applied:false})}));
    document.querySelectorAll(".enemy-skill-roll").forEach(button=>button.addEventListener("click",()=>rollEnemySkill(enemy,button.dataset.skill)));
    document.querySelectorAll(".enemy-use-ability").forEach(button=>button.addEventListener("click",()=>{if(!useNewEnemyAbility(enemy,button.dataset.ability,position))useEnemyAbility(enemy,button.dataset.ability,position)}));
    document.getElementById("enemyAddCondition")?.addEventListener("click",()=>openEnemyConditionSelector(enemy,position));
    document.querySelectorAll(".enemy-condition-remove").forEach(button=>button.addEventListener("click",()=>{enemy.conditions=conditions.filter((_,index)=>index!==Number(button.dataset.index));saveTableCampaign();renderCombatPositions();openEnemyControlSheet(enemy,position)}));
    document.getElementById("enemyMoveFromSheet")?.addEventListener("click",()=>{closeCurrentPanel();startMoveEntity("enemy",enemy)});
    document.getElementById("enemyRemoveFromSheet")?.addEventListener("click",()=>{removeEntityFromScene("enemy",enemy);closeCurrentPanel()});
}

/*==========================================================
=              MOVER ENTIDADE
==========================================================*/

function startMoveEntity(
    type,
    entity
){

    closeCurrentPositionModal();

    if(type === "player"){

        if(
            currentTableRole === "player"
        ){

            openTablePanel(
                "MOVIMENTO",
                "Escolha uma posição",
                createPositionButtons(
                    6,
                    "move-current-player"
                )
            );

            bindMoveCurrentPlayerButtons();

        }
        else{

            openTablePanel(
                "MOVIMENTO",
                entity.name || "Personagem",
                createPositionButtons(
                    6,
                    "move-master-player"
                )
            );

            bindMasterPlayerMoveButtons(
                entity
            );

        }

        return;

    }

    if(type === "enemy"){

        openTablePanel(
            "MOVIMENTO",
            entity.name || "Ameaça",
            createPositionButtons(
                6,
                "move-enemy"
            )
        );

        bindEntityMoveButtons(
            "enemy",
            entity
        );

        return;

    }

    if(type === "npc"){

        openTablePanel(
            "MOVIMENTO",
            entity.name || "NPC",
            createPositionButtons(
                3,
                "move-npc"
            )
        );

        bindEntityMoveButtons(
            "npc",
            entity
        );

    }

}


/*==========================================================
=              BOTÕES DE POSIÇÃO
==========================================================*/

function createPositionButtons(
    amount,
    className
){

    let html = `

        <div
            style="
                display:grid;
                grid-template-columns:repeat(2,1fr);
                gap:10px;
            "
        >

    `;

    for(
        let position = 1;
        position <= amount;
        position++
    ){

        html += `

            <button
                type="button"
                class="primary-button ${className}"
                data-position="${position}">

                Posição ${position}

            </button>

        `;

    }

    html += "</div>";

    return html;

}


/*==========================================================
=              MOVER JOGADOR ATUAL
==========================================================*/

function bindMoveCurrentPlayerButtons(){

    document
        .querySelectorAll(
            ".move-current-player"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    placeCurrentPlayer(
                        Number(
                            button.dataset.position
                        )
                    );

                    closeCurrentPanel();

                }
            );

        });

}


/*==========================================================
=              MESTRE MOVE JOGADOR
==========================================================*/

function bindMasterPlayerMoveButtons(
    entity
){

    document
        .querySelectorAll(
            ".move-master-player"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    moveCampaignPlayer(
                        entity.characterId,
                        Number(
                            button.dataset.position
                        )
                    );

                    closeCurrentPanel();

                }
            );

        });

}


/*==========================================================
=              MOVER NPC / AMEAÇA
==========================================================*/

function bindEntityMoveButtons(
    type,
    entity
){

    const selector =
        type === "enemy"
            ? ".move-enemy"
            : ".move-npc";

    document
        .querySelectorAll(
            selector
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    placeEntityAtPosition(
                        type,
                        entity,
                        Number(
                            button.dataset.position
                        )
                    );

                    closeCurrentPanel();

                }
            );

        });

}


/*==========================================================
=              REMOVER DO CENÁRIO
==========================================================*/

function removeEntityFromScene(
    type,
    entity
){

    if(type === "player"){

        const player =
            currentTableCampaign.players?.find(
                item =>
                    item.characterId ===
                    entity.characterId
            );

        if(player){

            player.position = null;

        }

    }

    if(type === "enemy"){

        const entityId =
            entity.enemyId ||
            entity.id;

        currentTableCampaign.enemies =
            (
                currentTableCampaign.enemies ||
                []
            ).filter(
                item =>
                    String(
                        item.enemyId ||
                        item.id
                    ) !==
                    String(entityId)
            );

    }

    if(type === "npc"){

        const npc =
            currentTableCampaign.npcs?.find(
                item =>
                    String(item.id) ===
                    String(entity.id)
            );

        if(npc){

            npc.position = null;

        }

    }

    saveTableCampaign();

    closeCurrentPositionModal();

    renderCombatPositions();

    addSystemChatMessage(
        `${entity.name || "Entidade"} saiu do cenário.`
    );

}

/*==========================================================
=              ID DE MENSAGEM
==========================================================*/

function createChatMessageId(){

    return (
        `chat_${Date.now()}_` +
        Math.random()
            .toString(36)
            .slice(2,10)
    );

}

/*==========================================================
=              SALVAR MENSAGEM PÚBLICA
==========================================================*/

function savePublicChatMessage(
    message
){

    refreshCurrentTableCampaign();


    if(
        !Array.isArray(
            currentTableCampaign.chatMessages
        )
    ){

        currentTableCampaign.chatMessages = [];

    }


    currentTableCampaign
        .chatMessages
        .push(message);


    /*
        Impede que o localStorage cresça sem limite.
    */

    if(
        currentTableCampaign
            .chatMessages
            .length > 200
    ){

        currentTableCampaign.chatMessages =
            currentTableCampaign
                .chatMessages
                .slice(-200);

    }


    saveTableCampaign();

    renderPublicChat();

}


/*==========================================================
=              CHAT
==========================================================*/

const tableChat =
    document.getElementById(
        "tableChat"
    );

const chatMessages =
    document.getElementById(
        "chatMessages"
    );

const chatInput =
    document.getElementById(
        "chatInput"
    );

const sendChatMessageButton =
    document.getElementById(
        "sendChatMessage"
    );

const collapseChat =
    document.getElementById(
        "collapseChat"
    );

const toggleChat =
    document.getElementById(
        "toggleChat"
    );


/*==========================================================
=              EVENTOS DO CHAT
==========================================================*/

sendChatMessageButton?.addEventListener(
    "click",
    sendTableChatMessage
);

chatInput?.addEventListener(
    "keydown",
    event => {

        if(event.key === "Enter"){

            sendTableChatMessage();

        }

    }
);

collapseChat?.addEventListener(
    "click",
    toggleTableChat
);

toggleChat?.addEventListener(
    "click",
    toggleTableChat
);


/*==========================================================
=              ENVIAR MENSAGEM
==========================================================*/
function sendTableChatMessage(){

    const text =
        chatInput?.value.trim();


    if(!text){

        return;

    }


    const author =
        currentTableRole === "master"
            ? "Mestre"
            : currentTableCharacter?.name ||
              "Jogador";


    const characterId =
        currentTableRole === "player"
            ? currentTableCharacter?.id || null
            : null;


    const photo =
        currentTableRole === "player"
            ? getCharacterCurrentPhoto(
                currentTableCharacter
            )
            : "";


    savePublicChatMessage({

        id:
            createChatMessageId(),

        type:
            "message",

        author,

        role:
            currentTableRole,

        characterId,

        photo,

        text,

        createdAt:
            Date.now()

    });


    chatInput.value = "";

}





/*==========================================================
=              MENSAGEM DO SISTEMA
==========================================================*/

function addSystemChatMessage(
    text
){

    if(
        !currentTableCampaign
    ){

        return;

    }


    savePublicChatMessage({

        id:
            createChatMessageId(),

        type:
            "system",

        author:
            "Sistema",

        text:
            String(text),

        createdAt:
            Date.now()

    });

}


/*==========================================================
=              ROLAGEM NO CHAT
==========================================================*/

function addRollChatMessage(
    label,
    formula,
    total,
    detail,
    metadata = {}
){

    if(
        !currentTableCampaign
    ){

        return;

    }

    if(currentTableRole==="player"&&metadata.rollKind==="attack"&&currentTableCharacter?.id){
        const illusion=currentTableCampaign.combat?.illusoryPenalties||{},oppression=currentTableCampaign.combat?.oppressivePenalties||{},effects=[illusion[currentTableCharacter.id],oppression[currentTableCharacter.id]].filter(Boolean),penalty=effects.reduce((sum,effect)=>sum+Math.max(0,Number(effect.penalty)||0),0);
        if(penalty){total=(Number(total)||0)-penalty;formula=`${formula} - ${penalty}`;detail=`${detail}${detail?" • ":""}Penalidades de ameaça: -${penalty}`;delete illusion[currentTableCharacter.id];delete oppression[currentTableCharacter.id];saveTableCampaign();addSystemChatMessage(`${currentTableCharacter.name} sofreu -${penalty} no ataque por efeitos de ameaça.`);}
    }


    const author =
        currentTableRole === "master"
            ? "Mestre"
            : currentTableCharacter?.name ||
              "Jogador";


    const characterId =
        currentTableRole === "player"
            ? currentTableCharacter?.id || null
            : null;


    const photo =
        currentTableRole === "player"
            ? getCharacterCurrentPhoto(
                currentTableCharacter
            )
            : "";


    savePublicChatMessage({

        id:
            createChatMessageId(),

        type:
            "roll",

        author,

        role:
            currentTableRole,

        characterId,

        photo,

        label:
            String(label || "Rolagem"),

        formula:
            String(formula || ""),

        total:
            Number(total) || 0,

        detail:
            String(detail || ""),

            rollKind:
    metadata.rollKind ||
    "generic",

attackIndex:
    metadata.attackIndex ??
    null,

attackName:
    String(
        metadata.attackName ||
        ""
    ),

attackSkill:
    metadata.attackSkill ||
    null,

element:
    metadata.element ||
    metadata.damageElement ||
    null,

isRitual:
    metadata.isRitual === true,

applied:
    Boolean(
        metadata.applied
    ),

    isCounterAttack:
    Boolean(
        metadata.isCounterAttack
    ),

forcedTargetCharacterId:
    metadata.forcedTargetCharacterId ||
    null,

enemyInstanceId:
    metadata.enemyInstanceId ||
    null,

attackVariant:
    metadata.attackVariant ||
    null,

enemyCritical:
    metadata.enemyCritical === true,

success:
    typeof metadata.success === "boolean"
        ? metadata.success
        : null,

testSuccess:
    typeof metadata.testSuccess === "boolean"
        ? metadata.testSuccess
        : null,

dt:
    Number.isFinite(Number(metadata.dt))
        ? Number(metadata.dt)
        : null,

resistanceDT:
    Number.isFinite(Number(metadata.resistanceDT))
        ? Number(metadata.resistanceDT)
        : null,

        createdAt:
            Date.now()

    });

}


/*==========================================================
=              DADOS RÁPIDOS
==========================================================*/

document
    .querySelectorAll(
        ".dice-quick-button"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const sides =
                    Number(
                        button.dataset.die
                    );

                const result =
                    Math.floor(
                        Math.random() * sides
                    ) + 1;

                addRollChatMessage(
                    `d${sides}`,
                    `1d${sides}`,
                    result,
                    `[${result}]`
                );

                diceModal?.classList.add(
                    "hidden"
                );

                clearActiveMenuButtons();

            }
        );

    });


/*==========================================================
=              ROLAGEM CUSTOMIZADA
==========================================================*/

document
    .getElementById(
        "rollCustomDice"
    )
    ?.addEventListener(
        "click",
        () => {

            const amount =
                Number(
                    document.getElementById(
                        "diceAmount"
                    )?.value
                ) || 1;

            const sides =
                Number(
                    document.getElementById(
                        "diceSides"
                    )?.value
                ) || 20;

            const modifier =
                Number(
                    document.getElementById(
                        "diceModifier"
                    )?.value
                ) || 0;

            const rolls = [];

            let sum = 0;

            for(
                let i = 0;
                i < amount;
                i++
            ){

                const roll =
                    Math.floor(
                        Math.random() *
                        sides
                    ) + 1;

                rolls.push(roll);

                sum += roll;

            }

            const total =
                sum + modifier;

            const formula =
                `${amount}d${sides}${
                    modifier
                        ? `${modifier >= 0 ? "+" : ""}${modifier}`
                        : ""
                }`;

            const detail =
                `[${rolls.join(", ")}]${
                    modifier
                        ? ` ${modifier >= 0 ? "+" : ""}${modifier}`
                        : ""
                }`;

            addRollChatMessage(
                "Rolagem",
                formula,
                total,
                detail
            );

            diceModal?.classList.add(
                "hidden"
            );

            clearActiveMenuButtons();

        }
    );


/*==========================================================
=              ABRIR / FECHAR CHAT
==========================================================*/

function toggleTableChat(){

    if(!tableChat){

        return;

    }


    const playArea =
        document.querySelector(
            ".table-play-area"
        );


    const collapsed =
        tableChat.classList.toggle(
            "collapsed"
        );


    playArea
        ?.classList
        .toggle(
            "chat-collapsed",
            collapsed
        );


    if(collapseChat){

        collapseChat.textContent =
            collapsed
                ? "‹"
                : "›";

    }

}


/*==========================================================
=              SCROLL CHAT
==========================================================*/

function scrollTableChat(){

    if(!chatMessages){

        return;

    }

    chatMessages.scrollTop =
        chatMessages.scrollHeight;

}


/*==========================================================
=              HORÁRIO
==========================================================*/

function getTableTime(){

    const now =
        new Date();

    return now.toLocaleTimeString(
        "pt-BR",
        {
            hour:"2-digit",
            minute:"2-digit"
        }
    );

}


/*==========================================================
=              ESC
==========================================================*/

document.addEventListener(
    "keydown",
    event => {

        if(event.key !== "Escape"){

            return;

        }

        if(pendingAttackApplication){

    cancelAttackTargetSelection();

    return;

}

        if(pendingDamageApplication){

    cancelDamageTargetSelection();

    return;

}

        if(
            positionModal &&
            !positionModal
                .classList
                .contains("hidden")
        ){

            closeCurrentPositionModal();

            return;

        }

        if(
            diceModal &&
            !diceModal
                .classList
                .contains("hidden")
        ){

            diceModal.classList.add(
                "hidden"
            );

            clearActiveMenuButtons();

            return;

        }

        if(
            tablePanelOverlay &&
            !tablePanelOverlay
                .classList
                .contains("hidden")
        ){

            closeCurrentPanel();

        }

    }
);

/*==========================================================
=              PEGAR FICHA ATUALIZADA
==========================================================*/

function getLiveCharacter(
    characterId
){

    const characters =
        JSON.parse(
            localStorage.getItem(
                "ordem_characters"
            ) || "[]"
        );


    return characters.find(
        character =>
            character.id === characterId
    ) || null;

}

function refreshCurrentTableCharacter(){

    if(
        currentTableRole !== "player" ||
        !currentTableCharacter
    ){

        return;

    }


    const updated =
        getLiveCharacter(
            currentTableCharacter.id
        );


    if(updated){

        currentTableCharacter =
            updated;

    }

}

/*==========================================================
=              ATUALIZAR CAMPANHA DA MESA
==========================================================*/

function refreshCurrentTableCampaign(){

    let campaigns = [];

    try{

        campaigns =
            JSON.parse(
                localStorage.getItem(
                    TABLE_CAMPAIGN_STORAGE
                ) || "[]"
            );

    }
    catch(error){

        console.error(
            "Erro ao atualizar campanha:",
            error
        );

        return false;

    }


    const updatedCampaign =
        campaigns.find(
            campaign =>
                campaign.id ===
                currentTableCampaign?.id
        );


    if(!updatedCampaign){

        return false;

    }


    tableCampaigns =
        campaigns;


    currentTableCampaign =
        updatedCampaign;


    initializeCombatState();


    return true;

}

/*==========================================================
=              CAMPANHA AO VIVO
==========================================================*/

window.addEventListener(
    "storage",
    event => {

        if(
            event.key !==
            TABLE_CAMPAIGN_STORAGE
        ){

            return;

        }


        refreshCurrentTableCampaign();

        refreshCurrentTableCharacter();

        renderCombatPositions();

        loadScene();

        renderPublicChat();

        checkInitiativeRequest();

    }
);

/*==========================================================
=              VERIFICAR INICIATIVA
==========================================================*/

function checkInitiativeRequest(){

    if(
        currentTableRole !== "player" ||
        !currentTableCharacter ||
        !currentTableCampaign
    ){

        return;

    }


    const request =
        currentTableCampaign
            .combat
            ?.initiativeRequest;


    if(
        !request ||
        request.active !== true
    ){

        return;

    }


    const participant =
        request.participants
            ?.find(
                item =>
                    item.type === "player" &&
                    item.characterId ===
                    currentTableCharacter.id
            );


    if(
        !participant ||
        participant.rolled === true
    ){

        return;

    }


    if(
        lastInitiativeRequestShown ===
        request.id
    ){

        return;

    }


    lastInitiativeRequestShown =
        request.id;


    openPlayerInitiativePanel();

}

/*==========================================================
=              PAINEL DO JOGADOR
==========================================================*/

function openPlayerInitiativePanel(){

    if(
        currentTableRole !== "player" ||
        !currentTableCharacter
    ){

        return;

    }


    const attributes=currentTableCharacter.attributes||{};
    const corpo=Number(attributes.corpo??currentTableCharacter.corpo)||0;
    const readiness=getCharacterReadinessSkill(currentTableCharacter);
    const trainingFormula=readiness?.training&&readiness.training!=="0"?readiness.training:"0";


    openTablePanel(
        "COMBATE",
        "Rolar Iniciativa",
        `

        <div class="table-panel-section">

            <div class="table-panel-card">

                <h3>
                    Teste solicitado
                </h3>

                <p>
                    A iniciativa utiliza Corpo e a perícia Presteza.
                </p>

                <p>
                    Fórmula: 1d12 + ${escapeTableHTML(trainingFormula)} + ${corpo} de Corpo.
                </p>

            </div>


            <button type="button" class="initiative-attribute-button" data-attribute="corpo"><strong>Rolar Presteza</strong><span>Corpo ${corpo}</span></button>

        </div>

        `
    );


    document
        .querySelectorAll(
            ".initiative-attribute-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    rollPlayerInitiative("corpo");

                }
            );

        });

}

/*==========================================================
=              PEGAR PRESTEZA
==========================================================*/

function getCharacterReadinessSkill(
    character
){

    const skills =
        Array.isArray(
            character.skills
        )
            ? character.skills
            : [];


    return skills.find(skill => {

        const id =
            String(
                skill.id || ""
            )
                .toLowerCase()
                .trim();


        const name =
            String(
                skill.name || ""
            )
                .toLowerCase()
                .trim();


        return (
            id === "presteza" ||
            name === "presteza"
        );

    }) || null;

}

/*==========================================================
=              ROLAR INICIATIVA DO JOGADOR
==========================================================*/

function rollPlayerInitiative(
    attributeName
){

    refreshCurrentTableCampaign();

    refreshCurrentTableCharacter();


    if(
        currentTableRole !== "player" ||
        !currentTableCharacter
    ){

        return;

    }


    const request =
        currentTableCampaign
            .combat
            ?.initiativeRequest;


    if(
        !request ||
        request.active !== true
    ){

        addSystemChatMessage(
            "Não existe uma solicitação de iniciativa ativa."
        );

        return;

    }


    const participant =
        request.participants
            ?.find(
                item =>
                    item.type === "player" &&
                    item.characterId ===
                    currentTableCharacter.id
            );


    if(!participant){

        return;

    }


    if(participant.rolled){

        addSystemChatMessage(
            "Você já rolou sua iniciativa."
        );

        closeCurrentPanel();

        return;

    }


    const attributeValue=Math.max(0,Number(currentTableCharacter.attributes?.corpo??currentTableCharacter.corpo)||0);
    const readiness =
        getCharacterReadinessSkill(
            currentTableCharacter
        );


    const trainingFormula =
        readiness?.training &&
        readiness.training !== "0"
            ? readiness.training
            : "0";


    const skillModifier =
        (
            Number(
                readiness?.bonus
            ) || 0
        )
        - Math.abs(Number(readiness?.penalty??readiness?.penalidade)||0);


    const initiativeRoll=rollCharacterTrainedTest(trainingFormula,attributeValue+skillModifier);
    if(!initiativeRoll)return;
    const principalRoll=initiativeRoll.principalRoll;
    const trainingValue=initiativeRoll.trainingTotal;
    const total=initiativeRoll.total;


    participant.rolled =
        true;


    participant.result =
        total;


    participant.attribute =
        attributeName;


    participant.attributeValue =
        attributeValue;


    participant.principalRoll=principalRoll;


    participant.readinessTraining =
        initiativeRoll.trainingFormula;


    participant.readinessRoll =
        trainingValue;


    participant.modifier =
        skillModifier;


    participant.rolledAt =
        Date.now();


    currentTableCampaign
        .combat
        .updatedAt =
        Date.now();


    saveTableCampaign();


    const detail = [

        `1d12 [${principalRoll}]`,

        `Corpo ${attributeValue >= 0 ? "+" : ""}${attributeValue}`,

        initiativeRoll.trainingFormula !== "0"
            ? `Presteza ${initiativeRoll.trainingFormula} = ${trainingValue}`
            : "Presteza sem treino",

        skillModifier
            ? `modificador ${skillModifier >= 0 ? "+" : ""}${skillModifier}`
            : ""

    ]
        .filter(Boolean)
        .join(" • ");


    addRollChatMessage(
        `Iniciativa • ${currentTableCharacter.name}`,
        initiativeRoll.formula,
        total,
        detail
    );


    closeCurrentPanel();


    addSystemChatMessage(
        `Iniciativa registrada: ${total}.`
    );


    finalizeInitiativeIfReady();

}

/*==========================================================
=              ROLAR INICIATIVA DAS AMEAÇAS
==========================================================*/

function rollEnemyInitiatives(){
    const request=currentTableCampaign.combat?.initiativeRequest;
    if(!request || request.active!==true)return;

    const placed=Array.isArray(currentTableCampaign.enemies)?currentTableCampaign.enemies:[];
    const rollMessages=[];
    request.participants
        .filter(participant=>participant.type==="enemy"&&participant.rolled!==true)
        .forEach(participant=>{
            const enemy=placed.find(item=>String(item.enemyId||item.id)===String(participant.enemyId));
            if(!enemy)return;

            const result=rollEnemyTrainedTest(enemy,"Presteza","corpo");
            if(!result)return;

            participant.rolled=true;
            participant.result=result.total;
            participant.attribute="corpo";
            participant.attributeValue=result.attributeValue;
            participant.readinessTraining=result.trainingFormula;
            participant.modifier=result.modifier;
            participant.critical=result.critical;
            participant.rolledAt=Date.now();

            rollMessages.push({
                label:`Iniciativa • ${enemy.name||participant.name||"Ameaça"}${result.critical?" • CRÍTICO":""}`,
                formula:result.formula,
                total:result.total,
                detail:`${enemyRollDetail(result)}${result.critical?" • d12 principal = 12 • dado de treino adicional":""}`
            });
        });

    currentTableCampaign.combat.updatedAt=Date.now();
    saveTableCampaign();
    rollMessages.forEach(message=>addRollChatMessage(message.label,message.formula,message.total,message.detail));
    finalizeInitiativeIfReady();
}

/*==========================================================
=              SINCRONIZAÇÃO AO VIVO
==========================================================*/

/*==========================================================
=              SINCRONIZAÇÃO AO VIVO
==========================================================*/

window.addEventListener(
    "storage",
    event => {

        if(
            event.key !== TABLE_CHARACTER_STORAGE &&
            event.key !== TABLE_CAMPAIGN_STORAGE
        ){

            return;

        }


        loadTableStorage();

        refreshCurrentTableCharacter();

        renderCombatPositions();

        refreshOpenCharacterPanel();

        checkPendingAttackReaction();

        checkPendingEnemyAttackReaction();

    }
);




/*==========================================================
=              FOTO ATUAL DO PERSONAGEM
==========================================================*/

function getCharacterCurrentPhoto(
    character
){

    const conditions =
        Array.isArray(
            character.conditions
        )
            ? character.conditions
            : [];


    const wounded =
        conditions.some(
            condition =>
                condition.id ===
                "machucado"
        );


    if(
        wounded &&
        character.woundedPhoto
    ){

        return character.woundedPhoto;

    }


 return character.photo || "";

}

/*==========================================================
=              ROLAR EXPRESSÃO DE DADOS
==========================================================*/

function rollDiceExpression(
    expression
){

    if(!expression){

        return null;

    }


    const clean =
        String(
            expression
        )
            .toLowerCase()
            .replace(/\s+/g,"");


    /*
        Aceita:
        1d20
        1d20+1d8
        2d6+5
        1d20+1d8-3
    */

    const parts =
        clean.match(
            /[+-]?[^+-]+/g
        );


    if(!parts){

        return null;

    }


    let total = 0;

    const details = [];


    for(
        const rawPart
        of parts
    ){

        let sign = 1;

        let part =
            rawPart;


        if(part.startsWith("+")){

            part =
                part.slice(1);

        }
        else if(
            part.startsWith("-")
        ){

            sign = -1;

            part =
                part.slice(1);

        }


        const dice =
            part.match(
                /^(\d+)d(\d+)$/
            );


        if(dice){

            const amount =
                Number(
                    dice[1]
                );


            const sides =
                Number(
                    dice[2]
                );


            const rolls = [];


            for(
                let i = 0;
                i < amount;
                i++
            ){

                rolls.push(
                    Math.floor(
                        Math.random() *
                        sides
                    ) + 1
                );

            }


            const subtotal =
                rolls.reduce(
                    (sum,value) =>
                        sum + value,
                    0
                ) * sign;


            total +=
                subtotal;


            details.push({

                type:"dice",

                formula:
                    `${amount}d${sides}`,

                rolls,

                sign,

                subtotal

            });


            continue;

        }


        const numeric =
            Number(
                part
            );


        if(
            Number.isFinite(
                numeric
            )
        ){

            const value =
                numeric * sign;


            total +=
                value;


            details.push({

                type:"number",

                value,

                subtotal:value

            });


            continue;

        }


        /*
            Se tiver algo que ainda não
            entendemos, aborta.
        */

        return null;

    }


    return {

        expression:
            clean,

        total,

        details

    };

}


function rollQuickAttackDamage(
    character,
    attack
){

    const formula =
        resolveCharacterFormula(
            attack.damage,
            character
        );


    const result =
        rollDiceExpression(
            formula
        );


    if(!result){

        addSystemChatMessage(
            `Não foi possível interpretar o dano "${attack.damage}".`
        );

        return;

    }


    addDiceChatMessage({

        characterName:
            character.name,

        title:
            attack.name,

        type:
            "Dano",

        formula,

        result

    });

}

function resolveCharacterFormula(
    expression,
    character
){

    const attributes =
        character.attributes || {};


    return String(
        expression || ""
    )
        .replace(
            /\bFOR\b/gi,
            Number(
                attributes.for
            ) || 0
        )
        .replace(
            /\bAGI\b/gi,
            Number(
                attributes.agi
            ) || 0
        )
        .replace(
            /\bINT\b/gi,
            Number(
                attributes.int
            ) || 0
        )
        .replace(
            /\bVIG\b/gi,
            Number(
                attributes.vig
            ) || 0
        )
        .replace(
            /\bPRE\b/gi,
            Number(
                attributes.pre
            ) || 0
        );

}



    function renderTableCharacterSkills(
    character
){

    const container =
        document.getElementById(
            "tableCharacterSkills"
        );


    if(!container){

        return;

    }


    const skills =
        Array.isArray(
            character.skills
        )
            ? character.skills
            : [];


    if(!skills.length){

        container.innerHTML = `

            <div class="sheet-empty">
                Nenhuma perícia configurada.
            </div>

        `;

        return;

    }


    container.innerHTML =
        skills
            .map(
                skill => `

                    <button
                        type="button"
                        class="table-skill-button"
                        data-skill="${skill.id}"
                    >

                        <div>

                            <strong>
                                ${escapeTableHTML(
                                    skill.name
                                )}
                            </strong>

                            <span>

                                ${String(
                                    skill.selectedAttribute ||
                                    ""
                                ).toUpperCase()}

                                •

                                ${
                                    skill.training === "0"
                                        ? "Sem treino"
                                        : skill.training
                                }

                            </span>

                        </div>


                        <span>
                            🎲
                        </span>

                    </button>

                `
            )
            .join("");


    container
        .querySelectorAll(
            ".table-skill-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    rollTableCharacterSkill(
                        character,
                        button.dataset.skill
                    );

                }
            );

        });

}

function rollTableCharacterSkill(
    character,
    skillId
){
    const skill=character.skills?.find(item=>String(item.id)===String(skillId));if(!skill)return;
    const assist=currentTableCampaign?.combat?.npcAssists?.[character.id],npcTestBonus=assist&&Number(assist.round)===enemyCombatRound()?Number(assist.testBonus)||0:0;
    const attribute=skill.selectedAttribute||skill.attribute||enemySkillAttribute(skill.name),attributeValue=Number(character.attributes?.[attribute]??character[attribute])||0,bonus=Number(skill.bonus)||0,penalty=Math.abs(Number(skill.penalty??skill.penalidade)||0),conditionModifier=getTableSkillConditionModifier(character,skill),result=rollCharacterTrainedTest(skill.training||skill.treino||"0",attributeValue+bonus-penalty+conditionModifier+npcTestBonus);if(!result)return;
    if(npcTestBonus){assist.testBonus=0;saveTableCampaign();}
    addRollChatMessage(`${skill.name||"Perícia"} • ${character.name||"Personagem"}${result.critical?" • CRÍTICO":""}`,result.formula,result.total,`${enemyRollDetail(result)}${result.critical?" • d12 principal = 12 • dado de treino adicional":""}`,{rollKind:"skill",playerCritical:result.critical});

}

function renderTableConditions(
    character
){

    const conditions =
        character.conditions || [];


    // gera os chips aqui

}

function hasTableCondition(
    character,
    conditionId
){

    return (
        character.conditions || []
    ).some(
        condition =>
            condition.id ===
            conditionId
    );

}

window.addEventListener(
    "focus",
    () => {

        refreshTableLiveData();

    }
);


document.addEventListener(
    "visibilitychange",
    () => {

        if(
            document.visibilityState ===
            "visible"
        ){

            refreshTableLiveData();

        }

    }
);
function refreshTableLiveData(){

    loadTableStorage();

    refreshCurrentTableCharacter();


    /*
        Atualiza tokens.
    */

    renderCombatPositions();

    renderPublicChat();

    refreshOpenCharacterPanel();

    checkInitiativeRequest();

    checkPendingAttackReaction();

finalizeInitiativeIfReady();


    /*
        Se o painel de ficha estiver aberto,
        reabre com os dados novos.
    */

    if(
        tablePanelOverlay &&
        !tablePanelOverlay
            .classList
            .contains("hidden")
    ){

        const active =
            document.querySelector(
                '.table-menu-button.active'
            );


        if(
            active?.dataset.panel ===
            "character"
        ){

            openCharacterPanel();

        }

    }

}

window.addEventListener(
    "storage",
    event => {

        if(
            event.key !==
            TABLE_CHARACTER_STORAGE
        ){

            return;

        }


        refreshTableLiveData();

    }
);

/*==========================================================
=              ESTADO DE COMBATE
==========================================================*/

function createDefaultCombatState(){

    return {

        

        active:false,

        round:0,

        currentTurnIndex:0,

        turnOrder:[],

        initiativeRequest:null,

        pendingAttack:null,

        updatedAt:Date.now()
        

    };

    

}


function initializeCombatState(){

    if(
        !currentTableCampaign.combat ||
        typeof currentTableCampaign.combat !== "object"
    ){

        currentTableCampaign.combat =
            createDefaultCombatState();

        saveTableCampaign();

        return;

    }


    const combat =
        currentTableCampaign.combat;


    combat.active =
        Boolean(
            combat.active
        );


    combat.round =
        Math.max(
            0,
            Number(
                combat.round
            ) || 0
        );


    combat.currentTurnIndex =
        Math.max(
            0,
            Number(
                combat.currentTurnIndex
            ) || 0
        );


    combat.turnOrder =
        Array.isArray(
            combat.turnOrder
        )
            ? combat.turnOrder
            : [];


    combat.initiativeRequest =
        combat.initiativeRequest &&
        typeof combat.initiativeRequest === "object"
            ? combat.initiativeRequest
            : null;

            combat.pendingAttack =
    combat.pendingAttack &&
    typeof combat.pendingAttack === "object"
        ? combat.pendingAttack
        : null;

}

/*==========================================================
=              INICIALIZAR CHAT PÚBLICO
==========================================================*/

function initializePublicChat(){

    if(
        !Array.isArray(
            currentTableCampaign.chatMessages
        )
    ){

        currentTableCampaign.chatMessages = [];

        saveTableCampaign();

    }

}

/*==========================================================
=              SALVAR FICHAS DA MESA
==========================================================*/

function saveTableCharacters(){

    localStorage.setItem(
        TABLE_CHARACTER_STORAGE,
        JSON.stringify(
            tableCharacters
        )
    );

}

/*==========================================================
=              PASSAR RODADA
==========================================================*/

function passTableRound(){

    if(
        currentTableRole !== "master"
    ){

        return;

    }


    const combat =
        currentTableCampaign.combat;


    combat.active =
        true;


    combat.round =
        Math.max(
            1,
            Number(
                combat.round
            ) + 1
        );


    combat.currentTurnIndex =
        0;

        combat.waitingNextRound =
    false;


    combat.initiativeRequest =
        null;


    combat.updatedAt =
        Date.now();

    (currentTableCampaign.enemies||[]).forEach(enemy=>{enemy.combatPressure=0;});
    (currentTableCampaign.players||[]).forEach(player=>{
        const character=getLiveCharacter(player.characterId);
        if(character){character.combatPressure=0;saveDamagedCharacter(character);}
    });


    restorePlayersActionPoints();

    restoreEnemiesActionPoints();

    if(combat.round===1&&!combat.firstRoundAbilityBonusesApplied){
        const participants=(currentTableCampaign.players||[]).map(player=>getLiveCharacter(player.characterId)).filter(Boolean);
        const hasAbility=(character,id)=>{
            const list=[character.abilities,character.acquiredAbilities,character.habilidades].find(Array.isArray)||[];
            return list.some(ability=>normalizeEnemyAbilityId(typeof ability==="string"?ability:ability.id||ability.name)===id);
        };
        participants.forEach(owner=>{
            const foco=Math.max(0,Number(owner.attributes?.foco??owner.attributes?.agi)||0);
            participants.filter(ally=>ally.id!==owner.id).forEach(ally=>{
                ally.status=ally.status||{};
                if(hasAbility(owner,"prontidao")) ally.status.paAtual=Math.max(0,Number(ally.status.paAtual)||0)+1;
                if(hasAbility(owner,"oficial-comandante")){
                    ally.status.pmTemp=Math.max(0,Number(ally.status.pmTemp??ally.status.pdTemp)||0)+foco;
                    ally.status.pdTemp=ally.status.pmTemp;
                }
                saveDamagedCharacter(ally);
            });
        });
        combat.firstRoundAbilityBonusesApplied=true;
    }

    processEnemyRoundAbilities();


    saveTableCharacters();

    saveTableCampaign();


    /*
        Atualiza a ficha do próprio jogador,
        caso a aba seja recarregada ou sincronizada.
    */

    refreshCurrentTableCharacter();

    renderCombatPositions();


    closeCurrentPanel();


    addSystemChatMessage(
        `Rodada ${combat.round} iniciada. Todos recuperaram seu PA máximo.`
    );

}

/*==========================================================
=              ENCERRAR COMBATE
==========================================================*/

function endTableCombat(){

    if(
        currentTableRole !== "master"
    ){

        return;

    }


    (currentTableCampaign.enemies||[]).forEach(enemy=>{enemy.abilityState={};});

    currentTableCampaign.combat =
        createDefaultCombatState();


    saveTableCampaign();


    closeCurrentPanel();


    addSystemChatMessage(
        "O mestre encerrou o combate."
    );


    renderCombatPositions();

}

/*==========================================================
=              FINALIZAR INICIATIVA
==========================================================*/

function finalizeInitiativeIfReady(){

    refreshCurrentTableCampaign();


    const combat =
        currentTableCampaign
            ?.combat;


    const request =
        combat?.initiativeRequest;


    if(
        !request ||
        request.active !== true
    ){

        return false;

    }


    const participants =
        Array.isArray(
            request.participants
        )
            ? request.participants
            : [];


    if(!participants.length){

        return false;

    }


    const allRolled =
        participants.every(
            participant =>
                participant.rolled === true &&
                Number.isFinite(
                    Number(
                        participant.result
                    )
                )
        );


    if(!allRolled){

        return false;

    }


    const ordered =
        [...participants]
            .sort(
                (first,second) => {

                    const resultDifference =
                        Number(
                            second.result
                        ) -
                        Number(
                            first.result
                        );


                    if(resultDifference !== 0){

                        return resultDifference;

                    }


                    const attributeDifference =
                        Number(
                            second.attributeValue
                        ) -
                        Number(
                            first.attributeValue
                        );


                    if(attributeDifference !== 0){

                        return attributeDifference;

                    }


                    return String(
                        first.name || ""
                    ).localeCompare(
                        String(
                            second.name || ""
                        ),
                        "pt-BR"
                    );

                }
            )
            .map(
                (participant,index) => ({

                    ...participant,

                    order:
                        index + 1

                })
            );


    combat.active =
        true;


    combat.round =
        1;


    combat.currentTurnIndex =
        0;


    combat.turnOrder =
        ordered;


    combat.initiativeRequest =
        null;


    combat.updatedAt =
        Date.now();


    saveTableCampaign();


    renderCombatPositions();


    showInitiativeOrderInChat(
        ordered
    );


    return true;

}

/*==========================================================
=              ORDEM NO CHAT
==========================================================*/

function showInitiativeOrderInChat(
    participants
){

    if(!chatMessages){

        return;

    }


    const message =
        document.createElement(
            "div"
        );


    message.className =
        "chat-roll-message initiative-order-message";


    message.innerHTML = `

        <div class="chat-roll-header">

            <strong>
                Ordem de Iniciativa
            </strong>

            <span class="chat-roll-label">
                RODADA 1
            </span>

        </div>


        <div class="initiative-order-list">

            ${
                participants
                    .map(
                        (participant,index) => `

                            <div class="initiative-order-item">

                                <span>
                                    ${index + 1}
                                </span>

                                <strong>
                                    ${escapeTableHTML(
                                        participant.name ||
                                        "Participante"
                                    )}
                                </strong>

                                <b>
                                    ${Number(
                                        participant.result
                                    ) || 0}
                                </b>

                            </div>

                        `
                    )
                    .join("")
            }

        </div>

    `;


    chatMessages.appendChild(
        message
    );


    scrollTableChat();

}

/*==========================================================
=              RENDERIZAR CHAT PÚBLICO
==========================================================*/

function renderPublicChat(){

    if(
        !chatMessages ||
        !currentTableCampaign
    ){

        return;

    }


    const messages =
        Array.isArray(
            currentTableCampaign.chatMessages
        )
            ? currentTableCampaign.chatMessages
            : [];


    chatMessages.innerHTML = "";


    if(messages.length === 0){

        const welcome =
            document.createElement(
                "div"
            );


        welcome.className =
            "chat-system-message";


        welcome.innerHTML = `

            <span class="chat-system-icon">
                ◇
            </span>

            <div>

                <strong>
                    Sistema
                </strong>

                <p>
                    Bem-vindo à mesa.
                </p>

            </div>

        `;


        chatMessages.appendChild(
            welcome
        );

        return;

    }


    messages.forEach(message => {

        const element =
            createPublicChatElement(
                message
            );


        if(element){

            chatMessages.appendChild(
                element
            );

        }

    });

    bindApplyAttackButtons();

bindApplyDamageButtons();

scrollTableChat();

}

/*==========================================================
=              ELEMENTO DO CHAT
==========================================================*/

function createPublicChatElement(
    message
){

    if(!message){

        return null;

    }


    if(
        message.type === "system"
    ){

        return createSystemChatElement(
            message
        );

    }


    if(
        message.type === "roll"
    ){

        return createRollChatElement(
            message
        );

    }


    return createNormalChatElement(
        message
    );

}

function createNormalChatElement(
    message
){

    const element =
        document.createElement(
            "div"
        );


    element.className =
        "chat-message";


    const avatar =
        document.createElement(
            "div"
        );


    avatar.className =
        "chat-message-avatar";


    if(message.photo){

        const image =
            document.createElement(
                "img"
            );


        image.src =
            message.photo;


        image.alt =
            message.author ||
            "Personagem";


        avatar.appendChild(
            image
        );

    }
    else{

        avatar.textContent =
            message.role === "master"
                ? "♛"
                : "◇";

    }


    const body =
        document.createElement(
            "div"
        );


    body.className =
        "chat-message-body";


    body.innerHTML = `

        <strong>
            ${escapeTableHTML(
                message.author ||
                "Jogador"
            )}
        </strong>

        <p>
            ${escapeTableHTML(
                message.text ||
                ""
            )}
        </p>

        <span class="chat-message-time">

            ${formatPublicChatTime(
                message.createdAt
            )}

        </span>

    `;


    element.append(
        avatar,
        body
    );


    return element;

}


function createSystemChatElement(
    message
){

    const element =
        document.createElement(
            "div"
        );


    element.className =
        "chat-system-message";


    element.innerHTML = `

        <span class="chat-system-icon">
            ◇
        </span>

        <div>

            <strong>
                Sistema
            </strong>

            <p>
                ${escapeTableHTML(
                    message.text ||
                    ""
                )}
            </p>

            <span class="chat-message-time">

                ${formatPublicChatTime(
                    message.createdAt
                )}

            </span>

        </div>

    `;


    return element;

}

function createRollChatElement(
    message
){

    const element =
        document.createElement(
            "div"
        );


    element.className =
        "chat-roll-message";


    element.innerHTML = `

        <div class="chat-roll-header">

            <strong>
                ${escapeTableHTML(
                    message.author ||
                    "Jogador"
                )}
            </strong>

            <span class="chat-roll-label">

                ${escapeTableHTML(
                    message.label ||
                    "Rolagem"
                )}

            </span>

        </div>

        <div class="chat-roll-result">

            <span class="chat-roll-total">

                ${Number(
                    message.total
                ) || 0}

            </span>

            <span class="chat-roll-formula">

                ${escapeTableHTML(
                    message.formula ||
                    ""
                )}

            </span>

        </div>

        <div class="chat-roll-detail">

            ${escapeTableHTML(
                message.detail ||
                ""
            )}

        </div>

        ${
    message.rollKind === "attack" &&
    message.applied !== true
        ? `

            <button
                type="button"
                class="chat-apply-attack-button"
                data-message-id="${escapeTableHTML(
                    message.id
                )}">

                Aplicar ataque

            </button>

        `
        : ""
}

${
    message.rollKind === "attack" &&
    message.applied === true &&
    message.attackApplication
        ? `

            <div class="
                chat-attack-applied
                ${
                    message.attackApplication.hit
                        ? "hit"
                        : "miss"
                }
            ">

                <strong>

                    ${
                        message.attackApplication.hit
                            ? "Ataque acertou"
                            : "Ataque errou"
                    }

                </strong>

                <span>

                    Alvo:
                    ${escapeTableHTML(
                        message.attackApplication.targetName ||
                        "Personagem"
                    )}

                </span>

                <span>

                    Ataque:
                    ${Number(
                        message.attackApplication.attackResult
                    ) || 0}

                    • Defesa:
                    ${Number(
                        message.attackApplication.finalDefense
                    ) || 0}

                </span>

                <span>

                    Reação:
                    ${escapeTableHTML(
                        message.attackApplication.reaction ||
                        "guard"
                    )}

                </span>

            </div>

        `
        : ""
}

        ${
    message.rollKind === "damage" &&
    message.applied !== true
        ? `

            <button
                type="button"
                class="chat-apply-damage-button"
                data-message-id="${escapeTableHTML(
                    message.id
                )}">

                Aplicar dano

            </button>

        `
        : ""
}

${
    message.rollKind === "damage" &&
    message.applied === true &&
    message.damageApplication
        ? `

            <div class="chat-damage-applied">

                <strong>
                    Dano aplicado
                </strong>

                <span>

                    Alvo:
                    ${escapeTableHTML(
                        message.appliedTarget?.name ||
                        "Personagem"
                    )}

                </span>

                <span>

                    ${Number(
                        message.damageApplication.originalDamage
                    ) || 0}

                    de dano

                    −

                    ${Number(
                        message.damageApplication.damageReduction
                    ) || 0}

                    de RD

                    =

                    ${Number(
                        message.damageApplication.finalDamage
                    ) || 0}

                </span>

                ${message.damageApplication.bodyDamage?`<span>Membros: ${Object.entries(message.damageApplication.allocations||{}).filter(([,amount])=>Number(amount)>0).map(([id,amount])=>`${escapeTableHTML(BODY_PART_LABELS[id]||id)} −${Number(amount)}`).join(" • ")}</span>`:`<span>PV: ${Number(message.damageApplication.pvBefore)||0} → ${Number(message.damageApplication.pvAfter)||0}</span>`}

            </div>

        `
        : ""
}

        <span class="chat-message-time">

            ${formatPublicChatTime(
                message.createdAt
            )}

        </span>

    `;


    return element;

}

/*==========================================================
=              BOTÃO APLICAR ATAQUE
==========================================================*/

function bindApplyAttackButtons(){

    document
        .querySelectorAll(
            ".chat-apply-attack-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    startAttackTargetSelection(
                        button.dataset.messageId
                    );

                }
            );

        });

}

/*==========================================================
=              INICIAR SELEÇÃO DE ATAQUE
==========================================================*/

function startAttackTargetSelection(
    messageId
){

    refreshCurrentTableCampaign();


    const messages =
        Array.isArray(
            currentTableCampaign
                .chatMessages
        )
            ? currentTableCampaign
                .chatMessages
            : [];


    const message =
        messages.find(
            item =>
                item.id === messageId
        );


    if(!message){

        addSystemChatMessage(
            "A rolagem de ataque não foi encontrada."
        );

        return;

    }


    if(
        message.rollKind !== "attack"
    ){

        return;

    }


    if(message.applied === true){

        addSystemChatMessage(
            "Esse ataque já foi aplicado."
        );

        return;

    }


    /*
        Impede outro jogador de usar a rolagem.
        O mestre pode controlar qualquer ataque.
    */

    if(
        currentTableRole !== "master" &&
        message.characterId !==
        currentTableCharacter?.id
    ){

        addSystemChatMessage(
            "Você não pode aplicar o ataque de outro personagem."
        );

        return;

    }


    pendingAttackApplication = {

        messageId:
            message.id,

        attackResult:
            Math.max(
                0,
                Number(
                    message.total
                ) || 0
            ),

        attackName:
            message.attackName ||
            "Ataque",

        attackIndex:
            message.attackIndex ??
            null,

        attackerCharacterId:
            message.characterId ||
            null,

        attackerEnemyId:
            message.enemyInstanceId ||
            null,

        attackerName:
            message.author ||
            "Atacante",

        attackSkill:message.attackSkill||getCharacterReadyAttacks(getLiveCharacter(message.characterId))[message.attackIndex]?.skill||null

    };


    document
        .querySelector(
            ".table-play-area"
        )
        ?.classList
        .add(
            "selecting-attack-target"
        );


    markAttackTargets();


    addLocalAttackNotice(
        `Selecione quem será atacado por ${pendingAttackApplication.attackName}.`
    );

}

/*==========================================================
=              MARCAR ALVOS DE ATAQUE
==========================================================*/

function markAttackTargets(){

    document
        .querySelectorAll(
            ".player-position.occupied, .enemy-position.occupied"
        )
        .forEach(position => {

            position.classList.add(
                "attack-target-selectable"
            );

        });

}

/*==========================================================
=              AVISO LOCAL DO ATAQUE
==========================================================*/

function addLocalAttackNotice(
    text
){

    document
        .querySelector(
            ".attack-selection-notice"
        )
        ?.remove();


    const notice =
        document.createElement(
            "div"
        );


    notice.className =
        "attack-selection-notice";


    notice.innerHTML = `

        <strong>
            Aplicar ataque
        </strong>

        <span>

            ${escapeTableHTML(
                text
            )}

        </span>

        <button
            type="button"
            class="attack-selection-cancel">

            Cancelar

        </button>

    `;


    document.body.appendChild(
        notice
    );


    notice
        .querySelector(
            ".attack-selection-cancel"
        )
        ?.addEventListener(
            "click",
            () => pendingEnemyAbilityTarget
                ? cancelEnemyAbilityTargetSelection()
                : cancelAttackTargetSelection()
        );

}

/*==========================================================
=              CANCELAR SELEÇÃO DE ATAQUE
==========================================================*/

function cancelAttackTargetSelection(){

    pendingAttackApplication =
        null;


    document
        .querySelector(
            ".table-play-area"
        )
        ?.classList
        .remove(
            "selecting-attack-target"
        );


    document
        .querySelectorAll(
            ".attack-target-selectable"
        )
        .forEach(element => {

            element.classList.remove(
                "attack-target-selectable"
            );

        });


    document
        .querySelector(
            ".attack-selection-notice"
        )
        ?.remove();

}

/*==========================================================
=              APLICAR ATAQUE AO ALVO
==========================================================*/

function applyPendingAttackToTarget(
    type,
    entity
){

    if(!pendingAttackApplication){

        return;

    }

    if(type==="enemy"){
        resolveAttackAgainstEnemy(entity);
        return;
    }


    if(
        type !== "player" ||
        !entity?.characterId
    ){

        addLocalAttackNotice(
            "Nesta etapa, ataques automáticos só podem selecionar personagens."
        );

        return;

    }


    const targetCharacter =
        getLiveCharacter(
            entity.characterId
        );


    if(!targetCharacter){

        addLocalAttackNotice(
            "A ficha do alvo não foi encontrada."
        );

        return;

    }

    if(pendingAttackApplication.attackerEnemyId&&!pendingAttackApplication.protectedCostPaid){
        const protectedTarget=(targetCharacter.conditions||[]).some(condition=>normalizeEnemyAbilityId(typeof condition==="string"?condition:condition.id||condition.name)==="protegido");
        if(protectedTarget){
            const attacker=(currentTableCampaign.enemies||[]).find(item=>String(item.enemyId||item.id)===String(pendingAttackApplication.attackerEnemyId));
            const currentPA=Math.max(0,Number(attacker?.status?.paAtual??attacker?.paAtual??attacker?.pa)||0);
            if(!attacker||currentPA<1){
                addLocalAttackNotice("A ameaça não possui o PA adicional exigido por Protegido.");
                return;
            }
            attacker.status=attacker.status&&typeof attacker.status==="object"?attacker.status:{};
            attacker.status.paAtual=currentPA-1;
            attacker.paAtual=attacker.status.paAtual;
            pendingAttackApplication.protectedCostPaid=true;
            addSystemChatMessage(`${attacker.name||"A ameaça"} gastou +1 PA para atacar ${targetCharacter.name} por causa de Protegido.`);
            saveTableCampaign();
        }
    }


    /*
        Impede atacar a própria ficha por engano.
        Remova esta verificação futuramente se quiser
        permitir ataques próprios.
    */

    if(
        pendingAttackApplication
            .attackerCharacterId &&
        pendingAttackApplication
            .attackerCharacterId ===
        targetCharacter.id
    ){

        addLocalAttackNotice(
            "Escolha outro personagem como alvo."
        );

        return;

    }

    if(pendingAttackApplication.attackerEnemyId&&!pendingAttackApplication.predatorApplied){const attacker=(currentTableCampaign.enemies||[]).find(item=>String(item.enemyId||item.id)===String(pendingAttackApplication.attackerEnemyId)),wounded=(targetCharacter.conditions||[]).some(condition=>normalizeEnemyAbilityId(typeof condition==="string"?condition:condition.id||condition.name)==="machucado");if(attacker&&wounded&&enemyHasAbility(attacker,"predador")){pendingAttackApplication.attackResult=(Number(pendingAttackApplication.attackResult)||0)+3;pendingAttackApplication.predatorApplied=true;addSystemChatMessage(`${attacker.name} ativou Predador e recebeu +3 para acertar ${targetCharacter.name}.`);}}


    createAttackReactionRequest(
        targetCharacter
    );

}

function resolveAttackAgainstEnemy(enemy){
    if(!enemy||!pendingAttackApplication)return;
    if(enemyHasAbility(enemy,"espinhoso")&&pendingAttackApplication.attackerCharacterId){const attacker=getLiveCharacter(pendingAttackApplication.attackerCharacterId);if(attacker)damageCharacterFromAbility(attacker,Math.max(0,Number(enemy.corpo)||0),`Espinhoso de ${enemy.name||"Ameaça"}`);}
    if(enemyHasAbility(enemy,"toque-da-morte")&&normalizeEnemyAbilityId(pendingAttackApplication.attackSkill)==="luta"&&pendingAttackApplication.attackerCharacterId){const attacker=getLiveCharacter(pendingAttackApplication.attackerCharacterId);if(attacker){attacker.age=(Number(attacker.age)||0)+3;saveDamagedCharacter(attacker);addSystemChatMessage(`${attacker.name||"O atacante"} envelheceu 3 anos ao atacar ${enemy.name||"a ameaça"} com Luta.`);}}
    currentTableCampaign.combat=currentTableCampaign.combat||{};
    currentTableCampaign.combat.pendingEnemyAttack={id:`enemy_attack_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,active:true,resolved:false,messageId:pendingAttackApplication.messageId,attackName:pendingAttackApplication.attackName,attackResult:Math.max(0,Number(pendingAttackApplication.attackResult)||0),attackerCharacterId:pendingAttackApplication.attackerCharacterId||null,attackerName:pendingAttackApplication.attackerName||"Atacante",targetEnemyId:enemy.enemyId||enemy.id,targetName:enemy.name||"Ameaça",createdAt:Date.now()};
    saveTableCampaign();cancelAttackTargetSelection();addSystemChatMessage(`${pendingAttackApplication?.attackerName||"O atacante"} atacou ${enemy.name||"a ameaça"}. Aguardando reação da criatura.`);checkPendingEnemyAttackReaction();
}

function checkPendingEnemyAttackReaction(){
    if(currentTableRole!=="master"||!currentTableCampaign)return;
    const request=currentTableCampaign.combat?.pendingEnemyAttack;
    if(!request||request.active!==true||request.resolved===true)return;
    const enemy=(currentTableCampaign.enemies||[]).find(item=>String(item.enemyId||item.id)===String(request.targetEnemyId));
    if(!enemy)return;
    const pa=Math.max(0,Number(enemy.status?.paAtual??enemy.paAtual??enemy.pa)||0),state=enemyAbilityState(enemy),majorReady=state.esquivaMaiorArmed&&enemyHasAbility(enemy,"esquiva-maior");
    openTablePanel("REAÇÃO",enemy.name||"Ameaça",`<div class="table-panel-card"><h3>${escapeTableHTML(request.attackerName||"Atacante")} atacou</h3><p>Ataque: <strong>${Number(request.attackResult)||0}</strong></p><p>Defesa: <strong>${Number(enemy.defense)||0}</strong> • RD: <strong>${Number(enemy.rd)||0}</strong> • PA: <strong>${pa}</strong></p>${majorReady?'<p><strong>Esquiva Maior preparada:</strong> ao escolher Esquivar, a RD do próximo dano será dobrada.</p>':""}</div><div class="attack-reaction-grid"><button type="button" class="attack-reaction-button enemy-reaction-choice" data-reaction="dodge" ${pa<1?"disabled":""}><strong>Esquivar</strong><span>1 PA • Presteza na Defesa</span></button><button type="button" class="attack-reaction-button enemy-reaction-choice" data-reaction="block" ${pa<1?"disabled":""}><strong>Bloquear</strong><span>1 PA • RD + Corpo</span></button><button type="button" class="attack-reaction-button enemy-reaction-choice" data-reaction="counter" ${pa<1?"disabled":""}><strong>Contra-atacar</strong><span>1 PA • ataca se o golpe errar</span></button><button type="button" class="attack-reaction-button enemy-reaction-choice" data-reaction="guard"><strong>Guardar</strong><span>Sem custo</span></button></div>`);
    document.querySelectorAll(".enemy-reaction-choice").forEach(button=>button.addEventListener("click",()=>answerEnemyAttackReaction(button.dataset.reaction)));
}

function answerEnemyAttackReaction(reactionType){
    refreshCurrentTableCampaign();
    const request=currentTableCampaign.combat?.pendingEnemyAttack,enemy=(currentTableCampaign.enemies||[]).find(item=>String(item.enemyId||item.id)===String(request?.targetEnemyId));
    if(!request||!enemy||request.active!==true)return;
    enemy.status=enemy.status&&typeof enemy.status==="object"?enemy.status:{};
    const pressure=Math.max(0,Number(enemy.combatPressure)||0),baseDefense=Math.max(0,(Number(enemy.defense)||0)-pressure),baseRD=Math.max(0,Number(enemy.rd)||0),currentPA=Math.max(0,Number(enemy.status.paAtual??enemy.paAtual??enemy.pa)||0),state=enemyAbilityState(enemy),round=enemyCombatRound();
    let cost=0,finalDefense=baseDefense,reactionRD=baseRD,reactionName="Guardar",dodgeResult=null,majorTriggered=false;
    if(["dodge","block","counter"].includes(reactionType)){cost=1;if(currentPA<1)return;}
    if(reactionType==="dodge"){
        reactionName="Esquivar";
        const skill=enemySkillData(enemy,"Presteza"),training=enemyTrainingDie(skill.rank),modifier=(Number(enemy.corpo)||0)+skill.bonus-skill.penalty,formula=`1d12${training!=="0"?`+${training}`:""}${modifier>=0?"+":""}${modifier}`;
        dodgeResult=rollDiceExpression(formula);finalDefense+=Math.max(0,Number(dodgeResult?.total)||0);
        if(state.esquivaMaiorArmed&&enemyHasAbility(enemy,"esquiva-maior")){majorTriggered=true;reactionRD=baseRD*2;state.esquivaMaiorArmed=false;state.esquivaMaiorUsedRound=round;state.esquivaMaiorSceneUses=Math.max(0,Number(state.esquivaMaiorSceneUses)||0)+1;}
    }else if(reactionType==="block"){reactionName="Bloquear";reactionRD=baseRD+Math.max(0,Number(enemy.corpo)||0);}else if(reactionType==="counter")reactionName="Contra-atacar";else reactionType="guard";
    enemy.status.paAtual=Math.max(0,currentPA-cost);enemy.paAtual=enemy.status.paAtual;
    const hit=Number(request.attackResult)>=finalDefense;
    if(hit){enemy.combatPressure=pressure+2;}
    request.active=false;request.resolved=true;request.hit=hit;request.reaction={type:reactionType,name:majorTriggered?"Esquiva Maior":reactionName,paCost:cost,baseDefense,finalDefense,baseRD,reactionRD,majorTriggered,answeredAt:Date.now()};
    const message=(currentTableCampaign.chatMessages||[]).find(item=>item.id===request.messageId);if(message){message.applied=true;message.appliedAt=Date.now();message.attackApplication={targetEnemyId:enemy.enemyId||enemy.id,targetName:enemy.name||"Ameaça",attackResult:Number(request.attackResult)||0,finalDefense,reaction:majorTriggered?"Esquiva Maior":reactionName,hit};}
    currentTableCampaign.combat.damageContext=hit?{id:`damage_${Date.now()}`,active:true,targetEnemyId:enemy.enemyId||enemy.id,targetName:enemy.name||"Ameaça",reaction:majorTriggered?"esquiva-maior":reactionType,damageReduction:reactionRD,consumed:false,createdAt:Date.now()}:null;
    saveTableCampaign();closeCurrentPanel();renderPublicChat();if(dodgeResult)addRollChatMessage(`Esquiva • ${enemy.name}`,dodgeResult.expression||"Presteza",dodgeResult.total,enemyRollDetail(dodgeResult));addSystemChatMessage(`${enemy.name} escolheu ${majorTriggered?"Esquiva Maior":reactionName}. Ataque ${Number(request.attackResult)||0} contra Defesa ${finalDefense}: ${hit?"acertou":"errou"}.${hit?` RD para o próximo dano: ${reactionRD}.`:""}`);
    if(reactionType==="counter"&&!hit)rollEnemySkill(enemy,"Luta",{label:`Contra-ataque • ${enemy.name}`,rollKind:"attack",attackName:"Contra-ataque",enemyInstanceId:enemy.enemyId||enemy.id,attackVariant:"counter",applied:false});
}

/*==========================================================
=              CRIAR PEDIDO DE REAÇÃO
==========================================================*/

function createAttackReactionRequest(
    targetCharacter
){

    if(
        !pendingAttackApplication ||
        !currentTableCampaign
    ){

        return;

    }


    if(
        !currentTableCampaign.combat ||
        typeof currentTableCampaign.combat !==
        "object"
    ){

        currentTableCampaign.combat =
            createDefaultCombatState();

    }


    const requestId =
        `attack_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2,8)}`;


    currentTableCampaign
        .combat
        .pendingAttack = {

            id:
                requestId,

            active:
                true,

            messageId:
                pendingAttackApplication
                    .messageId,

            attackName:
                pendingAttackApplication
                    .attackName,

            attackResult:
                pendingAttackApplication
                    .attackResult,

            attackIndex:
                pendingAttackApplication
                    .attackIndex,

            attackerCharacterId:
                pendingAttackApplication
                    .attackerCharacterId,

            attackerEnemyId:
                pendingAttackApplication
                    .attackerEnemyId,

            attackerName:
                pendingAttackApplication
                    .attackerName,

            targetCharacterId:
                targetCharacter.id,

            targetName:
                targetCharacter.name ||
                "Alvo",

            reaction:
                null,

            resolved:
                false,

            createdAt:
                Date.now()

        };

const attackerName =
    pendingAttackApplication
        .attackerName ||
    "O atacante";


saveTableCampaign();

cancelAttackTargetSelection();


addSystemChatMessage(
    `${attackerName} atacou ${targetCharacter.name || "o alvo"}. Aguardando reação.`
);


checkPendingAttackReaction();

}

/*==========================================================
=              VERIFICAR REAÇÃO PENDENTE
==========================================================*/

function checkPendingAttackReaction(){

    if(
        currentTableRole !== "player" ||
        !currentTableCharacter ||
        !currentTableCampaign
    ){

        return;

    }


    const request =
        currentTableCampaign
            .combat
            ?.pendingAttack;


    if(
        !request ||
        request.active !== true ||
        request.resolved === true
    ){

        return;

    }


    if(
        request.targetCharacterId !==
        currentTableCharacter.id
    ){

        return;

    }


    if(request.reaction){

        return;

    }


    if(
        lastAttackReactionShown ===
        request.id
    ){

        return;

    }


    lastAttackReactionShown =
        request.id;


    openAttackReactionPanel(
        request
    );

}

/*==========================================================
=              PAINEL DE REAÇÃO
==========================================================*/

function openAttackReactionPanel(
    request
){

    refreshCurrentTableCharacter();


    const character =
        currentTableCharacter;


    const currentPA =
        Math.max(
            0,
            Number(
                character.status?.paAtual
            ) || 0
        );


    const defense =
        Math.max(
            0,
            Number(
                character.defense?.total
            ) || 0
        );


    const rd =
        Math.max(
            0,
            Number(
                character.damageReduction?.total
            ) || 0
        );


    const vig =
        Math.max(
            0,
            Number(
                character.attributes?.vig
            ) || 0
        );


    openTablePanel(
        "REAÇÃO",
        "Você foi atacado",
        `

        <div class="table-panel-section">

            <div class="table-panel-card attack-reaction-summary">

                <h3>

                    ${escapeTableHTML(
                        request.attackerName ||
                        "Atacante"
                    )}

                </h3>

                <p>

                    Ataque:
                    <strong>

                        ${escapeTableHTML(
                            request.attackName ||
                            "Ataque"
                        )}

                    </strong>

                </p>

                <p>

                    Resultado do ataque:
                    <strong>

                        ${Number(
                            request.attackResult
                        ) || 0}

                    </strong>

                </p>

                <p>

                    Sua Defesa:
                    <strong>
                        ${defense}
                    </strong>

                </p>

                <p>

                    Seu PA:
                    <strong>
                        ${currentPA}
                    </strong>

                </p>

            </div>


            <div class="attack-reaction-grid">

                <button
                    type="button"
                    class="attack-reaction-button"
                    data-reaction="dodge"
                    ${currentPA < 1 ? "disabled" : ""}>

                    <strong>
                        Esquivar
                    </strong>

                    <span>
                        1 PA • soma Presteza à Defesa
                    </span>

                </button>


                <button
                    type="button"
                    class="attack-reaction-button"
                    data-reaction="block"
                    ${currentPA < 1 ? "disabled" : ""}>

                    <strong>
                        Bloquear
                    </strong>

                    <span>
                        1 PA • RD ${rd} + VIG ${vig}
                    </span>

                </button>

                <button
    type="button"
    class="attack-reaction-button"
    data-reaction="counter"
    ${currentPA < 1 ? "disabled" : ""}>

    <strong>
        Contra-atacar
    </strong>

    <span>
        1 PA • após resolver o ataque, pode atacar o agressor
    </span>

</button>


<button
    type="button"
    class="attack-reaction-button"
    data-reaction="ability">

    <strong>
        Habilidade
    </strong>

    <span>
        Usar uma habilidade de reação adquirida
    </span>

</button>


                <button
                    type="button"
                    class="attack-reaction-button"
                    data-reaction="guard">

                    <strong>
                        Guardar
                    </strong>

                    <span>
                        Não gasta PA
                    </span>

                </button>

            </div>

        </div>

        `
    );


    document
        .querySelectorAll(
            ".attack-reaction-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                   const reaction =
    button.dataset.reaction;


if(reaction === "ability"){

    openAttackReactionAbilityPanel();

    return;

}


answerAttackReaction(
    reaction
);

                }
            );

        });

}

/*==========================================================
=              HABILIDADES DE REAÇÃO
==========================================================*/

function openAttackReactionAbilityPanel(){

    refreshCurrentTableCharacter();


    const character =
        currentTableCharacter;


const abilities =
    getCharacterAcquiredAbilities(
        character
    );


const reactionAbilityIds =
    ATTACK_REACTION_ABILITY_IDS;




        const availableAbilities =
    abilities
        .map(
            normalizeCharacterAbility
        )
        .filter(ability => {

            return reactionAbilityIds.includes(
                ability.id
            );

        });


    if(!availableAbilities.length){

        openTablePanel(
            "REAÇÃO",
            "Habilidades",
            `

                <div class="editor-empty-state">

                    <span>◇</span>

                    <p>
                        Nenhuma habilidade de reação disponível.
                    </p>

                    <button
                        type="button"
                        id="returnToAttackReaction"
                        class="secondary-button">

                        Voltar

                    </button>

                </div>

            `
        );


        document
            .getElementById(
                "returnToAttackReaction"
            )
            ?.addEventListener(
                "click",
                () => {

                    const request =
                        currentTableCampaign
                            .combat
                            ?.pendingAttack;


                    if(request){

                        openAttackReactionPanel(
                            request
                        );

                    }

                }
            );


        return;

    }


    openTablePanel(
        "REAÇÃO",
        "Escolher Habilidade",
        `

            <div class="table-panel-list">

${

    availableAbilities
        .map(ability => {

            const paCost =
                Number(
                    ability.useCost?.type === "pa"
                        ? ability.useCost.value
                        : ability.activationCost?.type === "pa"
                            ? ability.activationCost.value
                            : 0
                ) || 0;


            const currentPA =
                Number(
                    character.status?.paAtual
                ) || 0;


            const unavailable =
                paCost > currentPA;


            return `

                <button
                    type="button"
                    class="table-panel-card reaction-ability-choice"
                    data-ability-id="${escapeTableHTML(
                        ability.id
                    )}"
                    ${unavailable ? "disabled" : ""}>

                    <h3>
                        ${escapeTableHTML(
                            ability.name ||
                            "Habilidade"
                        )}
                    </h3>

                    <p>
                        ${escapeTableHTML(
                            ability.description ||
                            ""
                        )}
                    </p>

                    <span class="reaction-ability-cost">

                        ${
                            paCost > 0
                                ? `${paCost} PA`
                                : "Sem custo de PA"
                        }

                    </span>

                </button>

            `;

        })
        .join("")

}

            </div>

        `
    );


    document
        .querySelectorAll(
            ".reaction-ability-choice"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    selectAttackReactionAbility(
                        button.dataset.abilityId
                    );

                }
            );

        });

}

function selectAttackReactionAbility(
    abilityId
){

    showLocalReactionMessage(
        `A habilidade ${abilityId} será implementada na etapa de habilidades de reação.`
    );

}

function showLocalReactionMessage(
    text
){

    const notice =
        document.createElement(
            "div"
        );


    notice.className =
        "damage-selection-notice";


    notice.innerHTML = `

        <strong>
            Habilidade
        </strong>

        <span>
            ${escapeTableHTML(text)}
        </span>

        <button type="button">
            Fechar
        </button>

    `;


    document.body.appendChild(
        notice
    );


    notice
        .querySelector("button")
        ?.addEventListener(
            "click",
            () => notice.remove()
        );

}


/*==========================================================
=              HABILIDADES ADQUIRIDAS
==========================================================*/

function getCharacterAcquiredAbilities(
    character
){

    if(!character){

        return [];

    }


    const possibleLists = [

        character.abilities,

        character.acquiredAbilities,

        character.systemData
            ?.abilities

    ];


    const abilities =
        possibleLists.find(
            list =>
                Array.isArray(list)
        ) || [];


    return abilities.filter(
        ability => {

            if(!ability){

                return false;

            }


            /*
                Algumas fichas podem guardar apenas o ID.
            */

            if(
                typeof ability ===
                "string"
            ){

                return Boolean(
                    ability.trim()
                );

            }


            return Boolean(
                ability.id ||
                ability.abilityId ||
                ability.name
            );

        }
    );

}

/*==========================================================
=              NORMALIZAR HABILIDADE
==========================================================*/

function normalizeCharacterAbility(
    ability
){

    if(
        typeof ability ===
        "string"
    ){

        const abilityId =
            ability
                .trim()
                .toLowerCase();


        const definition =
            typeof CHARACTER_ABILITIES !==
            "undefined"
                ? CHARACTER_ABILITIES.find(
                    item =>
                        item.id ===
                        abilityId
                )
                : null;


        return definition || {

            id:
                abilityId,

            name:
                ability,

            description:
                ""

        };

    }


    return {

        ...ability,

        id:
            String(
                ability.id ||
                ability.abilityId ||
                ""
            )
                .trim()
                .toLowerCase()

    };

}
/*==========================================================
=              ROLAR PRESTEZA DA ESQUIVA
==========================================================*/

/*==========================================================
=              PRESTEZA DA ESQUIVA
==========================================================*/

function rollDodgeReadiness(
    character
){

    const readiness =
        getCharacterReadinessSkill(
            character
        );


    if(!readiness){

        return {

            total:0,

            trainingValue:0,

            modifier:0,

            formula:"0",

            detail:"Sem treino em Presteza"

        };

    }


    const trainingFormula =
        readiness.training &&
        readiness.training !== "0"
            ? String(
                readiness.training
            )
            : "0";


    const trainingResult =
        rollDiceExpression(
            trainingFormula
        );


    const trainingValue =
        Math.max(
            0,
            Number(
                trainingResult?.total
            ) || 0
        );


    let conditionModifier = 0;


    if(
        typeof getTableSkillConditionModifier ===
        "function"
    ){

        conditionModifier =
            Number(
                getTableSkillConditionModifier(
                    character,
                    readiness
                )
            ) || 0;

    }


    const modifier =
        (
            Number(
                readiness.bonus
            ) || 0
        )
        +
        (
            Number(
                readiness.penalty
            ) || 0
        )
        +
        conditionModifier;


    return {

        total:
            trainingValue +
            modifier,

        trainingValue,

        modifier,

        formula:
            trainingFormula,

        detail:
            `${trainingFormula}: ${trainingValue}` +
            (
                modifier
                    ? ` ${modifier >= 0 ? "+" : ""}${modifier}`
                    : ""
            )

    };

}

/*==========================================================
=              RESPONDER ATAQUE
==========================================================*/

function answerAttackReaction(
    reactionType
){

    refreshCurrentTableCampaign();

    refreshCurrentTableCharacter();


    const request =
        currentTableCampaign
            .combat
            ?.pendingAttack;


    const character =
        currentTableCharacter;


    if(
        !request ||
        !character ||
        request.targetCharacterId !==
        character.id ||
        request.resolved === true
    ){

        closeCurrentPanel();

        return;

    }


    if(
        !character.status ||
        typeof character.status !== "object"
    ){

        character.status = {};

    }

    ensureCharacterHeart(character);


    const npcProtection=currentTableCampaign?.combat?.npcAssists?.[character.id],npcProtectionActive=npcProtection&&Number(npcProtection.round)===enemyCombatRound();

    const pressurePenalty=Math.max(0,Number(character.combatPressure)||0);
    const baseDefense =
        Math.max(
            0,
            Number(
                character.defense?.total
            ) - pressurePenalty || 0
        );


    const baseRD =
        Math.max(
            0,
            Number(
                character
                    .damageReduction
                    ?.total
            ) || 0
        );


    const currentPA =
        Math.max(
            0,
            Number(
                character.status.paAtual
            ) || 0
        );


    let paCost = 0;

    let finalDefense =
        baseDefense+(npcProtectionActive?Number(npcProtection.defenseBonus)||0:0);

    let reactionRD =
        baseRD+(npcProtectionActive?Number(npcProtection.rdBonus)||0:0);

    let readinessResult =
        null;


if(reactionType === "dodge"){

    paCost = 1;


    if(currentPA < paCost){

        addSystemChatMessage(
            `${character.name} não possui PA suficiente para Esquivar.`
        );

        return;

    }


    readinessResult =
        rollDodgeReadiness(
            character
        );


    finalDefense =
        baseDefense +(npcProtectionActive?Number(npcProtection.defenseBonus)||0:0)+
        Math.max(
            0,
            Number(
                readinessResult.total
            ) || 0
        );

}
    else if(reactionType === "block"){

        paCost = 1;


        if(currentPA < paCost){

            addSystemChatMessage(
                `${character.name} não possui PA suficiente para Bloquear.`
            );

            return;

        }


        reactionRD +=
            Math.max(
                0,
                Number(
                    character.attributes?.vig
                ) || 0
            );

    }

else if(reactionType === "counter"){

    paCost = 1;


    if(currentPA < paCost){

        addSystemChatMessage(
            `${character.name} não possui PA suficiente para Contra-atacar.`
        );

        return;

    }


    /*
        Contra-atacar não altera a Defesa.
        O ataque original é resolvido normalmente.
    */

    finalDefense =
        baseDefense;


    reactionRD =
        baseRD;

}

    else{

        reactionType =
            "guard";

        paCost =
            0;

    }


    character.status.paAtual =
        Math.max(
            0,
            currentPA -
            paCost
        );


    saveDamagedCharacter(
        character
    );


    request.reaction = {

        type:
            reactionType,

        paCost,

        baseDefense,

        finalDefense,

        baseRD,

        reactionRD,

        readiness:
            readinessResult,

        answeredAt:
            Date.now()

    };


    request.resolved =
        true;


    request.active =
        false;


    /*
        Empate pertence ao atacante.
    */

    request.hit =
        Number(
            request.attackResult
        ) >=
        finalDefense;

        if(request.hit){
            const abilities=[character.abilities,character.acquiredAbilities,character.habilidades].find(Array.isArray)||[];
            const perfectDefense=abilities.some(ability=>normalizeEnemyAbilityId(typeof ability==="string"?ability:ability.id||ability.name)==="defesa-perfeita");
            if(!perfectDefense){
                character.combatPressure=pressurePenalty+2;
                saveDamagedCharacter(character);
            }
        }

        if(request.hit){

    currentTableCampaign
        .combat
        .damageContext = {

            id:
                `damage_${Date.now()}`,

            active:
                true,

            attackRequestId:
                request.id,

            attackName:
                request.attackName,

            attackerCharacterId:
                request.attackerCharacterId ||
                null,

            targetCharacterId:
                character.id,

            targetName:
                character.name ||
                "Alvo",

            reaction:
                reactionType,

            damageReduction:
                reactionType === "block"
                    ? reactionRD
                    : baseRD,

            consumed:
                false,

            createdAt:
                Date.now()

        };

}
else{

    currentTableCampaign
        .combat
        .damageContext =
        null;

}

        if(
    reactionType === "counter"
){

    currentTableCampaign
        .combat
        .counterAttackOpportunity = {

            id:
                `counter_${Date.now()}`,

            active:
                true,

            characterId:
                character.id,

            characterName:
                character.name ||
                "Personagem",

            targetCharacterId:
                request.attackerCharacterId ||
                null,

            targetName:
                request.attackerName ||
                "Atacante",

            originalAttackId:
                request.id,

            createdAt:
                Date.now()

        };

}


    request.updatedAt =
        Date.now();


    currentTableCampaign
        .combat
        .updatedAt =
        Date.now();


    markAttackMessageAsApplied(
        request
    );

    if(request.hit&&request.attackerEnemyId){
        const attackingEnemy=(currentTableCampaign.enemies||[]).find(item=>String(item.enemyId||item.id)===String(request.attackerEnemyId));
        if(attackingEnemy&&enemyHasAbility(attackingEnemy,"vampirismo")){
            const vampirism=rollDiceExpression("1d10");
            if(vampirism){addRollChatMessage(`Vampirismo • ${attackingEnemy.name}`,"1d10",vampirism.total,enemyRollDetail(vampirism));healEnemy(attackingEnemy,vampirism.total,"Vampirismo");}
        }
    }


    saveTableCampaign();


    closeCurrentPanel();


    refreshCurrentTableCharacter();

    refreshOpenCharacterPanel();

    renderPublicChat();


    publishAttackResult(
        request,
        character
    );

    if(
    reactionType === "counter"
){

    openCounterAttackPanel();

}

}

/*==========================================================
=              PAINEL DE CONTRA-ATAQUE
==========================================================*/

function openCounterAttackPanel(){

    refreshCurrentTableCharacter();


    const opportunity =
        currentTableCampaign
            .combat
            ?.counterAttackOpportunity;


    if(
        !opportunity ||
        opportunity.active !== true ||
        opportunity.characterId !==
        currentTableCharacter?.id
    ){

        return;

    }


const attacks =
    getCharacterReadyAttacks(
        currentTableCharacter
    );


    const validAttacks =
        attacks.filter(
            attack =>
                attack &&
                (
                    attack.name ||
                    attack.roll
                )
        );


    openTablePanel(
        "REAÇÃO",
        "Contra-atacar",
        `

            <div class="table-panel-card">

                <h3>
                    Alvo: ${escapeTableHTML(
                        opportunity.targetName ||
                        "Atacante"
                    )}
                </h3>

                <p>
                    Escolha um ataque. A rolagem será marcada como Contra-ataque.
                </p>

            </div>


            <div class="table-panel-list">

                ${
                    validAttacks.length
                        ? validAttacks
                            .map((attack,index) => `

                                <button
                                    type="button"
                                    class="table-panel-card counter-attack-choice"
                                    data-attack-index="${index}">

                                    <h3>
                                        ${escapeTableHTML(
                                            attack.name ||
                                            `Ataque ${index + 1}`
                                        )}
                                    </h3>

                                    <p>
                                        ${escapeTableHTML(
                                            attack.roll ||
                                            "Sem fórmula"
                                        )}
                                    </p>

                                </button>

                            `)
                            .join("")
                        : `

                            <div class="editor-empty-state">

                                <span>⚔</span>

                                <p>
                                    Nenhum ataque rápido configurado.
                                </p>

                            </div>

                        `
                }

            </div>

        `
    );


    document
        .querySelectorAll(
            ".counter-attack-choice"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    rollCounterAttack(
                        Number(
                            button.dataset.attackIndex
                        )
                    );

                }
            );

        });

}

function rollCounterAttack(
    attackIndex
){

    refreshCurrentTableCampaign();

    refreshCurrentTableCharacter();


    const opportunity =
        currentTableCampaign
            .combat
            ?.counterAttackOpportunity;


    if(
        !opportunity ||
        opportunity.active !== true
    ){

        return;

    }


const attacks =
    getCharacterReadyAttacks(
        currentTableCharacter
    );


const attack =
    attacks[attackIndex];


    if(!attack){

        return;

    }


const rawFormula =
    attack.attack ||
    attack.roll ||
    attack.test ||
    attack.formula ||
    "1d20";


const formula =
    resolveCharacterFormula(
        rawFormula,
        currentTableCharacter
    );


    const result =
        rollDiceExpression(
            formula
        );


    if(!result){

        return;

    }


    addRollChatMessage(

        `Contra-ataque • ${attack.name || "Ataque"}`,

        formula,

        result.total,

        result.detail ||
        "",

        {

            rollKind:
                "attack",

            attackIndex,

            attackName:
                attack.name ||
                "Ataque",

            attackSkill:
                attack.skill ||
                attack.skillName ||
                attack.testSkill ||
                null,

            applied:
                false,

            isCounterAttack:
                true,

            forcedTargetCharacterId:
                opportunity.targetCharacterId

        }

    );


    opportunity.active =
        false;


    opportunity.usedAt =
        Date.now();


    saveTableCampaign();


    closeCurrentPanel();

}

/*==========================================================
=              ATAQUES PRONTOS DA FICHA
==========================================================*/

function getCharacterReadyAttacks(
    character
){

    if(!character){

        return [];

    }


    const possibleLists = [

        character.quickAttacks,

        character.attacks,

        character.combatAttacks,

        character.attackList

    ];


    const attackList =
        possibleLists.find(
            list =>
                Array.isArray(list)
        ) || [];


    return attackList.filter(
        attack => {

            if(!attack){

                return false;

            }


            const name =
                String(
                    attack.name ||
                    attack.title ||
                    ""
                ).trim();


            const attackFormula =
                String(
                    attack.attack ||
                    attack.roll ||
                    attack.test ||
                    attack.formula ||
                    ""
                ).trim();


            return Boolean(
                name &&
                attackFormula
            );

        }
    );

}

/*==========================================================
=              MARCAR ATAQUE COMO APLICADO
==========================================================*/

function markAttackMessageAsApplied(
    request
){

    const messages =
        Array.isArray(
            currentTableCampaign
                .chatMessages
        )
            ? currentTableCampaign
                .chatMessages
            : [];


    const message =
        messages.find(
            item =>
                item.id ===
                request.messageId
        );


    if(!message){

        return false;

    }


    message.applied =
        true;


    message.appliedAt =
        Date.now();


    message.attackApplication = {

        requestId:
            request.id,

        targetCharacterId:
            request.targetCharacterId,

        attackerEnemyId:
            request.attackerEnemyId ||
            null,

        targetName:
            request.targetName,

        attackResult:
            Number(
                request.attackResult
            ) || 0,

        reaction:
            request.reaction?.type ||
            "guard",

        baseDefense:
            request.reaction
                ?.baseDefense || 0,

        finalDefense:
            request.reaction
                ?.finalDefense || 0,

        reactionRD:
            request.reaction
                ?.reactionRD || 0,

        paCost:
            request.reaction
                ?.paCost || 0,

        hit:
            Boolean(
                request.hit
            )

    };


    return true;

}

/*==========================================================
=              RESULTADO DO ATAQUE
==========================================================*/

function publishAttackResult(
    request,
    targetCharacter
){

    const reactionNames = {

        dodge:
            "Esquivar",

        block:
            "Bloquear",

        guard:
            "Guardar"

    };


    const reactionName =
        reactionNames[
            request.reaction?.type
        ] ||
        "Guardar";


    const attackResult =
        Number(
            request.attackResult
        ) || 0;


    const defense =
        Number(
            request.reaction
                ?.finalDefense
        ) || 0;


    const hit =
        request.hit === true;


    const parts = [

        `${targetCharacter.name || "O alvo"} escolheu ${reactionName}.`,

        `Ataque ${attackResult} contra Defesa ${defense}.`,

        hit
            ? "O ataque acertou."
            : "O ataque errou."

    ];


    if(
        request.reaction?.type ===
        "block"
    ){

        parts.push(
            `Se houver dano, a RD deste ataque será ${request.reaction.reactionRD}.`
        );

    }


    addSystemChatMessage(
        parts.join(" ")
    );

}

/*==========================================================
=              BOTÃO APLICAR DANO
==========================================================*/

function bindApplyDamageButtons(){

    document
        .querySelectorAll(
            ".chat-apply-damage-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    startDamageTargetSelection(
                        button.dataset.messageId
                    );

                }
            );

        });

}

function formatPublicChatTime(
    timestamp
){

    const date =
        new Date(
            Number(timestamp) ||
            Date.now()
        );


    return date.toLocaleTimeString(
        "pt-BR",
        {
            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    );

}

/*==========================================================
=              INICIAR SELEÇÃO DE ALVO
==========================================================*/

function startDamageTargetSelection(
    messageId
){

    refreshCurrentTableCampaign();


    const messages =
        Array.isArray(
            currentTableCampaign
                .chatMessages
        )
            ? currentTableCampaign
                .chatMessages
            : [];


    const message =
        messages.find(
            item =>
                item.id ===
                messageId
        );


    if(!message){

        addSystemChatMessage(
            "A rolagem de dano não foi encontrada."
        );

        return;

    }


    if(
        message.rollKind !== "damage"
    ){

        return;

    }


    if(message.applied === true){

        addSystemChatMessage(
            "Esse dano já foi aplicado."
        );

        return;

    }


    pendingDamageApplication = {

        messageId:
            message.id,

        damage:
            Math.max(
                0,
                Number(
                    message.total
                ) || 0
            ),

        attackName:
            message.attackName ||
            "Ataque",

        attackerCharacterId:
            message.characterId ||
            null,

        attackerEnemyId:
            message.enemyInstanceId ||
            null,

        author:
            message.author ||
            "Atacante",

        element:message.element||message.damageElement||null,

        isRitual:message.isRitual===true||message.rollKind==="ritual-damage"

    };


    document
        .querySelector(
            ".table-play-area"
        )
        ?.classList
        .add(
            "selecting-damage-target"
        );


    markDamageTargets();


    addLocalDamageNotice(
        `Selecione no mapa quem receberá ${pendingDamageApplication.damage} de dano.`
    );

}

/*==========================================================
=              MARCAR ALVOS DE DANO
==========================================================*/

function markDamageTargets(){

    /*
        Nesta primeira versão, o dano automático
        funciona somente em personagens jogadores.

        Ameaças terão seus próprios PV de combate
        dentro da campanha posteriormente.
    */

    document
        .querySelectorAll(
            ".player-position.occupied, .enemy-position.occupied"
        )
        .forEach(position => {

            position.classList.add(
                "damage-target-selectable"
            );

        });

}

/*==========================================================
=              APLICAR DANO AO ALVO
==========================================================*/

function applyPendingDamageToTarget(
    type,
    entity
){

    if(!pendingDamageApplication){

        return;

    }

    if(type==="enemy"){
        applyDamageToEnemy(entity);
        return;
    }

    if(type==="npc"){
        const npc=(currentTableCampaign.npcs||[]).find(item=>String(item.npcId||item.id)===String(entity.npcId||entity.id))||entity;
        npc.status=npc.status||{pvAtual:Number(npc.pv)||0,pvMax:Number(npc.pv)||0};
        const before=Math.max(0,Number(npc.status.pvAtual)||0),damage=Math.max(0,Number(pendingDamageApplication.damage)||0);
        npc.status.pvAtual=Math.max(0,before-damage);
        const message=(currentTableCampaign.chatMessages||[]).find(item=>item.id===pendingDamageApplication.messageId);
        if(message){message.applied=true;message.appliedAt=Date.now();message.appliedTarget={type:"npc",npcId:npc.npcId||npc.id,name:npc.name||"NPC"};message.damageApplication={originalDamage:damage,damageReduction:0,finalDamage:damage,pvBefore:before,pvAfter:npc.status.pvAtual};}
        saveTableCampaign();cancelDamageTargetSelection();renderCombatPositions();renderPublicChat();addSystemChatMessage(`${npc.name||"O NPC"} sofreu ${damage} de dano. PV: ${before} → ${npc.status.pvAtual}.`);
        return;
    }


    /*
        Por enquanto apenas personagens.
    */

    if(
        type !== "player" ||
        !entity?.characterId
    ){

        addLocalDamageNotice(
            "Nesta etapa, o dano automático só pode ser aplicado em personagens jogadores."
        );

        return;

    }


    const character =
        getLiveCharacter(
            entity.characterId
        );


    if(!character){

        addLocalDamageNotice(
            "Não foi possível encontrar a ficha desse personagem."
        );

        return;

    }


    const lifeMode =
        character.lifeMode === "body"
            ? "body"
            : "classic";


    if(lifeMode === "body"){
        const originalDamage=Math.max(0,Number(pendingDamageApplication.damage)||0),normalRD=Math.max(0,Number(character.damageReduction?.total)||0),context=currentTableCampaign.combat?.damageContext,contextMatches=context?.active===true&&context.targetCharacterId===character.id,damageReduction=contextMatches?Math.max(0,Number(context.damageReduction)||0):normalRD;
        startBodyDamageDistribution("player",character,originalDamage,damageReduction);
        return;

    }


    applyClassicDamageToCharacter(
        character
    );

}

const BODY_PART_LABELS={head:"Cabeça",chest:"Torso",heart:"Coração",leftArm:"Braço esquerdo",rightArm:"Braço direito",leftLeg:"Perna esquerda",rightLeg:"Perna direita"};
function initializeEnemyBody(enemy){
    enemy.lifeMode="body";
    enemy.body=enemy.body&&typeof enemy.body==="object"?enemy.body:{};
    enemy.bodyMaximums=enemy.bodyMaximums&&typeof enemy.bodyMaximums==="object"?enemy.bodyMaximums:{};
    const maximums={head:Number(enemy.head)||0,chest:Number(enemy.torso)||0,leftArm:Number(enemy.limb)||0,rightArm:Number(enemy.limb)||0,leftLeg:Number(enemy.limb)||0,rightLeg:Number(enemy.limb)||0};
    const needsMigration=Number(enemy.bodySystemVersion||0)<2;
    Object.entries(maximums).forEach(([id,max])=>{
        const legacyId=id==="chest"?"torso":id;
        const oldMaximum=Math.max(0,Number(enemy.bodyMaximums[id]??enemy.bodyMaximums[legacyId])||0);
        const fixedMaximum=oldMaximum>0?oldMaximum:Math.max(0,max);
        const savedCurrent=enemy.body[id]??enemy.body[legacyId];
        enemy.bodyMaximums[id]=fixedMaximum;
        enemy.body[id]=needsMigration&&oldMaximum<=0?fixedMaximum:Math.min(fixedMaximum,Math.max(0,Number(savedCurrent??fixedMaximum)||0));
    });
    delete enemy.body.torso;
    delete enemy.bodyMaximums.torso;
    enemy.bodySystemVersion=2;
    return enemy;
}
function bodyDamageParts(target,type){
    if(type==="enemy")initializeEnemyBody(target);
    const body=target.body&&typeof target.body==="object"?target.body:{},states=target.bodyState&&typeof target.bodyState==="object"?target.bodyState:{};
    return ["head","chest","leftArm","rightArm","leftLeg","rightLeg"].map(id=>{const state=states[id]||{};const missing=state.type==="missing";const current=missing?0:Math.max(0,Number(state.type==="prosthetic"?state.currentPV:body[id])||0);return{id,label:BODY_PART_LABELS[id],current,state};});
}
function applyDamageAmountToBodyPart(current,remaining){return Math.min(Math.max(0,Number(current)||0),Math.max(0,Number(remaining)||0));}
function startBodyDamageDistribution(type,target,originalDamage,damageReduction){
    const reducedDamage=Math.max(0,originalDamage-damageReduction),temporaryBefore=type==="player"?Math.max(0,Number(target.body?.temporaryPV)||0,Number(target.status?.pvTemp)||0):0,temporaryAbsorbed=Math.min(temporaryBefore,reducedDamage);
    pendingBodyDamageApplication={type,targetId:type==="player"?target.id:(target.enemyId||target.id),messageId:pendingDamageApplication.messageId,attackName:pendingDamageApplication.attackName,originalDamage,damageReduction,reducedDamage,temporaryBefore,temporaryAbsorbed,remaining:reducedDamage-temporaryAbsorbed,allocations:{}};
    cancelDamageTargetSelection();
    if(type==="player"&&Math.max(0,Number(target.body?.chest)||0)<=0){applyPendingDamageToHeart();finishBodyDamageDistribution();return;}
    if(pendingBodyDamageApplication.remaining<=0){finishBodyDamageDistribution();return;}
    renderBodyDamageDistribution();
}
function applyPendingDamageToHeart(){const state=pendingBodyDamageApplication,target=getPendingBodyDamageTarget();if(!state||state.type!=="player"||!target)return 0;ensureCharacterHeart(target);const before=Math.max(0,Number(target.heart.current)||0),applied=Math.min(before,Math.max(0,Number(state.remaining)||0));target.heart.current=Math.max(0,before-applied);state.allocations.heart=(Number(state.allocations.heart)||0)+applied;state.remaining=Math.max(0,state.remaining-applied);if(target.heart.current<=0&&applied>0)markCharacterDead(target);return applied;}
function getPendingBodyDamageTarget(){const state=pendingBodyDamageApplication;if(!state)return null;return state.type==="player"?getLiveCharacter(state.targetId):(currentTableCampaign.enemies||[]).find(item=>String(item.enemyId||item.id)===String(state.targetId));}
function renderBodyDamageDistribution(){
    const state=pendingBodyDamageApplication,target=getPendingBodyDamageTarget();if(!state||!target)return;
    document.getElementById("bodyDamageSelector")?.remove();
    const parts=bodyDamageParts(target,state.type),modal=document.createElement("div");modal.id="bodyDamageSelector";modal.className="table-modal";
    modal.innerHTML=`<div class="table-modal-content"><div class="table-modal-header"><div><span class="table-panel-label">DANO POR MEMBROS</span><h2>${escapeTableHTML(target.name||"Alvo")}</h2></div></div><div class="table-panel-card"><h3>Dano restante: ${state.remaining}</h3><p>Escolha um membro. Ele receberá o máximo possível e o restante continuará para o próximo.</p></div><div class="table-panel-list">${parts.map(part=>{const allocated=Number(state.allocations[part.id])||0,current=Math.max(0,part.current-allocated);return`<button type="button" class="table-panel-card body-damage-part" data-part="${part.id}" ${current<=0?"disabled":""} style="width:100%;text-align:left"><h3>${escapeTableHTML(part.label)}</h3><p>PV disponível: ${current}</p></button>`}).join("")}</div></div>`;
    document.body.appendChild(modal);
    modal.querySelectorAll(".body-damage-part").forEach(button=>button.addEventListener("click",()=>allocatePendingBodyDamage(button.dataset.part)));
}
function allocatePendingBodyDamage(partId){
    const state=pendingBodyDamageApplication,target=getPendingBodyDamageTarget();if(!state||!target)return;
    const part=bodyDamageParts(target,state.type).find(item=>item.id===partId);if(!part)return;
    const already=Number(state.allocations[partId])||0,applied=applyDamageAmountToBodyPart(part.current-already,state.remaining);if(applied<=0)return;
    state.allocations[partId]=already+applied;state.remaining=Math.max(0,state.remaining-applied);
    if(state.type==="player"&&partId==="chest"&&part.current-already-applied<=0&&state.remaining>0){applyPendingDamageToHeart();finishBodyDamageDistribution();return;}
    const available=bodyDamageParts(target,state.type).reduce((sum,item)=>sum+Math.max(0,item.current-(Number(state.allocations[item.id])||0)),0);
    if(state.remaining<=0||available<=0)finishBodyDamageDistribution();else renderBodyDamageDistribution();
}
function finishBodyDamageDistribution(){
    const state=pendingBodyDamageApplication,target=getPendingBodyDamageTarget();if(!state||!target)return;
    bodyDamageParts(target,state.type).forEach(part=>{const amount=Number(state.allocations[part.id])||0;if(!amount)return;if(part.state.type==="prosthetic")part.state.currentPV=Math.max(0,part.current-amount);else target.body[part.id]=Math.max(0,part.current-amount);});
    if(state.type==="player"){target.status=target.status||{};target.body.temporaryPV=Math.max(0,state.temporaryBefore-state.temporaryAbsorbed);target.status.pvTemp=target.body.temporaryPV;saveDamagedCharacter(target);const sourceMessage=(currentTableCampaign.chatMessages||[]).find(item=>item.id===state.messageId);applyApplicatorCondition(target,sourceMessage?.enemyInstanceId);}else{const remainingBodyPV=bodyDamageParts(target,"enemy").reduce((sum,part)=>sum+Math.max(0,Number(part.current)||0),0);if(remainingBodyPV<=0)triggerEnemyLastBreath(target);saveTableCampaign();}
    const context=currentTableCampaign.combat?.damageContext;if(context?.active===true){context.active=false;context.consumed=true;context.consumedAt=Date.now();}
    const message=(currentTableCampaign.chatMessages||[]).find(item=>item.id===state.messageId),appliedDamage=state.reducedDamage-state.remaining;
    if(message){message.applied=true;message.appliedAt=Date.now();message.appliedTarget={type:state.type,characterId:state.type==="player"?target.id:null,enemyId:state.type==="enemy"?(target.enemyId||target.id):null,name:target.name||"Alvo"};message.damageApplication={originalDamage:state.originalDamage,damageReduction:state.damageReduction,finalDamage:appliedDamage,bodyDamage:true,allocations:{...state.allocations},unallocatedDamage:state.remaining};}
    saveTableCampaign();document.getElementById("bodyDamageSelector")?.remove();pendingBodyDamageApplication=null;renderCombatPositions();renderPublicChat();refreshOpenCharacterPanel();
    const allocationText=Object.entries(state.allocations).filter(([,amount])=>amount>0).map(([id,amount])=>`${BODY_PART_LABELS[id]}: ${amount}`).join(" • ");
    addSystemChatMessage(`${target.name||"O alvo"} recebeu ${appliedDamage} de dano nos membros${allocationText?` (${allocationText})`:""}.${state.remaining>0?` Restaram ${state.remaining} de dano sem membro disponível.`:""}`);
}

function consumeFantasmagorico(enemy){
    if(!enemyHasAbility(enemy,"fantasmagorico"))return 0;
    const state=enemyAbilityState(enemy),round=enemyCombatRound(),limit=Math.max(0,Number(enemy.foco)||0),used=Math.max(0,Number(state.fantasmagoricoSceneUses)||0);
    if(state.fantasmagoricoUsedRound===round||used>=limit)return 0;
    state.fantasmagoricoUsedRound=round;state.fantasmagoricoSceneUses=used+1;
    return 15;
}
function applyDamageToEnemy(enemy){
    if(!enemy||!pendingDamageApplication)return;
    const enemyId=enemy.enemyId||enemy.id;
    enemy=(currentTableCampaign.enemies||[]).find(item=>String(item.enemyId||item.id)===String(enemyId))||enemy;
    const originalDamage=Math.max(0,Number(pendingDamageApplication.damage)||0),context=currentTableCampaign.combat?.damageContext,contextMatches=context?.active===true&&String(context.targetEnemyId)===String(enemy.enemyId||enemy.id),ritualImmune=enemyHasAbility(enemy,"apice-do-poder")&&pendingDamageApplication.isRitual&&normalizeEnemyAbilityId(pendingDamageApplication.element)===normalizeEnemyAbilityId(enemy.element),baseReduction=ritualImmune?originalDamage:(contextMatches?Math.max(0,Number(context.damageReduction)||0):Math.max(0,Number(enemy.rd)||0)),spectralReduction=ritualImmune?0:consumeFantasmagorico(enemy),damageReduction=Math.min(originalDamage,baseReduction+spectralReduction),finalDamage=Math.max(0,originalDamage-damageReduction);
    if(enemy.lifeMode==="body"){startBodyDamageDistribution("enemy",enemy,originalDamage,damageReduction);return;}
    enemy.status=enemy.status&&typeof enemy.status==="object"?enemy.status:{};
    const before=Math.max(0,Number(enemy.status.pvAtual??enemy.pv)||0);
    enemy.status.pvAtual=Math.max(0,before-finalDamage);
    enemy.status.pvMax=Math.max(0,Number(enemy.status.pvMax??enemy.pv)||0);
    if(enemy.status.pvAtual<=0)triggerEnemyLastBreath(enemy);
    if(contextMatches){context.active=false;context.consumed=true;context.consumedAt=Date.now();}
    const after=enemy.status.pvAtual,message=(currentTableCampaign.chatMessages||[]).find(item=>item.id===pendingDamageApplication.messageId);
    if(message){message.applied=true;message.appliedAt=Date.now();message.appliedTarget={type:"enemy",enemyId:enemy.enemyId||enemy.id,name:enemy.name||"Ameaça"};message.damageApplication={originalDamage,damageReduction,finalDamage,pvBefore:before,pvAfter:after};}
    saveTableCampaign();cancelDamageTargetSelection();renderCombatPositions();renderPublicChat();addSystemChatMessage(`${enemy.name||"A ameaça"} recebeu ${finalDamage} de dano após RD ${damageReduction}. PV atual: ${before} → ${after}.`);
}

/*==========================================================
=              DANO EM PV CLÁSSICO
==========================================================*/

function applyClassicDamageToCharacter(
    character
){

    if(
        !character ||
        !pendingDamageApplication
    ){

        return;

    }


    if(
        !character.status ||
        typeof character.status !== "object"
    ){

        character.status = {};

    }

    ensureCharacterHeart(character);


    const originalDamage =
        Math.max(
            0,
            Number(
                pendingDamageApplication.damage
            ) || 0
        );


const normalDamageReduction =
    Math.max(
        0,
        Number(
            character
                .damageReduction
                ?.total
        ) || 0
    );


const damageContext =
    currentTableCampaign
        ?.combat
        ?.damageContext;


const canUseReactionRD =
    damageContext &&
    damageContext.active === true &&
    damageContext.consumed !== true &&
    damageContext.targetCharacterId ===
    character.id;


const damageReduction =
    canUseReactionRD
        ? Math.max(
            0,
            Number(
                damageContext.damageReduction
            ) || 0
        )
        : normalDamageReduction;


    const reducedDamage =
        Math.max(
            0,
            originalDamage -
            damageReduction
        );


    const temporaryPVBefore =
        Math.max(
            0,
            Number(character.status.pvTemp) || 0,
            Number(character.body?.temporaryPV) || 0
        );


    const currentPVBefore =
        Math.max(
            0,
            Number(
                character.status.pvAtual
            ) || 0
        );


    /*
        PV temporário absorve primeiro.
    */

    const temporaryAbsorbed =
        Math.min(
            temporaryPVBefore,
            reducedDamage
        );


    const damageAfterTemporary =
        Math.max(
            0,
            reducedDamage -
            temporaryAbsorbed
        );


    const actualPVLost =
        Math.min(
            currentPVBefore,
            damageAfterTemporary
        );

    const heartBefore=Math.max(0,Number(character.heart?.current)||0);
    const heartDamage=Math.min(heartBefore,Math.max(0,damageAfterTemporary-currentPVBefore));


    character.status.pvTemp =
        Math.max(
            0,
            temporaryPVBefore -
            temporaryAbsorbed
        );

    character.body=character.body||{};
    character.body.temporaryPV=character.status.pvTemp;


    character.status.pvAtual =
        Math.max(
            0,
            currentPVBefore -
            damageAfterTemporary
        );

    character.heart.current=Math.max(0,heartBefore-heartDamage);
    if(character.heart.current<=0&&heartDamage>0&&!trySoMaisUmPasso(character))markCharacterDead(character);


    const application =
        {

            originalDamage,

            damageReduction,

            reducedDamage,

            temporaryAbsorbed,

            actualPVLost,

            heartDamage,

            heartBefore,

            heartAfter:character.heart.current,

            usedReactionDamageReduction:
    Boolean(
        canUseReactionRD
    ),

reaction:
    canUseReactionRD
        ? damageContext.reaction
        : null,

            pvBefore:
                currentPVBefore,

            pvAfter:
                character.status.pvAtual,

            temporaryBefore:
                temporaryPVBefore,

            temporaryAfter:
                character.status.pvTemp

                

        };

        


    const saved =
        saveDamagedCharacter(
            character
        );


    if(!saved){

        addLocalDamageNotice(
            "Não foi possível salvar o dano na ficha."
        );

        return;

    }


    finishDamageApplication(
        character,
        application
    );

}

/*==========================================================
=              SALVAR PERSONAGEM FERIDO
==========================================================*/

function saveDamagedCharacter(
    updatedCharacter
){

    if(!updatedCharacter?.id){

        return false;

    }


    let characters = [];


    try{

        characters =
            JSON.parse(
                localStorage.getItem(
                    TABLE_CHARACTER_STORAGE
                ) || "[]"
            );

    }
    catch(error){

        console.error(
            "Erro ao carregar fichas para aplicar dano:",
            error
        );

        return false;

    }


    if(!Array.isArray(characters)){

        return false;

    }


    const characterIndex =
        characters.findIndex(
            character =>
                character.id ===
                updatedCharacter.id
        );


    if(characterIndex === -1){

        return false;

    }


    characters[characterIndex] =
        updatedCharacter;


    tableCharacters =
        characters;


    localStorage.setItem(
        TABLE_CHARACTER_STORAGE,
        JSON.stringify(
            characters
        )
    );


    if(
        currentTableCharacter?.id ===
        updatedCharacter.id
    ){

        currentTableCharacter =
            updatedCharacter;

    }


    return true;

}

function applyApplicatorCondition(character,attackerEnemyId){
    if(!character||!attackerEnemyId)return false;const enemy=(currentTableCampaign.enemies||[]).find(item=>String(item.enemyId||item.id)===String(attackerEnemyId));if(!enemy||!enemyHasAbility(enemy,"aplicador"))return false;
    const conditions=Array.isArray(character.conditions)?character.conditions:[],dying=Number(character.status?.pvAtual??1)<=0||conditions.some(condition=>normalizeEnemyAbilityId(typeof condition==="string"?condition:condition.id||condition.name)==="morrendo");if(!dying)return false;
    const conditionId=({sangue:"sangramento",morte:"envenenamento",energia:"chamas",conhecimento:"vulneravel"})[normalizeEnemyAbilityId(enemy.element)];if(!conditionId)return false;const definition=ENEMY_CONDITION_CATALOG.find(item=>item.id===conditionId);if(!definition)return false;
    const existing=conditions.find(condition=>normalizeEnemyAbilityId(typeof condition==="string"?condition:condition.id||condition.name)===conditionId);if(existing&&definition.stackable&&typeof existing==="object")existing.stacks=Math.max(1,Number(existing.stacks)||1)+1;else if(!existing)conditions.push({...definition,source:"aplicador",sourceEnemyId:enemy.enemyId||enemy.id});character.conditions=conditions;saveDamagedCharacter(character);addSystemChatMessage(`${enemy.name} aplicou ${definition.name} em ${character.name}.`);return true;
}

/*==========================================================
=              FINALIZAR APLICAÇÃO DO DANO
==========================================================*/

function finishDamageApplication(
    character,
    application
){

    const damageData = {
        ...pendingDamageApplication
    };

    const receivedDamage=Math.max(0,Number(application?.reducedDamage??application?.actualDamage??application?.finalDamage)||0);
    const abilities=[character?.abilities,character?.acquiredAbilities,character?.habilidades].find(Array.isArray)||[];
    if(receivedDamage>=20&&abilities.some(ability=>normalizeEnemyAbilityId(typeof ability==="string"?ability:ability.id||ability.name)==="dor-e-uma-bencao")){
        character.nextRoundTemporaryPA=Math.max(0,Number(character.nextRoundTemporaryPA)||0)+1;
        saveDamagedCharacter(character);
        addSystemChatMessage(`${character.name} ativou Dor é uma Bênção e receberá +1 PA temporário no próximo turno.`);
    }

    applyApplicatorCondition(character,damageData.attackerEnemyId);

    const damageContext =
    currentTableCampaign
        ?.combat
        ?.damageContext;


if(
    damageContext &&
    damageContext.active === true &&
    damageContext.targetCharacterId ===
    character.id
){

    damageContext.consumed =
        true;

    damageContext.active =
        false;

    damageContext.consumedAt =
        Date.now();

}

    markDamageMessageAsApplied(
        damageData.messageId,
        character,
        application
    );

saveTableCampaign();
    cancelDamageTargetSelection();


    refreshCurrentTableCharacter();

    renderCombatPositions();

    refreshOpenCharacterPanel();


    const details = [];


    details.push(
        `${damageData.attackName || "Ataque"} causou ${application.originalDamage} de dano em ${character.name || "Personagem"}.`
    );


if(application.damageReduction > 0){

    if(
        application.usedReactionDamageReduction &&
        application.reaction === "block"
    ){

        details.push(
            `O Bloqueio aplicou RD ${application.damageReduction}, reduzindo o dano para ${application.reducedDamage}.`
        );

    }
    else{

        details.push(
            `A RD ${application.damageReduction} reduziu o dano para ${application.reducedDamage}.`
        );

    }

}
    else{

        details.push(
            "O alvo não possuía RD."
        );

    }


    if(application.temporaryAbsorbed > 0){

        details.push(
            `${application.temporaryAbsorbed} de dano foi absorvido pelo PV temporário.`
        );

    }


    if(application.actualPVLost > 0){

        details.push(
            `O alvo perdeu ${application.actualPVLost} PV.`
        );

    }

    if(application.heartDamage > 0){details.push(`${application.heartDamage} de dano excedente atingiu o Coração. Coração: ${application.heartBefore} → ${application.heartAfter}.`);if(application.heartAfter<=0)details.push(`${character.name || "O personagem"} morreu.`);}


    if(application.reducedDamage === 0){

        details.push(
            "Todo o dano foi impedido."
        );

    }


    details.push(
        `PV atual: ${application.pvAfter}.`
    );


    addSystemChatMessage(
        details.join(" ")
    );

}

/*==========================================================
=              MARCAR DANO COMO APLICADO
==========================================================*/

function markDamageMessageAsApplied(
    messageId,
    targetCharacter,
    application
){

    refreshCurrentTableCampaign();


    const messages =
        Array.isArray(
            currentTableCampaign.chatMessages
        )
            ? currentTableCampaign.chatMessages
            : [];


    const message =
        messages.find(
            item =>
                item.id ===
                messageId
        );


    if(!message){

        return false;

    }


    message.applied =
        true;


    message.appliedAt =
        Date.now();


    message.appliedTarget = {

        type:"player",

        characterId:
            targetCharacter.id,

        name:
            targetCharacter.name ||
            "Personagem"

    };


    message.damageApplication = {

        originalDamage:
            application.originalDamage,

        damageReduction:
            application.damageReduction,

        finalDamage:
            application.reducedDamage,

        temporaryAbsorbed:
            application.temporaryAbsorbed,

        pvLost:
            application.actualPVLost,

        pvBefore:
            application.pvBefore,

        pvAfter:
            application.pvAfter

    };


    saveTableCampaign();

    renderPublicChat();


    return true;

}

/*==========================================================
=              AVISO LOCAL DE DANO
==========================================================*/

function addLocalDamageNotice(
    text
){

    document
        .querySelector(
            ".damage-selection-notice"
        )
        ?.remove();


    const notice =
        document.createElement(
            "div"
        );


    notice.className =
        "damage-selection-notice";


    notice.innerHTML = `

        <strong>
            Aplicar dano
        </strong>

        <span>
            ${escapeTableHTML(
                text
            )}
        </span>

        <button
            type="button"
            class="damage-selection-cancel">

            Cancelar

        </button>

    `;


    document.body.appendChild(
        notice
    );


    notice
        .querySelector(
            ".damage-selection-cancel"
        )
        ?.addEventListener(
            "click",
            cancelDamageTargetSelection
        );

}

/*==========================================================
=              CANCELAR SELEÇÃO DE DANO
==========================================================*/

function cancelDamageTargetSelection(){

    pendingDamageApplication =
        null;


    document
        .querySelector(
            ".table-play-area"
        )
        ?.classList
        .remove(
            "selecting-damage-target"
        );


    document
        .querySelectorAll(
            ".damage-target-selectable"
        )
        .forEach(element => {

            element.classList.remove(
                "damage-target-selectable"
            );

        });


    document
        .querySelector(
            ".damage-selection-notice"
        )
        ?.remove();

}
