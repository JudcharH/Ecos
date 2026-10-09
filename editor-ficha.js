/*==========================================================
=                 EDITOR-FICHA.JS - PARTE 1
==========================================================*/

document.addEventListener(
    "DOMContentLoaded",
    initCharacterEditor

    
);


/*==========================================================
=                       STORAGE
==========================================================*/

const CHARACTER_EDITOR_STORAGE =
    "ordem_characters";

const CAMPAIGN_EDITOR_STORAGE =
    "ordem_campaigns";



/*==========================================================
=                       ESTADO
==========================================================*/

let editorCharacters = [];

let editorCampaigns = [];

let editingCharacter = null;

let characterPhotoBase64 = "";

let characterWoundedPhotoBase64 = "";

const COMBAT_MEDIA_FIELDS={idle:"combatMediaIdle",attack:"combatMediaAttack",strongAttack:"combatMediaStrongAttack",hit:"combatMediaHit",dodge:"combatMediaDodge",block:"combatMediaBlock",heal:"combatMediaHeal",ability:"combatMediaAbility",ritual:"combatMediaRitual",move:"combatMediaMove",defeat:"combatMediaDefeat"};

function collectCharacterCombatMedia(previous={}){
    const media={...previous};
    Object.entries(COMBAT_MEDIA_FIELDS).forEach(([key,id])=>{media[key]=document.getElementById(id)?.value.trim()||""});
    media.scale=Math.max(40,Math.min(200,Number(document.getElementById("combatMediaScale")?.value)||100));
    media.offsetX=Math.max(-200,Math.min(200,Number(document.getElementById("combatMediaOffsetX")?.value)||0));
    media.offsetY=Math.max(-200,Math.min(200,Number(document.getElementById("combatMediaOffsetY")?.value)||0));
    media.flip=Boolean(document.getElementById("combatMediaFlip")?.checked);
    return media;
}

function loadCharacterCombatMedia(media={}){
    Object.entries(COMBAT_MEDIA_FIELDS).forEach(([key,id])=>{const input=document.getElementById(id);if(input)input.value=media?.[key]||""});
    const scale=document.getElementById("combatMediaScale"),offsetX=document.getElementById("combatMediaOffsetX"),offsetY=document.getElementById("combatMediaOffsetY"),flip=document.getElementById("combatMediaFlip");
    if(scale)scale.value=Number(media?.scale)||100;
    if(offsetX)offsetX.value=Number(media?.offsetX)||0;
    if(offsetY)offsetY.value=Number(media?.offsetY)||0;
    if(flip)flip.checked=Boolean(media?.flip);
}
function collectCharacterRestMedia(previous={}){return{...previous,image:document.getElementById("restMediaImage")?.value.trim()||"",scale:Math.max(40,Math.min(200,Number(document.getElementById("restMediaScale")?.value)||100)),flip:Boolean(document.getElementById("restMediaFlip")?.checked)}}
function loadCharacterRestMedia(media={}){const image=document.getElementById("restMediaImage"),scale=document.getElementById("restMediaScale"),flip=document.getElementById("restMediaFlip");if(image)image.value=media?.image||"";if(scale)scale.value=Number(media?.scale)||100;if(flip)flip.checked=Boolean(media?.flip)}

let linkedCampaignId = null;

let characterBodyState = {};

let characterAbilitiesState = [];

let characterAssimilationsState = [];

let characterConditionsState = [];

let characterSkillsState = [];

let characterSkillPointsPurchased = 0;

let selectedBodyPart = null;

let characterBodyDescriptions = {};


/*==========================================================
=                       ELEMENTOS
==========================================================*/

const characterEditorName =
    document.getElementById(
        "characterEditorName"
    );

const characterLevel =
    document.getElementById(
        "characterLevel"
    );

const characterOrigin =
    document.getElementById(
        "characterOrigin"
    );

const characterAge =
    document.getElementById(
        "characterAge"
    );

    /*==========================================================
=                    SISTEMA DE RPG
==========================================================*/

const characterSystem =
    document.getElementById(
        "characterSystem"
    );


const characterSystemPreview =
    document.getElementById(
        "characterSystemPreview"
    );


const characterSystemIcon =
    document.getElementById(
        "characterSystemIcon"
    );


const characterSystemName =
    document.getElementById(
        "characterSystemName"
    );


const characterSystemDescription =
    document.getElementById(
        "characterSystemDescription"
    );


const characterSystemWarning =
    document.getElementById(
        "characterSystemWarning"
    );

    const characterDefenseBase =
    document.getElementById(
        "characterDefenseBase"
    );

const characterDefenseBonus =
    document.getElementById(
        "characterDefenseBonus"
    );

const characterDefense =
    document.getElementById(
        "characterDefense"
    );

    /*==========================================================
=              REDUÇÃO DE DANO
==========================================================*/

const characterRDBase =
    document.getElementById(
        "characterRDBase"
    );


const characterRDBonus =
    document.getElementById(
        "characterRDBonus"
    );


const characterRD =
    document.getElementById(
        "characterRD"
    );


/*==========================================================
=                       FOTO
==========================================================*/

const characterPhotoInput =
    document.getElementById(
        "characterPhotoInput"
    );

const characterPhotoPreview =
    document.querySelector(
        ".character-photo-preview"
    );

    const characterWoundedPhotoInput =
    document.getElementById(
        "characterWoundedPhotoInput"
    );


/*==========================================================
=                       VIDA
==========================================================*/

const lifeMode =
    document.getElementById(
        "lifeMode"
    );

const classicLifeSystem =
    document.getElementById(
        "classicLifeSystem"
    );

const bodyLifeSystem =
    document.getElementById(
        "bodyLifeSystem"
    );


/*==========================================================
=                       PV
==========================================================*/

const characterPV =
    document.getElementById(
        "characterPV"
    );

const characterPVMax =
    document.getElementById(
        "characterPVMax"
    );

const characterPVTemp =
    document.getElementById(
        "characterPVTemp"
    );

const characterHeart = document.getElementById("characterHeart");
const characterHeartMax = document.getElementById("characterHeartMax");


/*==========================================================
=                       PD
==========================================================*/

const characterPD =
    document.getElementById(
        "characterPD"
    );

const characterPDMax =
    document.getElementById(
        "characterPDMax"
    );

const characterPDTemp =
    document.getElementById(
        "characterPDTemp"
    );


/*==========================================================
=                       PA
==========================================================*/

const characterPA =
    document.getElementById(
        "characterPA"
    );

const characterPAMax =
    document.getElementById(
        "characterPAMax"
    );


/*==========================================================
=                 PARTES DO CORPO
==========================================================*/

const bodyHead =
    document.getElementById(
        "bodyHead"
    );

const bodyChest =
    document.getElementById(
        "bodyChest"
    );


const bodyLeftArm =
    document.getElementById(
        "bodyLeftArm"
    );

const bodyRightArm =
    document.getElementById(
        "bodyRightArm"
    );

const bodyLeftLeg =
    document.getElementById(
        "bodyLeftLeg"
    );

const bodyRightLeg =
    document.getElementById(
        "bodyRightLeg"
    );

const bodyTemporaryPV =
    document.getElementById(
        "bodyTemporaryPV"
    );


/*==========================================================
=                       ATRIBUTOS
==========================================================*/

const attributeFOR =
    document.getElementById(
        "attributeFOR"
    );

const attributeAGI =
    document.getElementById(
        "attributeAGI"
    );

const attributeINT =
    document.getElementById(
        "attributeINT"
    );

const attributeVIG =
    document.getElementById(
        "attributeVIG"
    );

const attributePRE =
    document.getElementById(
        "attributePRE"
    );


/*==========================================================
=                 VÍNCULO COM CAMPANHA
==========================================================*/

const characterCampaignCode =
    document.getElementById(
        "characterCampaignCode"
    );

const linkCharacterCampaign =
    document.getElementById(
        "linkCharacterCampaign"
    );

const unlinkCharacterCampaign =
    document.getElementById(
        "unlinkCharacterCampaign"
    );

const linkedCampaignInfo =
    document.getElementById(
        "linkedCampaignInfo"
    );

const linkedCampaignName =
    document.getElementById(
        "linkedCampaignName"
    );


/*==========================================================
=                       SALVAR
==========================================================*/

const saveCharacterEditor =
    document.getElementById(
        "saveCharacterEditor"
    );


/*==========================================================
=                       MODAL
==========================================================*/

const characterEditorMessage =
    document.getElementById(
        "characterEditorMessage"
    );

const characterEditorMessageTitle =
    document.getElementById(
        "characterEditorMessageTitle"
    );

const characterEditorMessageText =
    document.getElementById(
        "characterEditorMessageText"
    );

const characterEditorMessageIcon =
    document.getElementById(
        "characterEditorMessageIcon"
    );

const closeCharacterEditorMessage =
    document.getElementById(
        "closeCharacterEditorMessage"
    );


/*==========================================================
=                 INICIALIZAÇÃO
==========================================================*/

function initCharacterEditor(){

    loadCharacterEditorStorage();

    populateCharacterSystemSelect();

    discoverEditingCharacter();

    bindCharacterEditorEvents();

    updateCharacterSystemPreview();

    bindAutomaticStatEvents();

    bindCurrentValueLimits();

    bindBodyConditionEvents();

    bindBodyMapEvents();


if(!editingCharacter){

    characterAbilitiesState = [];

    characterAssimilationsState = [];

    characterConditionsState = [];

    characterSkillPointsPurchased = 0;

    initializeBodyStates();

    initializeCharacterSkills();

    calculateAutomaticStats();

    renderAbilityEditorList();

    renderAssimilationEditorList();

    renderConditionEditorList();

    renderSkillPointsSummary();

    calculateCharacterDefense();

    calculateCharacterDamageReduction();

}


    updateLifeSystem();

}

/*==========================================================
=              PREENCHER SISTEMAS DA FICHA
==========================================================*/

function populateCharacterSystemSelect(){

    if(
        !characterSystem ||
        typeof getAllRPGSystems !==
        "function"
    ){

        return;

    }


    characterSystem.innerHTML =
        "";


    getAllRPGSystems()
        .forEach(system => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                system.id;


            option.textContent =
                system.enabled
                    ? system.name
                    : `${system.name} — Em desenvolvimento`;


            option.disabled =
                system.enabled !== true;


            characterSystem.appendChild(
                option
            );

        });


    characterSystem.value =
        DEFAULT_RPG_SYSTEM_ID;

}

/*==========================================================
=              PREVIEW DO SISTEMA DA FICHA
==========================================================*/

function updateCharacterSystemPreview(){

    if(!characterSystem){

        return;

    }


    const system =
        getRPGSystem(
            characterSystem.value
        );


    if(characterSystemIcon){

        characterSystemIcon.textContent =
            system.icon || "◇";


        characterSystemIcon.style.color =
            system.color || "";

    }


    if(characterSystemName){

        characterSystemName.textContent =
            system.name;

    }


    if(characterSystemDescription){

        characterSystemDescription.textContent =
            system.description || "";

    }


    characterSystemPreview
        ?.style
        .setProperty(
            "--system-color",
            system.color ||
            "#7B2CFF"
        );

}


/*==========================================================
=                 CARREGAR STORAGE
==========================================================*/

function loadCharacterEditorStorage(){

    try{

        const savedCharacters =
            JSON.parse(
                localStorage.getItem(
                    CHARACTER_EDITOR_STORAGE
                )
            );

        editorCharacters =
            Array.isArray(savedCharacters)
                ? savedCharacters
                : [];

                let charactersChanged =
    false;


editorCharacters.forEach(character => {

    if(!character.systemId){

        character.systemId =
            DEFAULT_RPG_SYSTEM_ID;

        charactersChanged =
            true;

        return;

    }


    const normalizedSystemId =
        normalizeRPGSystemId(
            character.systemId
        );


    if(
        normalizedSystemId !==
        character.systemId
    ){

        character.systemId =
            normalizedSystemId;

        charactersChanged =
            true;

    }

});


if(charactersChanged){

    localStorage.setItem(
        CHARACTER_EDITOR_STORAGE,
        JSON.stringify(
            editorCharacters
        )
    );

}

    }

    
    catch(error){

        console.error(
            "Erro ao carregar fichas:",
            error
        );

        editorCharacters = [];

    }


    try{

        const savedCampaigns =
            JSON.parse(
                localStorage.getItem(
                    CAMPAIGN_EDITOR_STORAGE
                )
            );

        editorCampaigns =
            Array.isArray(savedCampaigns)
                ? savedCampaigns
                : [];

                let campaignsChanged =
    false;


editorCampaigns.forEach(campaign => {

    if(!campaign.systemId){

        campaign.systemId =
            DEFAULT_RPG_SYSTEM_ID;

        campaignsChanged =
            true;

        return;

    }


    const normalizedSystemId =
        normalizeRPGSystemId(
            campaign.systemId
        );


    if(
        normalizedSystemId !==
        campaign.systemId
    ){

        campaign.systemId =
            normalizedSystemId;

        campaignsChanged =
            true;

    }

});


if(campaignsChanged){

    localStorage.setItem(
        CAMPAIGN_EDITOR_STORAGE,
        JSON.stringify(
            editorCampaigns
        )
    );

}

    }
    catch(error){

        console.error(
            "Erro ao carregar campanhas:",
            error
        );

        editorCampaigns = [];

    }

}


/*==========================================================
=                 DESCOBRIR SE ESTÁ EDITANDO
==========================================================*/

function discoverEditingCharacter(){

    const params =
        new URLSearchParams(
            window.location.search
        );

    const characterId =
        params.get("id") ||
        params.get("character");


    if(!characterId){

        return;

    }


    editingCharacter =
        editorCharacters.find(
            character =>
                character.id ===
                characterId
        ) || null;


    if(!editingCharacter){

        return;

    }


    loadCharacterIntoEditor();

}

/*==========================================================
=                       EVENTOS
==========================================================*/

function bindCharacterEditorEvents(){

    characterSystem?.addEventListener(
    "change",
    () => {

        updateCharacterSystemPreview();

    }
);

    lifeMode?.addEventListener(
        "change",
        updateLifeSystem
    );


    characterPhotoInput?.addEventListener(
        "change",
        handleCharacterPhoto
    );

    characterWoundedPhotoInput?.addEventListener(
    "change",
    handleCharacterWoundedPhoto
);


    linkCharacterCampaign?.addEventListener(
        "click",
        linkCharacterToCampaignByCode
    );


    unlinkCharacterCampaign?.addEventListener(
        "click",
        unlinkCharacterFromCampaign
    );


    saveCharacterEditor?.addEventListener(
        "click",
        saveCharacter
    );


    characterCampaignCode?.addEventListener(
        "input",
        () => {

            characterCampaignCode.value =
                characterCampaignCode.value
                    .toUpperCase()
                    .replace(
                        /[^A-Z0-9]/g,
                        ""
                    );

        }
    );


    characterCampaignCode?.addEventListener(
        "keydown",
        event => {

            if(event.key === "Enter"){

                linkCharacterToCampaignByCode();

            }

        }
    );


}


/*==========================================================
=              TROCAR SISTEMA DE VIDA
==========================================================*/

function updateLifeSystem(){

    if(
        !lifeMode ||
        !classicLifeSystem ||
        !bodyLifeSystem
    ){

        return;

    }

    const mode =
        lifeMode.value;


    if(mode === "body"){

        classicLifeSystem.classList.add(
            "hidden"
        );

        bodyLifeSystem.classList.remove(
            "hidden"
        );

    }
    else{

        bodyLifeSystem.classList.add(
            "hidden"
        );

        classicLifeSystem.classList.remove(
            "hidden"
        );

    }

}


/*==========================================================
=                       FOTO
==========================================================*/
/*==========================================================
=              CARREGAR FOTO NORMAL
==========================================================*/

async function handleCharacterPhoto(){

    const file =
        characterPhotoInput
            ?.files?.[0];


    if(!file){

        return;

    }


    try{

        characterPhotoBase64 =
            await characterFileToBase64(
                file
            );


        renderCharacterPhoto();

    }
    catch(error){

        console.error(
            "Erro ao carregar foto:",
            error
        );


        showCharacterEditorMessage(
            "Erro na imagem",
            "Não foi possível carregar a foto selecionada."
        );

    }

}
/*==========================================================
=              CARREGAR FOTO MACHUCADO
==========================================================*/

async function handleCharacterWoundedPhoto(){

    const file =
        characterWoundedPhotoInput
            ?.files?.[0];


    if(!file){

        return;

    }


    try{

        characterWoundedPhotoBase64 =
            await characterFileToBase64(
                file
            );


        /*
            Se o personagem já estiver Machucado,
            mostramos imediatamente.
        */

        renderCharacterPhoto();


        showCharacterEditorMessage(
            "Foto Machucado configurada",
            "A segunda aparência do personagem foi salva temporariamente. Salve a ficha para mantê-la."
        );

    }
    catch(error){

        console.error(
            "Erro ao carregar Foto Machucado:",
            error
        );


        showCharacterEditorMessage(
            "Erro na imagem",
            "Não foi possível carregar a Foto Machucado."
        );

    }

}

/*==========================================================
=              MOSTRAR FOTO DO PERSONAGEM
==========================================================*/

function renderCharacterPhoto(){

    if(!characterPhotoPreview){

        return;

    }


    const isWounded =
        hasCharacterCondition(
            "machucado"
        );


    /*
        Se estiver Machucado e existir
        uma foto especial, usa ela.

        Caso contrário, usa a normal.
    */

    const selectedPhoto =
        (
            isWounded &&
            characterWoundedPhotoBase64
        )
            ? characterWoundedPhotoBase64
            : characterPhotoBase64;


    /*
        Nenhuma foto configurada.
        Mostra novamente o placeholder.
    */

    if(!selectedPhoto){

        characterPhotoPreview.innerHTML = `

            <div class="character-photo-placeholder">

                <span>
                    👤
                </span>

                <strong>
                    Adicionar Foto
                </strong>

                <small>
                    PNG, JPG ou WEBP
                </small>

            </div>

        `;


        characterPhotoPreview
            .classList
            .remove(
                "showing-wounded-photo"
            );


        return;

    }


    characterPhotoPreview.innerHTML =
        "";


    const image =
        document.createElement(
            "img"
        );


    image.src =
        selectedPhoto;


    image.alt =
        characterEditorName?.value ||
        "Personagem";


    characterPhotoPreview.appendChild(
        image
    );


    if(
        isWounded &&
        characterWoundedPhotoBase64
    ){

        characterPhotoPreview
            .classList
            .add(
                "showing-wounded-photo"
            );

    }
    else{

        characterPhotoPreview
            .classList
            .remove(
                "showing-wounded-photo"
            );

    }

}

/*==========================================================
=          IMAGEM OTIMIZADA PARA A FICHA
==========================================================*/

