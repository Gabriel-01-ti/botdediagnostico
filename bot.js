let baseDados = null;
let sintomasAtuais = [];

// ELEMENTOS
const inputSintomas = document.getElementById("sintomas");
const listaSugestoes = document.getElementById("lista-sugestoes");
const selectCultura = document.getElementById("cultura");
const resultadoDiv = document.getElementById("resultado");

// NORMALIZAR TEXTO
function normalizar(txt) {
  return txt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// CARREGAR JSON (AGORA FUNCIONAL)
fetch("./base.json")
  .then(res => {
    if (!res.ok) throw new Error("Erro ao carregar JSON");
    return res.json();
  })
  .then(data => {
    baseDados = data;
    inputSintomas.placeholder = "Digite o sintoma (ex: mancha)";
    inputSintomas.disabled = false;
    console.log("Base carregada com sucesso!");
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

// AUTOCOMPLETE (4 DOENÇAS DIFERENTES)
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

// FECHAR LISTA
document.addEventListener("click", e => {
  if (!inputSintomas.contains(e.target) && !listaSugestoes.contains(e.target)) {
    listaSugestoes.style.display = "none";
  }
});

// DIAGNÓSTICO
function diagnosticar() {
  const cultura = selectCultura.value.toLowerCase();
  const texto = normalizar(inputSintomas.value);

  if (!cultura || !texto) {
    resultadoDiv.innerHTML = "⚠️ Selecione a cultura e o sintoma.";
    return;
  }

  let resultados = [];

  for (let id in baseDados[cultura]) {
    let pontos = 0;
    const d = baseDados[cultura][id];

    d.sintomas.praticos.forEach(s => {
      if (normalizar(s).includes(texto) || texto.includes(normalizar(s))) {
        pontos += 10;
      }
    });

    if (pontos > 0) resultados.push({ ...d, pontos });
  }

  resultados.sort((a, b) => b.pontos - a.pontos);

  if (resultados.length === 0) {
    resultadoDiv.innerHTML = "❌ Nenhuma doença encontrada.";
    return;
  }

  resultadoDiv.innerHTML = resultados.slice(0, 4).map(d => `
    <div class="doenca-card">
      <h3>🦠 ${d.nome}</h3>
      <p><b>Nome científico:</b> ${d.nome_biologico}</p>
      <p><b>Sintomas:</b> ${d.sintomas.praticos.join(", ")}</p>
      <p><b>Controle:</b> ${d.controle}</p>
    </div>
  `).join("");
}

function reiniciar() {
  selectCultura.value = "";
  inputSintomas.value = "";
  inputSintomas.disabled = false; // NÃO bloquear mais
  inputSintomas.placeholder = "Digite o sintoma (ex: mancha)";
  resultadoDiv.innerHTML = "";
  listaSugestoes.style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btn-diagnosticar");
  if (btn) {
    btn.addEventListener("click", diagnosticar);
    console.log("Botão de diagnóstico conectado!");
  }
});





