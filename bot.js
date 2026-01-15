let baseDados = null;
let sintomasAtuais = []; // Lista para o autocomplete

// Elementos da tela
const inputSintomas = document.getElementById("sintomas");
const listaSugestoes = document.getElementById("lista-sugestoes");
const selectCultura = document.getElementById("cultura");
const btnDiagnosticar = document.getElementById("btn-diagnosticar");
const resultadoDiv = document.getElementById("resultado");

// --- 1. CARREGAMENTO DA BASE EXTERNA ---
console.log("Iniciando carregamento da base.json...");

fetch("base.json") // O "./" garante que busque na mesma pasta
  .then(response => {
    if (!response.ok) {
      throw new Error(`Erro HTTP! Status: ${response.status} - ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    baseDados = data;
    console.log("✅ Base carregada com sucesso:", data);
    
    // Habilita a interface
    inputSintomas.placeholder = "Selecione uma cultura para começar...";
    // inputSintomas continua desabilitado até selecionar a cultura
  })
  .catch(error => {
    console.error("❌ Erro fatal ao carregar base:", error);
    resultadoDiv.innerHTML = `
      <div style="background:#ffcdd2; color:#b71c1c; padding:15px; border-radius:8px;">
        <strong>Erro ao carregar base de dados!</strong><br>
        O arquivo 'base.json' não foi encontrado ou está com erro de sintaxe.<br>
        <small>Detalhe: ${error.message}</small>
      </div>
    `;
  });

// Funcao para limpar texto (acentos, maiusculas)
function normalizar(txt) {
  return txt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// --- 2. MUDANÇA DE CULTURA (Prepara o Autocomplete) ---
selectCultura.addEventListener("change", () => {
  const cultura = selectCultura.value.toLowerCase();
  
  // Limpezas
  inputSintomas.value = "";
  listaSugestoes.style.display = "none";
  sintomasAtuais = [];

  // Verificações de segurança
  if (!baseDados) {
    alert("A base de dados ainda não carregou. Aguarde um instante.");
    return;
  }
  
  if (!cultura) {
    inputSintomas.disabled = true;
    inputSintomas.placeholder = "Selecione uma cultura...";
    return;
  }

  if (!baseDados[cultura]) {
    console.warn(`Cultura '${cultura}' não encontrada no JSON.`);
    inputSintomas.disabled = true;
    return;
  }

  // Se tudo ok, libera o input
  inputSintomas.disabled = false;
  inputSintomas.placeholder = `Digite um sintoma de ${cultura}...`;
  inputSintomas.focus();

  // Extrai sintomas únicos do JSON para a memória
  const doencas = baseDados[cultura];
  const setSintomas = new Set();

  for (let id in doencas) {
    const d = doencas[id];
    if (d.sintomas && d.sintomas.praticos) {
      d.sintomas.praticos.forEach(s => setSintomas.add(s));
    }
  }
  
  sintomasAtuais = Array.from(setSintomas).sort();
  console.log(`Sintomas carregados para ${cultura}:`, sintomasAtuais);
});

// --- 3. EVENTO DE DIGITAR (O Autocomplete) ---
inputSintomas.addEventListener("input", function() {
  const texto = this.value;
  listaSugestoes.innerHTML = ""; // Limpa lista anterior
  
  if (!texto || sintomasAtuais.length === 0) {
    listaSugestoes.style.display = "none";
    return;
  }

  const textoNorm = normalizar(texto);
  
  // Filtra: procura o texto digitado dentro dos sintomas
  const encontrados = sintomasAtuais.filter(s => 
    normalizar(s).includes(textoNorm)
  );

  if (encontrados.length > 0) {
    listaSugestoes.style.display = "block";
    
    // Cria os itens da lista
    encontrados.forEach(sintoma => {
      const li = document.createElement("li");
      li.textContent = sintoma;
      
      // Clique na sugestão
      li.onclick = () => {
        inputSintomas.value = sintoma; // Preenche input
        listaSugestoes.style.display = "none"; // Esconde lista
        inputSintomas.focus();
      };
      
      listaSugestoes.appendChild(li);
    });
  } else {
    listaSugestoes.style.display = "none";
  }
});

// Fecha a lista se clicar fora
document.addEventListener("click", (e) => {
  if (!inputSintomas.contains(e.target) && !listaSugestoes.contains(e.target)) {
    listaSugestoes.style.display = "none";
  }
});

// --- 4. FUNÇÃO DIAGNOSTICAR ---
window.diagnosticar = function() {
  const cultura = selectCultura.value.toLowerCase();
  const textoUsuario = inputSintomas.value;

  if (!cultura || !textoUsuario) {
    resultadoDiv.innerHTML = "<p style='color:red'>⚠️ Selecione a cultura e informe o sintoma.</p>";
    return;
  }

  const textoNorm = normalizar(textoUsuario);
  const doencas = baseDados[cultura];
  let sugestoes = [];

  for (let id in doencas) {
    const d = doencas[id];
    let pontos = 0;

    // Lógica de pontuação
    d.sintomas.praticos.forEach(s => {
      const sNorm = normalizar(s);
      // Se for igual ou se um conter o outro
      if (textoNorm.includes(sNorm) || sNorm.includes(textoNorm)) {
        pontos += 10;
      }
    });

    if (pontos > 0) sugestoes.push({ dados: d, pontos });
  }

  sugestoes.sort((a, b) => b.pontos - a.pontos);

  if (sugestoes.length === 0) {
    resultadoDiv.innerHTML = "<p>❌ Nenhuma doença encontrada com esse sintoma específico.</p>";
  } else {
    let html = "";
    // Pega até 3 sugestões
    sugestoes.slice(0, 3).forEach(item => {
      html += `
        <div class="doenca-card">
          <h3>🦠 ${item.dados.nome}</h3>
          <p><b>Nome Científico:</b> ${item.dados.nome_biologico}</p>
          <p><b>Sintomas:</b> ${item.dados.sintomas.praticos.join(", ")}</p>
          <p><b>Controle:</b> ${item.dados.controle}</p>
        </div>
      `;
    });
    resultadoDiv.innerHTML = html;
  }
};

// Reiniciar
window.reiniciar = function() {
  selectCultura.value = "";
  inputSintomas.value = "";
  inputSintomas.disabled = true;
  inputSintomas.placeholder = "Selecione uma cultura...";
  resultadoDiv.innerHTML = "";
  listaSugestoes.style.display = "none";
};
  const cultura = selectCultura.value.toLowerCase();
  sintomasAtuais = []; // Limpa lista
  inputSintomas.value = ""; // Limpa input

  if (!baseDados || !cultura || !baseDados[cultura]) return;

  const doencas = baseDados[cultura];
  const setSintomas = new Set();

  // Varre todas as doenças da cultura e pega os sintomas
  for (let chave in doencas) {
    const d = doencas[chave];
    if (d.sintomas && d.sintomas.praticos) {
      d.sintomas.praticos.forEach(s => setSintomas.add(s));
    }
  }
  
  // Converte para array e ordena
  sintomasAtuais = Array.from(setSintomas).sort();
  console.log(`Sintomas carregados para ${cultura}:`, sintomasAtuais.length);
});

// 3. AUTOCOMPLETE (Evento de digitar)
inputSintomas.addEventListener("input", function() {
  const texto = this.value;
  listaSugestoes.innerHTML = ""; // Limpa sugestões antigas
  
  // Se não tiver cultura selecionada ou texto vazio
  if (!texto || sintomasAtuais.length === 0) {
    listaSugestoes.style.display = "none";
    return;
  }

  const textoNorm = normalizar(texto);

  // Filtra os sintomas que contém o que foi digitado
  const encontrados = sintomasAtuais.filter(s => normalizar(s).includes(textoNorm));

  if (encontrados.length > 0) {
    listaSugestoes.style.display = "block";
    
    // Cria os itens da lista
    encontrados.forEach(sintoma => {
      const li = document.createElement("li");
      li.textContent = sintoma;
      li.onclick = () => {
        inputSintomas.value = sintoma; // Preenche o campo
        listaSugestoes.style.display = "none"; // Esconde a lista
      };
      listaSugestoes.appendChild(li);
    });
  } else {
    listaSugestoes.style.display = "none";
  }
});

// Esconder lista se clicar fora
document.addEventListener("click", (e) => {
  if (!inputSintomas.contains(e.target) && !listaSugestoes.contains(e.target)) {
    listaSugestoes.style.display = "none";
  }
});

// 4. DIAGNÓSTICO
function diagnosticar() {
  const cultura = selectCultura.value.toLowerCase();
  const textoUsuario = inputSintomas.value;
  const divResultado = document.getElementById("resultado");

  if (!cultura || !textoUsuario) {
    divResultado.innerHTML = "<p style='color:red'>⚠️ Selecione a cultura e descreva o sintoma.</p>";
    return;
  }

  const textoNorm = normalizar(textoUsuario);
  const doencas = baseDados[cultura];
  let sugestoes = [];

  for (let chave in doencas) {
    const d = doencas[chave];
    let pontos = 0;
    
    // Sistema simples de pontuação
    d.sintomas.praticos.forEach(s => {
      const sNorm = normalizar(s);
      if (textoNorm.includes(sNorm) || sNorm.includes(textoNorm)) pontos += 10;
    });

    if (pontos > 0) sugestoes.push({ dados: d, pontos });
  }

  sugestoes.sort((a, b) => b.pontos - a.pontos);

  // Exibir
  if (sugestoes.length === 0) {
    divResultado.innerHTML = "<p>❌ Nenhuma doença encontrada com esse sintoma específico.</p>";
  } else {
    let html = "";
    sugestoes.slice(0, 3).forEach(item => {
      html += `
        <div class="doenca-card">
          <h3>🦠 ${item.dados.nome}</h3>
          <p><b>Nome Científico:</b> ${item.dados.nome_biologico}</p>
          <p><b>Sintomas:</b> ${item.dados.sintomas.praticos.join(", ")}</p>
          <p><b>Controle:</b> ${item.dados.controle}</p>
        </div>
      `;
    });
    divResultado.innerHTML = html;
  }
}

function reiniciar() {
  selectCultura.value = "";
  inputSintomas.value = "";
  document.getElementById("resultado").innerHTML = "";
  listaSugestoes.style.display = "none";
}
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



