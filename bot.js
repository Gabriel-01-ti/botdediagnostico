// ================= VARIÁVEIS =================
let baseDados = null;
const inputSintomas = document.getElementById("sintomas");
const btnEnviar = document.getElementById("btn-diagnosticar");
const chatDiv = document.getElementById("chat-messages");

let etapa = 0;
let culturaSelecionada = "";
let modoDiagnostico = "";
let sintomasSelecionados = [];

// ================= CARREGAR BASE =================
fetch("base.json")
  .then(res => res.json())
  .then(data => {
    baseDados = data;
    inputSintomas.disabled = false;
    inputSintomas.placeholder = "Digite 'Oi' para começar...";
  })
  .catch(err => {
    console.error("Erro:", err);
    addMsg("❌ Erro ao carregar base de dados.", "bot");
  });

function abrirGuiaRapido() {
  if (!baseDados) return;

  const listaDiv = document.getElementById("listaGuiaDoencas");
  listaDiv.innerHTML = "";

  for (let cultura in baseDados) {
    const titulo = document.createElement("h3");
    titulo.textContent = "🌱 " + cultura.charAt(0).toUpperCase() + cultura.slice(1);
    titulo.style.color = "#2e7d32";
    titulo.style.marginTop = "15px";
    listaDiv.appendChild(titulo);

    for (let id in baseDados[cultura]) {
      const d = baseDados[cultura][id];
      const sintomaPrincipal = d.sintomas.praticos[0] || "Sintoma não informado";

      const item = document.createElement("div");
      item.className = "item-guia";
      item.innerHTML = `<strong>${d.nome}</strong><br><small>👀 ${sintomaPrincipal}</small>`;
      listaDiv.appendChild(item);
    }
  }

  document.getElementById("painelGuia").style.display = "flex";
}

function fecharGuiaRapido() {
  document.getElementById("painelGuia").style.display = "none";
}