function characterFileToBase64(
    file
){

    return new Promise(
        (resolve,reject) => {

            if(!file){

                reject(
                    new Error(
                        "Arquivo não informado."
                    )
                );

                return;

            }


            /*
                Máximo de 5 MB no arquivo de entrada.
                Mesmo assim ele será comprimido abaixo.
            */

            const maxInputSize =
                5 * 1024 * 1024;


            if(
                file.size >
                maxInputSize
            ){

                reject(
                    new Error(
                        "A imagem é muito grande. Use uma imagem de até 5 MB."
                    )
                );

                return;

            }


            const reader =
                new FileReader();


            reader.onload =
                event => {

                    const image =
                        new Image();


                    image.onload =
                        () => {

                            /*
                                A foto da ficha não precisa
                                ter 3000px ou 5000px.

                                700px já é suficiente.
                            */

                            const maxWidth =
                                700;

                            const maxHeight =
                                900;


                            let width =
                                image.width;

                            let height =
                                image.height;


                            const scale =
                                Math.min(
                                    1,
                                    maxWidth / width,
                                    maxHeight / height
                                );


                            width =
                                Math.round(
                                    width * scale
                                );


                            height =
                                Math.round(
                                    height * scale
                                );


                            const canvas =
                                document.createElement(
                                    "canvas"
                                );


                            canvas.width =
                                width;

                            canvas.height =
                                height;


                            const context =
                                canvas.getContext(
                                    "2d"
                                );


                            if(!context){

                                reject(
                                    new Error(
                                        "Não foi possível processar a imagem."
                                    )
                                );

                                return;

                            }


                            context.drawImage(
                                image,
                                0,
                                0,
                                width,
                                height
                            );


                            /*
                                WEBP economiza muito espaço.
                            */

                            let quality = 0.78;
                            let compressed = canvas.toDataURL("image/webp",quality);

                            /*
                                Mantém cada arte pequena o bastante para que
                                foto normal + machucada não impeçam a ficha de
                                ser salva no armazenamento do navegador.
                            */
                            for(let attempt=0;attempt<5&&compressed.length>180000;attempt++){
                                quality=Math.max(0.5,quality-0.07);
                                const factor=Math.pow(0.84,attempt+1);
                                const resized=document.createElement("canvas");
                                resized.width=Math.max(1,Math.round(width*factor));
                                resized.height=Math.max(1,Math.round(height*factor));
                                resized.getContext("2d")?.drawImage(image,0,0,resized.width,resized.height);
                                compressed=resized.toDataURL("image/webp",quality);
                            }

                            resolve(compressed);

                        };


                    image.onerror =
                        () => {

                            reject(
                                new Error(
                                    "A imagem selecionada é inválida."
                                )
                            );

                        };


                    image.src =
                        event.target.result;

                };


            reader.onerror =
                () => {

                    reject(
                        new Error(
                            "Erro ao ler a imagem."
                        )
                    );

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


/*==========================================================
=              VINCULAR PELO CÓDIGO
==========================================================*/

function linkCharacterToCampaignByCode(){

    const code =
        characterCampaignCode
            ?.value
            .trim()
            .toUpperCase() || "";

    if(!code){

        showCharacterEditorMessage(
            "Código necessário",
            "Digite o código de convite da campanha."
        );

        characterCampaignCode?.focus();

        return;

    }


    const campaign =
        editorCampaigns.find(
            item =>
                String(
                    item.inviteCode || ""
                ).toUpperCase() ===
                code
        );


    if(!campaign){

        showCharacterEditorMessage(
            "Campanha não encontrada",
            "Não existe uma campanha com esse código neste navegador."
        );

        return;

    }

    const characterSystemId =
    normalizeRPGSystemId(
        characterSystem?.value
    );


const campaignSystemId =
    normalizeRPGSystemId(
        campaign.systemId
    );


if(
    !areRPGSystemsCompatible(
        characterSystemId,
        campaignSystemId
    )
){

    showCharacterEditorMessage(
        "Sistema incompatível",
        `A campanha utiliza ${getRPGSystem(campaignSystemId).name}, mas esta ficha utiliza ${getRPGSystem(characterSystemId).name}.`
    );

    return;

}


    const maxPlayers =
        Number(
            campaign.maxPlayers
        ) || 6;

    const players =
        Array.isArray(
            campaign.players
        )
            ? campaign.players
            : [];


    const characterId =
        editingCharacter?.id;


    const alreadyLinked =
        characterId
            ? players.some(
                player =>
                    player.characterId ===
                    characterId
            )
            : false;


    if(
        !alreadyLinked &&
        players.length >= maxPlayers
    ){

        showCharacterEditorMessage(
            "Campanha cheia",
            "Essa campanha atingiu o limite máximo de jogadores."
        );

        return;

    }


    linkedCampaignId =
        campaign.id;


    if(linkedCampaignName){

        linkedCampaignName.textContent =
            campaign.name;

    }


    linkedCampaignInfo
        ?.classList
        .remove("hidden");


    showCharacterEditorMessage(
        "Campanha encontrada",
        `A ficha será vinculada à campanha "${campaign.name}" quando for salva.`
    );

    if(characterSystem){

    characterSystem.disabled =
        true;

}


characterSystemWarning
    ?.classList
    .remove(
        "hidden"
    );

}


/*==========================================================
=              REMOVER VÍNCULO
==========================================================*/

function unlinkCharacterFromCampaign(){

    linkedCampaignId = null;

    if(characterSystem){

    characterSystem.disabled =
        false;

}


characterSystemWarning
    ?.classList
    .add(
        "hidden"
    );


    linkedCampaignInfo
        ?.classList
        .add("hidden");


    if(characterCampaignCode){

        characterCampaignCode.value =
            "";

    }

}


/*==========================================================
=                 GERAR ID
==========================================================*/

function createCharacterEditorId(){

    if(
        typeof crypto !== "undefined" &&
        crypto.randomUUID
    ){

        return crypto.randomUUID();

    }

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .slice(2)
    );

}


/*==========================================================
=                 SALVAR FICHA
==========================================================*/

function saveCharacter(){

    const name =
        characterEditorName
            ?.value
            .trim() || "";

            const selectedSystemId =
    normalizeRPGSystemId(
        characterSystem?.value
    );


const selectedSystem =
    getRPGSystem(
        selectedSystemId
    );


    if(!name){

        showCharacterEditorMessage(
            "Nome obrigatório",
            "Digite o nome do personagem antes de salvar."
        );

        characterEditorName?.focus();

        return;

    }


    const characterId =
        editingCharacter?.id ||
        createCharacterEditorId();


    const oldCharacter =
        editingCharacter || {};


    const characterData = {

        ...oldCharacter,

        id:

        
            characterId,

            systemId:
    selectedSystemId,

        name:
            name,

        level:
            Number(
                characterLevel?.value
            ) || 1,

        origin:
            characterOrigin?.value.trim() ||
            "",

        age:
            Number(
                characterAge?.value
            ) || 0,

        photo:
            characterPhotoBase64 ||
            oldCharacter.photo ||
            "",

        woundedPhoto:
    characterWoundedPhotoBase64 ||
    oldCharacter.woundedPhoto ||
    "",

        combatMedia:
            collectCharacterCombatMedia(
                oldCharacter.combatMedia || {}
            ),

        restMedia:
            collectCharacterRestMedia(
                oldCharacter.restMedia || {}
            ),

        lifeMode:
            lifeMode?.value ||
            "classic",

        campaignId:
            linkedCampaignId ||
            null,

            bodyState:
    structuredCloneSafe(
        characterBodyState
    ),

    bodyDescriptions:
    structuredCloneSafe(
        characterBodyDescriptions
    ),

    skillPointsPurchased:
    characterSkillPointsPurchased,

    defense:{

    base:
        Number(
            characterDefenseBase?.value
        ) || 0,

    bonus:
        Number(
            characterDefenseBonus?.value
        ) || 0,

    total:
        Number(
            characterDefense?.value
        ) || 0

},

damageReduction:{

    base:
        Math.max(
            0,
            Number(
                characterRDBase?.value
            ) || 0
        ),

    automaticBonus:
        Math.max(
            0,
            Number(
                characterRDBonus?.value
            ) || 0
        ),

    total:
        Math.max(
            0,
            Number(
                characterRD?.value
            ) || 0
        )

},


        /*==================================================
=                       STATUS
==================================================*/

        status:{

            ...(oldCharacter.status || {}),

            pvAtual:
                Number(
                    characterPV?.value
                ) || 0,

            pvMax:
                Number(
                    characterPVMax?.value
                ) || 0,

            pvTemp:
                Number(
                    characterPVTemp?.value
                ) || 0,

            pdAtual:
                Number(
                    characterPD?.value
                ) || 0,

            pdMax:
                Number(
                    characterPDMax?.value
                ) || 0,

            pdTemp:
                Number(
                    characterPDTemp?.value
                ) || 0,

            paAtual:
                Number(
                    characterPA?.value
                ) || 0,

            paMax:
                Number(
                    characterPAMax?.value
                ) || 0

        },

        heart:{
            ...(oldCharacter.heart || {}),
            current:Math.max(0,Number(characterHeart?.value)||0),
            max:Math.max(0,Number(characterHeartMax?.value)||0)
        },


        /*==================================================
=                       CORPO
==================================================*/

        body:{

            ...(oldCharacter.body || {}),

            head:
                Number(
                    bodyHead?.value
                ) || 0,

            chest:
                Number(
                    bodyChest?.value
                ) || 0,


            leftArm:
                Number(
                    bodyLeftArm?.value
                ) || 0,

            rightArm:
                Number(
                    bodyRightArm?.value
                ) || 0,

            leftLeg:
                Number(
                    bodyLeftLeg?.value
                ) || 0,

            rightLeg:
                Number(
                    bodyRightLeg?.value
                ) || 0,

            temporaryPV:
                Number(
                    bodyTemporaryPV?.value
                ) || 0

        },


        /*==================================================
=                       ATRIBUTOS
==================================================*/

        attributes:{

            ...(oldCharacter.attributes || {}),

            for:
                Number(
                    attributeFOR?.value
                ) || 1,

            agi:
                Number(
                    attributeAGI?.value
                ) || 1,

            int:
                Number(
                    attributeINT?.value
                ) || 1,

            vig:
                Number(
                    attributeVIG?.value
                ) || 1,

            pre:
                Number(
                    attributePRE?.value
                ) || 1

        },


        /*==================================================
=            DADOS QUE VAMOS IMPLEMENTAR DEPOIS
==================================================*/

skills:
    structuredCloneSafe(
        characterSkillsState
    ),

abilities:
    structuredCloneSafe(
        characterAbilitiesState
    ),

assimilations:
    structuredCloneSafe(
        characterAssimilationsState
    ),

        inventory:
            oldCharacter.inventory || [],

conditions:
    structuredCloneSafe(
        characterConditionsState
    ),

        grimoire:
            oldCharacter.grimoire || [],

        attacks:
            collectQuickAttacks(
                oldCharacter.attacks || []
            ),


        createdAt:
            oldCharacter.createdAt ||
            Date.now(),

        updatedAt:
            Date.now()

    };

    if(linkedCampaignId){

    const linkedCampaign =
        editorCampaigns.find(
            campaign =>
                campaign.id ===
                linkedCampaignId
        );


    if(linkedCampaign){

        const campaignSystemId =
            normalizeRPGSystemId(
                linkedCampaign.systemId
            );


        if(
            !areRPGSystemsCompatible(
                selectedSystemId,
                campaignSystemId
            )
        ){

            showCharacterEditorMessage(
                "Sistemas incompatíveis",
                `Esta ficha utiliza ${selectedSystem.name}, mas a campanha utiliza ${getRPGSystem(campaignSystemId).name}.`
            );

            return;

        }

    }

}


    const preparedCharacterData =
        typeof window.migrateSystemBaseV2Character === "function"
            ? window.migrateSystemBaseV2Character(characterData)
            : characterData;

    preparedCharacterData.inventory=Array.isArray(preparedCharacterData.inventory)?preparedCharacterData.inventory:[];
    if(!preparedCharacterData.inventory.some(item=>String(item.id||item.name||"").toLowerCase()==="desarmado")){
        preparedCharacterData.inventory.push({id:"desarmado",name:"Desarmado",kind:"melee",space:0,noSpace:true,weight:0,damage:"1d4+Corpo",damageType:"impacto",skill:"luta",description:"Ataque natural sem ocupar espaço no inventário."});
    }
    [preparedCharacterData.attacks,preparedCharacterData.quickAttacks,preparedCharacterData.ataquesRapidos].filter(Array.isArray).forEach(list=>{if(String(list[0]?.damage||"").trim()==="55")list[0].damage="";});

    saveCharacterToStorage(
        preparedCharacterData
    );

}

/*==========================================================
=              EDITOR-FICHA.JS - PARTE 2
==========================================================*/

/*==========================================================
=              COLETAR ATAQUES RÁPIDOS
==========================================================*/

function collectQuickAttacks(oldAttacks = []){

    const attacks = [];

    for(let index = 1; index <= 4; index++){

        const name =
            document.getElementById(
                `attack${index}Name`
            )?.value.trim() || "";

        const roll =
            document.getElementById(
                `attack${index}Roll`
            )?.value.trim() || "";

        const damage =
            document.getElementById(
                `attack${index}Damage`
            )?.value.trim() || "";

        const skill =
            document.getElementById(
                `attack${index}Skill`
            )?.value.trim() || "";

        const damageType =
            document.getElementById(
                `attack${index}DamageType`
            )?.value.trim() || "";

        const oldAttack =
            oldAttacks[index - 1] || {};

        if(
            !name &&
            !roll &&
            !damage
        ){

            continue;

        }

        attacks.push({

            id:
                oldAttack.id ||
                createCharacterEditorId(),

            name,

            roll,

            damage,

            skill:
                skill || oldAttack.skill || "",

            damageType:
                damageType || oldAttack.damageType || oldAttack.tipoDano || "impacto",

            linkedWeaponId:
                String(name).trim().toLowerCase() === "desarmado"
                    ? "desarmado"
                    : oldAttack.linkedWeaponId || "",

            icon:
                oldAttack.icon || ""

        });

    }

    return attacks;

}


/*==========================================================
=              SALVAR FICHA NO STORAGE
==========================================================*/

function saveCharacterToStorage(
    characterData
){

    const index =
        editorCharacters.findIndex(
            character =>
                character.id ===
                characterData.id
        );

    if(index === -1){

        editorCharacters.unshift(
            characterData
        );

    }
    else{

        editorCharacters[index] =
            characterData;

    }

    try{

    const serialized =
        JSON.stringify(
            editorCharacters
        );


    localStorage.setItem(
        CHARACTER_EDITOR_STORAGE,
        serialized
    );

}
catch(error){

    console.error(
        "Erro ao salvar ficha:",
        error
    );


    /*
        Desfaz a alteração em memória
        caso o storage não aceite.
    */

    loadCharacterEditorStorage();


    if(
        error?.name ===
        "QuotaExceededError"
    ){

        showCharacterEditorMessage(
            "Armazenamento cheio",
            "A ficha ficou grande demais para o armazenamento do navegador. Tente utilizar imagens menores."
        );

    }
    else{

        showCharacterEditorMessage(
            "Erro ao salvar",
            "Não foi possível salvar a ficha. Consulte o console para mais informações."
        );

    }


    return false;

    

}


    syncCharacterCampaign(
        characterData
    );


    editingCharacter =
        characterData;


    showCharacterEditorMessage(
        "Ficha salva",
        "A ficha foi salva com sucesso.",
        true
    );

    return true;

}


/*==========================================================
=              SINCRONIZAR COM CAMPANHA
==========================================================*/

function syncCharacterCampaign(
    character
){

    let changed = false;


    /*
        Primeiro removemos a ficha de qualquer campanha
        antiga onde ela ainda esteja cadastrada.
    */

    editorCampaigns.forEach(
        campaign => {

            if(
                !Array.isArray(
                    campaign.players
                )
            ){

                campaign.players = [];

            }

            const before =
                campaign.players.length;

            campaign.players =
                campaign.players.filter(
                    player =>
                        player.characterId !==
                        character.id
                );

            if(
                before !==
                campaign.players.length
            ){

                changed = true;

            }

        }
    );


    /*
        Se a ficha estiver vinculada a uma campanha,
        adicionamos novamente nela.
    */

    if(character.campaignId){

        const campaign =
            editorCampaigns.find(
                item =>
                    item.id ===
                    character.campaignId
            );

        if(campaign){

            if(
                !Array.isArray(
                    campaign.players
                )
            ){

                campaign.players = [];

            }

            const maxPlayers =
                Number(
                    campaign.maxPlayers
                ) || 6;


            if(
                campaign.players.length <
                maxPlayers
            ){

                campaign.players.push({

                    characterId:
                        character.id,

                    name:
                        character.name,

                    photo:
                        character.photo || "",

                    position:null

                });

                changed = true;

            }
            else{

                /*
                    Segurança caso a campanha tenha lotado
                    entre a vinculação e o salvamento.
                */

                character.campaignId = null;

                linkedCampaignId = null;

                showCharacterEditorMessage(
                    "Campanha cheia",
                    "A campanha atingiu o limite de jogadores. A ficha foi salva sem vínculo."
                );

            }

        }

    }


    if(changed){

        localStorage.setItem(
            CAMPAIGN_EDITOR_STORAGE,
            JSON.stringify(
                editorCampaigns
            )
        );

    }

}


/*==========================================================
=              CARREGAR FICHA NO EDITOR
==========================================================*/

function loadCharacterIntoEditor(){

    if(!editingCharacter){

        return;

    }


    if(characterEditorName){

        characterEditorName.value =
            editingCharacter.name || "";

    }

    if(characterLevel){

        characterLevel.value =
            editingCharacter.level || 1;

    }

    if(characterOrigin){

        characterOrigin.value =
            editingCharacter.origin || "";

    }

    if(characterAge){

        characterAge.value =
            editingCharacter.age || "";

    }

    const editingSystemId =
    normalizeRPGSystemId(
        editingCharacter.systemId
    );


if(characterSystem){

    characterSystem.value =
        editingSystemId;

}


updateCharacterSystemPreview();

const hasLinkedCampaign =
    Boolean(
        editingCharacter.campaignId
    );


if(characterSystem){

    characterSystem.disabled =
        hasLinkedCampaign;

}


characterSystemWarning
    ?.classList
    .toggle(
        "hidden",
        !hasLinkedCampaign
    );

    if(selectedBodyPart){

    renderBodyPartInfo(
        selectedBodyPart
    );

}

    characterAbilitiesState =
    structuredCloneSafe(
        editingCharacter.abilities ||
        []
    );

characterAssimilationsState =
    structuredCloneSafe(
        editingCharacter.assimilations ||
        []
    );

    /* Atualiza nomes e regras antigas sem cobrar novamente o custo permanente. */
    characterAssimilationsState=characterAssimilationsState.map(saved=>{
        const canonicalId=window.ECO_BLOOD_ASSIMILATION_ALIASES?.[saved.id]||saved.id;
        const definition=DEFAULT_ASSIMILATIONS.find(item=>item.id===canonicalId);
        return definition?{...saved,id:definition.id,name:definition.name,description:definition.description,activationCost:structuredCloneSafe(definition.activationCost),activationType:definition.activationType,effects:structuredCloneSafe(definition.effects||{}),active:definition.activationType==="Passiva"?true:Boolean(saved.active)}:saved;
    });

    characterConditionsState =
    structuredCloneSafe(
        editingCharacter.conditions ||
        []
    );

    characterBodyDescriptions =
    structuredCloneSafe(
        editingCharacter
            .bodyDescriptions ||
        {}
    );

    characterPhotoBase64 =
    editingCharacter.photo || "";


characterWoundedPhotoBase64 =
    editingCharacter.woundedPhoto || "";

loadCharacterCombatMedia(
    editingCharacter.combatMedia || {}
);
loadCharacterRestMedia(
    editingCharacter.restMedia || {}
);


renderCharacterPhoto();

characterSkillPointsPurchased =
    Number(
        editingCharacter
            .skillPointsPurchased
    ) || 0;

    const defense =
    editingCharacter.defense || {};


if(characterDefenseBonus){

    characterDefenseBonus.value =
        Number(
            defense.bonus
        ) || 0;

}

const damageReduction =
    editingCharacter.damageReduction || {};


if(characterRDBase){

    characterRDBase.value =
        Math.max(
            0,
            Number(
                damageReduction.base
            ) || 0
        );

}


if(characterRDBonus){

    characterRDBonus.value =
        Math.max(
            0,
            Number(
                damageReduction.automaticBonus
            ) || 0
        );

}


if(characterRD){

    characterRD.value =
        Math.max(
            0,
            Number(
                damageReduction.total
            ) || 0
        );

}


calculateCharacterDamageReduction();



renderConditionEditorList();

renderAbilityEditorList();

renderAssimilationEditorList();

[
    bodyHead,
    bodyChest,
    bodyLeftArm,
    bodyRightArm,
    bodyLeftLeg,
    bodyRightLeg

].forEach(input => {

    if(input){

        input.dataset.initialized =
            "true";

    }

});




    /*======================================================
=                       FOTO
=======================================================*/

characterPhotoBase64 =
    editingCharacter.photo || "";


characterWoundedPhotoBase64 =
    editingCharacter.woundedPhoto || "";


renderCharacterPhoto();


    /*======================================================
=                 SISTEMA DE VIDA
=======================================================*/

    if(lifeMode){

        lifeMode.value =
            editingCharacter.lifeMode ||
            "classic";

    }


    const status =
        editingCharacter.status || {};


    if(characterPV){

        characterPV.value =
            status.pvAtual ?? 0;

    }

    if(characterPVMax){

        characterPVMax.value =
            status.pvMax ?? 0;

    }

    if(characterPVTemp){

        characterPVTemp.value =
            status.pvTemp ?? 0;

    }

    const heart=editingCharacter.heart||{};
    if(characterHeart)characterHeart.value=heart.current??heart.max??"";
    if(characterHeartMax)characterHeartMax.value=heart.max??"";


    if(characterPD){

        characterPD.value =
            status.pdAtual ?? 0;

    }

    if(characterPDMax){

        characterPDMax.value =
            status.pdMax ?? 0;

    }

    if(characterPDTemp){

        characterPDTemp.value =
            status.pdTemp ?? 0;

    }


    if(characterPA){

        characterPA.value =
            status.paAtual ?? 0;

    }

    if(characterPAMax){

        characterPAMax.value =
            status.paMax ?? 0;

    }


    /*======================================================
=                       CORPO
=======================================================*/

    const body =
        editingCharacter.body || {};

        characterBodyState =
    structuredCloneSafe(
        editingCharacter.bodyState ||
        {}
    );


    if(bodyHead){

        bodyHead.value =
            body.head ?? 0;

    }

    if(bodyChest){

        bodyChest.value =
            body.chest ?? 0;

    }


    if(bodyLeftArm){

        bodyLeftArm.value =
            body.leftArm ?? 0;

    }

    if(bodyRightArm){

        bodyRightArm.value =
            body.rightArm ?? 0;

    }

    if(bodyLeftLeg){

        bodyLeftLeg.value =
            body.leftLeg ?? 0;

    }

    if(bodyRightLeg){

        bodyRightLeg.value =
            body.rightLeg ?? 0;

    }

    if(bodyTemporaryPV){

        bodyTemporaryPV.value =
            body.temporaryPV ?? 0;

    }

    [
    bodyHead,
    bodyChest,
    bodyLeftArm,
    bodyRightArm,
    bodyLeftLeg,
    bodyRightLeg

].forEach(input=>{

    if(input){

        input.dataset.initialized =
            "true";

    }

});


    /*======================================================
=                       ATRIBUTOS
=======================================================*/

    const attributes =
        editingCharacter.attributes || {};


    if(attributeFOR){

        attributeFOR.value =
            attributes.for ?? 1;

    }

    if(attributeAGI){

        attributeAGI.value =
            attributes.agi ?? 1;

    }

    if(attributeINT){

        attributeINT.value =
            attributes.int ?? 1;

    }

    if(attributeVIG){

        attributeVIG.value =
            attributes.vig ?? 1;

    }

    if(attributePRE){

        attributePRE.value =
            attributes.pre ?? 1;

    }

    /*======================================================
=              CARREGAR PERÍCIAS
======================================================*/

initializeCharacterSkills();

renderSkillPointsSummary();


    /*======================================================
=                     ATAQUES
=======================================================*/

    loadQuickAttacks(
        editingCharacter.attacks || []
    );


    /*======================================================
=                     CAMPANHA
=======================================================*/

    linkedCampaignId =
        editingCharacter.campaignId ||
        null;


    if(linkedCampaignId){

        const campaign =
            editorCampaigns.find(
                item =>
                    item.id ===
                    linkedCampaignId
            );

        if(campaign){

            if(linkedCampaignName){

                linkedCampaignName.textContent =
                    campaign.name;

            }

            linkedCampaignInfo
                ?.classList
                .remove("hidden");

            if(characterCampaignCode){

                characterCampaignCode.value =
                    campaign.inviteCode || "";

            }

        }

    }

    initializeBodyStates();

calculateAutomaticStats();

    updateLifeSystem();

}


/*==========================================================
=              CARREGAR ATAQUES
==========================================================*/

function loadQuickAttacks(attacks){

    for(let index = 1; index <= 4; index++){

        const attack =
            attacks[index - 1];

        if(!attack){

            continue;

        }

        const name =
            document.getElementById(
                `attack${index}Name`
            );

        const roll =
            document.getElementById(
                `attack${index}Roll`
            );

        const damage =
            document.getElementById(
                `attack${index}Damage`
            );

        const skill =
            document.getElementById(
                `attack${index}Skill`
            );

        const damageType =
            document.getElementById(
                `attack${index}DamageType`
            );


        if(name){

            name.value =
                attack.name || "";

        }

        if(roll){

            roll.value =
                attack.roll || "";

        }

        if(damage){

            damage.value =
                String(attack.damage || "").trim() === "55"
                    ? ""
                    : attack.damage || "";

        }

        if(skill){

            skill.value =
                attack.skill || attack.skillName || attack.testSkill || "";

        }

        if(damageType){

            damageType.value =
                attack.damageType || attack.tipoDano || "impacto";

        }

    }

}


/*==========================================================
=              MENSAGEM DO EDITOR
==========================================================*/

function showCharacterEditorMessage(
    title,
    text,
    redirectAfter = false
){

    if(
        !characterEditorMessage ||
        !characterEditorMessageTitle ||
        !characterEditorMessageText
    ){

        if(redirectAfter){

            window.location.href =
                "ficha.html";

        }

        return;

    }


    characterEditorMessageTitle.textContent =
        title;

    characterEditorMessageText.textContent =
        text;

    if(characterEditorMessageIcon){

        characterEditorMessageIcon.textContent =
            "✓";

    }

    characterEditorMessage
        .classList
        .remove("hidden");


    if(closeCharacterEditorMessage){

        const newButton =
            closeCharacterEditorMessage
                .cloneNode(true);

        closeCharacterEditorMessage
            .replaceWith(
                newButton
            );


        newButton.addEventListener(
            "click",
            () => {

                characterEditorMessage
                    .classList
                    .add("hidden");

                if(redirectAfter){

                    window.location.href =
                        "ficha.html";

                }

            }
        );

    }

}


/*==========================================================
=              ESC FECHA MENSAGEM
==========================================================*/

document.addEventListener(
    "keydown",
    event => {

        if(
            event.key === "Escape" &&
            characterEditorMessage &&
            !characterEditorMessage
                .classList
                .contains("hidden")
        ){

            characterEditorMessage
                .classList
                .add("hidden");

        }

    }
);

/*==========================================================
=              STATUS AUTOMÁTICOS
==========================================================*/

function calculateAutomaticStats(){

    const level =
        Math.max(
            1,
            Number(
                characterLevel?.value
            ) || 1
        );

    const vig =
        Math.max(
            0,
            Number(
                attributeVIG?.value
            ) || 0
        );

    const pre =
        Math.max(
            0,
            Number(
                attributePRE?.value
            ) || 0
        );


    /*======================================================
    =              PV BASE
    ======================================================*/

    const basePV =
        (7 + vig) * level;


    /*======================================================
    =              CUSTOS PERMANENTES DE PV
    ======================================================*/

    const permanentPVCost =
        characterAssimilationsState
            .reduce(
                (total,assimilation) => {

                    if(
                        assimilation
                            .permanentCost
                            ?.type !== "pv"
                    ){

                        return total;

                    }

                    return (
                        total +
                        (
                            Number(
                                assimilation
                                    .permanentCost
                                    .value
                            ) || 0
                        )
                    );

                },
                0
            );


    const calculatedPV =
    lifeMode?.value === "body"
        ? basePV
        : Math.max(
            0,
            basePV - permanentPVCost
        );


    if(characterPVMax){

        characterPVMax.value =
            calculatedPV;

    }


    /*
        Se o máximo diminuir e o atual
        ficar acima dele, ajustamos.

        Se o máximo aumentar, NÃO cura.
    */

    if(
        characterPV &&
        Number(characterPV.value) >
        calculatedPV
    ){

        characterPV.value =
            calculatedPV;

    }


    /*======================================================
    =              PD BASE
    ======================================================*/

    const basePD =
        (4 + pre) * level;


    /*======================================================
    =              CUSTOS PERMANENTES DE PD
    ======================================================*/

    const permanentPDCost =
        characterAbilitiesState
            .reduce(
                (total,ability) => {

                    if(
                        ability
                            .permanentCost
                            ?.type !== "pd"
                    ){

                        return total;

                    }

                    return (
                        total +
                        (
                            Number(
                                ability
                                    .permanentCost
                                    .value
                            ) || 0
                        )
                    );

                },
                0
            );


    const calculatedPD =
        Math.max(
            0,
            basePD -
            permanentPDCost
        );


    if(characterPDMax){

        characterPDMax.value =
            calculatedPD;

    }


    if(
        characterPD &&
        Number(characterPD.value) >
        calculatedPD
    ){

        characterPD.value =
            calculatedPD;

    }


    /*======================================================
    =              PA
    ======================================================*/

let calculatedPA =
    3 +
    Math.floor(
        level / 10
    );


calculatedPA +=
    calculateConditionPAModifier();


calculatedPA =
    Math.max(
        0,
        calculatedPA
    );


/*
    Morrendo não possui PA.
*/

if(
    hasCharacterCondition(
        "morrendo"
    )
){

    calculatedPA = 0;

}

    if(characterPAMax){

        characterPAMax.value =
            calculatedPA;

    }


    if(
        characterPA &&
        Number(characterPA.value) >
        calculatedPA
    ){

        characterPA.value =
            calculatedPA;

    }


calculateBodyMaximums();

calculateCharacterDefense();

calculateCharacterDamageReduction();

}

/*==========================================================
=              CALCULAR REDUÇÃO DE DANO
==========================================================*/

function calculateCharacterDamageReduction(){

    const manualBase =
        Math.max(
            0,
            Number(
                characterRDBase?.value
            ) || 0
        );


    const automaticBonus =
        Math.max(
            0,
            calculateAutomaticDamageReduction()
        );


    const total =
        Math.max(
            0,
            manualBase +
            automaticBonus
        );


    if(characterRDBonus){

        characterRDBonus.value =
            automaticBonus;

    }


    if(characterRD){

        characterRD.value =
            total;

    }

}


/*==========================================================
=              BÔNUS AUTOMÁTICO DE RD
==========================================================*/

function calculateAutomaticDamageReduction(){

    return 0;

}

/*==========================================================
=              BÔNUS AUTOMÁTICO DE RD
==========================================================*/

function calculateAutomaticDamageReduction(){

    /*
        Depois serão analisados:
        habilidades,
        assimilações,
        itens,
        condições e próteses.
    */

    return 0;

}

    



/*==========================================================
=              PV AUTOMÁTICO DAS PARTES
==========================================================*/

function calculateBodyMaximums(){

    /*
        O sistema atual distribui o mesmo total do PV clássico entre os
        seis membros. Impede que a fórmula antiga, baseada em VIG, volte a
        zerar cabeça e torso depois que o módulo V2 já foi carregado.
    */
    if(typeof window.calculateSystemBaseV2Stats === "function"){
        window.calculateSystemBaseV2Stats();
        return;
    }

    const level =
        Math.max(
            1,
            Number(characterLevel?.value) || 1
        );

    const vig =
        Math.max(
            0,
            Number(attributeVIG?.value) || 0
        );

    const vigByLevel =
        vig * level;


   const bodyValues = {

    head:
        Math.max(
            0,
            2 +
            vigByLevel -
            getBodyPartPermanentPVCost(
                "head"
            )
        ),

    chest:
        Math.max(
            0,
            2 +
            vigByLevel -
            getBodyPartPermanentPVCost(
                "chest"
            )
        ),

    leftArm:
        Math.max(
            0,
            1 +
            vigByLevel -
            getBodyPartPermanentPVCost(
                "leftArm"
            )
        ),

    rightArm:
        Math.max(
            0,
            1 +
            vigByLevel -
            getBodyPartPermanentPVCost(
                "rightArm"
            )
        ),

    leftLeg:
        Math.max(
            0,
            1 +
            vigByLevel -
            getBodyPartPermanentPVCost(
                "leftLeg"
            )
        ),

    rightLeg:
        Math.max(
            0,
            1 +
            vigByLevel -
            getBodyPartPermanentPVCost(
                "rightLeg"
            )
        )

};


    updateBodyPartMaximum(
        "head",
        bodyHead,
        bodyValues.head
    );

    updateBodyPartMaximum(
        "chest",
        bodyChest,
        bodyValues.chest
    );

    updateBodyPartMaximum(
        "leftArm",
        bodyLeftArm,
        bodyValues.leftArm
    );

    updateBodyPartMaximum(
        "rightArm",
        bodyRightArm,
        bodyValues.rightArm
    );

    updateBodyPartMaximum(
        "leftLeg",
        bodyLeftLeg,
        bodyValues.leftLeg
    );

    updateBodyPartMaximum(
        "rightLeg",
        bodyRightLeg,
        bodyValues.rightLeg
    );


    renderBodyStates();

}


/*==========================================================
=              ATUALIZAR MÁXIMO DO MEMBRO
==========================================================*/

function updateBodyPartMaximum(
    partName,
    input,
    calculatedMax
){

    if(!input){

        return;

    }

    const state =
        characterBodyState[partName] || {
            type:"natural"
        };


    /*======================================================
    =                    AUSENTE
    ======================================================*/

    if(state.type === "missing"){

        input.dataset.max = "0";

        input.disabled = true;

        input.value = "";

        return;

    }


    /*======================================================
    =                    PRÓTESE
    ======================================================*/

    if(state.type === "prosthetic"){

        const prostheticMax =
            Math.max(
                1,
                Number(state.maxPV) || 1
            );

        input.dataset.max =
            prostheticMax;

        input.disabled =
            false;

        if(state.currentPV === undefined){

            state.currentPV =
                prostheticMax;

        }

        input.value =
            state.currentPV;

        return;

    }


    /*======================================================
    =                    NATURAL
    ======================================================*/

    input.disabled =
        false;

    input.dataset.max =
        calculatedMax;


    /*
        Membro novo começa com o PV cheio.
    */

    if(
        input.dataset.initialized !==
        "true"
    ){

        input.value =
            calculatedMax;

        input.dataset.initialized =
            "true";

        return;

    }


    /*
        Se o máximo diminuir,
        o atual não pode continuar acima dele.
    */

    const current =
        Number(input.value) || 0;

    if(current > calculatedMax){

        input.value =
            calculatedMax;

    }

}


/*==========================================================
=              INSTALAR PRÓTESE
==========================================================*/

function installProsthetic(
    partName
){

    const part =
        detachableBodyParts[partName];

    if(!part){

        return;

    }


    const nameInput =
        document.getElementById(
            "prostheticName"
        );

    const pvInput =
        document.getElementById(
            "prostheticPV"
        );


    const name =
        nameInput?.value.trim() ||
        "Prótese";


    const maxPV =
        Math.max(
            1,
            Number(pvInput?.value) || 1
        );


    characterBodyState[partName] = {

        type:"prosthetic",

        name:name,

        currentPV:maxPV,

        maxPV:maxPV

    };


    part.input.disabled =
        false;

    part.input.value =
        maxPV;

    part.input.dataset.max =
        maxPV;

    part.input.dataset.initialized =
        "true";


    document
        .getElementById(
            "prostheticCreatorModal"
        )
        ?.remove();


    renderBodyStates();


    showCharacterEditorMessage(
        "Prótese instalada",
        `${name} foi instalada em ${part.label} com ${maxPV} PV.`
    );

}

/*==========================================================
=              EVENTOS DOS CÁLCULOS
==========================================================*/

function bindAutomaticStatEvents(){

    characterLevel?.addEventListener(
        "input",
        calculateAutomaticStats
    );

    attributeVIG?.addEventListener(
        "input",
        calculateAutomaticStats
    );

    attributePRE?.addEventListener(
        "input",
        calculateAutomaticStats
    );

    characterLevel?.addEventListener(
    "change",
    renderSkillsEditor
);

attributeINT?.addEventListener(
    "change",
    renderSkillsEditor
);

attributeAGI?.addEventListener(
    "input",
    calculateCharacterDefense
);


attributeAGI?.addEventListener(
    "input",
    calculateCharacterDefense
);


characterDefenseBonus?.addEventListener(
    "input",
    calculateCharacterDefense
);

characterRDBase?.addEventListener(
    "input",
    calculateCharacterDamageReduction
);

}


/*==========================================================
=              LIMITAR PV / PD / PA ATUAL
==========================================================*/

function bindCurrentValueLimits(){

    characterPV?.addEventListener(
        "change",
        () => {

            const max =
                Number(
                    characterPVMax?.value
                ) || 0;

            let current =
                Number(
                    characterPV.value
                ) || 0;

            current =
                Math.max(
                    0,
                    Math.min(
                        current,
                        max
                    )
                );

            characterPV.value =
                current;

        }
    );


    characterPD?.addEventListener(
        "change",
        () => {

            const max =
                Number(
                    characterPDMax?.value
                ) || 0;

            let current =
                Number(
                    characterPD.value
                ) || 0;

            current =
                Math.max(
                    0,
                    Math.min(
                        current,
                        max
                    )
                );

            characterPD.value =
                current;

        }
    );


    characterPA?.addEventListener(
        "change",
        () => {

            const max =
                Number(
                    characterPAMax?.value
                ) || 0;

            let current =
                Number(
                    characterPA.value
                ) || 0;

            current =
                Math.max(
                    0,
                    Math.min(
                        current,
                        max
                    )
                );

            characterPA.value =
                current;

        }
    );

}


/*==========================================================
=              PARTES QUE PODEM SER REMOVIDAS
==========================================================*/

const detachableBodyParts = {

    leftArm:{

        label:"Braço Esquerdo",

        input:bodyLeftArm

    },

    rightArm:{

        label:"Braço Direito",

        input:bodyRightArm

    },

    leftLeg:{

        label:"Perna Esquerda",

        input:bodyLeftLeg

    },

    rightLeg:{

        label:"Perna Direita",

        input:bodyRightLeg

    }

};


/*==========================================================
=              EVENTOS DOS MEMBROS
==========================================================*/

function bindBodyConditionEvents(){

    const parts = [

        {
            name:"head",
            label:"Cabeça",
            input:bodyHead
        },

        {
            name:"chest",
            label:"Torso",
            input:bodyChest
        },

        {
            name:"leftArm",
            label:"Braço Esquerdo",
            input:bodyLeftArm
        },

        {
            name:"rightArm",
            label:"Braço Direito",
            input:bodyRightArm
        },

        {
            name:"leftLeg",
            label:"Perna Esquerda",
            input:bodyLeftLeg
        },

        {
            name:"rightLeg",
            label:"Perna Direita",
            input:bodyRightLeg
        }

    ];


    parts.forEach(part => {

        part.input?.addEventListener(
            "input",
            () => {

                updateBodyPartCondition(
                    part.name,
                    part.label,
                    part.input
                );

            }
        );

    });

}


/*==========================================================
=              INICIALIZAR ESTADOS DO CORPO
==========================================================*/

function initializeBodyStates(){

    const saved =
        editingCharacter?.bodyState;


    if(
        saved &&
        typeof saved === "object"
    ){

        characterBodyState =
            structuredCloneSafe(
                saved
            );

    }


    const parts = [

        "head",
        "chest",
        "leftArm",
        "rightArm",
        "leftLeg",
        "rightLeg"

    ];


    parts.forEach(part => {

        if(
            !characterBodyState[
                part
            ]
        ){

            characterBodyState[
                part
            ] = {

                type:"natural"

            };

        }

    });


    renderBodyStates();

}


/*==========================================================
=              CLONAR OBJETO
==========================================================*/

function structuredCloneSafe(value){

    try{

        return structuredClone(
            value
        );

    }
    catch(error){

        return JSON.parse(
            JSON.stringify(
                value
            )
        );

    }

}


/*==========================================================
=              RENDERIZAR CORPO
==========================================================*/

function renderBodyStates(){

    Object.entries(
        detachableBodyParts
    )
    .forEach(
        ([partName,data]) => {

            renderDetachableBodyPart(
                partName,
                data
            );

        }
    );


    updateSimpleBodyPartVisual(
        bodyHead
    );

    updateSimpleBodyPartVisual(
        bodyChest
    );

}


/*==========================================================
=              CABEÇA / TORSO
==========================================================*/

/*==========================================================
=              CABEÇA / TORSO
==========================================================*/

function updateSimpleBodyPartVisual(
    input
){

    if(!input){

        return;

    }


    const row =
        input.closest(
            ".body-member-row"
        );


    if(!row){

        return;

    }


    let controls =
        row.querySelector(
            ".body-part-controls"
        );


    if(!controls){

        controls =
            document.createElement(
                "div"
            );

        controls.className =
            "body-part-controls";

        row.appendChild(
            controls
        );

    }


    const current =
        Math.max(
            0,
            Number(
                input.value
            ) || 0
        );


    const max =
        Math.max(
            0,
            Number(
                input.dataset.max
            ) || 0
        );


    row.classList.remove(
        "body-part-disabled"
    );


    if(current <= 0){

        row.classList.add(
            "body-part-disabled"
        );

    }


    /*
        Cabeça e Torso possuem
        estado visual, mas NÃO
        botão de desmembrar.
    */

    controls.innerHTML = `

        <span class="body-state-badge natural">

            ${
                current <= 0
                    ? "INUTILIZADO"
                    : `NATURAL • ${current}/${max}`
            }

        </span>

    `;

}


/*==========================================================
=              RENDERIZAR BRAÇO / PERNA
==========================================================*/

function renderDetachableBodyPart(
    partName,
    data
){

    const input =
        data.input;


    if(!input){

        return;

    }


    const row =
        input.closest(
            ".body-member-row"
        );


    if(!row){

        return;

    }


    let controls =
        row.querySelector(
            ".body-part-controls"
        );


    if(!controls){

        controls =
            document.createElement(
                "div"
            );

        controls.className =
            "body-part-controls";

        row.appendChild(
            controls
        );

    }


    const state =
        characterBodyState[
            partName
        ] || {

            type:"natural"

        };


    row.classList.remove(
        "body-part-missing",
        "body-part-prosthetic",
        "body-part-disabled"
    );


    /*======================================================
    =                    AUSENTE
    ======================================================*/

    if(state.type === "missing"){

        row.classList.add(
            "body-part-missing"
        );

        input.disabled =
            true;

        input.value =
            "";

        input.dataset.max =
            "0";


        controls.innerHTML = `

            <span class="body-state-badge missing">

                AUSENTE

            </span>


            <button
                type="button"
                class="body-action-button regenerate"
                data-part="${partName}">

                Regenerar

            </button>


            <button
                type="button"
                class="body-action-button prosthetic"
                data-part="${partName}">

                Instalar Prótese

            </button>

        `;


        bindBodyControlButtons(
            controls
        );

        return;

    }


    /*======================================================
    =                    PRÓTESE
    ======================================================*/

    if(state.type === "prosthetic"){

        row.classList.add(
            "body-part-prosthetic"
        );


        input.disabled =
            false;


        const maxPV =
            Math.max(
                1,
                Number(
                    state.maxPV
                ) || 1
            );


        if(
            state.currentPV ===
            undefined
        ){

            state.currentPV =
                maxPV;

        }


        input.dataset.max =
            maxPV;

        input.dataset.initialized =
            "true";

        input.value =
            state.currentPV;


        controls.innerHTML = `

            <span class="body-state-badge prosthetic">

                ${escapeCharacterEditorHTML(
                    state.name ||
                    "Prótese"
                )}

                • ${Number(
                    state.currentPV
                )}/${maxPV}

            </span>


            <button
                type="button"
                class="body-action-button remove-prosthetic"
                data-part="${partName}">

                Remover

            </button>

        `;


        bindBodyControlButtons(
            controls
        );

        return;

    }


    /*======================================================
    =                    NATURAL
    ======================================================*/

    input.disabled =
        false;


    const current =
        Number(
            input.value
        ) || 0;


    const max =
        Number(
            input.dataset.max
        ) || 0;


    if(current <= 0){

        row.classList.add(
            "body-part-disabled"
        );

    }


    controls.innerHTML = `

        <span class="body-state-badge natural">

            ${
                current <= 0
                    ? "INUTILIZADO"
                    : `NATURAL • ${current}/${max}`
            }

        </span>


        <button
            type="button"
            class="body-action-button dismember"
            data-part="${partName}">

            Desmembrar

        </button>

    `;


    bindBodyControlButtons(
        controls
    );

}


/*==========================================================
=              ESTADO DO MEMBRO
==========================================================*/

function updateBodyPartCondition(
    partName,
    label,
    input
){

    if(!input){

        return;

    }


    const state =
        characterBodyState[
            partName
        ] || {

            type:"natural"

        };


    if(state.type === "missing"){

        return;

    }


    let current =
        Number(
            input.value
        ) || 0;


    const max =
        Math.max(
            0,
            Number(
                input.dataset.max
            ) || 0
        );


    current =
        Math.max(
            0,
            Math.min(
                current,
                max
            )
        );


    input.value =
        current;


    /*======================================================
    =                    PRÓTESE
    ======================================================*/

    if(state.type === "prosthetic"){

        state.currentPV =
            current;


        /*
            Prótese chega a zero:
            é destruída.
        */

        if(current <= 0){

            const prostheticName =
                state.name ||
                "A prótese";


            characterBodyState[
                partName
            ] = {

                type:"missing"

            };


            input.value =
                "";

            input.disabled =
                true;


            renderBodyStates();


            showCharacterEditorMessage(
                "Prótese destruída",
                `${prostheticName} chegou a 0 PV e foi destruída.`
            );


            return;

        }


        renderDetachableBodyPart(
            partName,
            detachableBodyParts[
                partName
            ]
        );

        return;

    }


    /*======================================================
    =                    NATURAL
    ======================================================*/

    const row =
        input.closest(
            ".body-member-row"
        );


    if(current <= 0){

        row?.classList.add(
            "body-part-disabled"
        );

        input.dataset.condition =
            "disabled";

    }
    else{

        row?.classList.remove(
            "body-part-disabled"
        );

        input.dataset.condition =
            "normal";

    }


    if(
        detachableBodyParts[
            partName
        ]
    ){

        renderDetachableBodyPart(
            partName,
            detachableBodyParts[
                partName
            ]
        );

    }

}


/*==========================================================
=              BOTÕES DOS MEMBROS
==========================================================*/

function bindBodyControlButtons(
    container
){

    container
        .querySelector(
            ".dismember"
        )
        ?.addEventListener(
            "click",
            event => {

                dismemberBodyPart(
                    event.currentTarget
                        .dataset.part
                );

            }
        );


    container
        .querySelector(
            ".regenerate"
        )
        ?.addEventListener(
            "click",
            event => {

                regenerateBodyPart(
                    event.currentTarget
                        .dataset.part
                );

            }
        );


    container
        .querySelector(
            ".prosthetic"
        )
        ?.addEventListener(
            "click",
            event => {

                openProstheticCreator(
                    event.currentTarget
                        .dataset.part
                );

            }
        );


    container
        .querySelector(
            ".remove-prosthetic"
        )
        ?.addEventListener(
            "click",
            event => {

                removeProsthetic(
                    event.currentTarget
                        .dataset.part
                );

            }
        );

}


/*==========================================================
=                    DESMEMBRAR
==========================================================*/

function dismemberBodyPart(
    partName
){

    const part =
        detachableBodyParts[
            partName
        ];


    if(!part){

        return;

    }


    characterBodyState[
        partName
    ] = {

        type:"missing"

    };


    part.input.value =
        "";

    part.input.disabled =
        true;

    part.input.dataset.max =
        "0";


    renderBodyStates();


    showCharacterEditorMessage(
        "Membro desmembrado",
        `${part.label} foi removido.`
    );

}


/*==========================================================
=                    REGENERAR
==========================================================*/

function regenerateBodyPart(
    partName
){

    const part =
        detachableBodyParts[
            partName
        ];


    if(!part){

        return;

    }


    const level =
        Math.max(
            1,
            Number(
                characterLevel?.value
            ) || 1
        );


    const vig =
        Math.max(
            0,
            Number(
                attributeVIG?.value
            ) || 0
        );


    /*
        Todos os membros removíveis possuem:

        1 + (VIG × Nível)
    */

  let naturalMax;

if(

    partName === "leftArm" ||

    partName === "rightArm" ||

    partName === "leftLeg" ||

    partName === "rightLeg"

){

    naturalMax =
        1 + (
            vig * level
        );

}
else{

    naturalMax =
        2 + (
            vig * level
        );

}


    characterBodyState[
        partName
    ] = {

        type:"natural"

    };


    part.input.disabled =
        false;

    part.input.dataset.max =
        naturalMax;

    part.input.dataset.initialized =
        "true";

    part.input.value =
        naturalMax;


    renderBodyStates();


    showCharacterEditorMessage(
        "Membro regenerado",
        `${part.label} foi completamente regenerado.`
    );

}


/*==========================================================
=              REMOVER PRÓTESE
==========================================================*/

function removeProsthetic(
    partName
){

    const part =
        detachableBodyParts[
            partName
        ];


    if(!part){

        return;

    }


    characterBodyState[
        partName
    ] = {

        type:"missing"

    };


    part.input.value =
        "";

    part.input.disabled =
        true;

    part.input.dataset.max =
        "0";


    renderBodyStates();


    showCharacterEditorMessage(
        "Prótese removida",
        `${part.label} agora está sem membro.`
    );

}


/*==========================================================
=              MODAL PARA CRIAR PRÓTESE
==========================================================*/

function openProstheticCreator(
    partName
){

    const part =
        detachableBodyParts[
            partName
        ];


    if(!part){

        return;

    }


    document
        .getElementById(
            "prostheticCreatorModal"
        )
        ?.remove();


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "prostheticCreatorModal";

    modal.className =
        "editor-message";


    modal.innerHTML = `

        <div class="prosthetic-editor-modal">

            <span class="section-label">

                PRÓTESE

            </span>


            <h2>

                ${escapeCharacterEditorHTML(
                    part.label
                )}

            </h2>


            <p>

                Defina o nome e o PV máximo da prótese.

            </p>


            <div class="field">

                <label for="prostheticName">

                    Nome

                </label>

                <input
                    type="text"
                    id="prostheticName"
                    maxlength="60"
                    placeholder="Ex: Braço Mecânico">

            </div>


            <div class="field">

                <label for="prostheticPV">

                    PV Máximo

                </label>

                <input
                    type="number"
                    id="prostheticPV"
                    min="1"
                    value="5">

            </div>


            <div class="prosthetic-modal-actions">

                <button
                    type="button"
                    id="cancelProsthetic"
                    class="secondary-button">

                    Cancelar

                </button>


                <button
                    type="button"
                    id="confirmProsthetic"
                    class="primary-button">

                    Instalar

                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    modal
        .querySelector(
            "#cancelProsthetic"
        )
        ?.addEventListener(
            "click",
            () => {

                modal.remove();

            }
        );


    modal
        .querySelector(
            "#confirmProsthetic"
        )
        ?.addEventListener(
            "click",
            () => {

                installProsthetic(
                    partName
                );

            }
        );


    modal.addEventListener(
        "click",
        event => {

            if(event.target === modal){

                modal.remove();

            }

        }
    );


    setTimeout(
        () => {

            modal
                .querySelector(
                    "#prostheticName"
                )
                ?.focus();

        },
        30
    );

}


/*==========================================================
=              ESCAPE HTML
==========================================================*/

function escapeCharacterEditorHTML(
    value
){

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}

/*==========================================================
=              SISTEMA DE HABILIDADES
==========================================================*/

const DEFAULT_ABILITIES = [

    {
        id:"ataque-especial",

        name:"Ataque Especial",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:{
            type:"pd",
            value:2
        },

        description:
            "Ao realizar um ataque, escolha +5 no teste de ataque ou +5 no dano causado.",

        upgrade:
            "Para cada +2 PD gastos, recebe +5 adicional, podendo dividir livremente entre ataque e dano."
    },


    {
        id:"ataque-de-oportunidade",

        name:"Ataque de Oportunidade",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:{
            type:"pa",
            value:1
        },

        description:
            "Reação. Quando um inimigo sair voluntariamente do seu alcance corpo a corpo, realize imediatamente um ataque contra ele. Não funciona contra teleporte ou movimento forçado. Limite: 1 vez por rodada.",

        upgrade:null
    },


    {
        id:"sacar-e-atacar",

        name:"Sacar e Atacar",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:null,

        description:
            "Reação. Em todo início de cena de combate você é o primeiro a atacar e recebe um ataque sem custo. Limite: 1 vez por cena.",

        upgrade:null
    },


    {
        id:"postura-defensiva",

        name:"Postura Defensiva",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:{
            type:"pa",
            value:1
        },

        description:
            "Até o início do seu próximo turno, recebe +2 Defesa e aumenta seu Bloqueio em 5.",

        upgrade:null
    },


    {
        id:"em-furia",

        name:"Em Fúria",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:{
            type:"pa",
            value:1
        },

        description:
            "Abdica de toda sua defesa até o seu próximo turno, mas recebe +2 dados de dano para seus ataques até sua defesa voltar.",

        upgrade:null
    },


    {
        id:"golpe-arriscado",

        name:"Golpe Arriscado",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:{
            type:"variable",
            options:[
                {
                    pd:2,
                    effect:"-5 Defesa e +10 no ataque."
                },
                {
                    pd:4,
                    effect:"-10 Defesa e +20 no ataque."
                }
            ]
        },

        description:
            "Escolha entre gastar 2 PD para receber -5 Defesa e +10 no ataque ou gastar 4 PD para receber -10 Defesa e +20 no ataque. O efeito dura até sua próxima rodada.",

        upgrade:null
    },


    {
        id:"golpe-pesado",

        name:"Golpe Pesado",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:null,

        description:
            "Passiva. Seu dano corpo a corpo aumenta em 1 passo.",

        upgrade:null
    },


    {
        id:"especialista-em-criticos",

        name:"Especialista em Críticos",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Sua margem de crítico é aumentada em 1 em armas corpo a corpo.",

        upgrade:null
    },


    {
        id:"combatente-incansavel",

        name:"Combatente Incansável",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Ao derrotar um inimigo, recupera 1 PA. Máximo de 1 vez por rodada.",

        upgrade:null
    },


    {
        id:"executor",

        name:"Executor",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Recebe +5 de dano contra alvos com a condição Machucado.",

        upgrade:null
    },


    {
        id:"duplo-golpe",

        name:"Duplo Golpe",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:{
            type:"pa",
            value:1
        },

        description:
            "Realiza dois ataques consecutivos contra o mesmo alvo. O segundo ataque recebe -5 no teste de ataque.",

        upgrade:null
    },


    {
        id:"rompedor-de-defesas",

        name:"Rompedor de Defesas",

        permanentCost:{
            type:"pd",
            value:5
        },

        useCost:null,

        description:
            "Passiva. Ignora redução de dano mundano ao bloquear por completo.",

        upgrade:null
    },


    {
        id:"carrasco",

        name:"Carrasco",

        permanentCost:{
            type:"pd",
            value:5
        },

        useCost:null,

        description:
            "Passiva. Quando causa um Acerto Crítico, aplica a condição Debilitado ao alvo.",

        upgrade:null
    },


    {
        id:"golpe-demolidor",

        name:"Golpe Demolidor",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:{
            type:"pd",
            value:2
        },

        description:
            "Ao atacar objetos ou estruturas, recebe +2 dados de dano.",

        upgrade:null
    },


    {
        id:"revidar",

        name:"Revidar",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:{
            type:"mixed",
            pd:2,
            pa:1
        },

        description:
            "Reação. Ao realizar um Contra-ataque com sucesso, recebe apenas metade do dano do ataque que o atingiu.",

        upgrade:null
    },


    {
        id:"devolver-ataque",

        name:"Devolver Ataque",

        permanentCost:{
            type:"pd",
            value:5
        },

        useCost:{
            type:"mixed",
            pd:3,
            pa:1
        },

        description:
            "Reação. Ao realizar um Contra-ataque, dispute seu teste diretamente contra o teste de ataque do inimigo. Se superar o teste inimigo, acerta o alvo e não recebe dano.",

        upgrade:null
    },


    {
        id:"retribuir",

        name:"Retribuir",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:{
            type:"pa",
            value:1
        },

        description:
            "Passiva. Quando um aliado adjacente sofrer um ataque, pode desferir um ataque contra o alvo como reação. Limite: 1 vez por rodada.",

        upgrade:null
    },


    {
        id:"parede-humana",

        name:"Parede Humana",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Você é considerado uma cobertura. Aliados atrás de você recebem cobertura parcial contra disparos, mas você recebe parte desse dano.",

        upgrade:null
    },


    {
        id:"levantar-escudo",

        name:"Levantar Escudo",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:{
            type:"pa",
            value:1
        },

        requirement:
            "Escudo Pesado",

        description:
            "Recebe Resistência a dano de Projéteis e Balístico pela metade até o início da sua próxima rodada. Requer Escudo Pesado.",

        upgrade:null
    },


    {
        id:"protetor",

        name:"Protetor",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:{
            type:"pa",
            value:1
        },

        description:
            "Protege um aliado adjacente. Enquanto protege, todos os ataques contra o aliado são direcionados a você e o custo para ameaças atacarem o aliado protegido aumenta em +1 PA.",

        upgrade:null
    },


    {
        id:"golpes-potentes",

        name:"Golpes Potentes",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Sempre que acertar um ataque, empurra o alvo 1 posição. Em um Acerto Crítico, empurra 2 posições. Não funciona contra criaturas com o dobro da sua estatura.",

        upgrade:null
    },


    {
        id:"tecnica-secreta",

        name:"Técnica Secreta",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:{
            type:"pd",
            value:2
        },

        description:
            "Adiciona uma propriedade especial ao próximo ataque. Amplo: atinge um alvo adicional ao alcance corpo a corpo. Preciso: ignora 5 de Defesa concedida por efeitos temporários.",

        upgrade:null
    },


    {
        id:"tecnica-sublime",

        name:"Técnica Sublime",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:{
            type:"pd",
            value:2
        },

        description:
            "Recebe +2 na margem de ameaça. Máximo de +4 na margem de ameaça.",

        upgrade:null
    },


    {
        id:"maquina-de-matar",

        name:"Máquina de Matar",

        permanentCost:{
            type:"pd",
            value:6
        },

        useCost:null,

        description:
            "Passiva. Sua arma recebe +1 na margem de ameaça e seu dano aumenta em 1 passo.",

        upgrade:null
    },


    {
        id:"potencia-maxima",

        name:"Potência Máxima",

        permanentCost:{
            type:"pd",
            value:6
        },

        useCost:{
            type:"pa",
            value:1
        },

        description:
            "Uma vez por cena, durante 1 rodada, todos os bônus de ataque e dano são dobrados.",

        upgrade:null
    },

    
    {
        id:"lobo-solitario",

        name:"Lobo Solitário",

        permanentCost:{
            type:"pd",
            value:5
        },

        useCost:null,

        description:
            "Passiva. Enquanto estiver sem aliados em combate, recebe +15 PV Temporários, +1 dado de dano, +1 PA Máximo, +3 Defesa e RD 5.",

        upgrade:null
    },


    {
        id:"incansavel",

        name:"Incansável",

        permanentCost:{
            type:"pd",
            value:5
        },

        useCost:{
            type:"pd",
            value:1
        },

        description:
            "Ao acertar um ataque desarmado, realiza outro ataque sem consumir PA. Cada ataque adicional custa 1 PD e recebe -3 cumulativo. Ao errar, a sequência termina. Limite: 1 vez por rodada.",

        upgrade:null
    },


    {
        id:"tiro-certeiro",

        name:"Tiro Certeiro",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:null,

        description:
            "Passiva. Soma AGI ao dano de armas de disparo e ignora penalidades por atacar alvos envolvidos em combate corpo a corpo.",

        upgrade:null
    },


    {
        id:"ricochete",

        name:"Ricochete",

        permanentCost:{
            type:"pd",
            value:5
        },

        useCost:{
            type:"mixed",
            pd:2,
            pa:1
        },

        description:
            "O disparo ricocheteia em superfícies para atingir ângulos impossíveis. O alvo é considerado Desprevenido, mas o dano do disparo é reduzido pela metade.",

        upgrade:null
    },


    {
        id:"segurar-o-gatilho",

        name:"Segurar o Gatilho",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:{
            type:"variable",
            resource:"pd",
            valuePerUse:2
        },

        description:
            "Pode realizar ataques adicionais com armas de fogo sem consumir PA. Cada ataque adicional custa 2 PD. O máximo de ataques adicionais por rodada é igual à AGI do personagem.",

        upgrade:null
    },


    {
        id:"disparo-surpresa",

        name:"Disparo Surpresa",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Recebe +5 em ataques realizados contra alvos que ainda não tenham agido na rodada.",

        upgrade:null
    },


    {
        id:"atirador-de-elite",

        name:"Atirador de Elite",

        permanentCost:{
            type:"pd",
            value:6
        },

        useCost:null,

        description:
            "Passiva. Ignora metade da cobertura utilizada pelo alvo e recebe +1 na margem de ameaça com armas de disparo.",

        upgrade:null
    },


    {
        id:"atirar-para-matar",

        name:"Atirar para Matar",

        permanentCost:{
            type:"pd",
            value:5
        },

        useCost:{
            type:"pa",
            value:2
        },

        description:
            "Se o disparo resultar em crítico, o dano é maximizado automaticamente. Além disso, soma AGI ×2 ao dano.",

        upgrade:null
    },


    {
        id:"corrida-imparavel",

        name:"Corrida Imparável",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:null,

        description:
            "Passiva. Recebe +1 posição ao se mover.",

        upgrade:null
    },


    {
        id:"arrancada",

        name:"Arrancada",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:{
            type:"pd",
            value:2
        },

        description:
            "Move-se até o dobro do deslocamento sem gastar PA adicional. Limite: 1 vez por rodada.",

        upgrade:null
    },


    {
        id:"passo-veloz",

        name:"Passo Veloz",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Ignora Terreno Difícil e recebe +5 em testes para escapar de agarrões ou imobilizações.",

        upgrade:null
    },


    {
        id:"movimento-fantasma",

        name:"Movimento Fantasma",

        permanentCost:{
            type:"pd",
            value:5
        },

        useCost:{
            type:"pd",
            value:2
        },

        description:
            "Até o fim da rodada recebe +10 em testes de Discreto e não provoca ataques de oportunidade ao se mover.",

        upgrade:null
    },


    {
        id:"resistente",

        name:"Resistente",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Recebe +5 PV Máximos e 5 de RD mundano.",

        upgrade:null
    },


    {
        id:"pele-dura",

        name:"Pele Dura",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:{
            type:"mixed",
            pd:3,
            pa:1
        },

        description:
            "Reduz um dano recebido pela metade. Limite: 1 vez por rodada.",

        upgrade:null
    },


    {
        id:"casca-grossa",

        name:"Casca Grossa",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Recebe +1 PV por nível e soma VIG ao Bloqueio.",

        upgrade:null
    },


    {
        id:"corpo-treinado",

        name:"Corpo Treinado",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:null,

        description:
            "Passiva. Recebe +5 em testes de Fortitude e ignora a primeira condição Enfraquecido recebida em cada cena.",

        upgrade:null
    },


    {
        id:"segunda-respiracao",

        name:"Segunda Respiração",

        permanentCost:{
            type:"pd",
            value:5
        },

        useCost:{
            type:"mixed",
            pd:2,
            pa:1
        },

        description:
            "Recupera 10 PV. Pode ser utilizada um número de vezes igual ao VIG.",

        upgrade:null
    },


    {
        id:"cai-dentro",

        name:"Cai Dentro",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:{
            type:"mixed",
            pd:3,
            pa:1
        },

        description:
            "Reação. Força um inimigo a direcionar seu ataque contra você. Limite: 1 vez a cada 2 rodadas.",

        upgrade:null
    },


    {
        id:"sempre-alerta",

        name:"Sempre Alerta",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Ao escolher Esquivar, reduz o dano recebido em AGI ×2.",

        upgrade:null
    },


    {
        id:"esquiva-aprimorada",

        name:"Esquiva Aprimorada",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Recebe +5 nos testes de Esquiva.",

        upgrade:null
    },


    {
        id:"inabalavel",

        name:"Inabalável",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Não sofre penalidades por estar Caído ou ser Empurrado.",

        upgrade:null
    },


    {
        id:"defesa-perfeita",

        name:"Defesa Perfeita",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Ao ser atingido, ignora penalidades associadas ao ataque recebido.",

        upgrade:null
    },


    {
        id:"guarda-alta",

        name:"Guarda Alta",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Enquanto não realizar ataques, recebe +5 Defesa e soma VIG na RD.",

        upgrade:null
    },


    {
        id:"desvio-absoluto",

        name:"Desvio Absoluto",

        permanentCost:{
            type:"pd",
            value:5
        },

        useCost:{
            type:"mixed-variable",
            pd:3,
            pa:{
                normal:2,
                critical:3
            }
        },

        description:
            "Pode gastar 2 PA para esquivar completamente de um ataque. Contra Acertos Críticos, o custo aumenta para 3 PA. O uso também custa 3 PD.",

        upgrade:null
    },


    {
        id:"adaptacao-rapida",

        name:"Adaptação Rápida",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Ao sofrer dano de um tipo específico, recebe RD 5 contra esse tipo de dano por 2 rodadas.",

        upgrade:null
    },


    {
        id:"inquebravel",

        name:"Inquebrável",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Enquanto estiver abaixo de 50% dos PV máximos, recebe +5 Defesa e RD 5.",

        upgrade:null
    },


    {
        id:"suportar-a-dor",

        name:"Suportar a Dor",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Enquanto estiver na condição Machucado, recebe +5 em testes de Fortitude e Vontade.",

        upgrade:null
    },

    
    {
        id:"surto-de-adrenalina",

        name:"Surto de Adrenalina",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:{
            type:"pd",
            value:4
        },

        description:
            "Recebe +1 PA temporário até o final da rodada.",

        upgrade:null
    },


    {
        id:"surto-de-acao",

        name:"Surto de Ação",

        permanentCost:{
            type:"pd",
            value:5
        },

        useCost:{
            type:"pa",
            value:0
        },

        abilityType:"active",

        description:
            "Uma vez por cena, recebe +2 PA temporários. Esses PA devem ser utilizados na rodada atual.",

        upgrade:null
    },


    {
        id:"reposicionamento",

        name:"Reposicionamento",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:{
            type:"variable",
            resource:"pa",
            valuePerUse:1
        },

        description:
            "Para cada 1 PA gasto, move um aliado em até 1 posição.",

        upgrade:null
    },


    {
        id:"resgate",

        name:"Resgate",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:null,

        description:
            "Pode se deslocar até 1 posição sem gastar PA. Além disso, recebe bônus em cura igual a INT ×2.",

        upgrade:null
    },


    {
        id:"inspirar-confianca",

        name:"Inspirar Confiança",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:{
            type:"mixed",
            pd:2,
            pa:1
        },

        description:
            "Reação. Ao ver um aliado realizar um teste, ele pode rerrolar o teste.",

        upgrade:null
    },


    {
        id:"prontidao",

        name:"Prontidão",

        permanentCost:{
            type:"pd",
            value:6
        },

        useCost:null,

        description:
            "Passiva. No início da cena, todos os aliados recebem +1 PA temporário no início da rodada.",

        upgrade:null
    },


    {
        id:"brecha-na-guarda",

        name:"Brecha na Guarda",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:{
            type:"pd",
            value:2
        },

        description:
            "Reação. Quando um aliado adjacente acerta um ataque, você pode realizar um ataque adicional sem consumir PA. Limite: 1 vez por rodada.",

        upgrade:null
    },


    {
        id:"comandar",

        name:"Comandar",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:{
            type:"pd",
            value:2
        },

        description:
            "Concede 1 PA seu a um aliado em até 2 posições.",

        upgrade:null
    },


    {
        id:"oficial-comandante",

        name:"Oficial Comandante",

        permanentCost:{
            type:"pd",
            value:6
        },

        useCost:{
            type:"mixed",
            pd:5,
            pa:3
        },

        description:
            "Uma vez por cena, aliados recebem +1 PA temporário e PD temporários. O total de PD distribuído não pode ultrapassar seu nível.",

        upgrade:null
    },


    {
        id:"valentao",

        name:"Valentão",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:{
            type:"pd",
            value:1
        },

        description:
            "Pode utilizar FOR no lugar de PRE em testes de Intimidação e realizar o teste como ação livre.",

        upgrade:null
    },


    {
        id:"contatos-oportunos",

        name:"Contatos Oportunos",

        permanentCost:{
            type:"pd",
            value:5
        },

        useCost:{
            type:"mixed",
            pd:4,
            pa:1
        },

        description:
            "Convoca um aliado temporário. O aliado chega em aproximadamente 10 minutos.",

        upgrade:null
    },


    {
        id:"determinacao-fisica",

        name:"Determinação Física",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:{
            type:"pd",
            value:2
        },

        description:
            "Ao realizar testes de Investigação, pode usar FOR ou AGI no lugar de INT.",

        upgrade:null
    },


    {
        id:"so-mais-um-passo",

        name:"Só Mais um Passo...",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:{
            type:"pd",
            value:5
        },

        description:
            "Ao atingir 0 PV, permanece com 1 PV em vez de cair. Pode usar um número de vezes igual ao VIG. Não funciona contra Morte Letal.",

        upgrade:null
    },


    {
        id:"determinacao",

        name:"Determinação",

        permanentCost:{
            type:"pd",
            value:7
        },

        useCost:{
            type:"pd",
            value:5
        },

        description:
            "Sobrevive a um dano que causaria Morte Letal. Limite: 1 vez por cena.",

        upgrade:null
    },


    {
        id:"chagas-da-resistencia",

        name:"Chagas da Resistência",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:null,

        description:
            "Uma vez por cena, ao atingir 0 PD, sofre 5 PV de dano e permanece com 1 PD.",

        upgrade:null
    },


    {
        id:"segunda-chance",

        name:"Segunda Chance",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Uma vez por cena, ao cair a 0 PV, ainda pode realizar 1 ação antes de cair.",

        upgrade:null
    },


    {
        id:"paramedico",

        name:"Paramédico",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:{
            type:"mixed",
            pd:2,
            pa:1
        },

        description:
            "Cura 2d10 PV.",

        upgrade:
            "Para cada +3 PD adicionais gastos, a cura aumenta em +2d10 PV."
    },


    {
        id:"equipe-de-trauma",

        name:"Equipe de Trauma",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:{
            type:"pa",
            value:1
        },

        description:
            "Remove uma condição negativa do alvo.",

        upgrade:null
    },


    {
        id:"reanimacao",

        name:"Reanimação",

        permanentCost:{
            type:"pd",
            value:5
        },

        useCost:{
            type:"mixed",
            pd:10,
            pa:2
        },

        description:
            "Revive um personagem na mesma cena. Pode ser utilizado um número de vezes igual ao INT. Não funciona em casos de Morte Letal.",

        upgrade:null
    },


    {
        id:"dorminhoco",

        name:"Dorminhoco",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:null,

        description:
            "Passiva. Em cenas de descanso, recupera o dobro baseado no conforto oferecido.",

        upgrade:null
    },


    {
        id:"recuperando-folego",

        name:"Recuperando Fôlego",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. A cada 10 pontos de dano causado, ganha 1 PD temporário. O máximo de PD temporário acumulado é igual ao seu nível.",

        upgrade:null
    },


    {
        id:"reciclar-energia",

        name:"Reciclar Energia",

        permanentCost:{
            type:"pd",
            value:5
        },

        useCost:{
            type:"pa",
            value:1
        },

        description:
            "Ao falhar ao conjurar um ritual, recupera metade do PD gasto.",

        upgrade:null
    },


    {
        id:"reserva-oculta",

        name:"Reserva Oculta",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. No início do combate, recebe PD temporários iguais ao PRE.",

        upgrade:null
    },

    
    {
        id:"escolhido-pelo-outro-lado",

        name:"Escolhido Pelo Outro Lado",

        permanentCost:{
            type:"mixed-permanent",
            pv:7,
            pd:4
        },

        useCost:{
            type:"variable"
        },

        description:
            "Adquire pontos elementais de Sangue, Morte, Energia e Conhecimento. Começa com 3 pontos elementais. A cada nível ímpar desbloqueia 1 slot de ponto comprável por 2 PV. É necessário para Assimilações.",

        upgrade:null
    },


    {
        id:"abrir-fenda",

        name:"Abrir Fenda",

        permanentCost:{
            type:"pv",
            value:5
        },

        useCost:null,

        description:
            "Sacrifica 2 pontos elementais para adquirir 1 ponto em Medo. Libera os caminhos e Assimilações de Medo. Não consome slot de habilidade.",

        upgrade:null
    },


    {
        id:"elemento-favorito",

        name:"Elemento Favorito",

        permanentCost:{
            type:"pv",
            value:4
        },

        useCost:null,

        description:
            "Recebe +1 ponto elemental imediatamente e outro no nível 10. Apenas 1 elemento pode ser desbloqueado por esta habilidade.",

        upgrade:null
    },


    {
        id:"nos-olhos-do-monstro",

        name:"Nos Olhos do Monstro",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:{
            type:"pd",
            value:3
        },

        description:
            "Recebe +5 em testes de resistência mental.",

        upgrade:null
    },


    {
        id:"camuflar-ocultismo",

        name:"Camuflar Ocultismo",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:{
            type:"pd",
            value:2
        },

        description:
            "Oculta símbolos e manifestações ao conjurar rituais. Também permite conjurar sem gestos.",

        upgrade:null
    },


    {
        id:"criar-selo",

        name:"Criar Selo",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:{
            type:"ritual-plus-pd",
            pd:2
        },

        description:
            "Armazena um ritual em um item de combate. O uso custa 2 PD além do custo normal do ritual.",

        upgrade:null
    },


    {
        id:"especialista-em-elemento",

        name:"Especialista em Elemento",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:null,

        description:
            "Passiva. Seus rituais recebem +2 na DT.",

        upgrade:null
    },


    {
        id:"conjurador-talentoso",

        name:"Conjurador Talentoso",

        permanentCost:{
            type:"pd",
            value:5
        },

        useCost:null,

        description:
            "Passiva. Recebe +5 em testes de conjuração.",

        upgrade:null
    },


    {
        id:"guiado-pelo-paranormal",

        name:"Guiado pelo Paranormal",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:{
            type:"pd",
            value:2
        },

        description:
            "Recebe uma ação extra de investigação.",

        upgrade:null
    },


    {
        id:"identificacao-paranormal",

        name:"Identificação Paranormal",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Recebe +10 em testes de Ocultismo que não envolvem conjuração.",

        upgrade:null
    },


    {
        id:"improvisar-componentes",

        name:"Improvisar Componentes",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:{
            type:"pd",
            value:2
        },

        description:
            "Cria componentes ou oferendas improvisadas.",

        upgrade:null
    },


    {
        id:"conjuracao-rapida",

        name:"Conjuração Rápida",

        permanentCost:{
            type:"pd",
            value:5
        },

        useCost:{
            type:"pd",
            value:3
        },

        description:
            "Reduz o custo de rituais de 4 PA para 3 PA.",

        upgrade:null
    },


    {
        id:"treinamento-rigoroso",

        name:"Treinamento Rigoroso",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Escolha uma opção: Arma recebe +4 de dano e +1 na margem crítica; ou Escudo recebe +2 Defesa e +3 RD. Ao adquirir duas vezes, recebe +1 FOR, VIG ou AGI.",

        upgrade:
            "Ao adquirir esta habilidade duas vezes, recebe +1 em FOR, VIG ou AGI."
    },


    {
        id:"elemento-resistente",

        name:"Elemento Resistente",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Recebe RD 2 para cada ponto elemental em um elemento.",

        upgrade:null
    },


    {
        id:"contrato-paranormal",

        name:"Contrato Paranormal",

        permanentCost:{
            type:"pd",
            value:5
        },

        useCost:null,

        requirement:
            "5 pontos elementais em um elemento",

        description:
            "Faz um vínculo com uma entidade do Outro Lado. A entidade pode auxiliar conjurações, mas exige algo em troca definido pelo mestre. Apenas 1 contrato pode existir; se for quebrado, não pode fazer outro.",

        upgrade:null
    },


    {
        id:"possuido",

        name:"Possuído",

        permanentCost:{
            type:"pd",
            value:5
        },

        useCost:null,

        requirement:
            "10 pontos elementais",

        description:
            "Permite manifestação parcial de uma entidade no corpo. Concede rituais instantâneos, imunidade elemental, +20 PV temporários e +10 PD temporários. Os efeitos negativos são definidos pelo mestre.",

        upgrade:null
    },


    {
        id:"adepto-paranormal",

        name:"Adepto Paranormal",

        permanentCost:{
            type:"pd",
            value:5
        },

        useCost:null,

        description:
            "Pode transferir até 3 pontos elementais entre elementos ao final de uma missão. Não ultrapassa limites e só pode ser usado 1 vez por missão.",

        upgrade:null
    },


    {
        id:"dor-e-uma-bencao",

        name:"Dor é uma Benção",

        permanentCost:{
            type:"pd",
            value:5
        },

        useCost:null,

        description:
            "Passiva. Sempre que sofrer 10 de dano em um único golpe, ganha +1 ponto elemental temporário. Esses pontos podem ser acumulados e utilizados normalmente em rituais.",

        upgrade:null
    },


    {
        id:"disparo-letal",

        name:"Disparo Letal",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:null,

        description:
            "Passiva. Recebe +2 na margem de ameaça com armas de disparo.",

        upgrade:null
    },


    {
        id:"ritual-gravado",

        name:"Ritual Gravado",

        permanentCost:{
            type:"pd",
            value:5
        },

        useCost:null,

        description:
            "Passiva. Uma vez por cena, pode reutilizar um ritual já conjurado sem custo adicional de PD. O ritual ainda respeita os limites de pontos elementais e PD.",

        upgrade:null
    },

    
    {
        id:"carteirada",

        name:"Carteirada",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:null,

        description:
            "Passiva. Ganha treinamento em Diplomacia ou Artifício. Se já for treinado, recebe +5 no teste. Também possui acesso a documentos e autoridade oficial.",

        upgrade:null
    },


    {
        id:"mente-disciplinada",

        name:"Mente Disciplinada",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Recebe +5 em testes de Vontade.",

        upgrade:null
    },


    {
        id:"observador",

        name:"Observador",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Recebe +5 em testes de Percepção.",

        upgrade:null
    },


    {
        id:"conhecimento-amplo",

        name:"Conhecimento Amplo",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:{
            type:"pd",
            value:2
        },

        description:
            "Escolha duas perícias. Ao realizar um teste com uma dessas perícias, pode adicionar 1d6 ao teste.",

        upgrade:null
    },


    {
        id:"sortudo",

        name:"Sortudo",

        permanentCost:{
            type:"pd",
            value:5
        },

        useCost:{
            type:"pd",
            value:2
        },

        description:
            "Role novamente um teste recém realizado. Deve utilizar o novo resultado. Limite: 1 vez por rodada.",

        upgrade:null
    },


    {
        id:"presenca-marcante",

        name:"Presença Marcante",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:null,

        description:
            "Passiva. Recebe +5 em testes de Intimidação ou Interação.",

        upgrade:null
    },


    {
        id:"lider-nato",

        name:"Líder Nato",

        permanentCost:{
            type:"pd",
            value:5
        },

        useCost:{
            type:"mixed",
            pd:2,
            pa:1
        },

        description:
            "Escolha um aliado que possa ouvir você. Ele recebe +5 em um teste realizado até o início do seu próximo turno.",

        upgrade:null
    },


    {
        id:"especialista",

        name:"Especialista",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Escolha uma perícia baseada em INT. Recebe +10 nessa perícia até o fim da cena.",

        upgrade:null
    },


    {
        id:"primeiros-socorros",

        name:"Primeiros Socorros",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:{
            type:"pa",
            value:1
        },

        description:
            "Realize um teste de Medicina. Em caso de sucesso, o alvo recupera 5 PV. Em um crítico, recupera 10 PV.",

        upgrade:null
    },


    {
        id:"improvisador",

        name:"Improvisador",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Pode utilizar Especialização sem possuir as ferramentas adequadas. Sofre apenas -2 em vez de não poder realizar o teste.",

        upgrade:null
    },


    {
        id:"sobrevivente",

        name:"Sobrevivente",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Recebe +5 em testes de Sobrevivência e necessita de apenas metade da comida e água normalmente exigidas.",

        upgrade:null
    },


    /*======================================================
    =                  NOVAS HABILIDADES
    ======================================================*/

    {
        id:"pressao-constante",

        name:"Pressão Constante",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Sempre que acertar 2 ataques consecutivos contra o mesmo alvo, a partir do 3º ataque seus ataques causam +1 dado de dano até errar um ataque ou trocar de alvo.",

        upgrade:null
    },


    /*
        Existe outro Executor anteriormente.
        ID diferente para não haver conflito.
    */

    {
        id:"executor-2",

        name:"Executor",

        permanentCost:{
            type:"pd",
            value:5
        },

        useCost:null,

        description:
            "Passiva. Sempre que derrotar uma ameaça, seu próximo ataque até o final da rodada recebe +1 dado de dano. Limite: 1 vez por rodada.",

        upgrade:null
    },


    {
        id:"ferimento-profundo",

        name:"Ferimento Profundo",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Sempre que obtiver um Acerto Crítico, o alvo recebe a condição Sangramento.",

        upgrade:null
    },


    {
        id:"instinto-de-combate",

        name:"Instinto de Combate",

        permanentCost:{
            type:"pd",
            value:3
        },

        useCost:null,

        description:
            "Passiva. Sempre que um inimigo errar um ataque contra você, recebe +5 no próximo ataque contra esse inimigo.",

        upgrade:null
    },


    /*
        Existe outro Carrasco anteriormente.
        ID diferente para não haver conflito.
    */

    {
        id:"carrasco-2",

        name:"Carrasco",

        permanentCost:{
            type:"pd",
            value:5
        },

        useCost:null,

        description:
            "Passiva. Sempre que obtiver um Acerto Crítico, recebe +1 PA temporário. Limite: 1 vez por rodada.",

        upgrade:null
    },


    {
        id:"mira-persistente",

        name:"Mira Persistente",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Caso permaneça uma rodada inteira sem realizar ataques com armas de disparo, seu próximo disparo recebe +10 no teste de ataque.",

        upgrade:null
    },


    {
        id:"escudo-vivo",

        name:"Escudo Vivo",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Enquanto permanecer adjacente a um aliado, ele recebe +3 em Defesa.",

        upgrade:null
    },


    {
        id:"reflexo-instantaneo",

        name:"Reflexo Instantâneo",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Sempre que realizar uma Esquiva com sucesso, pode mover 1 posição imediatamente sem consumir PA.",

        upgrade:null
    },


    {
        id:"cacada",

        name:"Caçada",

        permanentCost:{
            type:"pd",
            value:4
        },

        useCost:null,

        description:
            "Passiva. Sempre que um inimigo sair voluntariamente do seu alcance, ele recebe -5 em Esquiva até o início do próximo turno.",

        upgrade:null
    },


    {
        id:"eficiencia",

        name:"Eficiência",

        permanentCost:{
            type:"pd",
            value:5
        },

        useCost:null,

        description:
            "Passiva. Ao utilizar uma habilidade, pode reduzir pela metade seu custo em PD e PA, arredondando para cima. O custo nunca pode ser reduzido para 0. Pode ser utilizada um número de vezes igual ao INT por cena.",

        upgrade:null
    },

];


function ensureCharacterAbilities(){

    if(
        !Array.isArray(
            characterAbilitiesState
        )
    ){

        characterAbilitiesState = [];

    }

}


/*==========================================================
=              ADICIONAR HABILIDADE
==========================================================*/

function addAbilityToCharacter(
    abilityId
){


    ensureCharacterAbilities();


    const ability =
        DEFAULT_ABILITIES.find(
            item =>
                item.id === abilityId
        );


    if(!ability){

        return false;

    }

const alreadyHas =
    characterAbilitiesState.some(
            item =>
                item.id === ability.id
        );


    if(alreadyHas){

        showCharacterEditorMessage(
            "Habilidade já adquirida",
            `${ability.name} já pertence ao personagem.`
        );

        return false;

    }


    /*======================================================
    =              CUSTO PERMANENTE
    ======================================================*/

    if(
        ability.permanentCost?.type ===
        "pd"
    ){

        const cost =
            Number(
                ability.permanentCost.value
            ) || 0;


        const currentMax =
            Number(
                characterPDMax?.value
            ) || 0;


        if(currentMax < cost){

            showCharacterEditorMessage(
                "PD insuficiente",
                `Você precisa de ${cost} PD máximos para adquirir ${ability.name}.`
            );

            return false;

        }


        characterPDMax.value =
            Math.max(
                0,
                currentMax - cost
            );


        /*
            Se o PD atual ficar acima do novo máximo,
            reduzimos o atual também.
        */

        if(
            Number(
                characterPD?.value
            ) >
            Number(
                characterPDMax.value
            )
        ){

            characterPD.value =
                characterPDMax.value;

        }

    }


characterAbilitiesState.push({

    id:
        ability.id,

    name:
        ability.name,

    description:
        ability.description,

    upgrade:
        ability.upgrade,

    permanentCost:
        structuredCloneSafe(
            ability.permanentCost
        ),

    useCost:
        structuredCloneSafe(
            ability.useCost
        ),

    acquiredAt:
        Date.now()

});


calculateAutomaticStats();

renderAbilityEditorList();


showCharacterEditorMessage(
    "Habilidade adquirida",
    `${ability.name} foi adicionada à ficha.`
);


return true;

}


/*==========================================================
=              USAR HABILIDADE
==========================================================*/

function useCharacterAbility(
    abilityId
){

    const ability =
        characterAbilitiesState.find(
            item =>
                item.id === abilityId
        );


    if(!ability){

        return false;

    }


    const cost =
        ability.useCost;


    /*
        Passiva ou habilidade sem custo de uso.
    */

    if(!cost){

        showCharacterEditorMessage(
            ability.name,
            "Esta habilidade não possui custo de ativação."
        );

        return true;

    }


    /*======================================================
    =                    CUSTO PD
    ======================================================*/

    if(cost.type === "pd"){

        return spendAbilityResources(
            ability,
            {
                pd:
                    Number(
                        cost.value
                    ) || 0
            }
        );

    }


    /*======================================================
    =                    CUSTO PA
    ======================================================*/

    if(cost.type === "pa"){

        return spendAbilityResources(
            ability,
            {
                pa:
                    Number(
                        cost.value
                    ) || 0
            }
        );

    }


    /*======================================================
    =                    CUSTO PV
    ======================================================*/

    if(cost.type === "pv"){

        return spendAbilityResources(
            ability,
            {
                pv:
                    Number(
                        cost.value
                    ) || 0
            }
        );

    }


    /*======================================================
    =                    CUSTO MISTO
    ======================================================*/

    if(cost.type === "mixed"){

        return spendAbilityResources(
            ability,
            {
                pd:
                    Number(
                        cost.pd
                    ) || 0,

                pa:
                    Number(
                        cost.pa
                    ) || 0,

                pv:
                    Number(
                        cost.pv
                    ) || 0
            }
        );

    }


    /*======================================================
    =              CUSTO + RITUAL
    ======================================================*/

    if(
        cost.type ===
        "ritual-plus-pd"
    ){

        return spendAbilityResources(
            ability,
            {
                pd:
                    Number(
                        cost.pd
                    ) || 0
            },
            "Além desse custo, o ritual ainda deve pagar seu custo normal."
        );

    }


    /*======================================================
    =              CUSTO VARIÁVEL
    ======================================================*/

    if(cost.type === "variable"){

        openVariableAbilityCost(
            ability
        );

        return true;

    }


    /*======================================================
    =              CUSTO MISTO VARIÁVEL
    ======================================================*/

    if(
        cost.type ===
        "mixed-variable"
    ){

        openMixedVariableAbilityCost(
            ability
        );

        return true;

    }


    console.warn(
        "Tipo de custo não reconhecido:",
        cost
    );


    showCharacterEditorMessage(
        "Custo não configurado",
        `O custo de ${ability.name} ainda não foi configurado no sistema.`
    );


    return false;

}

/*==========================================================
=              GASTAR RECURSOS
==========================================================*/

function spendAbilityResources(
    ability,
    resources,
    extraMessage = ""
){

    let pd =
        Math.max(
            0,
            Number(
                resources.pd
            ) || 0
        );


    let pa =
        Math.max(
            0,
            Number(
                resources.pa
            ) || 0
        );


    let pv =
        Math.max(
            0,
            Number(
                resources.pv
            ) || 0
        );


    const currentPD =
        Number(
            characterPD?.value
        ) || 0;


    const currentPA =
        Number(
            characterPA?.value
        ) || 0;


    const currentPV =
        Number(
            characterPV?.value
        ) || 0;


    /*======================================================
    =                    VALIDAÇÃO
    ======================================================*/

    if(currentPD < pd){

        showCharacterEditorMessage(
            "PD insuficiente",
            `Você precisa de ${pd} PD para utilizar ${ability.name}.`
        );

        return false;

    }


    if(currentPA < pa){

        showCharacterEditorMessage(
            "PA insuficiente",
            `Você precisa de ${pa} PA para utilizar ${ability.name}.`
        );

        return false;

    }


    if(
        lifeMode?.value === "classic" &&
        currentPV < pv
    ){

        showCharacterEditorMessage(
            "PV insuficiente",
            `Você precisa de ${pv} PV para utilizar ${ability.name}.`
        );

        return false;

    }

    if(
    !isValidRPGSystem(
        selectedSystemId
    )
){

    showCharacterEditorMessage(
        "Sistema inválido",
        "Selecione um sistema de RPG válido."
    );

    characterSystem?.focus();

    return;

}


if(
    !isRPGSystemEnabled(
        selectedSystemId
    )
){

    showCharacterEditorMessage(
        "Sistema indisponível",
        `${selectedSystem.name} ainda está em desenvolvimento.`
    );

    characterSystem?.focus();

    return;

}


    /*======================================================
    =                    PAGAMENTO
    ======================================================*/

    if(pd > 0){

        characterPD.value =
            currentPD - pd;

    }


    if(pa > 0){

        characterPA.value =
            currentPA - pa;

    }


    if(
        pv > 0 &&
        lifeMode?.value === "classic"
    ){

        characterPV.value =
            currentPV - pv;

    }


    /*======================================================
    =                    TEXTO
    ======================================================*/

    const costs = [];


    if(pd){

        costs.push(
            `${pd} PD`
        );

    }


    if(pa){

        costs.push(
            `${pa} PA`
        );

    }


    if(pv){

        costs.push(
            `${pv} PV`
        );

    }


    const costText =
        costs.length
            ? costs.join(" + ")
            : "Sem custo";


    showCharacterEditorMessage(
        ability.name,
        `Habilidade utilizada. Custo: ${costText}.${extraMessage ? ` ${extraMessage}` : ""}`
    );


    return true;

}

/*==========================================================
=              CUSTO VARIÁVEL
==========================================================*/

function openVariableAbilityCost(
    ability
){

    const cost =
        ability.useCost;


    document
        .getElementById(
            "variableAbilityModal"
        )
        ?.remove();


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "variableAbilityModal";

    modal.className =
        "editor-message";


    let content = "";


    /*
        Habilidades com opções específicas.
        Exemplo: Golpe Arriscado.
    */

    if(
        Array.isArray(
            cost.options
        )
    ){

        content =
            cost.options
                .map(
                    (option,index) => `

                    <button
                        type="button"
                        class="ability-cost-option"
                        data-option="${index}"
                    >

                        <strong>
                            ${
                                Number(
                                    option.pd
                                ) || 0
                            }
                            PD
                        </strong>

                        <span>
                            ${escapeCharacterEditorHTML(
                                option.effect ||
                                ""
                            )}
                        </span>

                    </button>

                `
                )
                .join("");

    }


    /*
        Custo por quantidade.
        Exemplo:
        2 PD por ataque adicional.
    */

    else if(
        cost.resource &&
        cost.valuePerUse
    ){

        content = `

            <div class="field">

                <label>
                    Quantidade
                </label>

                <input
                    type="number"
                    id="variableAbilityAmount"
                    min="1"
                    value="1">

            </div>

            <div
                class="variable-cost-preview"
                id="variableAbilityPreview"
            >
                Custo: ${cost.valuePerUse}
                ${String(
                    cost.resource
                ).toUpperCase()}
            </div>

            <button
                type="button"
                id="confirmVariableAbility"
                class="primary-button"
                style="width:100%;"
            >

                Utilizar

            </button>

        `;

    }


    else{

        content = `

            <div class="field">

                <label>
                    Custo em PD
                </label>

                <input
                    type="number"
                    id="variableAbilityPD"
                    min="1"
                    value="1">

            </div>

            <button
                type="button"
                id="confirmVariableAbility"
                class="primary-button"
                style="width:100%;"
            >

                Utilizar

            </button>

        `;

    }


    modal.innerHTML = `

        <div class="prosthetic-editor-modal">

            <span class="section-label">

                CUSTO VARIÁVEL

            </span>

            <h2>
                ${escapeCharacterEditorHTML(
                    ability.name
                )}
            </h2>

            <div class="editor-dynamic-list">

                ${content}

            </div>

            <button
                type="button"
                id="cancelVariableAbility"
                class="secondary-button"
                style="
                    width:100%;
                    margin-top:14px;
                "
            >

                Cancelar

            </button>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    /*======================================================
    =              OPÇÕES PRONTAS
    ======================================================*/

    modal
        .querySelectorAll(
            ".ability-cost-option"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const option =
                        cost.options[
                            Number(
                                button.dataset.option
                            )
                        ];


                    if(!option){

                        return;

                    }


                    const success =
                        spendAbilityResources(
                            ability,
                            {
                                pd:
                                    Number(
                                        option.pd
                                    ) || 0,

                                pa:
                                    Number(
                                        option.pa
                                    ) || 0,

                                pv:
                                    Number(
                                        option.pv
                                    ) || 0
                            },

                            option.effect || ""
                        );


                    if(success){

                        modal.remove();

                    }

                }
            );

        });


    /*======================================================
    =              QUANTIDADE VARIÁVEL
    ======================================================*/

    const amountInput =
        modal.querySelector(
            "#variableAbilityAmount"
        );


    const preview =
        modal.querySelector(
            "#variableAbilityPreview"
        );


    amountInput?.addEventListener(
        "input",
        () => {

            const amount =
                Math.max(
                    1,
                    Number(
                        amountInput.value
                    ) || 1
                );


            if(preview){

                preview.textContent =
                    `Custo: ${
                        amount *
                        Number(
                            cost.valuePerUse
                        )
                    } ${
                        String(
                            cost.resource
                        ).toUpperCase()
                    }`;

            }

        }
    );


    modal
        .querySelector(
            "#confirmVariableAbility"
        )
        ?.addEventListener(
            "click",
            () => {

                /*
                    Formato quantidade × custo.
                */

                if(
                    cost.resource &&
                    cost.valuePerUse
                ){

                    const amount =
                        Math.max(
                            1,
                            Number(
                                amountInput?.value
                            ) || 1
                        );


                    const total =
                        amount *
                        Number(
                            cost.valuePerUse
                        );


                    const resources = {};


                    resources[
                        cost.resource
                    ] = total;


                    const success =
                        spendAbilityResources(
                            ability,
                            resources
                        );


                    if(success){

                        modal.remove();

                    }


                    return;

                }


                /*
                    Variável genérico em PD.
                */

                const pd =
                    Math.max(
                        1,
                        Number(
                            modal.querySelector(
                                "#variableAbilityPD"
                            )?.value
                        ) || 1
                    );


                const success =
                    spendAbilityResources(
                        ability,
                        {
                            pd
                        }
                    );


                if(success){

                    modal.remove();

                }

            }
        );


    modal
        .querySelector(
            "#cancelVariableAbility"
        )
        ?.addEventListener(
            "click",
            () => {

                modal.remove();

            }
        );

}

