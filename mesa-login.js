/*==========================================================
=                  MESA LOGIN.JS - PARTE 1
==========================================================*/

document.addEventListener(
    "DOMContentLoaded",
    initMesaLogin
);


/*==========================================================
=                  STORAGE
==========================================================*/

const CAMPAIGN_STORAGE =
    "ordem_campaigns";

const CHARACTER_STORAGE =
    "ordem_characters";


let campaigns = [];

let characters = [];

let currentCampaign = null;


/*==========================================================
=                  ELEMENTOS
==========================================================*/

const campaignTitle =
    document.getElementById(
        "campaignTitle"
    );

const campaignDescription =
    document.getElementById(
        "campaignDescription"
    );

const campaignPlayers =
    document.getElementById(
        "campaignPlayers"
    );

const campaignInvite =
    document.getElementById(
        "campaignInvite"
    );

const campaignCover =
    document.getElementById(
        "campaignCover"
    );

const enterPlayer =
    document.getElementById(
        "enterPlayer"
    );

const enterMaster =
    document.getElementById(
        "enterMaster"
    );

const masterPasswordPanel =
    document.getElementById(
        "masterPasswordPanel"
    );

const masterPasswordInput =
    document.getElementById(
        "masterPasswordInput"
    );

const confirmMasterLogin =
    document.getElementById(
        "confirmMasterLogin"
    );

const cancelMasterLogin =
    document.getElementById(
        "cancelMasterLogin"
    );

const masterPasswordError =
    document.getElementById(
        "masterPasswordError"
    );

const playerCharacterPanel =
    document.getElementById(
        "playerCharacterPanel"
    );

const availableCharacters =
    document.getElementById(
        "availableCharacters"
    );

const closeCharacterPanel =
    document.getElementById(
        "closeCharacterPanel"
    );


/*==========================================================
=                  INICIALIZAÇÃO
==========================================================*/

function initMesaLogin(){

    loadStorage();

    discoverCampaign();

    bindEvents();

}


/*==========================================================
=                  EVENTOS
==========================================================*/

function bindEvents(){

    enterPlayer?.addEventListener(

        "click",

        openPlayerPanel

    );

    enterMaster?.addEventListener(

        "click",

        openMasterPanel

    );

    cancelMasterLogin?.addEventListener(

        "click",

        closeMasterPanel

    );

    closeCharacterPanel?.addEventListener(

        "click",

        closePlayerPanel

    );

    confirmMasterLogin?.addEventListener(

        "click",

        validateMasterLogin

    );

    masterPasswordInput?.addEventListener(

        "keydown",

        event=>{

            if(event.key==="Enter"){

                validateMasterLogin();

            }

        }

    );

}


/*==========================================================
=                  STORAGE
==========================================================*/

function loadStorage(){

    try{

        campaigns =
            JSON.parse(

                localStorage.getItem(
                    CAMPAIGN_STORAGE
                )

            ) || [];

    }

    catch{

        campaigns = [];

    }

    try{

        characters =
            JSON.parse(

                localStorage.getItem(
                    CHARACTER_STORAGE
                )

            ) || [];

    }

    catch{

        characters = [];

    }

}


/*==========================================================
=              DESCOBRIR CAMPANHA
==========================================================*/

function discoverCampaign(){

    const params =
        new URLSearchParams(
            window.location.search
        );

    const id =
        params.get("campaign");

    if(!id){

        window.location.href =
            "campanhas.html";

        return;

    }

    currentCampaign =
        campaigns.find(

            campaign=>

                String(campaign.id)===String(id)

        );

    if(!currentCampaign){

        window.location.href =
            "campanhas.html";

        return;

    }

    fillCampaign();

}


/*==========================================================
=              PREENCHER CAMPANHA
==========================================================*/

function fillCampaign(){

    campaignTitle.textContent =
        currentCampaign.name;

    campaignDescription.textContent =
        currentCampaign.description ||
        "Sem descrição.";

    const players =
        currentCampaign.players?.length || 0;

    const maxPlayers =
        currentCampaign.maxPlayers || 4;

    campaignPlayers.textContent =
        `${players} / ${maxPlayers}`;

    campaignInvite.textContent =
        currentCampaign.inviteCode;

    if(currentCampaign.cover){

        campaignCover.innerHTML="";

        const img =
            document.createElement("img");

        img.src =
            currentCampaign.cover;

        campaignCover.appendChild(img);

    }

}

/*==========================================================
=                  MESA LOGIN.JS - PARTE 2
==========================================================*/

