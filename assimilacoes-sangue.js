/* ECO — Biblioteca oficial de Assimilações de Sangue */
(function(){
"use strict";
const P=(id,name,cost,type,activationCost,description,extra={})=>({id,name,element:"sangue",permanentCost:{type:"pv",value:cost},activationType:type,activationCost:activationCost?{type:activationCost[0],value:activationCost[1]}:null,active:type==="Passiva",description,...extra});
window.ECO_BLOOD_ASSIMILATIONS=[
P("visceral","Visceral",5,"Ativação",["pa",1],"Cria garras e presas monstruosas. Enquanto estiver ativa, ataques desarmados recebem +1 dado de dano."),
P("dilaceramento","Dilaceramento",5,"Ativação",["pa",1],"Cria uma espada de sangue coagulado que causa 2d8 + Corpo de dano de Sangue."),
P("redencao","Redenção",5,"Passiva",null,"Recupera 2d6 PV no início de cada rodada."),
P("pungencia","Pungência",5,"Ativação",["pa",1],"Enquanto estiver ativa, ataques corpo a corpo sofridos causam 2d6 de Sangue ao atacante. No início de cada turno, gaste 1 PA para mantê-la."),
P("avidez","Avidez",4,"Ativação",["pa",2],"Após acertar um ataque corpo a corpo, recupera 2d10 PV."),
P("entrega","Entrega",4,"Passiva",null,"Pode transferir seus próprios PV para recuperar a mesma quantidade de PV de um aliado em até 1 posição."),
P("tensao","Tensão",4,"Passiva",null,"Recebe +1 em Corpo e +3 em testes de Manobra.",{effects:{attribute:{corpo:1},skills:{manobra:3}}}),
P("hematopoiese","Hematopoiese",5,"Passiva",null,"Quando um aliado adjacente sofrer dano, reduza o dano final em valor igual ao seu Corpo. Limite: 1 vez por rodada."),
P("anseio","Anseio",4,"Ativação",["pa",1],"Cria asas demoníacas. Seu deslocamento passa a 4 posições e ignora terreno difícil."),
P("sobrevivencia","Sobrevivência",4,"Reação",["pa",1],"Reduz um dano recebido em 30. Limite: 1 vez por cena."),
P("amor-proprio","Amor Próprio",4,"Passiva",null,"No início de cada cena de combate recebe 20 PV temporários."),
P("empatia","Empatia",4,"Ativação",["pm",4],"Descobre a emoção dominante de um alvo e recebe +3 no próximo teste de Interação contra ele."),
P("lapidacao","Lapidação",4,"Ativação",["pa",1],"Uma vez por cena, transfira até 2 pontos de outros atributos para Corpo até o fim da cena."),
P("gula","Gula",4,"Ativação",["pa",1],"Consome 1 ponto de Corpo do alvo e o adiciona ao seu Corpo até o fim da cena. Uma vez por alvo por cena."),
P("inveja","Inveja",4,"Ativação",["pa",1],"Copia a última habilidade ativa, reação ou Assimilação de Sangue usada por um aliado. A cópia pode ser usada uma vez."),
P("ira","Ira",4,"Ativação",["pa",1],"Enquanto ativa, recebe +1 para acertar e +1 de dano no início de cada turno, acumulando até +10."),
P("luxuria","Luxúria",4,"Passiva",null,"Recebe +3 em Interação. Uma vez por cena, pode dobrar os bônus de um teste de Interação.",{effects:{skills:{interacao:3}}}),
P("preguica","Preguiça",4,"Passiva",null,"Pode guardar até 2 PA não utilizados para usar na rodada seguinte."),
P("orgulho","Orgulho",4,"Passiva",null,"Reduz pela metade todo dano mundano e de Sangue. O efeito termina pelo restante da cena ao receber cura, proteção ou benefício de um aliado."),
P("ganancia","Ganância",4,"Ativação",["pa",3],"Rouba uma habilidade ativa ou ritual recém-utilizado por uma ameaça. O uso só é consumido quando o roubo tiver sucesso; limite de um sucesso por cena."),
P("vinganca","Vingança",4,"Passiva",null,"Quando um aliado morrer durante a cena, seu próximo ataque bem-sucedido possui Acerto Crítico garantido."),
P("instinto","Instinto",4,"Passiva",null,"Quando uma criatura entrar ou iniciar o turno adjacente a você, pode realizar imediatamente um ataque corpo a corpo. Limite: 1 vez por rodada."),
P("elo","Elo",4,"Passiva",null,"Enquanto houver um aliado em até 1 posição, ambos recebem +3 Defesa. Quando um sofrer dano, o outro recebe +5 no próximo ataque contra o agressor.",{effects:{conditionalDefense:3}}),
P("crescimento","Crescimento",4,"Passiva",null,"Um membro perdido permanentemente cresce novamente após um descanso longo e não pode ser perdido novamente da mesma forma."),
P("frenesi","Frenesi",4,"Passiva",null,"Ao reduzir uma criatura a 0 PV, recupera 2d8 PV. Limite: 1 vez por rodada."),
P("sangue-fervente","Sangue Fervente",4,"Passiva",null,"Ao sofrer dano de um ataque, acumula +1 dado de dano principal no próximo ataque, até +3 dados. O acúmulo é consumido ao acertar."),
P("coagulacao-instantanea","Coagulação Instantânea",4,"Reação",["pa",1],"Ao receber Sangramento, impeça sua aplicação; se já estiver sangrando, remova uma aplicação. Limite: 1 vez por rodada."),
P("coracao-predador","Coração Predador",5,"Passiva",null,"Com PV clássico ou Torso em 0, o Coração recebe RD igual a Corpo contra o primeiro dano de cada rodada."),
P("transfusao-violenta","Transfusão Violenta",4,"Ativação",["pa",1],"Sofra até Corpo x2 de dano direto. Um aliado adjacente recupera o dobro. Não reduz o usuário abaixo de 1 PV nem cura o Coração."),
P("forma-aberrante","Forma Aberrante",5,"Ativação",["pa",1],"Aumenta o Tamanho em 1, concede +3 em Manobra e alcance corpo a corpo de uma posição adicional. Enquanto ativa, sofre -3 em Discreto."),
P("olfato-rubro","Olfato Rubro",4,"Passiva",null,"Recebe +3 em Percepção para localizar criaturas feridas e conhece a direção de criaturas Machucadas em até 3 posições."),
P("mutacao-reativa","Mutação Reativa",4,"Passiva",null,"Ao sofrer dano Cortante, Perfurante ou Impacto, até o próximo turno o dano seguinte do mesmo tipo é reduzido pela metade. Uma ativação por rodada."),
P("hemorragia-voluntaria","Hemorragia Voluntária",4,"Ativação",null,"Antes de um ataque corpo a corpo, perca até Corpo PV. O ataque recebe o dobro como dano de Sangue. Uma vez por rodada e não pode reduzir abaixo de 1 PV."),
P("contracao-monstruosa","Contração Monstruosa",4,"Reação",["pa",1],"Recebe +5 contra agarrar, derrubar, empurrar ou mover. Se vencer, empurra o agressor uma posição. Uma vez por rodada."),
P("pulso-carniceiro","Pulso Carniceiro",4,"Ativação",["pa",2],"Criaturas na mesma posição e adjacentes sofrem 2d8 + Corpo de Sangue e são empurradas uma posição. Uma vez por cena."),
P("banquete-de-carne","Banquete de Carne",4,"Ativação",["pa",1],"Consuma restos de uma criatura morta e escolha até o fim da cena: +1 Corpo, +1 dado de dano corpo a corpo ou regenerar 1d6 PV por turno. Uma vez por cena."),
P("sangue-de-guerra","Sangue de Guerra",4,"Passiva",null,"Enquanto Machucado, recebe +3 em Fortitude e ignora penalidades de ataque de Enfraquecido e Cansado."),
P("simbiose-carmesim","Simbiose Carmesim",4,"Ativação",["pa",1],"Escolha um aliado adjacente. Até seu próximo turno, metade do dano final dele é transferida para você e ignora sua RD."),
P("orgaos-redundantes","Órgãos Redundantes",5,"Passiva",null,"Uma vez por cena, ignore os dados adicionais e a condição de um Acerto Crítico. Em membros, também impede a perda permanente causada por esse ataque."),
P("surto-hematico","Surto Hemático",4,"Passiva",null,"Na primeira vez por cena que ficar Machucado, recebe 2 PA temporários até o fim da próxima rodada.")
];
window.ECO_BLOOD_ASSIMILATION_ALIASES={presas:"visceral","lamina-de-sangue":"dilaceramento","celulas-regenerativas":"redencao",espinhoso:"pungencia",devorar:"avidez","sangue-compartilhado":"entrega","musculos-intensificados":"tensao","peitoral-de-ferro":"hematopoiese","asas-profanas":"anseio","insensibilidade-a-dor":"sobrevivencia","camada-extra":"amor-proprio","sentir-emocao":"empatia","consumir-e-transformar":"lapidacao","instinto-predatorio":"instinto","elo-carmesim":"elo","crescimento-anomalo":"crescimento"};
})();