/*==========================================================
=              CUSTO MISTO VARIÁVEL
==========================================================*/

function openMixedVariableAbilityCost(
    ability
){

    const cost =
        ability.useCost;


    document
        .getElementById(
            "mixedVariableAbilityModal"
        )
        ?.remove();


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "mixedVariableAbilityModal";

    modal.className =
        "editor-message";


    modal.innerHTML = `

        <div class="prosthetic-editor-modal">

            <span class="section-label">

                ${escapeCharacterEditorHTML(
                    ability.name
                )}

            </span>

            <h2>

                Escolha o tipo de uso

            </h2>


            <div class="editor-dynamic-list">


                <button
                    type="button"
                    class="ability-cost-option"
                    data-type="normal"
                >

                    <strong>

                        Ataque Normal

                    </strong>

                    <span>

                        ${Number(
                            cost.pd
                        ) || 0}
                        PD

                        +

                        ${Number(
                            cost.pa?.normal
                        ) || 0}
                        PA

                    </span>

                </button>


                <button
                    type="button"
                    class="ability-cost-option"
                    data-type="critical"
                >

                    <strong>

                        Acerto Crítico

                    </strong>

                    <span>

                        ${Number(
                            cost.pd
                        ) || 0}
                        PD

                        +

                        ${Number(
                            cost.pa?.critical
                        ) || 0}
                        PA

                    </span>

                </button>


            </div>


            <button
                type="button"
                id="cancelMixedVariableAbility"
                class="secondary-button"
                style="
                    width:100%;
                    margin-top:15px;
                "
            >

                Cancelar

            </button>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    modal
        .querySelectorAll(
            ".ability-cost-option"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const type =
                        button.dataset.type;


                    const pa =
                        type === "critical"
                            ? Number(
                                cost.pa?.critical
                            ) || 0
                            : Number(
                                cost.pa?.normal
                            ) || 0;


                    const success =
                        spendAbilityResources(
                            ability,
                            {
                                pd:
                                    Number(
                                        cost.pd
                                    ) || 0,

                                pa
                            }
                        );


                    if(success){

                        modal.remove();

                    }

                }
            );

        });


    modal
        .querySelector(
            "#cancelMixedVariableAbility"
        )
        ?.addEventListener(
            "click",
            () => {

                modal.remove();

            }
        );

}


/*==========================================================
=              RENDERIZAR HABILIDADES
==========================================================*/

function renderAbilityEditorList(){

    const container =
        document.getElementById(
            "abilitiesEditorList"
        );


    if(!container){

        return;

    }


    const abilities =
    characterAbilitiesState;


    if(abilities.length === 0){

        container.innerHTML = `

            <div class="editor-empty-state">

                <span>◇</span>

                <p>
                    Nenhuma habilidade adicionada.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        abilities
            .map(ability => `

<div class="ability-editor-card">

    <h3>
        ${escapeCharacterEditorHTML(
            ability.name
        )}
    </h3>

    <p>
        ${escapeCharacterEditorHTML(
            ability.description || ""
        )}
    </p>

    ${
        ability.upgrade
            ? `
                <p>
                    <strong>Aprimoramento:</strong>

                    ${escapeCharacterEditorHTML(
                        ability.upgrade
                    )}
                </p>
            `
            : ""
    }

    ${
        ability.useCost
            ? `
                <button
                    type="button"
                    class="primary-button use-ability-button"
                    data-ability="${escapeCharacterEditorHTML(
                        ability.id
                    )}"
                >

                    Usar •
                    ${Number(
                        ability.useCost.value
                    )}
                    ${String(
                        ability.useCost.type
                    ).toUpperCase()}

                </button>
            `
            : ""
    }

    <button
        type="button"
        class="remove-content-button remove-ability-button"
        data-ability="${escapeCharacterEditorHTML(
            ability.id
        )}"
    >

        Remover

    </button>

</div>

            `)
            .join("");


    container
        .querySelectorAll(
            ".use-ability-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    useCharacterAbility(
                        button.dataset.ability
                    );

                }
            );

        });

