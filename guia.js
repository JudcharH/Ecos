/* ECO — navegação e pesquisa do guia */
(function(){
"use strict";
const sections={
    "Introdução":["Visão geral","ECO utiliza Corpo, Foco e Nexo, testes com dado principal d12 e recursos de PV, PM e PA."],
    "Criação de Personagem":["Ficha","Escolha o sistema, distribua atributos e perícias, configure a vida e então adicione ataques, habilidades e equipamentos."],
    "Atributos":["Corpo, Foco e Nexo","Corpo representa capacidade física, Foco reúne rapidez e presença, e Nexo cobre conhecimento e conexão paranormal."],
    "Perícias":["Testes","Um teste combina o dado principal, o dado de treinamento, o atributo associado e bônus ou penalidades aplicáveis."],
    "Combate":["Rodadas e ações","Ataques, movimento e reações consomem os recursos indicados. Ataques rápidos sempre exigem a seleção de um alvo na mesa."],
    "Condições":["Efeitos ativos","Condições alteram ações, movimento, defesa ou recursos. A ficha e a mesa exibem apenas as condições atualmente aplicadas."],
    "Rituais":["Construção","Rituais são montados com palavras aprendidas. O efeito, a DT e o custo dependem das palavras selecionadas."],
    "Assimilações":["Transformações paranormais","Assimilações concedem efeitos permanentes ou ativáveis vinculados ao elemento do personagem."],
    "Equipamentos":["Inventário","Itens podem ocupar espaços e fornecer fórmulas de ataque, dano, defesa ou RD. Desarmado não ocupa espaço."],
    "Ameaças":["Controle do mestre","Ameaças possuem atributos, perícias, ataques, habilidades, PA, Defesa, RD e sistema de vida clássico ou por membros."],
    "Glossário":["Termos principais","PV: vida. PM: recurso paranormal. PA: pontos de ação. RD: redução de dano. DT: dificuldade do teste. NA: nível da ameaça."]
};
const content=document.getElementById("guideContent"),search=document.getElementById("guideSearch"),modal=document.getElementById("guideModal"),modalContent=document.getElementById("guideModalContent"),close=document.getElementById("closeGuideModal"),buttons=[...document.querySelectorAll(".guide-category")];
const escape=value=>String(value||"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
function render(name){const section=sections[name];if(!section||!content)return;content.innerHTML=`<h2>${escape(name)}</h2><div class="guide-block"><h3>${escape(section[0])}</h3><p>${escape(section[1])}</p></div>`;buttons.forEach(button=>button.classList.toggle("active",button.textContent.trim()===name));}
function results(term){const query=String(term||"").trim().toLocaleLowerCase("pt-BR");if(!query){modal?.classList.add("hidden");return;}const matches=Object.entries(sections).filter(([name,[title,text]])=>`${name} ${title} ${text}`.toLocaleLowerCase("pt-BR").includes(query));if(modalContent)modalContent.innerHTML=matches.length?matches.map(([name,[title,text]])=>`<button type="button" class="guide-search-result" data-guide-section="${escape(name)}"><strong>${escape(name)}</strong><span>${escape(title)}</span><p>${escape(text)}</p></button>`).join(""):'<p>Nenhuma regra encontrada.</p>';modal?.classList.remove("hidden");}
buttons.forEach(button=>button.addEventListener("click",()=>render(button.textContent.trim())));
search?.addEventListener("input",event=>results(event.target.value));
close?.addEventListener("click",()=>modal?.classList.add("hidden"));
modal?.addEventListener("click",event=>{if(event.target===modal)modal.classList.add("hidden");const result=event.target.closest("[data-guide-section]");if(result){render(result.dataset.guideSection);modal.classList.add("hidden");if(search)search.value="";}});
render("Introdução");
})();
