/*==========================================================
=                  CAMPANHAS.JS - PARTE 1
==========================================================*/

document.addEventListener("DOMContentLoaded", () => {

    initCampaigns();

});


/*==========================================================
=                  ESTADO
==========================================================*/

let campaigns = [];

const STORAGE_KEY = "ordem_campaigns";


/*==========================================================
=                  ELEMENTOS
==========================================================*/

const campaignList = document.getElementById("campaignList");

const createCampaignButton = document.getElementById("createCampaign");

const searchCampaignInput = document.getElementById("searchCampaign");

const createCampaignModal = document.getElementById("createCampaignModal");

const campaignNameInput = document.getElementById("campaignName");

const campaignDescriptionInput = document.getElementById("campaignDescription");

const campaignBackgroundInput = document.getElementById("campaignBackground");

const saveCampaignButton = document.getElementById("saveCampaign");

const cancelCampaignButton = document.getElementById("cancelCampaign");

const joinCampaignButton =
    document.getElementById(
        "joinCampaign"
    );


/*==========================================================
=                  INICIALIZAÇÃO
==========================================================*/

function initCampaigns(){

    loadCampaigns();

    renderCampaigns();

    bindCampaignEvents();
    const invite=new URLSearchParams(location.search).get("convite");
    if(invite){
        openJoinCampaignModal();
        document.getElementById("inviteCodeInput").value=invite.slice(0,24);
    }

}


/*==========================================================
=                  EVENTOS
==========================================================*/

function bindCampaignEvents(){

    if(createCampaignButton){

        createCampaignButton.addEventListener(
            "click",
            openCreateCampaign
        );

    }

    if(cancelCampaignButton){

        cancelCampaignButton.addEventListener(
            "click",
            closeCreateCampaign
        );

    }

    if(saveCampaignButton){

        saveCampaignButton.addEventListener(
            "click",
            createCampaign
        );

    }

    if(searchCampaignInput){

        searchCampaignInput.addEventListener(
            "input",
            event => {

                renderCampaigns(
                    event.target.value
                );

            }
        );

    }

    if(createCampaignModal){

        createCampaignModal.addEventListener(
            "click",
            event => {

                if(event.target === createCampaignModal){

                    closeCreateCampaign();

                }

            }
        );

    }

    if(joinCampaignButton){

    joinCampaignButton.addEventListener(
        "click",
        openJoinCampaignModal
    );

}

}


/*==========================================================
=                  ABRIR MODAL
==========================================================*/

function openCreateCampaign(){

    if(!createCampaignModal){

        return;

    }

    clearCampaignForm();

    createCampaignModal.classList.remove("hidden");

    setTimeout(() => {

        campaignNameInput?.focus();

    }, 50);

}


/*==========================================================
=                  FECHAR MODAL
==========================================================*/

function closeCreateCampaign(){

    if(!createCampaignModal){

        return;

    }

    createCampaignModal.classList.add("hidden");

    clearCampaignForm();

}


/*==========================================================
=                  LIMPAR FORMULÁRIO
==========================================================*/

function clearCampaignForm(){

    if(campaignNameInput){

        campaignNameInput.value = "";

    }

    if(campaignDescriptionInput){

        campaignDescriptionInput.value = "";

    }

    if(campaignBackgroundInput){

        campaignBackgroundInput.value = "";

    }

}


/*==========================================================
=                  CRIAR CAMPANHA
==========================================================*/

async function createCampaign(){

    const name =
        campaignNameInput?.value.trim() || "";

    const description =
        campaignDescriptionInput?.value.trim() || "";

    if(!name){

        alert("Digite um nome para a campanha.");

        campaignNameInput?.focus();

        return;

    }

    let background = "";

    const file =
        campaignBackgroundInput?.files?.[0];

    if(file){

        background = await fileToBase64(file);

    }

    const campaign = {

        id:createId(),

        name,

        description,

        background,

        players:[],

        enemies:[],

        npcs:[],

        scene:"",

        music:"",

        createdAt:Date.now(),

        updatedAt:Date.now()

    };

    campaigns.unshift(campaign);

    saveCampaigns();

    renderCampaigns();

    closeCreateCampaign();

}


/*==========================================================
=                  GERAR ID
==========================================================*/

function createId(){

    if(
        typeof crypto !== "undefined" &&
        crypto.randomUUID
    ){

        return crypto.randomUUID();

    }

    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2)
    );

}


/*==========================================================
=                  IMAGEM -> BASE64
==========================================================*/