container
    .querySelectorAll(
        ".remove-ability-button"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                removeCharacterAbility(
                    button.dataset.ability
                );

            }
        );

    });

}


/*==========================================================
=              BOTÃO + HABILIDADE
==========================================================*/

document
    .getElementById(
        "addAbilityEditor"
    )
    ?.addEventListener(
        "click",
        openAbilitySelector
    );


/*==========================================================
=              SELETOR DE HABILIDADES
==========================================================*/

function openAbilitySelector(){

    document
        .getElementById(
            "abilitySelectorModal"
        )
        ?.remove();


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "abilitySelectorModal";

    modal.className =
        "editor-message";


const cards =
    DEFAULT_ABILITIES
        .map(
            ability => `

            <button
                type="button"
                class="ability-choice-card"
                data-ability="${ability.id}"
            >

                <strong>
                    ✦ ${escapeCharacterEditorHTML(
                        ability.name
                    )}
                </strong>

                <span>
                    ${ability.permanentCost.value}
                    ${ability.permanentCost.type.toUpperCase()}
                    permanente
                </span>

                <p>
                    ${escapeCharacterEditorHTML(
                        ability.description
                    )}
                </p>

            </button>

        `
        )
        .join("");


    modal.innerHTML = `

        <div class="prosthetic-editor-modal">

            <span class="section-label">
                HABILIDADES
            </span>

            <h2>
                Adicionar Habilidade
            </h2>

            <div class="editor-dynamic-list">

                ${cards}

            </div>

            <button
                type="button"
                id="closeAbilitySelector"
                class="secondary-button"
                style="width:100%;margin-top:18px;"
            >

                Fechar

            </button>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    modal
        .querySelectorAll(
            ".ability-choice-card"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const success =
                        addAbilityToCharacter(
                            button.dataset.ability
                        );


                    if(success){

                        modal.remove();

                    }

                }
            );

        });


    modal
        .querySelector(
            "#closeAbilitySelector"
        )
        ?.addEventListener(
            "click",
            () => {

                modal.remove();

            }
        );

}

/*==========================================================
=              ASSIMILAÇÕES DISPONÍVEIS
==========================================================*/

const DEFAULT_ASSIMILATIONS = window.ECO_BLOOD_ASSIMILATIONS && window.ECO_DEATH_ASSIMILATIONS
    ? [...window.ECO_BLOOD_ASSIMILATIONS,...window.ECO_DEATH_ASSIMILATIONS]
    : [

    {
        id:"presas",
        name:"Presas",

        permanentCost:{
            type:"pv",
            value:5
        },

        activationCost:{
            type:"pa",
            value:1
        },

        activationType:"Ativação",

        active:false,

        description:
            "Cria garras e presas monstruosas. Enquanto estiverem ativas, seus ataques desarmados causam +1 dado de dano."
    },


    {
        id:"lamina-de-sangue",
        name:"Lâmina de Sangue",

        permanentCost:{
            type:"pv",
            value:5
        },

        activationCost:{
            type:"pa",
            value:1
        },

        activationType:"Ativação",

        active:false,

        description:
            "Cria uma espada formada por sangue coagulado que causa 2d8 + FOR de dano de Sangue."
    },


    {
        id:"celulas-regenerativas",
        name:"Células Regenerativas",

        permanentCost:{
            type:"pv",
            value:5
        },

        activationCost:null,

        activationType:"Passiva",

        active:true,

        description:
            "Recupera 2d6 PV no início de cada rodada."
    },


    {
        id:"espinhoso",
        name:"Espinhoso",

        permanentCost:{
            type:"pv",
            value:5
        },

        activationCost:{
            type:"pa",
            value:1
        },

        activationType:"Ativação",

        active:false,

        description:
            "Enquanto estiver ativo, sempre que sofrer um ataque corpo a corpo, o atacante recebe 2d6 de dano de Sangue."
    },


    {
        id:"devorar",
        name:"Devorar",

        permanentCost:{
            type:"pv",
            value:4
        },

        activationCost:{
            type:"pa",
            value:1
        },

        activationType:"Ativação",

        active:false,

        description:
            "Após acertar um ataque corpo a corpo, pode ativar esta habilidade para recuperar 2d10 PV."
    },


    {
        id:"sangue-compartilhado",
        name:"Sangue Compartilhado",

        permanentCost:{
            type:"pv",
            value:4
        },

        activationCost:null,

        activationType:"Passiva",

        active:true,

        description:
            "Pode transferir seus próprios PV para recuperar PV de um aliado em até 1 posição."
    },


    {
        id:"musculos-intensificados",
        name:"Músculos Intensificados",

        permanentCost:{
            type:"pv",
            value:4
        },

        activationCost:null,

        activationType:"Passiva",

        active:true,

        description:
            "Recebe +1 em FOR e +3 em testes de Manobra."
    },


    {
        id:"peitoral-de-ferro",
        name:"Peitoral de Ferro",

        permanentCost:{
            type:"pv",
            value:4
        },

        activationCost:null,

        activationType:"Passiva",

        active:true,

        description:
            "Recebe +1 em VIG e +3 em testes de Fortitude."
    },


    {
        id:"asas-profanas",
        name:"Asas Profanas",

        permanentCost:{
            type:"pv",
            value:4
        },

        activationCost:{
            type:"pa",
            value:1
        },

        activationType:"Ativação",

        active:false,

        description:
            "Cria asas demoníacas. Seu deslocamento passa a ser 4 posições e você ignora terreno difícil."
    },


    {
        id:"insensibilidade-a-dor",
        name:"Insensibilidade à Dor",

        permanentCost:{
            type:"pv",
            value:4
        },

        activationCost:{
            type:"pa",
            value:1
        },

        activationType:"Ativação",

        active:false,

        description:
            "Uma vez por cena, reduza um dano recebido em 30."
    },


    {
        id:"camada-extra",
        name:"Camada Extra",

        permanentCost:{
            type:"pv",
            value:4
        },

        activationCost:null,

        activationType:"Passiva",

        active:true,

        description:
            "No início de cada Cena de Combate recebe 20 PV temporários."
    },


    {
        id:"sentir-emocao",
        name:"Sentir Emoção",

        permanentCost:{
            type:"pv",
            value:4
        },

        activationCost:{
            type:"pd",
            value:4
        },

        activationType:"Ativação",

        active:false,

        description:
            "Descobre exatamente qual emoção domina um alvo no momento."
    },


    {
        id:"consumir-e-transformar",
        name:"Consumir e Transformar",

        permanentCost:{
            type:"pv",
            value:4
        },

        activationCost:{
            type:"pa",
            value:1
        },

        activationType:"Ativação",

        active:false,

        description:
            "Uma vez por cena, redistribua seus pontos de atributos, transferindo-os livremente para FOR e VIG até o fim da cena."
    },


    {
        id:"gula",
        name:"Gula",

        permanentCost:{
            type:"pv",
            value:4
        },

        activationCost:{
            type:"pa",
            value:1
        },

        activationType:"Ativação",

        active:false,

        description:
            "Consome 1 ponto de FOR ou VIG do alvo, adicionando esse ponto ao seu próprio atributo enquanto durar a cena."
    },


    {
        id:"inveja",
        name:"Inveja",

        permanentCost:{
            type:"pv",
            value:4
        },

        activationCost:{
            type:"pa",
            value:1
        },

        activationType:"Ativação",

        active:false,

        description:
            "Copia a habilidade mais recentemente utilizada por um aliado, podendo utilizá-la apenas uma vez."
    },


    {
        id:"ira",
        name:"Ira",

        permanentCost:{
            type:"pv",
            value:4
        },

        activationCost:{
            type:"pa",
            value:1
        },

        activationType:"Ativação",

        active:false,

        description:
            "Seu próximo ataque causa +2d8 de dano. Até o início do seu próximo turno, você não pode utilizar as reações Esquivar ou Bloquear."
    },


    {
        id:"luxuria",
        name:"Luxúria",

        permanentCost:{
            type:"pv",
            value:4
        },

        activationCost:null,

        activationType:"Passiva",

        active:true,

        description:
            "Recebe +5 em testes de interação. Uma vez por cena, pode dobrar todos os bônus aplicados em um único teste de interação."
    },


    {
        id:"preguica",
        name:"Preguiça",

        permanentCost:{
            type:"pv",
            value:4
        },

        activationCost:null,

        activationType:"Passiva",

        active:true,

        description:
            "Pode reutilizar 1 PA não gasto na rodada anterior."
    },


    {
        id:"orgulho",
        name:"Orgulho",

        permanentCost:{
            type:"pv",
            value:4
        },

        activationCost:null,

        activationType:"Passiva",

        active:true,

        description:
            "Enquanto não receber cura ou proteção de aliados, recebe Resistência a dano Mundano e de Sangue."
    },


    {
        id:"ganancia",
        name:"Ganância",

        permanentCost:{
            type:"pv",
            value:4
        },

        activationCost:{
            type:"pa",
            value:3
        },

        activationType:"Ativação",

        active:false,

        description:
            "Rouba uma habilidade ou ritual utilizado por uma ameaça. Enquanto não utilizar a habilidade roubada, o alvo também não poderá utilizá-la."
    },


    {
        id:"vinganca",
        name:"Vingança",

        permanentCost:{
            type:"pv",
            value:4
        },

        activationCost:null,

        activationType:"Passiva",

        active:true,

        description:
            "Sempre que um aliado morrer durante a cena, seu próximo ataque possui Acerto Crítico garantido."
    },


    {
        id:"instinto-predatorio",
        name:"Instinto Predatório",

        permanentCost:{
            type:"pv",
            value:4
        },

        activationCost:null,

        activationType:"Passiva",

        active:true,

        description:
            "Sempre que uma criatura entrar na sua posição ou iniciar o turno adjacente a você, pode realizar imediatamente um ataque corpo a corpo contra ela. Limite: 1 vez por rodada."
    },


    {
        id:"elo-carmesim",
        name:"Elo Carmesim",

        permanentCost:{
            type:"pv",
            value:4
        },

        activationCost:null,

        activationType:"Passiva",

        active:true,

        description:
            "Enquanto houver um aliado em até 1 posição de você, ambos recebem +5 na Defesa. Sempre que um dos dois sofrer dano, o outro recebe +5 no próximo ataque contra o agressor."
    },


    {
        id:"crescimento-anomalo",
        name:"Crescimento Anômalo",

        permanentCost:{
            type:"pv",
            value:4
        },

        activationCost:null,

        activationType:"Passiva",

        active:true,

        description:
            "Sempre que perder permanentemente um membro do corpo, ele cresce novamente após um descanso longo. O novo membro possui aparência grotesca e paranormal, funciona normalmente e não pode ser perdido novamente da mesma forma."
    },


    {
        id:"frenesi",
        name:"Frenesi",

        permanentCost:{
            type:"pv",
            value:4
        },

        activationCost:null,

        activationType:"Passiva",

        active:true,

        description:
            "Sempre que reduzir uma criatura a 0 PV, entra em um estado de Frenesi, recuperando imediatamente 2d8 PV. Limite: 1 vez por rodada."
    }
    

];


/*==========================================================
=              GARANTIR ASSIMILAÇÕES
==========================================================*/

function ensureCharacterAssimilations(){

    if(
        !Array.isArray(
            characterAssimilationsState
        )
    ){

        characterAssimilationsState = [];

    }

}


/*==========================================================
=              ADQUIRIR ASSIMILAÇÃO
==========================================================*/

/*==========================================================
=              ADQUIRIR ASSIMILAÇÃO
==========================================================*/

function addAssimilationToCharacter(
    assimilationId
){

    ensureCharacterAssimilations();


    const assimilation =
        DEFAULT_ASSIMILATIONS.find(
            item =>
                item.id ===
                assimilationId
        );


    if(!assimilation){

        return false;

    }


    const alreadyHas =
        characterAssimilationsState.some(
            item =>
                item.id ===
                assimilation.id
        );


    if(alreadyHas){

        showCharacterEditorMessage(
            "Assimilação já adquirida",
            `${assimilation.name} já pertence ao personagem.`
        );

        return false;

    }


    /*
        VIDA POR PARTES:

        escolhemos primeiro qual parte
        sofrerá o custo permanente.
    */

    if(lifeMode?.value === "body"){

        openAssimilationBodyCostSelector(
            assimilation
        );

        return "waiting";

    }


    /*
        VIDA CLÁSSICA
    */

    const cost =
        Number(
            assimilation
                .permanentCost
                ?.value
        ) || 0;


    const currentMaximum =
        Number(
            characterPVMax?.value
        ) || 0;


    if(currentMaximum <= cost){

        showCharacterEditorMessage(
            "PV insuficiente",
            `Você não possui PV máximo suficiente para adquirir ${assimilation.name}.`
        );

        return false;

    }


    characterAssimilationsState.push({

        id:
            assimilation.id,

        name:
            assimilation.name,

        description:
            assimilation.description,

        permanentCost:{

            ...structuredCloneSafe(
                assimilation.permanentCost
            ),

            bodyPart:null

        },

        activationCost:
            structuredCloneSafe(
                assimilation.activationCost
            ),

        activationType:
            assimilation.activationType,

        effects:
            structuredCloneSafe(assimilation.effects || {}),

        active:assimilation.activationType === "Passiva",

        acquiredAt:
            Date.now()

    });


    calculateAutomaticStats();

    renderAssimilationEditorList();


    showCharacterEditorMessage(
        "Assimilação adquirida",
        `${assimilation.name} foi adquirida por ${cost} PV permanentes.`
    );


    return true;

}

/*==========================================================
=              ATIVAR / DESATIVAR ASSIMILAÇÃO
==========================================================*/

function toggleAssimilation(
    assimilationId
){

    const assimilation =
        characterAssimilationsState
            .find(
                item =>
                    item.id ===
                    assimilationId
            );


    if(!assimilation){

        return;

    }


    /*======================================================
    =              DESATIVAR
    ======================================================*/

    if(assimilation.active){

        assimilation.active =
            false;

        renderAssimilationEditorList();


        showCharacterEditorMessage(
            assimilation.name,
            "Assimilação desativada."
        );


        return;

    }


    /*======================================================
    =              ATIVAR
    ======================================================*/

    const cost =
        Number(
            assimilation
                .activationCost
                ?.value
        ) || 0;


    const type =
        assimilation
            .activationCost
            ?.type;


    if(type === "pa"){

        const currentPA =
            Number(
                characterPA?.value
            ) || 0;


        if(currentPA < cost){

            showCharacterEditorMessage(
                "PA insuficiente",
                `Você precisa de ${cost} PA para ativar ${assimilation.name}.`
            );

            return;

        }


        characterPA.value =
            currentPA - cost;

    }

    if(type === "pm" || type === "pd"){
        const currentPM=Number(characterPD?.value)||0;
        if(currentPM<cost){showCharacterEditorMessage("PM insuficiente",`Você precisa de ${cost} PM para ativar ${assimilation.name}.`);return;}
        characterPD.value=currentPM-cost;
    }


    assimilation.active =
        true;


    renderAssimilationEditorList();


    showCharacterEditorMessage(
        assimilation.name,
        `${assimilation.name} foi ativada por ${cost} PA.`
    );

}

/*==========================================================
=              LISTA DE ASSIMILAÇÕES
==========================================================*/

function renderAssimilationEditorList(){

    const container =
        document.getElementById(
            "assimilationsEditorList"
        );


    if(!container){

        return;

    }


    if(
        characterAssimilationsState
            .length === 0
    ){

        container.innerHTML = `

            <div class="editor-empty-state">

                <span>◈</span>

                <p>
                    Nenhuma assimilação adicionada.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        characterAssimilationsState
            .map(
                assimilation => `

                <div
                    class="assimilation-editor-card
                    ${
                        assimilation.active
                            ? "active"
                            : ""
                    }"
                >

                    <div class="assimilation-editor-header">

                        <div>

                            <h3>
                                ${escapeCharacterEditorHTML(
                                    assimilation.name
                                )}
                            </h3>

                            <span class="assimilation-editor-type">

                                ${
                                    assimilation.active
                                        ? "ATIVA"
                                        : escapeCharacterEditorHTML(
                                            assimilation.activationType ||
                                            "Assimilação"
                                        )
                                }

                            </span>

                        </div>


                        <span class="assimilation-editor-cost">

                            ${
                                Number(
                                    assimilation
                                        .permanentCost
                                        ?.value
                                ) || 0
                            }
                            PV

                        </span>

                    </div>


                    <p class="assimilation-editor-description">

                        ${escapeCharacterEditorHTML(
                            assimilation.description ||
                            ""
                        )}

                    </p>


                    <button
                        type="button"
                        class="${
                            assimilation.active
                                ? "secondary-button"
                                : "primary-button"
                        } assimilation-toggle-button"
                        data-assimilation="${escapeCharacterEditorHTML(
                            assimilation.id
                        )}"
                    >

                        ${
                            assimilation.active
                                ? "Desativar"
                                : `Ativar • ${
                                    Number(
                                        assimilation
                                            .activationCost
                                            ?.value
                                    ) || 0
                                } PA`
                        }

                    </button>

<button
    type="button"
    class="remove-content-button remove-assimilation-button"
    data-assimilation="${escapeCharacterEditorHTML(
        assimilation.id
    )}"
>

    Remover

</button>

                </div>


            `
            )
            .join("");


    container
        .querySelectorAll(
            ".assimilation-toggle-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    toggleAssimilation(
                        button.dataset
                            .assimilation
                    );

                }
            );

        });

        container
    .querySelectorAll(
        ".remove-assimilation-button"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                removeCharacterAssimilation(
                    button.dataset.assimilation
                );

            }
        );

    });

}

