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

  Object.keys(baseDados).forEach(cultura => {
    // Título da Cultura (🌱 TRIGO, etc) - Agora com a classe correta para aparecer
    const titulo = document.createElement("div"); 
    titulo.className = "titulo-cultura-guia"; 
    
    const nomeFormatado = cultura.charAt(0).toUpperCase() + cultura.slice(1);
    titulo.innerHTML = `<span>🌱</span> ${nomeFormatado}`;
    
    listaDiv.appendChild(titulo);

    Object.values(baseDados[cultura]).forEach(d => {
      const sintomaPrincipal = d?.sintomas?.praticos?.[0] || "Sintoma não informado";

      const item = document.createElement("div");
      item.className = "item-guia";
      // Removemos o cursor de ponteiro para indicar que não é clicável
      item.style.cursor = "default"; 

      item.innerHTML = `
        <strong>${d.nome}</strong>
        <span>👀 ${sintomaPrincipal}</span>
      `;
      
      // REMOVIDO: item.onclick (Agora não faz nada ao clicar)

      listaDiv.appendChild(item);
    });
  });

  document.getElementById("guia-menu").classList.remove("hidden");
}


function toggleGuiaMenu() {
  document.getElementById("guia-menu").classList.toggle("hidden");
}


// ================= FUNÇÕES UTIL =================
function normalizar(txt) {
  return txt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}function addMsg(texto, tipo, rolar = true) {
  const div = document.createElement("div");
  div.className = tipo === "bot" ? "msg-bot-wrapper" : "msg " + tipo;

  if (tipo === "bot") {
    const headerArea = document.createElement("div");
    headerArea.className = "bot-header-area";

    const avatar = document.createElement("img");
    avatar.src = "logo.jpg";
    avatar.className = "bot-avatar";

    const tail = document.createElement("div");
    tail.className = "bot-tail";

    headerArea.appendChild(avatar);
    headerArea.appendChild(tail);

    const bubble = document.createElement("div");
    bubble.className = "bot-bubble";
    bubble.innerHTML = texto;

    div.appendChild(headerArea);
    div.appendChild(bubble);
  } else {
    // Para mensagens do usuário (bolha verde)
    div.classList.add("usuario"); 
    div.innerHTML = texto;
  }

  chatDiv.appendChild(div);

  // Rola a página inteira de forma suave para o final do novo conteúdo
  if (rolar) {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
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

function salvarDiagnostico(texto) {
  // Pega o usuário logado
  const user = localStorage.getItem("loggedUser");
  if (!user) return; // Não faz nada se não tiver login

  // Pega histórico atual ou cria vazio
  let historico = JSON.parse(localStorage.getItem(user + "_diagnosticos")) || [];

  // Adiciona novo diagnóstico com data/hora
  historico.push({
    resultado: texto,
    data: new Date().toLocaleString()
  });

  // Salva de volta no localStorage
  localStorage.setItem(user + "_diagnosticos", JSON.stringify(historico));
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

// ================= BOTÕES DE SINTOMAS AJUSTADOS =================
function toggleSintoma(btn, sintoma) {
    // Adiciona ou remove a classe 'ativo' (que deve estar configurada no CSS como verde)
    btn.classList.toggle("ativo");
    
    // Se quiser garantir que fique verde forte como solicitado:
    if (btn.classList.contains("ativo")) {
        btn.style.backgroundColor = "#2e7d32";
        btn.style.color = "white";
    } else {
        btn.style.backgroundColor = ""; // Volta ao padrão do CSS
        btn.style.color = "";
    }

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
    addMsg("❌ Não identifiquei a doença. Tente detalhar melhor os sintomas ou use o guia rápido.", "bot");
  } else {
    const d = resultados[0];

    const htmlCompleto = `
      <div class="doenca-card">
        <div class="card-header-agro">
          <h2>🦠 ${d.nome}</h2>
          <small><i>${d.nome_biologico}</i></small>
        </div>

        ${d.imagem ? `<img src="${d.imagem}" class="imagem-doenca-agro">` : ""}

        <div class="card-content-agro">
          <section class="info-item">
            <strong><i class="icon">📝</i> Descrição:</strong>
            <p>${d.descricao}</p>
          </section>

          <section class="info-item box-alerta">
            <strong><i class="icon">🌡️</i> Condições Favoráveis:</strong>
            <p>${d.condicoes_favoraveis}</p>
          </section>

          <div class="duas-colunas">
            <div class="col">
              <strong><i class="icon">👀</i> Sintomas Práticos:</strong>
              <ul>${d.sintomas.praticos.map(s => `<li>${s}</li>`).join("")}</ul>
            </div>
            <div class="col">
              <strong><i class="icon">🔬</i> Sintomas Técnicos:</strong>
              <ul>${d.sintomas.tecnicos.map(s => `<li>${s}</li>`).join("")}</ul>
            </div>
          </div>

          <section class="info-item">
            <strong><i class="icon">⚠️</i> Danos:</strong>
            <p>${d.danos}</p>
          </section>

          <section class="info-item box-manejo">
            <strong><i class="icon">🛡️</i> Manejo Preventivo:</strong>
            <p>${d.manejo_preventivo}</p>
          </section>

          <section class="info-item box-controle">
            <strong><i class="icon">💊</i> Controle Recomendado:</strong>
            <p>${d.controle}</p>
          </section>
          
          <div class="aviso-responsabilidade">
            <p>🚨 <b>AVISO IMPORTANTE:</b> Este diagnóstico é baseado em inteligência artificial e processamento de dados, portanto <b>não é 100% confiável</b>. Para uma análise precisa e aplicação de defensivos, é indispensável a presença e o laudo de um <b>Engenheiro Agrônomo</b>.</p>
          </div>
        </div>
      </div>
    `;

    addMsg(htmlCompleto, "bot", false);
    salvarDiagnostico(`Cultura: ${cultura}, Doença: ${d.nome}`);

    setTimeout(() => {
      addMsg("🏁 Diagnóstico finalizado. Deseja analisar outra cultura ou encerrar?", "bot", false);
      etapa = 1;
    }, 4000);
  }
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



const btnGuia = document.getElementById("floating-guia-btn");

let arrastando = false;
let offsetX = 0;
let offsetY = 0;
let moveu = false;

// recuperar posição salva
const pos = JSON.parse(localStorage.getItem("posGuiaBtn"));
if (pos) {
  btnGuia.style.left = pos.x + "px";
  btnGuia.style.top  = pos.y + "px";
  btnGuia.style.right = "auto";
  btnGuia.style.bottom = "auto";
}

// --------- MOUSE ----------
btnGuia.addEventListener("mousedown", e => {
  arrastando = true;
  moveu = false;
  offsetX = e.clientX - btnGuia.offsetLeft;
  offsetY = e.clientY - btnGuia.offsetTop;
});

document.addEventListener("mousemove", e => {
  if (!arrastando) return;

  moveu = true;

  btnGuia.style.left = (e.clientX - offsetX) + "px";
  btnGuia.style.top  = (e.clientY - offsetY) + "px";
  btnGuia.style.right = "auto";
  btnGuia.style.bottom = "auto";
});

document.addEventListener("mouseup", () => {
  if (!arrastando) return;
  arrastando = false;

  // salva posição
  localStorage.setItem("posGuiaBtn", JSON.stringify({
    x: btnGuia.offsetLeft,
    y: btnGuia.offsetTop
  }));
});


// --------- TOUCH (CELULAR) ----------
btnGuia.addEventListener("touchstart", e => {
  const t = e.touches[0];
  arrastando = true;
  moveu = false;
  offsetX = t.clientX - btnGuia.offsetLeft;
  offsetY = t.clientY - btnGuia.offsetTop;
});

document.addEventListener("touchmove", e => {
  if (!arrastando) return;
  const t = e.touches[0];

  moveu = true;

  btnGuia.style.left = (t.clientX - offsetX) + "px";
  btnGuia.style.top  = (t.clientY - offsetY) + "px";
  btnGuia.style.right = "auto";
  btnGuia.style.bottom = "auto";
});

document.addEventListener("touchend", () => {
  if (!arrastando) return;
  arrastando = false;

  localStorage.setItem("posGuiaBtn", JSON.stringify({
    x: btnGuia.offsetLeft,
    y: btnGuia.offsetTop
  }));
});


// 👉 evita abrir o guia quando arrastar
btnGuia.addEventListener("click", e => {
  if (moveu) {
    e.stopImmediatePropagation();
    e.preventDefault();
    moveu = false;
  }
});
