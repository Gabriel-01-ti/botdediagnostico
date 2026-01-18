let baseDados = null;

// ESTADOS DO CHAT
let estado = "inicio";   // inicio | cultura | sintomas
let culturaAtual = "";

// ELEMENTOS
const input = document.getElementById("mensagem");
const chat = document.getElementById("chat");

// NORMALIZAR TEXTO
function normalizar(txt) {
  return txt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// CARREGAR JSON
fetch("./base.json")
  .then(r => r.json())
  .then(d => {
    baseDados = d;
    bot("🤖 Bot Agro pronto! Diga: Bom dia 👋");
  })
  .catch(() => bot("❌ Erro ao carregar base de dados."));

// MOSTRAR MSG DO BOT
function bot(texto) {
  const div = document.createElement("div");
  div.className = "bot";
  div.innerText = texto;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// MOSTRAR MSG DO USUÁRIO
function user(texto) {
  const div = document.createElement("div");
  div.className = "user";
  div.innerText = texto;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// ENVIAR MENSAGEM
function enviar() {
  const msg = input.value.trim();
  if (!msg) return;

  user(msg);
  input.value = "";

  const resposta = responder(msg);
  setTimeout(() => bot(resposta), 400);
}

// LÓGICA PRINCIPAL
function responder(mensagem) {
  const texto = normalizar(mensagem);

  if (estado === "inicio") {
    estado = "cultura";
    return "Olá! Bom dia 👨‍🌾 Qual cultura deseja diagnosticar? (milho, soja ou feijão)";
  }

  if (estado === "cultura") {
    if (!baseDados[texto]) {
      return "Não reconheci essa cultura. Pode informar: milho, soja ou feijão?";
    }
    culturaAtual = texto;
    estado = "sintomas";
    return "Perfeito! Agora descreva os sintomas que você está vendo na lavoura.";
  }

  if (estado === "sintomas") {
    return diagnosticarConversacional(texto);
  }
}

// DIAGNÓSTICO INTELIGENTE
function diagnosticarConversacional(texto) {

  const stop = ["a","o","e","de","do","da","dos","das","com","na","no","nos","nas",
                "folha","folhas","planta","tem","esta","ta","uns","umas","alguns",
                "algumas","parece","muito"];

  const palavras = texto.split(" ").filter(p => p.length > 2 && !stop.includes(p));

  let melhor = null, maior = 0;

  for (let id in baseDados[culturaAtual]) {
    const d = baseDados[culturaAtual][id];
    let pontos = 0;

    d.sintomas.praticos.forEach(s => {
      const sint = normalizar(s);
      palavras.forEach(p => {
        if (sint.includes(p)) pontos += 5;
      });
    });

    if (pontos > maior) {
      maior = pontos;
      melhor = d;
    }
  }

  if (!melhor || maior === 0) {
    return "Não consegui identificar bem. Pode descrever um pouco mais os sintomas?";
  }

  return `
🦠 ${melhor.nome}
Nome científico: ${melhor.nome_biologico}
Descrição: ${melhor.descricao}
Condições favoráveis: ${melhor.condicoes_favoraveis}
Danos: ${melhor.danos}
Manejo: ${melhor.manejo_preventivo}
Controle: ${melhor.controle}
`;
}