/*==========================================================
=              BOTÃO + ASSIMILAÇÃO
==========================================================*/

document
    .getElementById(
        "addAssimilationEditor"
    )
    ?.addEventListener(
        "click",
        openAssimilationSelector
    );


/*==========================================================
=              SELETOR DE ASSIMILAÇÕES
==========================================================*/

function openAssimilationSelector(){

    document
        .getElementById(
            "assimilationSelectorModal"
        )
        ?.remove();


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "assimilationSelectorModal";

    modal.className =
        "editor-message";


    const cards =
        DEFAULT_ASSIMILATIONS
            .map(
                assimilation => `

                <button
                    type="button"
                    class="ability-choice-card assimilation-choice-card"
                    data-assimilation="${escapeCharacterEditorHTML(
                        assimilation.id
                    )}"
                >

                    <strong>
                        🩸
                        ${escapeCharacterEditorHTML(
                            assimilation.name
                        )}
                    </strong>

                    <span>

                        ${Number(
                            assimilation
                                .permanentCost
                                ?.value
                        ) || 0}
                        PV permanente

                        •

                        ${Number(
                            assimilation
                                .activationCost
                                ?.value
                        ) || 0}
                        PA para ativar

                    </span>

                    <p>
                        ${escapeCharacterEditorHTML(
                            assimilation.description ||
                            ""
                        )}
                    </p>

                </button>

            `
            )
            .join("");


    modal.innerHTML = `

        <div class="prosthetic-editor-modal">

            <span class="section-label">

                ASSIMILAÇÕES

            </span>

            <h2>

                Adicionar Assimilação

            </h2>


            <div class="editor-dynamic-list">

                ${cards}

            </div>


            <button
                type="button"
                id="closeAssimilationSelector"
                class="secondary-button"
                style="
                    width:100%;
                    margin-top:18px;
                "
            >

                Fechar

            </button>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    modal
        .querySelectorAll(
            ".assimilation-choice-card"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const result =
                        addAssimilationToCharacter(
                            button.dataset
                                .assimilation
                        );


                    /*
                        Vida clássica:
                        a Assimilação é adicionada
                        imediatamente.
                    */

                    if(result === true){

                        modal.remove();

                        return;

                    }


                    /*
                        Partes do corpo:
                        precisamos fechar este modal
                        para abrir o seletor do membro.
                    */

                    if(result === "waiting"){

                        modal.remove();

                    }

                }
            );

        });


    modal
        .querySelector(
            "#closeAssimilationSelector"
        )
        ?.addEventListener(
            "click",
            () => {

                modal.remove();

            }
        );


    modal.addEventListener(
        "click",
        event => {

            if(event.target === modal){

                modal.remove();

            }

        }
    );

}

/*==========================================================
=       ESCOLHER PARTE PARA CUSTO DA ASSIMILAÇÃO
==========================================================*/

function openAssimilationBodyCostSelector(
    assimilation
){

    document
        .getElementById(
            "assimilationBodyCostModal"
        )
        ?.remove();


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "assimilationBodyCostModal";

    modal.className =
        "editor-message";


    const cost =
        Number(
            assimilation
                .permanentCost
                ?.value
        ) || 0;


    const parts = [

        {
            id:"head",
            name:"Cabeça",
            input:bodyHead
        },

        {
            id:"chest",
            name:"Torso",
            input:bodyChest
        },

        {
            id:"leftArm",
            name:"Braço Esquerdo",
            input:bodyLeftArm
        },

        {
            id:"rightArm",
            name:"Braço Direito",
            input:bodyRightArm
        },

        {
            id:"leftLeg",
            name:"Perna Esquerda",
            input:bodyLeftLeg
        },

        {
            id:"rightLeg",
            name:"Perna Direita",
            input:bodyRightLeg
        }

    ];


    const availableParts =
        parts.filter(part => {

            const state =
                characterBodyState[
                    part.id
                ] || {
                    type:"natural"
                };


            /*
                Não sacrificamos PV
                de membro ausente ou prótese.
            */

            if(
                state.type !== "natural"
            ){

                return false;

            }


            const naturalMax =
                Number(
                    part.input
                        ?.dataset.max
                ) || 0;


            const alreadySacrificed =
                getBodyPartPermanentPVCost(
                    part.id
                );


            return (
                naturalMax -
                alreadySacrificed -
                cost
            ) > 0;

        });


    if(availableParts.length === 0){

        showCharacterEditorMessage(
            "PV insuficiente",
            `Nenhuma parte do corpo possui PV suficiente para pagar o custo de ${cost} PV de ${assimilation.name}.`
        );

        return;

    }


    const buttons =
        availableParts
            .map(part => {

                const baseMax =
                    Number(
                        part.input
                            ?.dataset.max
                    ) || 0;


                const previousCost =
                    getBodyPartPermanentPVCost(
                        part.id
                    );


                const finalMax =
                    baseMax -
                    previousCost -
                    cost;


                return `

                    <button
                        type="button"
                        class="assimilation-body-part-choice"
                        data-part="${part.id}"
                    >

                        <strong>
                            ${part.name}
                        </strong>

                        <span>
                            ${baseMax - previousCost}
                            →
                            ${finalMax} PV
                        </span>

                    </button>

                `;

            })
            .join("");


    modal.innerHTML = `

        <div class="prosthetic-editor-modal">

            <span class="section-label">
                CUSTO DA ASSIMILAÇÃO
            </span>

            <h2>
                ${escapeCharacterEditorHTML(
                    assimilation.name
                )}
            </h2>

            <p>
                Escolha qual parte do corpo perderá
                ${cost} PV permanentemente.
            </p>

            <div class="assimilation-body-grid">

                ${buttons}

            </div>

            <button
                type="button"
                id="cancelAssimilationBodyCost"
                class="secondary-button"
                style="width:100%;margin-top:18px;"
            >

                Cancelar

            </button>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    modal
        .querySelectorAll(
            ".assimilation-body-part-choice"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    acquireBodyAssimilation(
                        assimilation,
                        button.dataset.part
                    );

                    modal.remove();

                }
            );

        });


    modal
        .querySelector(
            "#cancelAssimilationBodyCost"
        )
        ?.addEventListener(
            "click",
            () => {

                modal.remove();

            }
        );

}