/*==========================================================
=              ABRIR PAINEL DO MESTRE
==========================================================*/

function openMasterPanel(){

    if(!masterPasswordPanel){

        return;

    }

    masterPasswordError.textContent = "";

    masterPasswordInput.value = "";

    masterPasswordPanel.classList.remove(
        "hidden"
    );

    setTimeout(
        () => masterPasswordInput.focus(),
        50
    );

}


/*==========================================================
=              FECHAR PAINEL DO MESTRE
==========================================================*/

function closeMasterPanel(){

    masterPasswordPanel?.classList.add(
        "hidden"
    );

    masterPasswordError.textContent = "";

    masterPasswordInput.value = "";

}


/*==========================================================
=              VALIDAR MESTRE
==========================================================*/

function validateMasterLogin(){

    const password =
        masterPasswordInput?.value || "";

    /*
        Enquanto não tivermos backend,
        a senha fica salva na campanha.

        Se a campanha ainda não tiver senha,
        usamos "mestre" temporariamente.
    */

    const correctPassword =
        currentCampaign.masterPassword ||
        "mestre";

    if(password !== correctPassword){

        masterPasswordError.textContent =
            "Senha incorreta.";

        masterPasswordInput?.focus();

        return;

    }

    enterMesaAsMaster();

}


/*==========================================================
=              ENTRAR COMO MESTRE
==========================================================*/

function enterMesaAsMaster(){

    localStorage.setItem(
        "ordem_table_role",
        "master"
    );

    localStorage.removeItem(
        "ordem_table_character"
    );

    localStorage.setItem(
        "ordem_current_campaign",
        currentCampaign.id
    );

    window.location.href =
        `mesa.html?campaign=${encodeURIComponent(
            currentCampaign.id
        )}&role=master`;

}


/*==========================================================
=              ABRIR PAINEL DO JOGADOR
==========================================================*/

function openPlayerPanel(){

    if(!playerCharacterPanel){

        return;

    }

    renderAvailableCharacters();

    playerCharacterPanel.classList.remove(
        "hidden"
    );

}


/*==========================================================
=              FECHAR PAINEL DO JOGADOR
==========================================================*/

function closePlayerPanel(){

    playerCharacterPanel?.classList.add(
        "hidden"
    );

}


/*==========================================================
=              FICHAS DISPONÍVEIS
==========================================================*/

function renderAvailableCharacters(){

    if(!availableCharacters){

        return;

    }

    availableCharacters.innerHTML = "";

    const available =
        characters.filter(character => {

            /*
                Mostra:
                - fichas sem campanha;
                - fichas já vinculadas a esta campanha.
            */

            return (
                !character.campaignId ||
                String(character.campaignId) ===
                    String(currentCampaign.id)
            );

        });

    if(available.length === 0){

        availableCharacters.innerHTML = `

            <div class="characters-empty">

                Nenhuma ficha disponível.
                Crie uma ficha antes de entrar
                como jogador.

            </div>

        `;

        return;

    }

    available.forEach(character => {

        const card =
            createCharacterChoiceCard(
                character
            );

        availableCharacters.appendChild(
            card
        );

    });

}


/*==========================================================
=              CARD DE PERSONAGEM
==========================================================*/

function createCharacterChoiceCard(character){

    const card =
        document.createElement("button");

    card.type = "button";

    card.className =
        "character-choice-card";

    const photo =
        document.createElement("div");

    photo.className =
        "character-choice-photo";

    if(character.photo){

        const img =
            document.createElement("img");

        img.src = character.photo;

        img.alt =
            character.name || "Personagem";

        photo.appendChild(img);

    }
    else{

        photo.textContent = "👤";

    }

    const info =
        document.createElement("div");

    info.className =
        "character-choice-info";

    info.innerHTML = `

        <strong>
            ${escapeMesaLoginHTML(
                character.name || "Sem nome"
            )}
        </strong>

        <span>
            ${
                character.origin
                    ? escapeMesaLoginHTML(
                        character.origin
                    )
                    : "Sem origem"
            }
        </span>

        <span>
            Nível ${Number(
                character.level
            ) || 1}
        </span>

    `;

    const arrow =
        document.createElement("div");

    arrow.className =
        "character-choice-arrow";

    arrow.textContent = "→";

    card.append(
        photo,
        info,
        arrow
    );

    card.addEventListener(
        "click",
        () => selectCharacter(
            character
        )
    );

    return card;

}


/*==========================================================
=              ESCOLHER PERSONAGEM
==========================================================*/

