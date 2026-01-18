let baseDados = null;

// ELEMENTOS
const inputSintomas = document.getElementById("sintomas");
const listaSugestoes = document.getElementById("lista-sugestoes");
const selectCultura = document.getElementById("cultura");
const btnEnviar = document.getElementById("btn-diagnosticar");
const chatDiv = document.getElementById("chat");

// CARREGAR BASE
fetch("base.json")
  .then(res => res.json())
  .then(data => {
    baseDados = data;
    inputSintomas.disabled = false;
    inputSintomas.placeholder = "Digite aqui...";
    iniciarBot();
  });

// NORMALIZAR TEXTO
function normalizar(txt) {
  return txt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// ADICIONAR MENSAGEM AO CHAT
function addMsg(texto, tipo) {
  const div = document.createElement("div");
  div.className = "msg " + tipo;
  div.innerHTML = texto;
  chatDiv.appendChild(div);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

// VARIÁVEL DE CONTROLE DE FLUXO
let etapa = 0;
let culturaSelecionada = "";
let sintomasUsuario = "";

// INICIAR BOT
function iniciarBot() {
  addMsg("🤖 Olá! Tudo bem? 🌱<br>Qual é a cultura que você deseja analisar?", "bot");
  etapa = 1;
}

// BOTÃO ENVIAR
btnEnviar.addEventListener("click", () => {
  const texto = inputSintomas.value.trim();
  if (!texto) return;

  addMsg("Você: " + texto, "usuario");

  if (etapa === 1) {
    // Usuário respondeu a cultura
    const culturaNorm = normalizar(texto);
    if (!baseDados[culturaNorm]) {
      addMsg("⚠️ Cultura não encontrada. Tente novamente.", "bot");
      inputSintomas.value = "";
      return;
    }
    culturaSelecionada = culturaNorm;
    addMsg(`Ótimo! Você escolheu <b>${texto}</b>.<br>Agora, descreva os sintomas observados na lavoura.`, "bot");
    etapa = 2;
    inputSintomas.value = "";
  } else if (etapa === 2) {
    // Usuário respondeu os sintomas
    sintomasUsuario = texto;
    etapa = 3;
    diagnosticar(culturaSelecionada, sintomasUsuario);
  }
});

// FUNÇÃO DIAGNOSTICAR
function diagnosticar(cultura, textoUsuario) {
  const textoNorm = normalizar(textoUsuario);
  const palavras = textoNorm.split(" ");

  let resultados = [];

  for (let id in baseDados[cultura]) {
    const d = baseDados[cultura][id];
    let pontos = 0;

    d.sintomas.praticos.forEach(s => {
      const sNorm = normalizar(s);
      palavras.forEach(p => {
        if (p.length > 3 && sNorm.includes(p)) pontos += 3;
      });
      if (sNorm.includes(textoNorm) || textoNorm.includes(sNorm)) pontos += 15;
    });

    if (pontos > 0) resultados.push({ ...d, pontos });
  }

  resultados.sort((a, b) => b.pontos - a.pontos);

  if (resultados.length === 0) {
    addMsg("❌ Não encontrei doença compatível.", "bot");
  } else {
    resultados.slice(0, 3).forEach(d => {
      addMsg(`
        <b>🦠 ${d.nome}</b><br>
        <b>Descrição:</b> ${d.descricao}<br>
        <b>Sintomas técnicos:</b> ${d.sintomas.tecnicos.join(", ")}<br>
        <b>Danos:</b> ${d.danos}<br>
        <b>Controle:</b> ${d.controle}
      `, "bot");
    });
  }

  // Resetar para nova análise
  addMsg("Se quiser analisar outra cultura, digite o nome da cultura.", "bot");
  etapa = 1;
  inputSintomas.value = "";
}