/*==========================================================
=          CUSTOS PERMANENTES POR PARTE
==========================================================*/

function getBodyPartPermanentPVCost(
    partName
){

    return characterAssimilationsState
        .reduce(
            (total,assimilation) => {

                if(
                    assimilation
                        .permanentCost
                        ?.type !== "pv"
                ){

                    return total;

                }


                if(
                    assimilation
                        .permanentCost
                        ?.bodyPart !==
                    partName
                ){

                    return total;

                }


                return (
                    total +
                    (
                        Number(
                            assimilation
                                .permanentCost
                                .value
                        ) || 0
                    )
                );

            },
            0
        );

}

/*==========================================================
=          ADQUIRIR ASSIMILAÇÃO NO CORPO
==========================================================*/

function acquireBodyAssimilation(
    assimilation,
    partName
){

    const cost =
        Number(
            assimilation
                .permanentCost
                ?.value
        ) || 0;


    characterAssimilationsState.push({

        id:
            assimilation.id,

        name:
            assimilation.name,

        description:
            assimilation.description,

        permanentCost:{

            ...structuredCloneSafe(
                assimilation.permanentCost
            ),

            bodyPart:
                partName

        },

        activationCost:
            structuredCloneSafe(
                assimilation.activationCost
            ),

        activationType:
            assimilation.activationType,

        effects:
            structuredCloneSafe(assimilation.effects || {}),

        active:assimilation.activationType === "Passiva",

        acquiredAt:
            Date.now()

    });


    calculateAutomaticStats();

    renderAssimilationEditorList();


    showCharacterEditorMessage(
        "Assimilação adquirida",
        `${assimilation.name} consumiu ${cost} PV permanentemente de ${getBodyPartLabel(partName)}.`
    );

}

function getBodyPartLabel(
    partName
){

    const labels = {

        head:
            "Cabeça",

        chest:
            "Torso",

        leftArm:
            "Braço Esquerdo",

        rightArm:
            "Braço Direito",

        leftLeg:
            "Perna Esquerda",

        rightLeg:
            "Perna Direita"

    };


    return labels[partName] ||
        "Parte do Corpo";

}

/*==========================================================
=              REMOVER HABILIDADE
==========================================================*/

function removeCharacterAbility(
    abilityId
){

    const ability =
        characterAbilitiesState.find(
            item =>
                item.id === abilityId
        );


    if(!ability){

        return;

    }


    openRemoveConfirmation({

        type:"Habilidade",

        name:
            ability.name,

        message:
            ability.permanentCost
                ? `Ao remover esta habilidade, o custo permanente de ${ability.permanentCost.value} ${ability.permanentCost.type.toUpperCase()} deixará de ser aplicado.`
                : "Esta habilidade será removida da ficha.",

        onConfirm:() => {

            characterAbilitiesState =
                characterAbilitiesState.filter(
                    item =>
                        item.id !== abilityId
                );


            /*
                Recalcular devolve automaticamente
                o máximo consumido pela habilidade.
            */

            calculateAutomaticStats();

            renderAbilityEditorList();


            showCharacterEditorMessage(
                "Habilidade removida",
                `${ability.name} foi removida da ficha.`
            );

        }

    });

}

/*==========================================================
=              REMOVER ASSIMILAÇÃO
==========================================================*/

