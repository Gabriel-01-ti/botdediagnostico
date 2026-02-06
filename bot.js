// ================= VARIÁVEIS =================
let baseDados = null;
const inputSintomas = document.getElementById("sintomas");
const btnEnviar = document.getElementById("btn-diagnosticar");
const chatDiv = document.getElementById("chat");

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

// ================= FUNÇÕES UTIL =================
function normalizar(txt) {
  return txt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function addMsg(texto, tipo) {
  const div = document.createElement("div");
  div.className = "msg " + tipo;
  div.innerHTML = texto;
  chatDiv.appendChild(div);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

// ================= INÍCIO =================
function iniciarBot() {
  addMsg("🤖 <b>Olá! Sou o AgroBot.</b><br>Vou te ajudar a diagnosticar doenças na sua lavoura.<br><br>Qual é a cultura? (Ex: Milho, Soja...)", "bot");
  etapa = 1;
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

  if (etapa === 0) iniciarBot();

  else if (etapa === 1) {
    const culturaNorm = normalizar(texto);
    if (!baseDados[culturaNorm]) {
      addMsg("⚠️ Cultura não encontrada. Tente: Milho, Soja ou Feijão.", "bot");
      return;
    }
    culturaSelecionada = culturaNorm;
    addMsg(`Certo! Analisando <b>${texto}</b>. 🌱`, "bot");
    addMsg(`Como você prefere fazer o diagnóstico?<br><br>
      <button onclick="escolherModo('texto')">✍️ Descrever sintomas</button>
      <button onclick="escolherModo('selecao')">✅ Escolher sintomas</button>`, "bot");
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

        ${d.imagem ? `<img src="${d.imagem}" class="imagem-doenca">` : ""}

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
    addMsg(htmlCompleto, "bot");
  }

  setTimeout(() => {
    addMsg("🏁 Análise feita. Digite outra cultura ou 'Oi' para reiniciar.", "bot");
    etapa = 1;
  }, 2500);
}

// ENTER ENVIA
inputSintomas.addEventListener("keypress", e => {
  if (e.key === "Enter") btnEnviar.click();
});