// ================= FUNÇÕES UTIL =================
function normalizar(txt) {
  return txt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function addMsg(texto, tipo, rolar = true) {
  const div = document.createElement("div");
  div.className = "msg " + tipo;

  // 👉 Se for o BOT, adiciona avatar + bolha
  if (tipo === "bot") {
  div.classList.add("msg-bot-wrapper");

  const avatar = document.createElement("img");
  avatar.src = "logo.jpg";
  avatar.className = "bot-avatar";

  const bubble = document.createElement("div");
  bubble.className = "bot-bubble";
  bubble.innerHTML = texto;

  div.appendChild(avatar);
  div.appendChild(bubble);
}
 else {
    // usuário continua igual
    div.innerHTML = texto;
  }

  chatDiv.appendChild(div);

  if (rolar) {
    chatDiv.scrollTop = chatDiv.scrollHeight;
  }
}



// ================= INÍCIO =================
function iniciarBot() {
  addMsg(
    `
    🤖 <b>Olá! Seja bem-vindo ao AgroBot.</b><br><br>
    Estou aqui para ajudar você a identificar possíveis doenças na sua lavoura de forma rápida e prática 🌱<br><br>
    Você gostaria de ver a lista de culturas disponíveis para diagnóstico?
    <br><br>
    👉 Responda com <b>Sim</b> ou <b>Não</b>.
    `,
    "bot"
  );
  etapa = -1;
}
function finalizarDiagnostico() {
  addMsg(`
    🌿 <b>Diagnóstico finalizado com sucesso!</b><br><br>
    Foi um prazer ajudar você a cuidar da sua lavoura 💚<br>
    Sempre que precisar, estarei por aqui 🌱<br><br>
    ✨ <i>O histórico foi limpo. Digite <b>Oi</b> para começar um novo diagnóstico.</i>
  `, "bot");

  // Espera a mensagem aparecer e depois limpa tudo
  setTimeout(() => {
    chatDiv.innerHTML = "";
    etapa = 0;
    culturaSelecionada = "";
  }, 5500);
}


// ================= ESCOLHER MODO =================
function escolherModo(modo) {
  modoDiagnostico = modo;

  if (modo === "texto") {
    addMsg("✍️ Você escolheu descrever os sintomas.<br>Escreva o que está vendo na planta.", "bot");
    etapa = 3;
  } else {
    sintomasSelecionados = [];
    addMsg("✅ Você escolheu selecionar sintomas.<br>Clique nos sintomas observados:", "bot");
    mostrarBotoesSintomas();
    etapa = 4;
  }
}
function mostrarCulturasDisponiveis() {
  let html = "🌱 <b>Culturas disponíveis:</b><br><br>";

  for (let cultura in baseDados) {
    html += "• " + cultura.charAt(0).toUpperCase() + cultura.slice(1) + "<br>";
  }

  html += "<br>👉 Digite o nome da cultura para continuar.";

  addMsg(html, "bot");
}
// ================= BOTÕES DE SINTOMAS =================
function mostrarBotoesSintomas() {
  const dados = baseDados[culturaSelecionada];
  let sintomasSet = new Set();

  Object.values(dados).forEach(d => {
    d.sintomas.praticos.forEach(s => sintomasSet.add(s));
  });

  let html = `<div class="sintomas-botoes">`;
  sintomasSet.forEach(s => {
    html += `<button onclick="toggleSintoma(this,'${s}')">${s}</button>`;
  });
  html += `<br><br><button onclick="finalizarSelecao()">🔍 Diagnosticar</button></div>`;

  addMsg(html, "bot");
}

function toggleSintoma(btn, sintoma) {
  btn.classList.toggle("ativo");
  if (sintomasSelecionados.includes(sintoma)) {
    sintomasSelecionados = sintomasSelecionados.filter(s => s !== sintoma);
  } else {
    sintomasSelecionados.push(sintoma);
  }
}

function finalizarSelecao() {
  if (sintomasSelecionados.length === 0) {
    addMsg("⚠️ Selecione pelo menos um sintoma.", "bot");
    return;
  }
  addMsg("Sintomas selecionados: " + sintomasSelecionados.join(", "), "usuario");
  diagnosticar(culturaSelecionada, sintomasSelecionados.join(" "));
}

// ================= BOTÃO ENVIAR =================
btnEnviar.addEventListener("click", () => {
  const texto = inputSintomas.value.trim();
  if (!texto) return;

  addMsg("Você: " + texto, "usuario");
  inputSintomas.value = "";

  const comando = normalizar(texto);
  if (["oi","ola","reiniciar","inicio"].includes(comando)) {
    iniciarBot();
    return;
  }
  // 🛑 COMANDOS PARA FINALIZAR O DIAGNÓSTICO
  if (['finalizar', 'encerrar', 'parar', 'sair', 'cancelar','obrigado', 'muito obrigado'].includes(comando)) {
    finalizarDiagnostico();
    return;
   }


  if (etapa === 0) iniciarBot();
  else if (etapa === -1) {
  const resposta = normalizar(texto);

  if (["sim", "s", "quero", "claro"].includes(resposta)) {
    mostrarCulturasDisponiveis();
    etapa = 1;
  } 
  else if (["nao", "não", "n"].includes(resposta)) {
    addMsg(
      "Sem problema 😊<br>Digite o nome da cultura (Ex: Milho, Soja, Feijão).",
      "bot"
    );
    etapa = 1;
  } 
  else {
    addMsg("👉 Responda com <b>Sim</b> ou <b>Não</b>.", "bot");
  }
  }

  else if (etapa === 1) {
    const culturaNorm = normalizar(texto);
    if (!baseDados[culturaNorm]) {
      addMsg("⚠️ Cultura não encontrada. Tente: Milho, Soja ou Feijão.", "bot");
      return;
    }
    culturaSelecionada = culturaNorm;
    addMsg(`Certo! Analisando <b>${texto}</b>. 🌱`, "bot");
    addMsg(`
  Como você prefere fazer o diagnóstico?<br><br>
  <div class="botoes-opcao">
      <button onclick="escolherModo('texto')">✍️ Descrever sintomas</button>
      <button onclick="escolherModo('lista')">📋 Escolher sintomas</button>
  </div>
`, "bot");

    etapa = 2;
  }

  else if (etapa === 3) {
    diagnosticar(culturaSelecionada, texto);
  }
});

// ================= DIAGNÓSTICO COMPLETO =================
function diagnosticar(cultura, textoUsuario) {
  const textoNorm = normalizar(textoUsuario).replace(/s\b/g, "");
  const palavras = textoNorm.split(" ");
  let resultados = [];

  for (let id in baseDados[cultura]) {
    const d = baseDados[cultura][id];
    let pontos = 0;
    const nomeDoencaNorm = normalizar(d.nome).replace(/s\b/g, "");

    if (textoNorm.includes(nomeDoencaNorm) || nomeDoencaNorm.includes(textoNorm)) {
      pontos += 500;
    }

    d.sintomas.praticos.forEach(s => {
      const sNorm = normalizar(s).replace(/s\b/g, "");
      if (textoNorm.includes(sNorm)) pontos += 50;
      palavras.forEach(p => {
        if (p.length > 3 && sNorm.includes(p)) pontos += 5;
      });
    });

    if (pontos > 0) resultados.push({ ...d, pontos });
  }

  resultados.sort((a, b) => b.pontos - a.pontos);

  if (resultados.length === 0) {
    addMsg("❌ Não identifiquei a doença. Tente detalhar mais.", "bot");
  } else {
    const d = resultados[0];

    const htmlCompleto = `
      <div class="doenca-card destaque">
        <h3>🦠 ${d.nome}</h3>
        <p class="subtitulo"><i>Nome Biológico: ${d.nome_biologico}</i></p>

        ${d.imagem ? `<img src="${d.imagem}" alt="Imagem da ${d.nome}" class="imagem-doenca">` : ""}

        <p><b>📝 Descrição:</b><br>${d.descricao}</p>

        <div class="info-box">
           <p><b>🌡️ Condições Favoráveis:</b><br>${d.condicoes_favoraveis}</p>
        </div>

        <div class="secao-sintomas">
            <p><b>👀 Sintomas Práticos (Campo):</b></p>
            <ul>${d.sintomas.praticos.map(s => `<li>${s}</li>`).join("")}</ul>
        </div>

        <div class="secao-tecnica">
            <p><b>🔬 Sintomas Técnicos:</b></p>
            <ul>${d.sintomas.tecnicos.map(s => `<li>${s}</li>`).join("")}</ul>
        </div>

        <p><b>⚠️ Danos:</b><br>${d.danos}</p>

        <div class="secao-prevencao">
           <p><b>🛡️ Manejo Preventivo:</b><br>${d.manejo_preventivo}</p>
        </div>
        
        <div class="secao-controle">
            <p><b>💊 Controle Recomendado:</b><br>${d.controle}</p>
        </div>
      </div>
    `;
    addMsg(htmlCompleto, "bot", false);
  }

  setTimeout(() => {
    addMsg("🏁 Análise feita. Digite outra cultura para novo diagnóstico ou 'encerrar' para finalizar.", "bot", false);
    etapa = 1;
  }, 2500);
}

// ENTER ENVIA
inputSintomas.addEventListener("keypress", e => {
  if (e.key === "Enter") btnEnviar.click();
});


  window.addEventListener("load", function () {
    setTimeout(function () {
      document.getElementById("splash").style.display = "none";
    }, 3500);
  });