function removeCharacterAssimilation(
    assimilationId
){

    const assimilation =
        characterAssimilationsState.find(
            item =>
                item.id === assimilationId
        );


    if(!assimilation){

        return;

    }


    let costMessage =
        "A Assimilação será removida da ficha.";


    if(
        assimilation.permanentCost
            ?.type === "pv"
    ){

        const part =
            assimilation
                .permanentCost
                ?.bodyPart;


        if(part){

            costMessage =
                `Os ${assimilation.permanentCost.value} PV permanentes sacrificados de ${getBodyPartLabel(part)} serão restaurados ao máximo dessa parte.`;

        }
        else{

            costMessage =
                `Os ${assimilation.permanentCost.value} PV permanentes serão restaurados ao seu PV máximo.`;

        }

    }


    openRemoveConfirmation({

        type:"Assimilação",

        name:
            assimilation.name,

        message:
            costMessage,

        onConfirm:() => {

            characterAssimilationsState =
                characterAssimilationsState.filter(
                    item =>
                        item.id !== assimilationId
                );


            calculateAutomaticStats();

            renderAssimilationEditorList();


            showCharacterEditorMessage(
                "Assimilação removida",
                `${assimilation.name} foi removida da ficha.`
            );

        }

    });

}

/*==========================================================
=              CONFIRMAR REMOÇÃO
==========================================================*/

function openRemoveConfirmation({

    type = "Conteúdo",

    name = "Item",

    message =
        "Tem certeza que deseja remover?",

    onConfirm

}){


    document
        .getElementById(
            "removeConfirmationModal"
        )
        ?.remove();


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "removeConfirmationModal";

    modal.className =
        "editor-message";


    modal.innerHTML = `

        <div class="remove-confirmation-modal">

            <div class="remove-confirmation-icon">

                ×

            </div>


            <span class="section-label">

                REMOVER ${escapeCharacterEditorHTML(
                    type.toUpperCase()
                )}

            </span>


            <h2>

                ${escapeCharacterEditorHTML(
                    name
                )}

            </h2>


            <p>

                ${escapeCharacterEditorHTML(
                    message
                )}

            </p>


            <div class="remove-confirmation-warning">

                Esta ação altera permanentemente
                os dados atuais da ficha após salvar.

            </div>


            <div class="remove-confirmation-actions">

                <button
                    type="button"
                    id="cancelRemoveCharacterContent"
                    class="secondary-button">

                    Cancelar

                </button>


                <button
                    type="button"
                    id="confirmRemoveCharacterContent"
                    class="danger-button">

                    Remover

                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    modal
        .querySelector(
            "#cancelRemoveCharacterContent"
        )
        ?.addEventListener(
            "click",
            () => {

                modal.remove();

            }
        );


    modal
        .querySelector(
            "#confirmRemoveCharacterContent"
        )
        ?.addEventListener(
            "click",
            () => {

                modal.remove();

                if(
                    typeof onConfirm ===
                    "function"
                ){

                    onConfirm();

                }

            }
        );


    modal.addEventListener(
        "click",
        event => {

            if(
                event.target === modal
            ){

                modal.remove();

            }

        }
    );

}

/*==========================================================
=              CONDIÇÕES DISPONÍVEIS
==========================================================*/

const DEFAULT_CONDITIONS = [

    {
        id:"sangramento",

        name:"Sangramento",

        category:"physical",

        icon:"🩸",

        stackable:true,

        defaultStacks:1,

        description:
            "Sofre 1d6 de dano por rodada. Stacks adicionais podem aumentar a quantidade de dados de dano.",

        effects:{
            damagePerRound:{
                dice:"1d6",
                perStack:true
            }
        }
    },


    {
        id:"envenenamento",

        name:"Envenenamento",

        category:"physical",

        icon:"☠️",

        stackable:true,

        defaultStacks:1,

        description:
            "Sofre 2d4 de dano por rodada e recebe -5 em testes de Vigor. Quanto maior o acúmulo, maior o dano. Quando a condição termina, o alvo fica Enjoado.",

        effects:{
            damagePerRound:{
                dice:"2d4",
                perStack:true
            },

            vigorPenalty:-5,

            onEndCondition:"enjoado"
        }
    },


    {
        id:"chamas",

        name:"Chamas",

        category:"physical",

        icon:"🪨",

        stackable:false,

        description:
            "Sofre 2d6 de dano por rodada. Gasta 1 PA para sair da condição.",

        effects:{
            damagePerRound:{
                dice:"2d6"
            },

            removeCost:{
                type:"pa",
                value:1
            }
        }
    },


    {
        id:"paralisia",

        name:"Paralisia",

        category:"physical",

        icon:"⚡",

        stackable:false,

        description:
            "Testes contra o alvo possuem acerto garantido e o alvo fracassa automaticamente em testes.",

        effects:{
            guaranteedHitsAgainst:true,
            automaticTestFailure:true
        }
    },


    {
        id:"paralisia-total",

        name:"Paralisia Total",

        category:"physical",

        icon:"⚡",

        stackable:false,

        description:
            "Mantém todos os efeitos de Paralisia. Se o alvo estiver abaixo de 20% dos PV, pode ser finalizado gastando 3 PA.",

        effects:{
            guaranteedHitsAgainst:true,

            automaticTestFailure:true,

            execution:{
                belowPVPercent:20,
                cost:{
                    type:"pa",
                    value:3
                }
            }
        }
    },


    {
        id:"imobilizado",

        name:"Imobilizado",

        category:"physical",

        icon:"🧱",

        stackable:false,

        description:
            "Recebe -10 em testes físicos e -10 na Defesa.",

        effects:{
            physicalTests:-10,
            defense:-10
        }
    },


    {
        id:"caido",

        name:"Caído",

        category:"physical",

        icon:"🪨",

        stackable:false,

        description:
            "Recebe -1 dado em testes físicos e -5 na Defesa.",

        effects:{
            physicalDice:-1,
            defense:-5
        }
    },


    {
        id:"enjoado",

        name:"Enjoado",

        category:"physical",

        icon:"🤢",

        stackable:false,

        description:
            "Recebe -3 em testes físicos. Duração: 1d4 + 1 rodadas.",

        duration:{
            type:"dice",
            formula:"1d4+1"
        },

        effects:{
            physicalTests:-3
        }
    },


    {
        id:"morrendo",

        name:"Morrendo",

        category:"physical",

        icon:"🩸",

        stackable:false,

        description:
            "Não possui PA e permanece inconsciente. No sistema clássico, morrerá se sofrer dano equivalente a 50% do PV máximo enquanto estiver Morrendo. Em Partes do Corpo, ao Torso chegar a 0 o personagem cai inconsciente e pode ser finalizado. Ao sair da condição, recupera a consciência após 1 rodada.",

        effects:{
            noPA:true,
            unconscious:true,

            classicDeathDamagePercent:50,

            bodyTorsoExecution:true,

            recoveryDelayRounds:1
        }
    },


    {
        id:"machucado",

        name:"Machucado",

        category:"physical",

        icon:"🧱",

        stackable:false,

        description:
            "Condição apenas visual.",

        effects:{}
    },


    {
        id:"debilitado",

        name:"Debilitado",

        category:"physical",

        icon:"🧱",

        stackable:false,

        description:
            "Recebe -1 PA por rodada.",

        effects:{
            paPerRound:-1
        }
    },


    {
        id:"enfraquecido",

        name:"Enfraquecido",

        category:"physical",

        icon:"🧱",

        stackable:false,

        description:
            "Recebe -5 em testes de Força.",

        effects:{
            strengthTests:-5
        }
    },


    {
        id:"lento",

        name:"Lento",

        category:"physical",

        icon:"🐌",

        stackable:false,

        description:
            "Recebe -5 em testes de Agilidade.",

        effects:{
            agilityTests:-5
        }
    },


    {
        id:"cansado",

        name:"Cansado",

        category:"physical",

        icon:"😵",

        stackable:false,

        description:
            "Habilidades custam o dobro enquanto a condição estiver ativa.",

        effects:{
            doubleAbilityCost:true
        }
    },

    {
    id:"controlado",

    name:"Controlado",

    category:"mental",

    icon:"🧠",

    stackable:false,

    description:
        "Entrega seus PA para o conjurador.",

    effects:{
        controlled:true
    }
},


{
    id:"cego",

    name:"Cego",

    category:"mental",

    icon:"👁️",

    stackable:false,

    description:
        "Recebe -10 em Percepção baseada em visão e -10 em ataques à distância.",

    effects:{
        visionPerception:-10,
        rangedAttack:-10
    }
},


{
    id:"surdo",

    name:"Surdo",

    category:"mental",

    icon:"🔇",

    stackable:false,

    description:
        "Recebe -10 em Percepção baseada em audição.",

    effects:{
        hearingPerception:-10
    }
},


{
    id:"traumatizado",

    name:"Traumatizado",

    category:"mental",

    icon:"🧠",

    stackable:false,

    description:
        "Recebe -5 em testes de Vontade.",

    effects:{
        willTests:-5
    }
},


{
    id:"penumbra",

    name:"Penumbra",

    category:"mental",

    icon:"🌑",

    stackable:false,

    description:
        "Recebe -5 em Percepção e -3 em Reflexos.",

    effects:{
        perception:-5,
        reflexes:-3
    }
},


{
    id:"vulneravel",

    name:"Vulnerável",

    category:"mental",

    icon:"🎯",

    stackable:false,

    description:
        "Sofre o dobro de dano bônus. Apenas o dano bônus é dobrado; dados de dano não são afetados.",

    effects:{
        doubleBonusDamage:true
    }
},


{
    id:"desprevenido",

    name:"Desprevenido",

    category:"mental",

    icon:"😶",

    stackable:false,

    description:
        "Não pode usar reações e recebe -5 na Defesa.",

    effects:{
        reactionsDisabled:true,
        defense:-5
    }
},


{
    id:"confuso",

    name:"Confuso",

    category:"mental",

    icon:"🌀",

    stackable:false,

    description:
        "Move-se aleatoriamente e consome 1 PA por rodada. Duração: 1d4 rodadas.",

    duration:{
        type:"dice",
        formula:"1d4"
    },

    effects:{
        randomMovement:true,
        paPerRound:-1
    }
},

{
    id:"protegido",
    name:"Protegido",
    category:"positive",
    icon:"🛡️",
    stackable:false,
    description:"Ataques de ameaças contra este personagem custam +1 PA.",
    effects:{
        enemyAttackPACost:1
    }
},

];

/*==========================================================
=              ADICIONAR CONDIÇÃO
==========================================================*/

function addConditionToCharacter(
    conditionId
){

    const condition =
        DEFAULT_CONDITIONS.find(
            item =>
                item.id === conditionId
        );


    if(!condition){

        return false;

    }


    const existing =
        characterConditionsState.find(
            item =>
                item.id === condition.id
        );


    /*
        Condição acumulável.
    */

    if(
        existing &&
        condition.stackable
    ){

        existing.stacks =
            Math.max(
                1,
                Number(
                    existing.stacks
                ) || 1
            ) + 1;


        renderConditionEditorList();

        return true;

    }


    /*
        Não acumulável.
    */

    if(existing){

        showCharacterEditorMessage(
            "Condição já ativa",
            `${condition.name} já está aplicada ao personagem.`
        );

        return false;

    }


    const newCondition = {

        id:
            condition.id,

        name:
            condition.name,

        icon:
            condition.icon,

        category:
            condition.category,

        description:
            condition.description,

        stackable:
            condition.stackable,

        stacks:
            condition.defaultStacks || 1,

        effects:
            structuredCloneSafe(
                condition.effects || {}
            ),

        duration:
            structuredCloneSafe(
                condition.duration || null
            ),

        appliedAt:
            Date.now()

    };


    characterConditionsState.push(
        newCondition
    );

calculateAutomaticStats();
    renderConditionEditorList();

    renderCharacterPhoto();


    showCharacterEditorMessage(
        "Condição adicionada",
        `${condition.name} foi aplicada ao personagem.`
    );


    return true;

}

/*==========================================================
=              ABRIR SELETOR DE CONDIÇÕES
==========================================================*/

document
    .getElementById(
        "addConditionEditor"
    )
    ?.addEventListener(
        "click",
        openConditionSelector
    );


function openConditionSelector(){

    document
        .getElementById(
            "conditionSelectorModal"
        )
        ?.remove();


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "conditionSelectorModal";

    modal.className =
        "editor-message";


    const cards =
        DEFAULT_CONDITIONS
            .map(condition => `

                <button
                    type="button"
                    class="condition-choice-card"
                    data-condition="${escapeCharacterEditorHTML(
                        condition.id
                    )}"
                >

                    <div class="condition-choice-icon">

                        ${condition.icon}

                    </div>


                    <div>

                        <strong>
                            ${escapeCharacterEditorHTML(
                                condition.name
                            )}
                        </strong>

                        <p>
                            ${escapeCharacterEditorHTML(
                                condition.description
                            )}
                        </p>

                    </div>

                </button>

            `)
            .join("");


    modal.innerHTML = `

        <div class="prosthetic-editor-modal condition-selector-panel">

            <span class="section-label">

                CONDIÇÕES

            </span>

            <h2>

                Adicionar Condição

            </h2>


            <div class="condition-selector-list">

                ${cards}

            </div>


            <button
                type="button"
                id="closeConditionSelector"
                class="secondary-button"
                style="
                    width:100%;
                    margin-top:18px;
                "
            >

                Fechar

            </button>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    modal
        .querySelectorAll(
            ".condition-choice-card"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const success =
                        addConditionToCharacter(
                            button.dataset.condition
                        );


                    if(success){

                        modal.remove();

                    }

                }
            );

        });


    modal
        .querySelector(
            "#closeConditionSelector"
        )
        ?.addEventListener(
            "click",
            () => {

                modal.remove();

            }
        );

}

/*==========================================================
=              RENDERIZAR CONDIÇÕES
==========================================================*/

