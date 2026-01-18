let baseDados = null;

// ELEMENTOS
const inputSintomas = document.getElementById("sintomas");
const listaSugestoes = document.getElementById("lista-sugestoes");
const selectCultura = document.getElementById("cultura");
const btnDiagnosticar = document.getElementById("btn-diagnosticar");
const chatDiv = document.getElementById("chat");

// CARREGAR BASE
fetch("base.json")
  .then(res => res.json())
  .then(data => {
    baseDados = data;
    inputSintomas.disabled = false;
    inputSintomas.placeholder = "Descreva o sintoma (ex: manchas brancas nas folhas)";
  });

// NORMALIZAR TEXTO
function normalizar(txt) {
  return txt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// MENSAGENS NO CHAT
function addMsg(texto, tipo) {
  const div = document.createElement("div");
  div.className = "msg " + tipo;
  div.innerHTML = texto;
  chatDiv.appendChild(div);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

// BOT INICIAL
window.onload = () => {
  addMsg("🤖 Olá! Bom dia 🌱<br>Escolha a cultura e descreva os sintomas da lavoura.", "bot");
};

// AUTOCOMPLETE INTELIGENTE
inputSintomas.addEventListener("input", () => {
  const cultura = selectCultura.value;
  const texto = normalizar(inputSintomas.value);
  listaSugestoes.innerHTML = "";

  if (!baseDados || !cultura || texto.length < 2) {
    listaSugestoes.style.display = "none";
    return;
  }

  let sugestoes = [];

  for (let id in baseDados[cultura]) {
    baseDados[cultura][id].sintomas.praticos.forEach(s => {
      if (normalizar(s).includes(texto)) sugestoes.push(s);
    });
  }

  sugestoes = [...new Set(sugestoes)];

  sugestoes.forEach(s => {
    const li = document.createElement("li");
    li.textContent = s;
    li.onclick = () => {
      inputSintomas.value = s;
      listaSugestoes.style.display = "none";
    };
    listaSugestoes.appendChild(li);
  });

  listaSugestoes.style.display = sugestoes.length ? "block" : "none";
});

// BOTÃO DIAGNOSTICAR
btnDiagnosticar.addEventListener("click", diagnosticar);

function diagnosticar() {
  const cultura = selectCultura.value;
  const textoUsuario = inputSintomas.value.trim();

  if (!cultura || !textoUsuario) {
    addMsg("⚠️ Informe a cultura e descreva o sintoma.", "bot");
    return;
  }

  addMsg("Você: " + textoUsuario, "usuario");

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
    return;
  }

  resultados.slice(0, 3).forEach(d => {
    addMsg(`
      <b>🦠 ${d.nome}</b><br>
      <b>Descrição:</b> ${d.descricao}<br>
      <b>Sintomas técnicos:</b> ${d.sintomas.tecnicos.join(", ")}<br>
      <b>Danos:</b> ${d.danos}<br>
      <b>Controle:</b> ${d.controle}
    `, "bot");
  });

  inputSintomas.value = "";
}
