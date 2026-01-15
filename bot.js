let baseDados = null;
let todosSintomasCultura = []; // Armazena sintomas únicos da cultura selecionada

// Elementos do DOM
const inputSintomas = document.getElementById("sintomas");
const listaSugestoes = document.getElementById("lista-sugestoes");

// Carregar JSON
fetch("base.json")
  .then(res => res.json())
  .then(data => {
    baseDados = data;
    console.log("Base carregada com sucesso");
  })
  .catch(err => {
    console.error("Erro ao carregar base:", err);
  });

// Normalizar texto (remove acentos e caixa baixa)
function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// --- NOVO: Função para extrair sintomas da cultura selecionada ---
function atualizarListaSintomas() {
  const cultura = document.getElementById("cultura").value.toLowerCase();
  todosSintomasCultura = []; // Limpa lista anterior
  
  if (!baseDados || !baseDados[cultura]) return;

  const doencas = baseDados[cultura];
  const setSintomas = new Set(); // Set evita duplicatas

  // Varre todas as doenças e pega os sintomas práticos
  for (const chave in doencas) {
    const doenca = doencas[chave];
    if (doenca.sintomas && doenca.sintomas.praticos) {
      doenca.sintomas.praticos.forEach(s => setSintomas.add(s));
    }
  }

  // Converte Set para Array e ordena
  todosSintomasCultura = Array.from(setSintomas).sort();
}

// --- NOVO: Evento de Digitação (Autocomplete) ---
inputSintomas.addEventListener("input", function() {
  const textoDigitado = this.value;
  listaSugestoes.innerHTML = ""; // Limpa sugestões antigas
  
  if (!textoDigitado) {
    listaSugestoes.style.display = "none";
    return;
  }

  const textoNorm = normalizar(textoDigitado);

  // Filtra sintomas que contêm o texto digitado
  const sugestoes = todosSintomasCultura.filter(sintoma => 
    normalizar(sintoma).includes(textoNorm)
  );

  if (sugestoes.length > 0) {
    listaSugestoes.style.display = "block";
    sugestoes.forEach(sintoma => {
      const li = document.createElement("li");
      li.textContent = sintoma;
      
      // Ao clicar na sugestão
      li.onclick = () => {
        inputSintomas.value = sintoma; // Preenche o input
        listaSugestoes.style.display = "none"; // Esconde lista
        listaSugestoes.innerHTML = "";
      };
      
      listaSugestoes.appendChild(li);
    });
  } else {
    listaSugestoes.style.display = "none";
  }
});

// Esconder lista se clicar fora
document.addEventListener('click', function(e) {
  if (!inputSintomas.contains(e.target) && !listaSugestoes.contains(e.target)) {
    listaSugestoes.style.display = 'none';
  }
});

// --- LÓGICA DE DIAGNÓSTICO (Mantida e ajustada) ---
function obterSugestoes(cultura, textoNorm, limite = 4) {
  if (!baseDados || !baseDados[cultura]) return [];

  const doencas = baseDados[cultura];
  const sugestoes = [];

  for (const chave in doencas) {
    const doenca = doencas[chave];
    if (!doenca.sintomas || !doenca.sintomas.praticos) continue;

    let pontos = 0;

    doenca.sintomas.praticos.forEach(sintoma => {
      const sintomaNorm = normalizar(sintoma);
      // Se o sintoma for exato ou conter a frase inteira, pontua mais
      if (textoNorm.includes(sintomaNorm) || sintomaNorm.includes(textoNorm)) {
        pontos += 10;
      } 
      // Comparação palavra por palavra (fallback)
      else {
        sintomaNorm.split(" ").forEach(p => {
          if (p.length > 3 && textoNorm.includes(p)) pontos += 1;
        });
      }
    });

    sugestoes.push({ doenca, pontos });
  }

  sugestoes.sort((a, b) => b.pontos - a.pontos);

  const topSugestoes = [];
  const nomes = new Set();
  for (let i = 0; i < sugestoes.length && topSugestoes.length < limite; i++) {
    if (sugestoes[i].pontos > 0 && !nomes.has(sugestoes[i].doenca.nome)) {
      topSugestoes.push(sugestoes[i].doenca);
      nomes.add(sugestoes[i].doenca.nome);
    }
  }

  return topSugestoes;
}

function diagnosticar() {
  const cultura = document.getElementById("cultura").value.toLowerCase();
  const textoUsuario = document.getElementById("sintomas").value.trim();
  const resultado = document.getElementById("resultado");

  if (!cultura) {
    resultado.innerHTML = "⚠️ Selecione uma cultura primeiro.";
    return;
  }
  
  if (!textoUsuario) {
    resultado.innerHTML = "⚠️ Descreva ou selecione um sintoma.";
    return;
  }

  if (!baseDados || !baseDados[cultura]) {
    resultado.innerHTML = "❌ Base de dados carregando ou cultura inválida.";
    return;
  }

  const textoNorm = normalizar(textoUsuario);
  const sugestoes = obterSugestoes(cultura, textoNorm, 4);

  if (sugestoes.length === 0) {
    resultado.innerHTML = "❌ Nenhuma doença compatível encontrada com esse sintoma.";
    return;
  }

  let html = "";
  sugestoes.forEach((doenca, index) => {
    html += `
      <h3>🦠 Sugestão ${index + 1}: ${doenca.nome}</h3>
      <p><b>Nome científico:</b> ${doenca.nome_biologico}</p>
      <p><b>Sintomas:</b> ${doenca.sintomas.praticos.join(", ")}</p>
      <p><b>Controle:</b> ${doenca.controle}</p>
      <hr>
    `;
  });
  
  html += `<small>⚠️ Diagnóstico de apoio técnico.</small>`;
  resultado.innerHTML = html;
}

function reiniciar() {
  document.getElementById("sintomas").value = "";
  document.getElementById("cultura").value = "";
  document.getElementById("resultado").innerHTML = "";
  document.getElementById("lista-sugestoes").style.display = "none";
}