function fileToBase64(file){

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = () => {

            resolve(reader.result);

        };

        reader.onerror = reject;

        reader.readAsDataURL(file);

    });

}


/*==========================================================
=                  SALVAR
==========================================================*/

function saveCampaigns(){

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(campaigns)
    );

}


/*==========================================================
=                  CARREGAR
==========================================================*/

function loadCampaigns(){

    try{

        const saved =
            localStorage.getItem(STORAGE_KEY);

        campaigns = saved
            ? JSON.parse(saved)
            : [];

        if(!Array.isArray(campaigns)){

            campaigns = [];

        }

    }
    catch(error){

        console.error(
            "Erro ao carregar campanhas:",
            error
        );

        campaigns = [];

    }

}

/*==========================================================
=              CAMPANHAS.JS - PARTE 2
==========================================================*/

/*==========================================================
=                  RENDERIZAR CAMPANHAS
==========================================================*/

function renderCampaigns(search = ""){

    if(!campaignList){

        return;

    }

    const term = search
        .trim()
        .toLowerCase();

    const filteredCampaigns = campaigns.filter(campaign => {

        const name =
            campaign.name?.toLowerCase() || "";

        const description =
            campaign.description?.toLowerCase() || "";

        return (
            name.includes(term) ||
            description.includes(term)
        );

    });

    campaignList.innerHTML = "";

    if(filteredCampaigns.length === 0){

        renderEmptyCampaigns(term);

        return;

    }

    filteredCampaigns.forEach(campaign => {

        const card =
            createCampaignCard(campaign);

        campaignList.appendChild(card);

    });

}


/*==========================================================
=                  ESTADO VAZIO
==========================================================*/

function renderEmptyCampaigns(searchTerm = ""){

    const empty = document.createElement("div");

    empty.className = "empty-campaigns";

    if(searchTerm){

        empty.innerHTML = `
            <div class="icon">🔎</div>

            <h3>Nenhuma campanha encontrada</h3>

            <p>
                Nenhuma campanha corresponde à pesquisa
                "<strong>${escapeHTML(searchTerm)}</strong>".
            </p>
        `;

    }
    else{

        empty.innerHTML = `
            <div class="icon">🗡</div>

            <h3>Nenhuma campanha criada</h3>

            <p>
                Crie sua primeira campanha para começar.
            </p>
        `;

    }

    campaignList.appendChild(empty);

}


/*==========================================================
=                  CRIAR CARD
==========================================================*/

function createCampaignCard(campaign){

    const card =
        document.createElement("article");

    card.className = "campaign-card";

    card.dataset.campaignId = campaign.id;

    const cover =
        document.createElement("div");

    cover.className = "campaign-cover";

    if(campaign.background){

        cover.style.backgroundImage =
            `url("${campaign.background}")`;

        cover.style.backgroundSize = "cover";

        cover.style.backgroundPosition = "center";

        cover.textContent = "";

    }
    else{

        cover.textContent = "🗡";

    }

    const info =
        document.createElement("div");

    info.className = "campaign-info";

    const playersCount =
        Array.isArray(campaign.players)
            ? campaign.players.length
            : 0;

    info.innerHTML = `
        <h2>${escapeHTML(campaign.name)}</h2>

        <p>
            ${playersCount}
            ${playersCount === 1 ? "Jogador" : "Jogadores"}
        </p>

        ${
            campaign.description
                ? `<p>${escapeHTML(campaign.description)}</p>`
                : `<p>Sem descrição.</p>`
        }
    `;

    const buttons =
        document.createElement("div");

    buttons.className = "campaign-buttons";

    const enterButton =
        document.createElement("button");

    enterButton.className = "enter-button";

    enterButton.textContent = "Entrar";

    enterButton.addEventListener(
        "click",
        () => enterCampaign(campaign.id)
    );

    const editButton =
        document.createElement("button");

    editButton.className = "edit-button";

    editButton.textContent = "Editar";

    editButton.addEventListener(
        "click",
        () => editCampaign(campaign.id)
    );

    const deleteButton =
        document.createElement("button");

    deleteButton.className = "delete-button";

    deleteButton.textContent = "Excluir";

    deleteButton.addEventListener(
        "click",
        () => deleteCampaign(campaign.id)
    );

    buttons.append(
        enterButton,
        ...(campaign.sharedGuest?[]:[editButton]),
        deleteButton
    );
    if(campaign.sharedGuest){
        deleteButton.textContent="Remover deste navegador";
        const notice=document.createElement("p");
        notice.textContent="Convite aceito • combate entre navegadores ainda não sincronizado.";
        info.append(notice);
    }

    card.append(
        cover,
        info,
        buttons
    );

    return card;

}


