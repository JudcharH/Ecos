/* ECO — Biblioteca oficial de Assimilações de Sangue */
(function(){
"use strict";
const P=(id,name,cost,type,activationCost,description,extra={})=>({id,name,element:"sangue",permanentCost:{type:"pv",value:cost},activationType:type,activationCost:activationCost?{type:activationCost[0],value:activationCost[1]}:null,active:type==="Passiva",description,...extra});
window.ECO_BLOOD_ASSIMILATIONS=[
P("visceral","Visceral",5,"Ativação",["pa",1],"Cria garras e presas monstruosas. Enquanto estiver ativa, ataques desarmados recebem +1 dado de dano."),
P("dilaceramento","Dilaceramento",5,"Ativação",["pa",1],"Cria uma espada de sangue coagulado que causa 2d8 + Corpo de dano de Sangue."),
P("redencao","Redenção",5,"Passiva",null,"Recupera 2d6 PV no início de cada rodada."),
P("pungencia","Pungência",5,"Reação extra",["pa",1],"Ao sofrer um ataque corpo a corpo, causa 2d6 de Sangue ao atacante. Não substitui sua reação normal. Limite: 1 vez por rodada."),
P("avidez","Avidez",4,"Ativação",["pa",2],"Após acertar um ataque corpo a corpo, recupera 2d10 PV."),
P("entrega","Entrega",4,"Ativação",["pa",1],"Sofra até Corpo PV para recuperar a mesma quantidade de um aliado adjacente. Não pode reduzir você abaixo de 1 PV."),
P("tensao","Tensão",4,"Passiva",null,"Recebe +1 em Corpo e +3 em testes de Manobra.",{effects:{attribute:{corpo:1},skills:{manobra:3}}}),
P("hematopoiese","Hematopoiese",5,"Passiva / Ativação",null,"Prepare a proteção em um aliado adjacente. O próximo dano sofrido por ele na rodada é reduzido em valor igual ao seu Corpo."),
P("anseio","Anseio",4,"Ativação",["pa",1],"Cria asas demoníacas. Seu deslocamento passa a 4 posições e ignora terreno difícil."),
P("sobrevivencia","Sobrevivência",4,"Reação",["pa",1],"Reduz um dano recebido em 30. Limite: 1 vez por cena."),
P("amor-proprio","Amor Próprio",4,"Passiva",null,"No início de cada cena de combate recebe 20 PV temporários."),
P("lapidacao","Lapidação",4,"Ativação",["pa",1],"Uma vez por cena, recebe +2 Corpo, -1 Foco e -1 Nexo até o fim da cena."),
P("gula","Gula",4,"Ativação",["pa",1],"Recebe +1 Corpo até o fim da cena e o alvo adjacente sofre -3 no próximo teste de Fortitude. Uma vez por alvo por cena."),
P("inveja","Inveja",4,"Ativação",["pa",1],"Abra a lista de habilidades gerais e adquira uma delas sem pagar seu custo permanente de PM. Limite: 1 vez por cena."),
P("ira","Ira",4,"Ativação",["pa",1],"Enquanto ativa, recebe +1 para acertar e +1 de dano no início de cada turno, acumulando até +10."),
P("luxuria","Luxúria",4,"Ativação",["pm",4],"Enxerga a emoção dominante de uma criatura e recebe +4 no próximo teste de Interação. O bônus é aplicado diretamente à fórmula e consumido após a rolagem."),
P("preguica","Preguiça",4,"Passiva",null,"Pode guardar até 2 PA não utilizados para usar na rodada seguinte."),
P("orgulho","Orgulho",4,"Passiva",null,"Enquanto não possuir PV temporário, reduz pela metade todo dano mundano e de Sangue. O efeito retorna automaticamente quando os PV temporários terminam."),
P("ganancia","Ganância",4,"Ativação",null,"Uma vez por cena, escolha receber 2 PA temporários, recuperar 8 PM ou receber 15 PV temporários."),
P("instinto","Instinto",4,"Ativação",null,"Quando houver uma ameaça nas posições 1 ou 2, realize um ataque rápido sem gastar PA. Limite: 1 vez por rodada."),
P("elo","Elo",4,"Ativação",["pa",1],"Escolha dois personagens aliados. Ambos recebem +2 Defesa até o fim da cena. Apenas um Elo pode permanecer ativo por usuário."),
P("crescimento","Crescimento",4,"Passiva",null,"Após um descanso longo, permite regenerar um membro decepado. No PV clássico, recupera 20 PV adicionais."),
P("frenesi","Frenesi",4,"Passiva",null,"Ao reduzir uma criatura a 0 PV, recupera 2d8 PV. Limite: 1 vez por rodada."),
P("sangue-fervente","Sangue Fervente",4,"Passiva",null,"Após sofrer dano, o próximo ataque de Luta realizado até o fim da próxima rodada causa +1 dado principal de dano. Não acumula."),
P("coagulacao-instantanea","Coagulação Instantânea",4,"Reação",["pa",1],"Ao receber Sangramento, impeça sua aplicação; se já estiver sangrando, remova uma aplicação. Limite: 1 vez por rodada."),
P("forma-aberrante","Forma Aberrante",5,"Ativação",["pa",1],"Enquanto ativa, recebe +3 em Manobra, +1 dado principal de dano em ataques desarmados e -3 em Discreto."),
P("mutacao-reativa","Mutação Reativa",4,"Passiva",null,"Ao sofrer dano Cortante, Perfurante ou Impacto, até o próximo turno o dano seguinte do mesmo tipo é reduzido pela metade. Uma ativação por rodada."),
P("hemorragia-voluntaria","Hemorragia Voluntária",4,"Ativação",null,"Antes de um ataque corpo a corpo, perca até Corpo PV. O ataque recebe o dobro como dano de Sangue. Uma vez por rodada e não pode reduzir abaixo de 1 PV."),
P("sangue-de-guerra","Sangue de Guerra",4,"Passiva",null,"Enquanto Machucado, recebe +3 em Fortitude e ignora penalidades de ataque de Enfraquecido e Cansado."),
P("surto-hematico","Surto Hemático",4,"Passiva",null,"Na primeira vez por cena que ficar Machucado, recebe 2 PA temporários até o fim da próxima rodada.")
];
window.ECO_BLOOD_ASSIMILATION_ALIASES={presas:"visceral","lamina-de-sangue":"dilaceramento","celulas-regenerativas":"redencao",espinhoso:"pungencia",devorar:"avidez","sangue-compartilhado":"entrega","musculos-intensificados":"tensao","peitoral-de-ferro":"hematopoiese","asas-profanas":"anseio","insensibilidade-a-dor":"sobrevivencia","camada-extra":"amor-proprio",empatia:"luxuria","sentir-emocao":"luxuria","consumir-e-transformar":"lapidacao","instinto-predatorio":"instinto","elo-carmesim":"elo","crescimento-anomalo":"crescimento"};
})();