function renderConditionEditorList(){

    const container =
        document.getElementById(
            "conditionsEditorList"
        );


    if(!container){

        return;

    }


    if(
        characterConditionsState.length === 0
    ){

        container.innerHTML = `

            <div class="editor-empty-state">

                <span>○</span>

                <p>
                    Nenhuma condição ativa.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        characterConditionsState
            .map(condition => `

                <div class="condition-editor-card">

                    <div class="condition-editor-header">

                        <div class="condition-editor-name">

                            <span class="condition-editor-icon">

                                ${condition.icon || "○"}

                            </span>

                            <div>

                                <span class="condition-category-badge">

    ${
        condition.category === "mental"
            ? "MENTAL"
            : "FÍSICA"
    }

</span>

<h3>

    ${escapeCharacterEditorHTML(
        condition.name
    )}

</h3>

                                ${
                                    condition.stackable
                                        ? `
                                            <span class="condition-stack">

                                                STACKS:
                                                ${
                                                    Number(
                                                        condition.stacks
                                                    ) || 1
                                                }

                                            </span>
                                        `
                                        : ""
                                }

                            </div>

                        </div>


                        ${
                            condition.stackable
                                ? `
                                    <div class="condition-stack-controls">

                                        <button
                                            type="button"
                                            class="condition-stack-button condition-stack-minus"
                                            data-condition="${condition.id}"
                                        >
                                            −
                                        </button>

                                        <button
                                            type="button"
                                            class="condition-stack-button condition-stack-plus"
                                            data-condition="${condition.id}"
                                        >
                                            +
                                        </button>

                                    </div>
                                `
                                : ""
                        }

                    </div>


                    <p>
                        ${escapeCharacterEditorHTML(
                            condition.description || ""
                        )}
                    </p>


                    <button
                        type="button"
                        class="remove-content-button remove-condition-button"
                        data-condition="${escapeCharacterEditorHTML(
                            condition.id
                        )}"
                    >

                        Remover

                    </button>

                </div>

            `)
            .join("");


    bindConditionCardEvents(
        container
    );

}

/*==========================================================
=              EVENTOS DAS CONDIÇÕES
==========================================================*/

function bindConditionCardEvents(
    container
){

    container
        .querySelectorAll(
            ".remove-condition-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    removeCharacterCondition(
                        button.dataset.condition
                    );

                }
            );

        });


    container
        .querySelectorAll(
            ".condition-stack-plus"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    changeConditionStack(
                        button.dataset.condition,
                        1
                    );

                }
            );

        });


    container
        .querySelectorAll(
            ".condition-stack-minus"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    changeConditionStack(
                        button.dataset.condition,
                        -1
                    );

                }
            );

        });

}

/*==========================================================
=              ALTERAR STACK
==========================================================*/

function changeConditionStack(
    conditionId,
    amount
){

    const condition =
        characterConditionsState.find(
            item =>
                item.id === conditionId
        );


    if(
        !condition ||
        !condition.stackable
    ){

        return;

    }


    condition.stacks =
        Math.max(
            1,
            (
                Number(
                    condition.stacks
                ) || 1
            ) + amount
        );


    renderConditionEditorList();

}


/*==========================================================
=              REMOVER CONDIÇÃO
==========================================================*/

function removeCharacterCondition(
    conditionId
){

    const condition =
        characterConditionsState.find(
            item =>
                item.id === conditionId
        );


    if(!condition){

        return;

    }


    openRemoveConfirmation({

        type:"Condição",

        name:
            condition.name,

        message:
            "A condição será removida do personagem.",

        onConfirm:() => {

            characterConditionsState =
                characterConditionsState.filter(
                    item =>
                        item.id !== conditionId
                );

calculateAutomaticStats();
            renderConditionEditorList();
            renderCharacterPhoto();


            showCharacterEditorMessage(
                "Condição removida",
                `${condition.name} foi removida da ficha.`
            );

        }

    });

}

/*==========================================================
=              CONSULTAR CONDIÇÕES
==========================================================*/

function hasCharacterCondition(
    conditionId
){

    return characterConditionsState.some(
        condition =>
            condition.id === conditionId
    );

}


function getCharacterCondition(
    conditionId
){

    return characterConditionsState.find(
        condition =>
            condition.id === conditionId
    ) || null;

}

/*==========================================================
=              PA MODIFICADO POR CONDIÇÕES
==========================================================*/

function calculateConditionPAModifier(){

    let modifier = 0;


    if(
        hasCharacterCondition(
            "debilitado"
        )
    ){

        modifier -= 1;

    }


    if(
        hasCharacterCondition(
            "confuso"
        )
    ){

        modifier -= 1;

    }


    return modifier;

}



/*==========================================================
=              MODIFICADORES DE CONDIÇÃO
==========================================================*/

function getConditionModifier(
    type
){

    let modifier = 0;


    characterConditionsState.forEach(
        condition => {

            const effects =
                condition.effects || {};


            switch(type){

                case "defense":

                    modifier +=
                        Number(
                            effects.defense
                        ) || 0;

                    break;


                case "strength":

                    modifier +=
                        Number(
                            effects.strengthTests
                        ) || 0;

                    break;


                case "agility":

                    modifier +=
                        Number(
                            effects.agilityTests
                        ) || 0;

                    break;


                case "physical":

                    modifier +=
                        Number(
                            effects.physicalTests
                        ) || 0;

                    break;


                case "will":

                    modifier +=
                        Number(
                            effects.willTests
                        ) || 0;

                    break;


                case "perception":

                    modifier +=
                        Number(
                            effects.perception
                        ) || 0;

                    break;


                case "reflexes":

                    modifier +=
                        Number(
                            effects.reflexes
                        ) || 0;

                    break;


                case "rangedAttack":

                    modifier +=
                        Number(
                            effects.rangedAttack
                        ) || 0;

                    break;

            }

        }
    );


    return modifier;

}



    /*==========================================================
=              PERÍCIAS DISPONÍVEIS
==========================================================*/

const DEFAULT_SKILLS = [

    {
        id:"manobra",
        name:"Manobra",
        defaultAttributes:["for","agi"]
    },

    {
        id:"disciplina",
        name:"Disciplina",
        defaultAttributes:["pre"]
    },

    {
        id:"especializacao",
        name:"Especialização",
        defaultAttributes:["int"]
    },

    {
        id:"discreto",
        name:"Discreto",
        defaultAttributes:["agi","pre"]
    },

    {
        id:"artificio",
        name:"Artifício",
        defaultAttributes:["pre"]
    },

    {
        id:"fortitude",
        name:"Fortitude",
        defaultAttributes:["vig"]
    },


    {
        id:"intimidacao",
        name:"Intimidação",
        defaultAttributes:["pre"]
    },

    {
        id:"deducao",
        name:"Dedução",
        defaultAttributes:["int"]
    },

    {
        id:"luta",
        name:"Luta",
        defaultAttributes:["for"]
    },

    {
        id:"medicina",
        name:"Medicina",
        defaultAttributes:["int"]
    },

    {
        id:"ocultismo",
        name:"Ocultismo",
        defaultAttributes:["int"]
    },

    {
        id:"percepcao",
        name:"Percepção",
        defaultAttributes:["pre"]
    },

    {
        id:"pilotagem",
        name:"Pilotagem",
        defaultAttributes:["agi"]
    },

    {
        id:"pontaria",
        name:"Pontaria",
        defaultAttributes:["agi"]
    },

    {
        id:"presteza",
        name:"Presteza",
        defaultAttributes:["agi"]
    },

    {
        id:"sobrevivencia",
        name:"Sobrevivência",
        defaultAttributes:["int"]
    },

    {
        id:"informacao",
        name:"Informação",
        defaultAttributes:["int"]
    },

    {
        id:"vontade",
        name:"Vontade",
        defaultAttributes:["pre"]
    },

    {
        id:"sorte",
        name:"Sorte",
        defaultAttributes:["pre"]
    }

];

/*==========================================================
=              INICIALIZAR PERÍCIAS
==========================================================*/

/*==========================================================
=              INICIALIZAR PERÍCIAS
==========================================================*/

function initializeCharacterSkills(){

    const savedSkills =
        Array.isArray(
            editingCharacter?.skills
        )
            ? editingCharacter.skills
            : [];


    characterSkillsState =
        DEFAULT_SKILLS.map(
            defaultSkill => {

                const saved =
                    savedSkills.find(
                        skill =>
                            skill.id ===
                            defaultSkill.id
                    );


                return {

                    id:
                        defaultSkill.id,

                    name:
                        defaultSkill.name,

                    defaultAttributes:
                        structuredCloneSafe(
                            defaultSkill.defaultAttributes
                        ),

                    selectedAttribute:
                        saved?.selectedAttribute ||
                        defaultSkill.defaultAttributes[0],

                    training:
                        [
                            "0",
                            "1d4",
                            "1d8",
                            "1d12",
                            "1d20"
                        ].includes(
                            saved?.training
                        )
                            ? saved.training
                            : "0",

                    bonus:
                        Number(
                            saved?.bonus
                        ) || 0,

                    penalty:
                        Number(
                            saved?.penalty
                        ) || 0

                };

            }
        );


    renderSkillsEditor();

    renderSkillPointsSummary();

}

/*==========================================================
=              RENDERIZAR PERÍCIAS
==========================================================*/

function renderSkillsEditor(){

    const container =
        document.getElementById(
            "skillsEditorList"
        );


    if(!container){

        return;

    }


    container.innerHTML =
        characterSkillsState
            .map(skill => {

                const attributeOptions =
                    createSkillAttributeOptions(
                        skill
                    );


                const total =
                    calculateSkillStaticTotal(
                        skill
                    );


                return `

                    <div
                        class="skill-editor-row"
                        data-skill="${skill.id}"
                    >

                        <span class="skill-name">

                            ${escapeCharacterEditorHTML(
                                skill.name
                            )}

                        </span>


                        <select
                            class="skill-attribute-select"
                            data-skill="${skill.id}"
                        >

                            ${attributeOptions}

                        </select>


                        <select
                            class="skill-training-select"
                            data-skill="${skill.id}"
                        >

                            <option
                                value="0"
                                ${
                                    skill.training === "0"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Despreparado
                            </option>

                            <option
                                value="1d4"
                                ${
                                    skill.training === "1d4"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Treinado • 1d4
                            </option>

                            <option
                                value="1d8"
                                ${
                                    skill.training === "1d8"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Experiente • 1d8
                            </option>

                            <option
                                value="1d12"
                                ${
                                    skill.training === "1d12"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Expert • 1d12
                            </option>

                            <option
                                value="1d20"
                                ${
                                    skill.training === "1d20"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Gênio • 1d20
                            </option>

                        </select>


                        <input
                            type="number"
                            class="skill-bonus-input"
                            data-skill="${skill.id}"
                            min="-10"
                            max="10"
                            value="${
                                Number(
                                    skill.bonus
                                ) || 0
                            }"
                        >


                        <input
                            type="number"
                            class="skill-penalty-input"
                            data-skill="${skill.id}"
                            min="-50"
                            max="0"
                            value="${
                                Number(
                                    skill.penalty
                                ) || 0
                            }"
                        >


                        <span class="skill-total">

                            ${total >= 0 ? "+" : ""}
                            ${total}

                        </span>

                        <button
    type="button"
    class="skill-roll-button"
    data-skill="${skill.id}"
    title="Rolar ${escapeCharacterEditorHTML(
        skill.name
    )}"
>

    🎲

</button>

                    </div>

                `;

            })
            .join("");


    bindSkillEditorEvents();

}

/*==========================================================
=              ATRIBUTOS DA PERÍCIA
==========================================================*/

function createSkillAttributeOptions(
    skill
){

    const attributes = [

        {
            id:"for",
            label:"FOR"
        },

        {
            id:"agi",
            label:"AGI"
        },

        {
            id:"int",
            label:"INT"
        },

        {
            id:"vig",
            label:"VIG"
        },

        {
            id:"pre",
            label:"PRE"
        }

    ];


    return attributes
        .map(attribute => {

            const isDefault =
                skill.defaultAttributes
                    ?.includes(
                        attribute.id
                    );


            return `

                <option
                    value="${attribute.id}"
                    ${
                        skill.selectedAttribute ===
                        attribute.id
                            ? "selected"
                            : ""
                    }
                >

                    ${attribute.label}
                    ${isDefault ? " • padrão" : ""}

                </option>

            `;

        })
        .join("");

}

/*==========================================================
=              EVENTOS DAS PERÍCIAS
==========================================================*/

function bindSkillEditorEvents(){

    /*======================================================
    =              TROCAR ATRIBUTO
    ======================================================*/

    document
        .querySelectorAll(
            ".skill-attribute-select"
        )
        .forEach(select => {

            select.addEventListener(
                "change",
                () => {

                    const skill =
                        getCharacterSkill(
                            select.dataset.skill
                        );


                    if(!skill){

                        return;

                    }


                    skill.selectedAttribute =
                        select.value;


                    renderSkillsEditor();

                    renderSkillPointsSummary();

                }
            );

        });


    /*======================================================
    =              ALTERAR TREINO
    ======================================================*/

    document
        .querySelectorAll(
            ".skill-training-select"
        )
        .forEach(select => {

            select.addEventListener(
                "change",
                () => {

                    const skill =
                        getCharacterSkill(
                            select.dataset.skill
                        );


                    if(!skill){

                        return;

                    }


                    const requestedTraining =
                        select.value;


                    const oldTraining =
                        skill.training || "0";


                    const oldCost =
                        getSkillTrainingPointCost(
                            oldTraining
                        );


                    const newCost =
                        getSkillTrainingPointCost(
                            requestedTraining
                        );


                    const difference =
                        newCost - oldCost;


                    /*
                        Primeiro verifica
                        nível / INT.
                    */

                    if(
                        !canUseSkillTraining(
                            requestedTraining,
                            skill.id
                        )
                    ){

                        renderSkillsEditor();

                        return;

                    }


                    /*
                        Depois verifica pontos.
                    */

                    if(difference > 0){

                        const available =
                            calculateAvailableSkillPoints();


                        if(
                            available <
                            difference
                        ){

                            showCharacterEditorMessage(
                                "Pontos insuficientes",
                                `Você precisa de ${difference} ponto(s) de perícia, mas possui apenas ${available} disponível(is).`
                            );


                            renderSkillsEditor();

                            return;

                        }

                    }


                    /*
    Salva novo treino.
*/

skill.training =
    requestedTraining;


renderSkillsEditor();

renderSkillPointsSummary();

                }
            );

        });


    /*======================================================
    =              BÔNUS
    ======================================================*/

    document
        .querySelectorAll(
            ".skill-bonus-input"
        )
        .forEach(input => {

            input.addEventListener(
                "change",
                () => {

                    const skill =
                        getCharacterSkill(
                            input.dataset.skill
                        );


                    if(!skill){

                        return;

                    }


                    skill.bonus =
                        Math.max(
                            -10,
                            Math.min(
                                10,
                                Number(
                                    input.value
                                ) || 0
                            )
                        );


                    renderSkillsEditor();

                }
            );

        });


    /*======================================================
    =              PENALIDADE
    ======================================================*/

    document
        .querySelectorAll(
            ".skill-penalty-input"
        )
        .forEach(input => {

            input.addEventListener(
                "change",
                () => {

                    const skill =
                        getCharacterSkill(
                            input.dataset.skill
                        );


                    if(!skill){

                        return;

                    }


                    skill.penalty =
                        Math.min(
                            0,
                            Number(
                                input.value
                            ) || 0
                        );


                    renderSkillsEditor();

                }
            );

        });


    /*======================================================
    =              ROLAR PERÍCIA
    ======================================================*/

    document
        .querySelectorAll(
            ".skill-roll-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    rollCharacterSkill(
                        button.dataset.skill
                    );

                }
            );

        });

}



function getCharacterSkill(
    skillId
){

    return characterSkillsState.find(
        skill =>
            skill.id === skillId
    ) || null;

}

/*==========================================================
=              LIMITES DE TREINO
==========================================================*/

function canUseSkillTraining(
    training,
    skillId
){

    const level =
        Math.max(
            1,
            Number(
                characterLevel?.value
            ) || 1
        );


    const intelligence =
        Math.max(
            0,
            Number(
                attributeINT?.value
            ) || 0
        );


    /*
        Despreparado e 1d4
        sempre disponíveis.
    */

    if(
        training === "0" ||
        training === "1d4"
    ){

        return true;

    }


    /*
        Nível 7:
        pode chegar a 1d8.
    */

    if(training === "1d8"){

        if(level >= 7){

            return true;

        }


        showCharacterEditorMessage(
            "Treino indisponível",
            "É necessário atingir o nível 7 para elevar uma perícia até 1d8."
        );

        return false;

    }


    /*
        Nível 14:
        pode chegar a 1d12.
    */

    if(training === "1d12"){

        if(level >= 14){

            return true;

        }


        showCharacterEditorMessage(
            "Treino indisponível",
            "É necessário atingir o nível 14 para elevar uma perícia até 1d12."
        );

        return false;

    }


    /*
        INT 5:
        até duas perícias em 1d20.
    */

    if(training === "1d20"){

        if(intelligence < 5){

            showCharacterEditorMessage(
                "INT insuficiente",
                "É necessário possuir INT 5 para elevar uma perícia até 1d20."
            );

            return false;

        }


        const geniusSkills =
            characterSkillsState.filter(
                skill =>
                    skill.training ===
                    "1d20" &&
                    skill.id !== skillId
            );


        if(geniusSkills.length >= 2){

            showCharacterEditorMessage(
                "Limite de perícias",
                "Com INT 5, no máximo duas perícias podem possuir treino 1d20."
            );

            return false;

        }


        return true;

    }


    return false;

}

/*==========================================================
=              TOTAL ESTÁTICO DA PERÍCIA
==========================================================*/

function calculateSkillStaticTotal(
    skill
){

    let total =
        (
            Number(
                skill.bonus
            ) || 0
        )
        +
        (
            Number(
                skill.penalty
            ) || 0
        );


    total +=
        getSkillConditionModifier(
            skill
        );


    /*
        Bônus cumulativos:
        máximo +10.
    */

    total =
        Math.min(
            10,
            total
        );


    return total;

}

/*==========================================================
=              CONDIÇÕES NAS PERÍCIAS
==========================================================*/

function getSkillConditionModifier(
    skill
){

    let modifier = 0;


    /*
        ENFRAQUECIDO
        -5 testes de FOR
    */

    if(
        hasCharacterCondition(
            "enfraquecido"
        ) &&
        skill.selectedAttribute === "for"
    ){

        modifier -= 5;

    }


    /*
        LENTO
        -5 testes de AGI
    */

    if(
        hasCharacterCondition(
            "lento"
        ) &&
        skill.selectedAttribute === "agi"
    ){

        modifier -= 5;

    }


    /*
        TRAUMATIZADO
    */

    if(
        skill.id === "vontade" &&
        hasCharacterCondition(
            "traumatizado"
        )
    ){

        modifier -= 5;

    }


    /*
        PENUMBRA
    */

    if(
        skill.id === "percepcao" &&
        hasCharacterCondition(
            "penumbra"
        )
    ){

        modifier -= 5;

    }


    if(
        skill.id === "preteza" &&
        hasCharacterCondition(
            "penumbra"
        )
    ){

        modifier -= 3;

    }


    /*
        CEGO
        Aqui aplicamos a penalidade geral
        de percepção visual.

        Depois, na rolagem,
        podemos perguntar se o teste
        depende de visão.
    */

    if(
        skill.id === "percepcao" &&
        hasCharacterCondition(
            "cego"
        )
    ){

        modifier -= 10;

    }


    /*
        SURDO

        Por enquanto afeta Percepção.
        Depois podemos perguntar se
        o teste é auditivo.
    */

    if(
        skill.id === "percepcao" &&
        hasCharacterCondition(
            "surdo"
        )
    ){

        modifier -= 10;

    }


    /*
        ENVENENAMENTO
        -5 em testes de Vigor.
    */

    if(
        hasCharacterCondition(
            "envenenamento"
        ) &&
        skill.selectedAttribute === "vig"
    ){

        modifier -= 5;

    }


    /*
        ENJOADO
        -3 testes físicos.
    */

    if(
        hasCharacterCondition(
            "enjoado"
        ) &&
        isPhysicalSkillAttribute(
            skill.selectedAttribute
        )
    ){

        modifier -= 3;

    }


    /*
        IMOBILIZADO
        -10 testes físicos.
    */

    if(
        hasCharacterCondition(
            "imobilizado"
        ) &&
        isPhysicalSkillAttribute(
            skill.selectedAttribute
        )
    ){

        modifier -= 10;

    }


    return modifier;

}


function isPhysicalSkillAttribute(
    attribute
){

    return (
        attribute === "for" ||
        attribute === "agi" ||
        attribute === "vig"
    );

}

/*==========================================================
=              VALOR DOS ATRIBUTOS
==========================================================*/

function getCharacterAttributeValue(
    attribute
){

    const attributeMap = {

        for:
            attributeFOR,

        agi:
            attributeAGI,

        int:
            attributeINT,

        vig:
            attributeVIG,

        pre:
            attributePRE

    };


    const input =
        attributeMap[
            attribute
        ];


    return Math.max(
        0,
        Number(
            input?.value
        ) || 0
    );

}

/*==========================================================
=              ROLAR DADO
==========================================================*/

function rollSkillTrainingDice(
    training
){

    if(
        !training ||
        training === "0"
    ){

        return {
            formula:"0",
            roll:0
        };

    }


    const match =
        String(
            training
        ).match(
            /^1d(\d+)$/
        );


    if(!match){

        return {
            formula:"0",
            roll:0
        };

    }


    const sides =
        Number(
            match[1]
        );


    const result =
        Math.floor(
            Math.random() *
            sides
        ) + 1;


    return {

        formula:
            `1d${sides}`,

        roll:
            result

    };

}

/*==========================================================
=              ROLAR PERÍCIA
==========================================================*/

function rollCharacterSkill(
    skillId
){

    const skill =
        getCharacterSkill(
            skillId
        );


    if(!skill){

        return;

    }


    const attribute =
        skill.selectedAttribute;


    const attributeValue =
        getCharacterAttributeValue(
            attribute
        );


    /*
        O atributo determina
        quantos D20 são rolados.

        Mantemos no mínimo 1 dado.
    */

    const diceAmount =
        Math.max(
            1,
            attributeValue
        );


    const d20Rolls = [];


    for(
        let index = 0;
        index < diceAmount;
        index++
    ){

        d20Rolls.push(

            Math.floor(
                Math.random() * 20
            ) + 1

        );

    }


    /*
        Apenas o maior D20
        entra no resultado.
    */

    const selectedD20 =
        Math.max(
            ...d20Rolls
        );


    /*
        Somente UM dado de treino.
    */

    const trainingRoll =
        rollSkillTrainingDice(
            skill.training
        );


    const modifier =
        calculateSkillStaticTotal(
            skill
        );


    const total =
        selectedD20 +
        trainingRoll.roll +
        modifier;


    showSkillRollResult({

        skill,

        attribute,

        attributeValue,

        d20Rolls,

        selectedD20,

        training:
            trainingRoll.formula,

        trainingRoll:
            trainingRoll.roll,

        modifier,

        total

    });

}

/*==========================================================
=              RESULTADO DA PERÍCIA
==========================================================*/

function showSkillRollResult(
    result
){

    document
        .getElementById(
            "skillRollModal"
        )
        ?.remove();


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "skillRollModal";

    modal.className =
        "editor-message";


    const attributeName =
        String(
            result.attribute
        ).toUpperCase();


    modal.innerHTML = `

        <div class="prosthetic-editor-modal skill-roll-modal">

            <span class="section-label">

                TESTE DE PERÍCIA

            </span>


            <h2>

                ${escapeCharacterEditorHTML(
                    result.skill.name
                )}

            </h2>


            <div class="skill-roll-result">

                <span class="skill-roll-total">

                    ${result.total}

                </span>

                <span class="skill-roll-label">

                    RESULTADO

                </span>

            </div>


<div class="skill-roll-breakdown">

    <div class="skill-roll-d20-list">

        <span>
            ${String(
                result.attribute
            ).toUpperCase()}
            • ${result.attributeValue}d20
        </span>

        <strong>

            ${
                result.d20Rolls
                    .map(
                        value =>
                            value ===
                            result.selectedD20
                                ? `[${value}]`
                                : value
                    )
                    .join(" • ")
            }

        </strong>

        <small>

            Maior:
            ${result.selectedD20}

        </small>

    </div>


    <div>

        <span>
            Treino
        </span>

        <strong>

            ${
                result.training === "0"
                    ? "Sem treino"
                    : `${result.training} → ${result.trainingRoll}`
            }

        </strong>

    </div>


    <div>

        <span>
            Modificadores
        </span>

        <strong>

            ${
                result.modifier >= 0
                    ? "+"
                    : ""
            }

            ${result.modifier}

        </strong>

    </div>

</div>


            <button
                type="button"
                id="closeSkillRoll"
                class="primary-button"
                style="
                    width:100%;
                    margin-top:18px;
                "
            >

                Fechar

            </button>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    modal
        .querySelector(
            "#closeSkillRoll"
        )
        ?.addEventListener(
            "click",
            () => {

                modal.remove();

            }
        );


    modal.addEventListener(
        "click",
        event => {

            if(
                event.target === modal
            ){

                modal.remove();

            }

        }
    );

}

/*==========================================================
=              PONTOS DE PERÍCIA DISPONÍVEIS
==========================================================*/

function calculateSkillPointsTotal(){

    const level =
        Math.max(
            1,
            Number(
                characterLevel?.value
            ) || 1
        );


    let total = 7;


    /*
        Nível 7
        +4 pontos
    */

    if(level >= 7){

        total += 4;

    }


    /*
        Nível 14
        +4 pontos
    */

    if(level >= 14){

        total += 4;

    }


    /*
        Cada compra concede
        2 pontos de perícia.
    */

    total +=
        characterSkillPointsPurchased * 2;


    return total;

}

/*==========================================================
=              CUSTO DOS TREINOS
==========================================================*/

function getSkillTrainingPointCost(
    training
){

    switch(training){

        case "1d4":
            return 1;

        case "1d8":
            return 2;

        case "1d12":
            return 3;

        case "1d20":
            return 4;

        default:
            return 0;

    }

}


function calculateUsedSkillPoints(){

    return characterSkillsState.reduce(
        (total,skill) => {

            return (
                total +
                getSkillTrainingPointCost(
                    skill.training
                )
            );

        },
        0
    );

}


function calculateAvailableSkillPoints(){

    return Math.max(
        0,
        calculateSkillPointsTotal() -
        calculateUsedSkillPoints()
    );

}

/*==========================================================
=              RESUMO DOS PONTOS
==========================================================*/

function renderSkillPointsSummary(){

    const container =
        document.getElementById(
            "skillPointsSummary"
        );


    if(!container){

        return;

    }


    const total =
        calculateSkillPointsTotal();


    const used =
        calculateUsedSkillPoints();


    const available =
        calculateAvailableSkillPoints();


    container.innerHTML = `

        <div>

            <span>
                Total
            </span>

            <strong>
                ${total}
            </strong>

        </div>


        <div>

            <span>
                Usados
            </span>

            <strong>
                ${used}
            </strong>

        </div>


        <div>

            <span>
                Disponíveis
            </span>

            <strong>
                ${available}
            </strong>

        </div>

    `;

}

/*==========================================================
=              COMPRAR PONTOS DE PERÍCIA
==========================================================*/

document
    .getElementById(
        "buySkillPoints"
    )
    ?.addEventListener(
        "click",
        buySkillPoints
    );


/*==========================================================
=              COMPRAR PONTOS DE PERÍCIA
==========================================================*/

function buySkillPoints(){

    characterSkillPointsPurchased += 1;


    renderSkillPointsSummary();


    showCharacterEditorMessage(
        "Pontos adquiridos",
        "2 pontos de perícia foram adicionados. O custo em PV será conectado novamente depois que o sistema de perícias estiver estabilizado."
    );

}

/*==========================================================
=              CALCULAR DEFESA
==========================================================*/

function calculateCharacterDefense(){

    const agi =
        Math.max(
            0,
            Number(
                attributeAGI?.value
            ) || 0
        );


    /*
        DEFESA BASE

        5 + AGI
    */

    const baseDefense =
        5 + agi;


    /*
        BÔNUS MANUAL
    */

    const manualBonus =
        Number(
            characterDefenseBonus?.value
        ) || 0;


    /*
        CONDIÇÕES

        Ex:
        Caído -5
        Imobilizado -10
        Desprevenido -5
    */

    const conditionBonus =
        getConditionModifier(
            "defense"
        );


    /*
        HABILIDADES
    */

    const abilityBonus =
        getAbilityDefenseBonus();


    /*
        ASSIMILAÇÕES
    */

    const assimilationBonus =
        getAssimilationDefenseBonus();


    const total =
        baseDefense +
        manualBonus +
        conditionBonus +
        abilityBonus +
        assimilationBonus;


    if(characterDefenseBase){

        characterDefenseBase.value =
            baseDefense;

    }


    if(characterDefense){

        characterDefense.value =
            total;

    }

}

/*==========================================================
=              DEFESA DE ASSIMILAÇÕES
==========================================================*/

function getAssimilationDefenseBonus(){

    let total = 0;


    characterAssimilationsState
        .forEach(assimilation => {

            /*
                Assimilações passivas sempre contam.

                Assimilações de ativação só contam
                se estiverem ativas.
            */

            const canApply =
                assimilation.activationType === "Passiva" ||
                assimilation.active === true;


            if(!canApply){

                return;

            }


            total +=
                Number(
                    assimilation.effects
                        ?.defense
                ) || 0;

        });


    return total;

}

/*==========================================================
=              DEFESA POR HABILIDADES
==========================================================*/

function getAbilityDefenseBonus(){

    let bonus = 0;


    characterAbilitiesState.forEach(
        ability => {

            /*
                Aqui futuramente podemos
                ler um campo automático.
            */

            if(
                ability.effects
                    ?.defense
            ){

                bonus +=
                    Number(
                        ability.effects.defense
                    ) || 0;

            }

        }
    );


    return bonus;

}

/*==========================================================
=              FOTO MACHUCADO
==========================================================*/

async function handleCharacterWoundedPhoto(){

    const file =
        characterWoundedPhotoInput
            ?.files?.[0];


    if(!file){

        return;

    }


    try{

        characterWoundedPhotoBase64 =
            await characterFileToBase64(
                file
            );


        renderCharacterPhoto();


        showCharacterEditorMessage(
            "Foto salva",
            "A aparência de Machucado foi configurada."
        );

    }
    catch(error){

        console.error(
            "Erro ao carregar foto machucado:",
            error
        );


        showCharacterEditorMessage(
            "Erro na imagem",
            "Não foi possível carregar a foto de Machucado."
        );

    }

}

/*==========================================================
=              DADOS DAS PARTES DO CORPO
==========================================================*/

const BODY_PART_DATA = {

    head:{
        name:"Cabeça",
        input:() => bodyHead
    },

    chest:{
        name:"Torso",
        input:() => bodyChest
    },

    leftArm:{
        name:"Braço Esquerdo",
        input:() => bodyLeftArm
    },

    rightArm:{
        name:"Braço Direito",
        input:() => bodyRightArm
    },

    leftLeg:{
        name:"Perna Esquerda",
        input:() => bodyLeftLeg
    },

    rightLeg:{
        name:"Perna Direita",
        input:() => bodyRightLeg
    }

};

/*==========================================================
=              CLIQUE NO CORPO
==========================================================*/

function bindBodyMapEvents(){

    document
        .querySelectorAll(
            ".body-map-zone"
        )
        .forEach(zone => {

            zone.addEventListener(
                "click",
                () => {

                    selectBodyPart(
                        zone.dataset.bodyPart
                    );

                }
            );

        });

}

/*==========================================================
=              SELECIONAR PARTE DO CORPO
==========================================================*/

function selectBodyPart(
    partName
){

    const data =
        BODY_PART_DATA[
            partName
        ];


    if(!data){

        return;

    }


    selectedBodyPart =
        partName;


    document
        .querySelectorAll(
            ".body-map-zone"
        )
        .forEach(zone => {

            zone.classList.toggle(
                "selected",
                zone.dataset.bodyPart ===
                partName
            );

        });


    renderBodyPartInfo(
        partName
    );

}

/*==========================================================
=              PAINEL DA PARTE DO CORPO
==========================================================*/

function renderBodyPartInfo(
    partName
){

    const panel =
        document.getElementById(
            "bodyInfoPanel"
        );


    const data =
        BODY_PART_DATA[
            partName
        ];


    if(
        !panel ||
        !data
    ){

        return;

    }


    const input =
        data.input();


    const currentPV =
        Number(
            input?.value
        ) || 0;


    const maxPV =
        Number(
            input?.dataset.max
        ) || 0;


    const state =
        characterBodyState[
            partName
        ] || {
            type:"natural"
        };


    const assimilations =
        getAssimilationsForBodyPart(
            partName
        );


    let stateLabel =
        "Natural";


    if(
        state.type ===
        "missing"
    ){

        stateLabel =
            "Ausente";

    }


    if(
        state.type ===
        "prosthetic"
    ){

        stateLabel =
            state.name
                ? `Prótese • ${state.name}`
                : "Prótese";

    }


    if(
        currentPV <= 0 &&
        state.type === "natural"
    ){

        stateLabel =
            "Inutilizado";

    }


    panel.innerHTML = `

        <div class="body-info-header">

            <div>

                <span class="section-label">
                    PARTE DO CORPO
                </span>

                <h3>
                    ${escapeCharacterEditorHTML(
                        data.name
                    )}
                </h3>

            </div>


            <span class="body-info-state">

                ${escapeCharacterEditorHTML(
                    stateLabel
                )}

            </span>

        </div>


        <div class="body-info-pv">

            <span>
                PV
            </span>

            <strong>

                ${currentPV}
                /
                ${maxPV}

            </strong>

        </div>


        <div class="body-info-block">

            <span class="body-info-label">

                Assimilações

            </span>


            <div class="body-info-assimilations">

                ${
                    assimilations.length
                        ? assimilations
                            .map(
                                assimilation => `

                                    <div class="body-assimilation-chip">

                                        <strong>
                                            ${escapeCharacterEditorHTML(
                                                assimilation.name
                                            )}
                                        </strong>

                                        <span>
                                            ${escapeCharacterEditorHTML(
                                                assimilation.description ||
                                                ""
                                            )}
                                        </span>

                                    </div>

                                `
                            )
                            .join("")
                        : `
                            <div class="body-info-empty">
                                Nenhuma Assimilação alocada neste membro.
                            </div>
                        `
                }

            </div>

        </div>


        <div class="body-info-block">

            <label
                class="body-info-label"
                for="bodyPartDescription">

                Descrição do membro

            </label>


            <textarea
                id="bodyPartDescription"
                class="body-part-description"
                placeholder="Ex: cicatriz profunda, braço coberto por veias paranormais, tatuagem ritualística...">${escapeCharacterEditorHTML(
                    characterBodyDescriptions[
                        partName
                    ] || ""
                )}</textarea>

        </div>

    `;


    panel
        .querySelector(
            "#bodyPartDescription"
        )
        ?.addEventListener(
            "input",
            event => {

                characterBodyDescriptions[
                    partName
                ] =
                    event.target.value;

            }
        );

}

/*==========================================================
=              ASSIMILAÇÕES DO MEMBRO
==========================================================*/

function getAssimilationsForBodyPart(
    partName
){

    return characterAssimilationsState
        .filter(
            assimilation =>
                assimilation.bodyPart ===
                partName
        );

}