/*==========================================================
=                  ENTRAR NA CAMPANHA
==========================================================*/

function enterCampaign(id){

    const campaign =
        campaigns.find(
            campaign => campaign.id === id
        );

    if(!campaign){

        return;

    }

    localStorage.setItem(
        "ordem_current_campaign",
        id
    );

    window.location.href =
        `mesa-login.html?campaign=${encodeURIComponent(id)}`;

}


/*==========================================================
=                  EDITAR CAMPANHA
==========================================================*/

async function editCampaign(id){

    const campaign =
        campaigns.find(
            campaign => campaign.id === id
        );

    if(!campaign){

        return;

    }

    const newName = prompt(
        "Nome da campanha:",
        campaign.name
    );

    if(newName === null){

        return;

    }

    const name =
        newName.trim();

    if(!name){

        alert(
            "O nome da campanha não pode ficar vazio."
        );

        return;

    }

    const newDescription = prompt(
        "Descrição da campanha:",
        campaign.description || ""
    );

    if(newDescription === null){

        return;

    }

    campaign.name = name;

    campaign.description =
        newDescription.trim();

    campaign.updatedAt =
        Date.now();

    saveCampaigns();

    renderCampaigns(
        searchCampaignInput?.value || ""
    );

}


/*==========================================================
=                  EXCLUIR CAMPANHA
==========================================================*/

function deleteCampaign(id){

    const campaign =
        campaigns.find(
            campaign => campaign.id === id
        );

    if(!campaign){

        return;

    }

    const confirmed = confirm(
        `Excluir a campanha "${campaign.name}"?\n\nEssa ação não poderá ser desfeita.`
    );

    if(!confirmed){

        return;

    }

    campaigns = campaigns.filter(
        campaign => campaign.id !== id
    );

    saveCampaigns();

    renderCampaigns(
        searchCampaignInput?.value || ""
    );

}


/*==========================================================
=                  PROTEÇÃO HTML
==========================================================*/

