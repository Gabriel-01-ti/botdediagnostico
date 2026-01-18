let baseDados = null;
let sintomasAtuais = [];

// ELEMENTOS
const inputSintomas = document.getElementById("sintomas");
const listaSugestoes = document.getElementById("lista-sugestoes");
const selectCultura = document.getElementById("cultura");
const resultadoDiv = document.getElementById("resultado");
const btnDiagnosticar = document.getElementById("btn-diagnosticar");

// NORMALIZAR TEXTO
function normalizar(txt) {
  return txt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// CARREGAR JSON
fetch("./base.json")
  .then(res => {
    if (!res.ok) throw new Error("Erro ao carregar JSON");
    return res.json();
  })
  .then(data => {
    baseDados = data;
    inputSintomas.placeholder = "Digite o sintoma (ex: manchas claras na folha)";
    inputSintomas.disabled = false;
    console.log("Base carregada!");
  })
  .catch(err => {
    console.error(err);
    resultadoDiv.innerHTML = "❌ Erro ao carregar base.json";
  });

// MUDANÇA DE CULTURA
selectCultura.addEventListener("change", () => {
  const cultura = selectCultura.value.toLowerCase();
  sintomasAtuais = [];
  inputSintomas.value = "";
  listaSugestoes.innerHTML = "";

  if (!baseDados || !baseDados[cultura]) return;

  const doencas = baseDados[cultura];
  for (let id in doencas) {
    sintomasAtuais.push({
      nomeDoenca: doencas[id].nome,
      sintomas: doencas[id].sintomas.praticos
    });
  }
});

// AUTOCOMPLETE INTELIGENTE (4 DOENÇAS)
inputSintomas.addEventListener("input", () => {
  const texto = normalizar(inputSintomas.value);
  listaSugestoes.innerHTML = "";

  if (!texto || sintomasAtuais.length === 0) {
    listaSugestoes.style.display = "none";
    return;
  }

  const sugestoes = [];
  const usadas = new Set();

  sintomasAtuais.forEach(d => {
    for (let s of d.sintomas) {
      if (normalizar(s).includes(texto) && !usadas.has(d.nomeDoenca)) {
        sugestoes.push(s);
        usadas.add(d.nomeDoenca);
        break;
      }
    }
  });

  if (sugestoes.length === 0) {
    listaSugestoes.style.display = "none";
    return;
  }

  listaSugestoes.style.display = "block";
  sugestoes.slice(0, 4).forEach(s => {
    const li = document.createElement("li");
    li.textContent = s;
    li.onclick = () => {
      inputSintomas.value = s;
      listaSugestoes.style.display = "none";
    };
    listaSugestoes.appendChild(li);
  });
});

// FECHAR LISTA AO CLICAR FORA
document.addEventListener("click", e => {
  if (!inputSintomas.contains(e.target) && !listaSugestoes.contains(e.target)) {
    listaSugestoes.style.display = "none";
  }
});

// DIAGNÓSTICO COMPLETO
function diagnosticar() {
  const cultura = selectCultura.value.toLowerCase();
  const texto = normalizar(inputSintomas.value);

  if (!cultura) {
    resultadoDiv.innerHTML = "⚠️ Selecione a cultura.";
    return;
  }

  let resultados = [];

  for (let id in baseDados[cultura]) {
    const d = baseDados[cultura][id];
    let pontos = 0;

    d.sintomas.praticos.forEach(s => {
      const sint = normalizar(s);
      if (sint.includes(texto) || texto.includes(sint)) pontos += 10;
    });

    if (texto.length === 0) pontos += 1;

    if (pontos > 0) resultados.push({ ...d, pontos });
  }

  if (resultados.length === 0) {
    resultadoDiv.innerHTML = "❌ Nenhuma doença encontrada.";
    return;
  }

  resultados.sort((a, b) => b.pontos - a.pontos);

  resultadoDiv.innerHTML = resultados.map(d => `
    <div class="doenca-card">
      <h3>🦠 ${d.nome}</h3>
      <p><b>Nome científico:</b> ${d.nome_biologico}</p>
      <p><b>Descrição:</b> ${d.descricao}</p>
      <p><b>Condições favoráveis:</b> ${d.condicoes_favoraveis}</p>

      <p><b>Sintomas técnicos:</b></p>
      <ul>
        ${d.sintomas.tecnicos.map(s => `<li>${s}</li>`).join("")}
      </ul>

      <p><b>Danos:</b> ${d.danos}</p>
      <p><b>Manejo preventivo:</b> ${d.manejo_preventivo}</p>
      <p><b>Controle:</b> ${d.controle}</p>
    </div>
  `).join("");
}

// REINICIAR
function reiniciar() {
  selectCultura.value = "";
  inputSintomas.value = "";
  inputSintomas.disabled = false;
  inputSintomas.placeholder = "Digite o sintoma";
  resultadoDiv.innerHTML = "";
  listaSugestoes.style.display = "none";
}

// BOTÃO
btnDiagnosticar.addEventListener("click", diagnosticar);
