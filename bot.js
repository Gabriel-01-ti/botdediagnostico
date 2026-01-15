let baseDados = null;
let baseCarregada = false;

// carregar JSON
fetch("base.json")
  .then(res => res.json())
  .then(data => {
    baseDados = data;
    baseCarregada = true;
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

// BOT PRINCIPAL
function diagnosticar() {
  const cultura = document.getElementById("cultura").value.toLowerCase();
  const textoUsuario = document.getElementById("sintomas").value.trim();
  const resultado = document.getElementById("resultado");

  if (!textoUsuario) {
    resultado.innerHTML = "⚠️ Descreva os sintomas observados.";
    return;
  }

  if (!baseCarregada) {
    resultado.innerHTML = "⏳ Aguarde, base de dados carregando...";
    return;
  }

  if (!baseDados[cultura]) {
    resultado.innerHTML = "❌ Cultura não encontrada na base.";
    return;
  }

  resultado.innerHTML = "⏳ Analisando sintomas...";

  const textoNorm = normalizar(textoUsuario);

  let melhorDoenca = null;
  let maiorPontuacao = 0;

  const doencas = baseDados[cultura];

  for (const chave in doencas) {
    const doenca = doencas[chave];
    let pontos = 0;

    if (!doenca.sintomas || !doenca.sintomas.praticos) continue;

    doenca.sintomas.praticos.forEach(sintoma => {
      const sintomaNorm = normalizar(sintoma);

      // ⭐ match por frase
      if (textoNorm.includes(sintomaNorm)) {
        pontos += 3;
      } else {
        // match parcial por palavras
        sintomaNorm.split(" ").forEach(p => {
          if (textoNorm.includes(p)) {
            pontos += 1;
          }
        });
      }
    });

    if (pontos > maiorPontuacao) {
      maiorPontuacao = pontos;
      melhorDoenca = doenca;
    }
  }

  if (!melhorDoenca || maiorPontuacao < 2) {
    resultado.innerHTML = "❌ Nenhuma doença compatível encontrada.";
    return;
  }

  // EXIBIR RESULTADO
  resultado.innerHTML = `
    <h3>🦠 ${melhorDoenca.nome}</h3>

    <p><b>Nome científico:</b> ${melhorDoenca.nome_biologico}</p>

    <p><b>Descrição:</b><br>${melhorDoenca.descricao}</p>

    <p><b>Condições favoráveis:</b><br>${melhorDoenca.condicoes_favoraveis}</p>

    <p><b>Sintomas observados:</b><br>
    ${melhorDoenca.sintomas.praticos.join(", ")}</p>

    <p><b>Sintomas técnicos:</b><br>
    ${melhorDoenca.sintomas.tecnicos.join(", ")}</p>

    <p><b>Danos:</b><br>${melhorDoenca.danos}</p>

    <p><b>Manejo preventivo:</b><br>${melhorDoenca.manejo_preventivo}</p>

    <p><b>Controle:</b><br>${melhorDoenca.controle}</p>

    <small>⚠️ Diagnóstico de apoio técnico. Consulte um engenheiro agrônomo.</small>
  `;
}

// botão reiniciar
function reiniciar() {
  document.getElementById("sintomas").value = "";
  document.getElementById("resultado").innerHTML = "";
                                      }