function selectCharacter(character){

    const maxPlayers =
        Number(
            currentCampaign.maxPlayers
        ) || 4;

    if(
        !Array.isArray(
            currentCampaign.players
        )
    ){

        currentCampaign.players = [];

    }

    const alreadyExists =
        currentCampaign.players.some(
            player =>
                String(player.characterId) ===
                String(character.id)
        );

    if(
        !alreadyExists &&
        currentCampaign.players.length >=
            maxPlayers
    ){

        showLoginMessage(
            "Campanha cheia",
            "O limite de jogadores desta campanha já foi atingido."
        );

        return;

    }

    connectCharacterToCurrentCampaign(
        character
    );

    enterMesaAsPlayer(
        character
    );

}


/*==========================================================
=              VINCULAR FICHA À CAMPANHA
==========================================================*/

function connectCharacterToCurrentCampaign(
    character
){

    character.campaignId =
        currentCampaign.id;

    character.updatedAt =
        Date.now();

    const characterIndex =
        characters.findIndex(
            item => item.id === character.id
        );

    if(characterIndex !== -1){

        characters[characterIndex] =
            character;

    }

    localStorage.setItem(
        CHARACTER_STORAGE,
        JSON.stringify(characters)
    );

    if(
        !Array.isArray(
            currentCampaign.players
        )
    ){

        currentCampaign.players = [];

    }

    const existingPlayer =
        currentCampaign.players.find(
            player =>
                String(player.characterId) ===
                String(character.id)
        );

    if(!existingPlayer){

        currentCampaign.players.push({

            characterId:
                character.id,

            name:
                character.name,

            photo:
                character.photo || "",

            position:null

        });

    }
    else{

        existingPlayer.name =
            character.name;

        existingPlayer.photo =
            character.photo || "";

    }

    saveCurrentCampaign();

}


/*==========================================================
=              ENTRAR COMO JOGADOR
==========================================================*/

function enterMesaAsPlayer(character){

    localStorage.setItem(
        "ordem_table_role",
        "player"
    );

    localStorage.setItem(
        "ordem_table_character",
        character.id
    );

    localStorage.setItem(
        "ordem_current_campaign",
        currentCampaign.id
    );

    window.location.href =
        `mesa.html?campaign=${encodeURIComponent(
            currentCampaign.id
        )}&role=player&character=${encodeURIComponent(
            character.id
        )}`;

}


/*==========================================================
=              SALVAR CAMPANHA
==========================================================*/

function saveCurrentCampaign(){

    const index =
        campaigns.findIndex(
            campaign =>
                String(campaign.id) ===
                String(currentCampaign.id)
        );

    if(index === -1){

        return;

    }

    currentCampaign.updatedAt =
        Date.now();

    campaigns[index] =
        currentCampaign;

    localStorage.setItem(
        CAMPAIGN_STORAGE,
        JSON.stringify(campaigns)
    );

}


/*==========================================================
=              MENSAGEM DO SISTEMA
==========================================================*/

function showLoginMessage(
    title,
    text
){

    const modal =
        document.getElementById(
            "loginMessage"
        );

    const titleElement =
        document.getElementById(
            "loginMessageTitle"
        );

    const textElement =
        document.getElementById(
            "loginMessageText"
        );

    const closeButton =
        document.getElementById(
            "closeLoginMessage"
        );

    if(
        !modal ||
        !titleElement ||
        !textElement ||
        !closeButton
    ){

        return;

    }

    titleElement.textContent =
        title;

    textElement.textContent =
        text;

    modal.classList.remove(
        "hidden"
    );

    const newButton =
        closeButton.cloneNode(true);

    closeButton.replaceWith(
        newButton
    );

    newButton.addEventListener(
        "click",
        () => {

            modal.classList.add(
                "hidden"
            );

        }
    );

}


/*==========================================================
=              ESC FECHA PAINÉIS
==========================================================*/

document.addEventListener(
    "keydown",
    event => {

        if(event.key !== "Escape"){

            return;

        }

        if(
            masterPasswordPanel &&
            !masterPasswordPanel
                .classList
                .contains("hidden")
        ){

            closeMasterPanel();

            return;

        }

        if(
            playerCharacterPanel &&
            !playerCharacterPanel
                .classList
                .contains("hidden")
        ){

            closePlayerPanel();

        }

    }
);


/*==========================================================
=              PROTEÇÃO HTML
==========================================================*/

function escapeMesaLoginHTML(value){

    return String(value)
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");

}
