let baseDados = null;

// carregar JSON
fetch("base.json")
  .then(res => res.json())
  .then(data => {
    baseDados = data;
    console.log("Base carregada com sucesso");
  })
  .catch(err => {
    console.error("Erro ao carregar base:", err);
  });

// normalizar texto
function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// FUNÇÃO PARA OBTER SUGESTÕES
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
      if (textoNorm.includes(sintomaNorm)) {
        pontos += 3;
      } else {
        sintomaNorm.split(" ").forEach(p => {
          if (textoNorm.includes(p)) pontos += 1;
        });
      }
    });

    sugestoes.push({ doenca, pontos });
  }

  // ordenar por pontuação decrescente
  sugestoes.sort((a, b) => b.pontos - a.pontos);

  // pegar as top sugestões não repetindo
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

// BOT PRINCIPAL
function diagnosticar() {
  const cultura = document.getElementById("cultura").value.toLowerCase();
  const textoUsuario = document.getElementById("sintomas").value.trim();
  const resultado = document.getElementById("resultado");

  if (!textoUsuario) {
    resultado.innerHTML = "⚠️ Descreva os sintomas observados.";
    return;
  }

  if (!baseDados || !baseDados[cultura]) {
    resultado.innerHTML = "❌ Base de dados não carregada ou cultura não encontrada.";
    return;
  }

  const textoNorm = normalizar(textoUsuario);

  // obter sugestões (máx 4)
  const sugestoes = obterSugestoes(cultura, textoNorm, 4);

  if (sugestoes.length === 0) {
    resultado.innerHTML = "❌ Nenhuma doença compatível encontrada.";
    return;
  }

  // exibir resultados das sugestões
  let html = "";
  sugestoes.forEach((doenca, index) => {
    html += `
      <h3>🦠 Sugestão ${index + 1}: ${doenca.nome}</h3>

      <p><b>Nome científico:</b> ${doenca.nome_biologico}</p>

      <p><b>Descrição:</b><br>${doenca.descricao}</p>

      <p><b>Condições favoráveis:</b><br>${doenca.condicoes_favoraveis}</p>

      <p><b>Sintomas observados:</b><br>${doenca.sintomas.praticos.join(", ")}</p>

      <p><b>Sintomas técnicos:</b><br>${doenca.sintomas.tecnicos.join(", ")}</p>

      <p><b>Danos:</b><br>${doenca.danos}</p>

      <p><b>Manejo preventivo:</b><br>${doenca.manejo_preventivo}</p>

      <p><b>Controle:</b><br>${doenca.controle}</p>

      <hr>
    `;
  });

  html += `<small>⚠️ Diagnóstico de apoio técnico. Consulte um engenheiro agrônomo.</small>`;

  resultado.innerHTML = html;
}

// botão reiniciar
function reiniciar() {
  document.getElementById("sintomas").value = "";
  document.getElementById("resultado").innerHTML = "";
}      <hr>
    `;
  });

  html += `<small>⚠️ Diagnóstico de apoio técnico. Consulte um engenheiro agrônomo.</small>`;

  resultado.innerHTML = html;
}

// botão reiniciar
function reiniciar() {
  document.getElementById("sintomas").value = "";
  document.getElementById("resultado").innerHTML = "";
}

