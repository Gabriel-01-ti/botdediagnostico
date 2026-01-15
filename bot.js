let baseDados = null;

// carregar JSON
fetch("base.json")
  .then(res => res.json())
  .then(data => baseDados = data);

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

  if (!baseDados || !baseDados[cultura]) {
    resultado.innerHTML = "❌ Base de dados não carregada ou cultura inválida.";
    return;
  }

  resultado.innerHTML = "⏳ Analisando sintomas...";

  const palavrasUsuario = normalizar(textoUsuario).split(/\s+/);

  let melhorDoenca = null;
  let maiorPontuacao = 0;

  const doencas = baseDados[cultura];

  for (const chave in doencas) {
    const doenca = doencas[chave];
    let pontos = 0;

    // 🔒 DIAGNÓSTICO: SOMENTE SINTOMAS PRÁTICOS
    const sintomasPraticos = doenca.sintomas.praticos;

    sintomasPraticos.forEach(sintoma => {
      const palavrasSintoma = normalizar(sintoma).split(/\s+/);
      palavrasSintoma.forEach(p => {
        if (palavrasUsuario.includes(p)) {
          pontos++;
        }
      });
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

  // 👉 EXIBIR TUDO DO JSON
  resultado.innerHTML = `
    <h3>🦠 ${melhorDoenca.nome}</h3>

    <p><b>Nome científico:</b> ${melhorDoenca.nome_biologico}</p>

    <p><b>Descrição:</b><br>
    ${melhorDoenca.descricao}</p>

    <p><b>Condições favoráveis:</b><br>
    ${melhorDoenca.condicoes_favoraveis}</p>

    <p><b>Sintomas observados no campo:</b><br>
    ${melhorDoenca.sintomas.praticos.join(", ")}</p>

    <p><b>Sintomas técnicos (referência):</b><br>
    ${melhorDoenca.sintomas.tecnicos.join(", ")}</p>

    <p><b>Danos causados:</b><br>
    ${melhorDoenca.danos}</p>

    <p><b>Manejo preventivo:</b><br>
    ${melhorDoenca.manejo_preventivo}</p>

    <p><b>Controle:</b><br>
    ${melhorDoenca.controle}</p>

    <small>⚠️ Diagnóstico de apoio técnico. Consulte um engenheiro agrônomo.</small>
  `;
}

// botão reiniciar
function reiniciar() {
  document.getElementById("sintomas").value = "";
  document.getElementById("resultado").innerHTML = "";
}
