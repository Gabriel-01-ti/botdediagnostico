// VARIÁVEIS DE CONTROLE
let baseDados = null;
const inputSintomas = document.getElementById("sintomas");
const btnEnviar = document.getElementById("btn-diagnosticar");
const chatDiv = document.getElementById("chat");
let etapa = 0; 
let culturaSelecionada = "";

// 1. CARREGAR BASE
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

// NORMALIZAR
function normalizar(txt) {
  return txt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// ADICIONAR MENSAGEM
function addMsg(texto, tipo) {
  const div = document.createElement("div");
  div.className = "msg " + tipo;
  div.innerHTML = texto;
  chatDiv.appendChild(div);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

// INICIAR
function iniciarBot() {
  addMsg("🤖 Olá! Tudo bem? 🌱<br>Qual é a cultura? (Ex: Milho, Soja...)", "bot");
  etapa = 1;
}

// BOTÃO ENVIAR
btnEnviar.addEventListener("click", () => {
  const texto = inputSintomas.value.trim();
  if (!texto) return;

  addMsg("Você: " + texto, "usuario");
  inputSintomas.value = "";

  const comando = normalizar(texto);
  if (['oi', 'ola', 'reiniciar', 'inicio'].includes(comando)) {
    iniciarBot();
    return;
  }

  if (etapa === 0) {
    iniciarBot();
  } else if (etapa === 1) {
    const culturaNorm = normalizar(texto);
    if (!baseDados || !baseDados[culturaNorm]) {
      addMsg("⚠️ Cultura não encontrada. Tente: Milho, Soja ou Feijão.", "bot");
      return;
    }
    culturaSelecionada = culturaNorm;
    addMsg(`Certo! Analisando <b>${texto}</b>.<br>Descreva os sintomas.`, "bot");
    etapa = 2;
  } else if (etapa === 2) {
    diagnosticar(culturaSelecionada, texto);
  }
});

// --- FUNÇÃO PRINCIPAL DE DIAGNÓSTICO ---
function diagnosticar(cultura, textoUsuario) {
  const textoNorm = normalizar(textoUsuario).replace(/s\b/g, ""); 
  const palavras = textoNorm.split(" ");
  let resultados = [];

  for (let id in baseDados[cultura]) {
    const d = baseDados[cultura][id];
    let pontos = 0;
    const nomeDoencaNorm = normalizar(d.nome).replace(/s\b/g, "");

    // 1. Identificação por Nome (Peso Máximo)
    if (textoNorm.includes(nomeDoencaNorm) || nomeDoencaNorm.includes(textoNorm)) {
      pontos += 500;
    }

    // 2. Identificação por Sintomas
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
    // PEGA SÓ O PRIMEIRO (O VENCEDOR)
    const d = resultados[0];

    // Formata listas (Práticos e Técnicos)
    const listaPraticos = d.sintomas.praticos.map(s => `<li>${s}</li>`).join("");
    const listaTecnicos = d.sintomas.tecnicos.map(s => `<li>${s}</li>`).join("");

    // MONTA O HTML COM TUDO O QUE TEM NO JSON
    const htmlCompleto = `
      <div class="doenca-card destaque">
        <h3>🦠 ${d.nome}</h3>
        <p class="subtitulo"><i>Nome Biológico: ${d.nome_biologico}</i></p>
        
        <p><b>📝 Descrição:</b><br>${d.descricao}</p>
        
        <div class="info-box">
           <p><b>🌡️ Condições Favoráveis:</b><br>${d.condicoes_favoraveis}</p>
        </div>

        <div class="secao-sintomas">
            <p><b>👀 Sintomas Práticos (Campo):</b></p>
            <ul>${d.sintomas.praticos.join(", ")}</ul>
        </div>

        <div class="secao-tecnica">
            <p><b>🔬 Sintomas Técnicos (Laboratório/Análise):</b></p>
            <ul>${d.sintomas.tecnicos.join(", ")}</ul>
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
    addMsg("<br>🏁 <b>Análise feita.</b><br>Digite a próxima cultura ou 'Oi' para reiniciar.", "bot");
    etapa = 1; 
  }, 2500);
}

// Enter para enviar
inputSintomas.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    btnEnviar.click();
  }
});