function escapeHTML(value){

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/*==========================================================
=                  ESC FECHA MODAL
==========================================================*/

document.addEventListener(
    "keydown",
    event => {

        if(
            event.key === "Escape" &&
            createCampaignModal &&
            !createCampaignModal.classList.contains("hidden")
        ){

            closeCreateCampaign();

        }

    }
);


/*==========================================================
=                  API GLOBAL
==========================================================*/

window.CampaignAPI = {

    getAll(){

        return [...campaigns];

    },

    getById(id){

        return campaigns.find(
            campaign => campaign.id === id
        ) || null;

    },

    reload(){

        loadCampaigns();

        renderCampaigns();

    }

};

/*==========================================================
=              CAMPANHAS.JS - PARTE 3
==========================================================*/




/*==========================================================
=          BOTÃO NOVA CAMPANHA
==========================================================*/

function openCreateCampaign(){

    window.location.href = "editor-campanha.html";

}


/*==========================================================
=              CÓDIGO DE CONVITE
==========================================================*/

function createInviteCode(){

    const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for(let i=0;i<8;i++){

        const index =
            Math.floor(
                Math.random() * chars.length
            );

        code += chars[index];

    }

    return code;

}


/*==========================================================
=              GARANTIR CÓDIGOS ANTIGOS
==========================================================*/

function ensureInviteCodes(){

    let changed = false;

    campaigns.forEach(campaign => {

        if(!campaign.inviteCode){

            campaign.inviteCode =
                createInviteCode();

            changed = true;

        }

    });

    if(changed){

        saveCampaigns();

    }

}


/*==========================================================
=              COPIAR CONVITE
==========================================================*/

async function copyInviteCode(id){

    const campaign =
        campaigns.find(
            campaign => campaign.id === id
        );

    if(!campaign){

        return;

    }

    let invite;
    try{invite=await window.ECO_CAMPAIGN_INVITES.publish(campaign);}
    catch(error){alert(window.ECO_CAMPAIGN_INVITES.errorText(error));return;}
    loadCampaigns();
    const savedCampaign=campaigns.find(item=>item.id===id);
    if(savedCampaign){savedCampaign.sharedCampaignId=invite.sharedId;saveCampaigns();}
    // The clipboard may require a fresh click after the network request.
    const dialog=document.createElement("dialog");
    dialog.className="campaign-invite-dialog";
    dialog.setAttribute("aria-labelledby","campaignInviteTitle");
    const eyebrow=document.createElement("span");eyebrow.className="campaign-invite-label";eyebrow.textContent="Convite";
    const title=document.createElement("h2");title.id="campaignInviteTitle";title.textContent="Convite de jogador";
    const description=document.createElement("p");description.textContent="Compartilhe o link ou o código para convidar alguém para "+campaign.name+".";
    const code=document.createElement("p");code.className="campaign-invite-code";code.textContent=invite.code;code.setAttribute("aria-label","Código do convite");
    const link=document.createElement("input");link.readOnly=true;link.value=invite.url;link.setAttribute("aria-label","Link do convite");
    const actions=document.createElement("div");actions.className="campaign-invite-actions";
    const copy=document.createElement("button");copy.className="campaign-invite-primary";copy.textContent="Copiar link";
    const close=document.createElement("button");close.textContent="Fechar";
    const status=document.createElement("span");status.className="campaign-invite-status";status.setAttribute("role","status");
    actions.append(close,copy);
    dialog.append(eyebrow,title,description,code,link,actions,status);
    document.body.append(dialog);
    close.onclick=()=>dialog.close();
    copy.onclick=async()=>{try{await navigator.clipboard.writeText(invite.url);status.textContent="Link copiado."; }catch{link.select();status.textContent="Link selecionado. Copie para compartilhar."; }};
    dialog.addEventListener("close",()=>dialog.remove(),{once:true});
    dialog.showModal();

}


/*==========================================================
=              ADICIONAR BOTÃO CONVITE
==========================================================*/

const originalCreateCampaignCard =
    createCampaignCard;

createCampaignCard = function(campaign){

    const card =
        originalCreateCampaignCard(campaign);

    const buttons =
        card.querySelector(
            ".campaign-buttons"
        );

    if(buttons&&!campaign.sharedGuest){

        const inviteButton =
            document.createElement("button");

        inviteButton.className =
            "invite-button";

        inviteButton.textContent =
            "Convidar";

        inviteButton.addEventListener(
            "click",
            () => copyInviteCode(
                campaign.id
            )
        );

        buttons.insertBefore(
            inviteButton,
            buttons.lastElementChild
        );

    }

    return card;

};


/*==========================================================
=              CSS DOS NOVOS BOTÕES
==========================================================*/

function injectCampaignStyles(){

    if(
        document.getElementById(
            "campaignDynamicStyles"
        )
    ){

        return;

    }

    const style =
        document.createElement("style");

    style.id =
        "campaignDynamicStyles";

    style.textContent = `

        .invite-button{

            background:#202029;

            color:white;

            border:1px solid var(--border);

        }

        .invite-button:hover{

            border-color:var(--primary);

            background:#292934;

        }

        .delete-button{

            background:#561A1A;

            color:#FFD6D6;

            border:1px solid #772929;

        }

        .delete-button:hover{

            background:#7B2525;

            border-color:#A33B3B;

        }

    `;

    document.head.appendChild(style);

}


/*==========================================================
=              CAMPANHA ATUAL
==========================================================*/

function getCurrentCampaignId(){

    const params =
        new URLSearchParams(
            window.location.search
        );

    return (
        params.get("campaign") ||
        localStorage.getItem(
            "ordem_current_campaign"
        )
    );

}


/*==========================================================
=              BUSCAR PELO CÓDIGO
==========================================================*/

function getCampaignByInviteCode(code){

    if(!code){

        return null;

    }

    const normalized =
        code.trim().toUpperCase();

    return campaigns.find(
        campaign =>
            campaign.inviteCode ===
            normalized
    ) || null;

}


/*==========================================================
=              ENTRAR POR CONVITE
==========================================================*/

function joinCampaignByCode(code){

    const campaign =
        getCampaignByInviteCode(code);

    if(!campaign){

        return false;

    }

    localStorage.setItem(
        "ordem_current_campaign",
        campaign.id
    );

    window.location.href =
        `mesa.html?campaign=${encodeURIComponent(
            campaign.id
        )}`;

    return true;

}


/*==========================================================
=              ATUALIZAR CAMPANHA
==========================================================*/

function updateCampaign(id, changes){

    const index =
        campaigns.findIndex(
            campaign =>
                campaign.id === id
        );

    if(index === -1){

        return false;

    }

    campaigns[index] = {

        ...campaigns[index],

        ...changes,

        id:campaigns[index].id,

        updatedAt:Date.now()

    };

    saveCampaigns();

    renderCampaigns(
        searchCampaignInput?.value || ""
    );

    return true;

}


/*==========================================================
=              INICIALIZAÇÃO EXTRA
==========================================================*/

document.addEventListener(
    "DOMContentLoaded",
    () => {

        ensureInviteCodes();

        injectCampaignStyles();

    }
);


/*==========================================================
=              API COMPLETA
==========================================================*/

window.CampaignAPI = {

    getAll(){

        return [...campaigns];

    },

    getById(id){

        return campaigns.find(
            campaign =>
                campaign.id === id
        ) || null;

    },

    getByInviteCode(code){

        return getCampaignByInviteCode(
            code
        );

    },

    getCurrentId(){

        return getCurrentCampaignId();

    },

    joinByCode(code){

        return joinCampaignByCode(
            code
        );

    },

    update(id,changes){

        return updateCampaign(
            id,
            changes
        );

    },

    remove(id){

        deleteCampaign(id);

    },

    reload(){

        loadCampaigns();

        ensureInviteCodes();

        renderCampaigns();

    }

};

/*==========================================================
=          ENTRAR COM CÓDIGO
==========================================================*/

function openJoinCampaignModal(){

    closeJoinCampaignModal();

    const overlay =
        document.createElement("div");

    overlay.id =
        "joinCampaignModal";

    overlay.className =
        "game-modal";

    overlay.innerHTML = `

        <div class="game-message join-campaign-box">

            <div class="game-message-icon">
                ⛓
            </div>

            <span class="game-modal-label">
                CONVITE
            </span>

            <h2>
                Entrar em Campanha
            </h2>

            <p>
                Digite o código enviado pelo mestre.
            </p>

            <input
                type="text"
                id="inviteCodeInput"
                maxlength="24"
                autocomplete="off"
                placeholder="XXXXXXXX">

            <div class="join-campaign-buttons">

                <button
                    type="button"
                    class="primary-button"
                    id="confirmJoinCampaign">

                    Entrar

                </button>

                <button
                    type="button"
                    class="secondary-button"
                    id="cancelJoinCampaign">

                    Cancelar

                </button>

            </div>

            <div
                id="inviteCodeError"
                class="invite-error">
            </div>

        </div>

    `;

    document.body.appendChild(
        overlay
    );

    const input =
        overlay.querySelector(
            "#inviteCodeInput"
        );

    input.focus();

    input.addEventListener(
        "input",
        () => {

            input.value =
                input.value
                    .toUpperCase()
                    .replace(
                        /[^A-Z0-9]/g,
                        ""
                    );

        }
    );

    overlay
        .querySelector(
            "#confirmJoinCampaign"
        )
        .addEventListener(
            "click",
            () => {

                tryJoinCampaign(
                    input.value
                );

            }
        );

    overlay
        .querySelector(
            "#cancelJoinCampaign"
        )
        .addEventListener(
            "click",
            closeJoinCampaignModal
        );

    input.addEventListener(
        "keydown",
        event => {

            if(event.key === "Enter"){

                tryJoinCampaign(
                    input.value
                );

            }

        }
    );

}


/*==========================================================
=          TENTAR ENTRAR
==========================================================*/

async function tryJoinCampaign(code){

    const normalized =
        code
            .trim()
            .toUpperCase();

    const error =
        document.getElementById(
            "inviteCodeError"
        );

    if(!normalized){

        if(error){

            error.textContent =
                "Digite um código de convite.";

        }

        return;

    }

    if(window.ECO_CAMPAIGN_INVITES.validCode(normalized)){
        const button=document.getElementById("confirmJoinCampaign");
        if(button?.disabled)return;
        if(button)button.disabled=true;
        if(error)error.textContent="Consultando convite…";
        try{
            const shared=await window.ECO_CAMPAIGN_INVITES.accept(normalized);
            loadCampaigns();
            const existing=campaigns.find(item=>item.id===shared.id);
            if(existing)Object.assign(existing,{...shared,players:existing.players||[]});
            else campaigns.push(shared);
            saveCampaigns();
            enterCampaign(shared.id);
        }catch(cause){
            if(error)error.textContent=window.ECO_CAMPAIGN_INVITES.errorText(cause);
        }finally{if(button)button.disabled=false;}
        return;
    }
    const campaign=getCampaignByInviteCode(normalized);

    if(!campaign){

        if(error){

            error.textContent =
                "Este código não foi encontrado neste navegador. Peça ao mestre um link de convite online.";

        }

        return;

    }

    enterCampaign(campaign.id);

}


/*==========================================================
=          FECHAR ENTRADA POR CÓDIGO
==========================================================*/

function closeJoinCampaignModal(){

    document
        .getElementById(
            "joinCampaignModal"
        )
        ?.remove();

}
