console.log("JS carregado com sucesso");

let model;
let modeloCarregando = false; // Trava para evitar cliques enquanto carrega

// Elementos do DOM
const selectCultura = document.getElementById("cultura");
const divResultado = document.getElementById("resultado");

// 1. Função dinâmica para carregar modelo
async function carregarModelo(cultura) {
  if (!cultura) return;

  console.log("--- INICIANDO CARREGAMENTO ---");
  console.log(`1. Cultura selecionada: "${cultura}"`);

  const modelURL = `./modelos/${cultura}/`;
  console.log(`2. Caminho construído: ${modelURL}`);
  console.log(`3. Tentando baixar: ${modelURL}model.json`);

  try {
    model = await tmImage.load(
      modelURL + "model.json",
      modelURL + "metadata.json"
    );
    console.log("✅ SUCESSO: Modelo carregado!");
    document.getElementById("resultado").innerHTML = `<p style="color:green">Modelo de ${cultura} carregado.</p>`;
    
  } catch (error) {
    console.error("❌ ERRO FATAL:", error);
    alert(`Erro ao carregar modelo! \n\nO navegador tentou buscar em:\n${modelURL}model.json\n\nVerifique o console (F12) para ver o erro detalhado.`);
  }
}

// 2. Carregar o modelo inicial (padrão do select) ao abrir a página
window.addEventListener('DOMContentLoaded', () => {
    const culturaInicial = selectCultura.value.toLowerCase().trim();
    carregarModelo(culturaInicial);
});

// 3. Monitorar mudança no <select> para trocar o modelo
selectCultura.addEventListener("change", (e) => {
    const novaCultura = e.target.value.toLowerCase().trim();
    carregarModelo(novaCultura);
});


// Função Analisar (Ajustada)
async function analisar() {
  
  // Verificações de segurança antes de começar
  if (modeloCarregando) {
    alert("Aguarde, o modelo ainda está carregando...");
    return;
  }

  if (!model) {
    alert("O modelo não foi carregado corretamente. Verifique a pasta dos arquivos.");
    return;
  }

  const input = document.getElementById("foto");
  const file = input.files[0];

  if (!file) {
    alert("Envie uma foto da lavoura");
    return;
  }

  divResultado.innerHTML = `
    <p class="analisando">⏳ Analisando a imagem com IA...</p>
  `;

  const img = document.createElement("img");
  img.src = URL.createObjectURL(file);

  img.onload = async () => {
    // Predição usando o modelo atual carregado
    const predictions = await model.predict(img);

    const melhor = predictions.reduce((a, b) =>
      a.probability > b.probability ? a : b
    );

    const classeOriginal = melhor.className;
    const prob = melhor.probability;

    // Normalização do nome da classe
    const classe = classeOriginal
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_");

    console.log("Classe:", classe, "| Prob:", prob);

    // Pega o valor atual do select para buscar no JSON
    const culturaAtual = selectCultura.value.toLowerCase().trim();
    mostrarResultado(culturaAtual, classe, prob);
  };
}

async function mostrarResultado(cultura, classe, prob) {
  const res = document.getElementById("resultado");

  try {
    const base = await fetch("base.json").then(r => r.json());

    // Verifica se a cultura e a doença existem no JSON
    if (!base[cultura] || !base[cultura][classe]) {
      res.innerHTML = `
        <div class="erro-box">
            <p>⚠️ Doença identificada: <b>${classe}</b> (${(prob * 100).toFixed(1)}%)</p>
            <p>Mas não encontrei detalhes no arquivo base.json para a cultura <b>${cultura}</b>.</p>
        </div>
      `;
      return;
    }

    const d = base[cultura][classe];

    // Formata a lista de sintomas (Pega os práticos para mostrar ao usuário)
    let listaSintomas = "";
    if (d.sintomas && d.sintomas.praticos) {
      listaSintomas = "<ul>" + d.sintomas.praticos.map(s => `<li>${s}</li>`).join("") + "</ul>";
    } else {
      listaSintomas = d.sintomas; // Caso seja apenas texto antigo
    }

    res.innerHTML = `
      <div class="resultado-card">
          <h3>${d.nome}</h3>
          <p class="probabilidade"><b>Confiança da IA:</b> ${(prob * 100).toFixed(1)}%</p>
          
          <p><b>Nome biológico:</b> <i>${d.nome_biologico}</i></p>
          <p><b>Descrição:</b> ${d.descricao}</p>

          <div class="secao-sintomas">
              <b>Sintomas Principais:</b>
              ${listaSintomas}
          </div>

          <p><b>🌧️ Condições favoráveis:</b> ${d.condicoes_favoraveis}</p>
          <p><b>⚠️ Danos:</b> ${d.danos}</p>
          <p><b>🛡️ Manejo preventivo:</b> ${d.manejo_preventivo}</p>
          <p><b>💊 Controle:</b> ${d.controle}</p>

          <small class="aviso-legal">
            ⚠️ Diagnóstico por IA é apenas um auxílio. Consulte sempre um engenheiro agrônomo.
          </small>
      </div>
    `;
  } catch (err) {
    console.error(err);
    res.innerHTML = "<p>Erro ao ler base de dados. Verifique o JSON.</p>";
  }
}

function reiniciar() {
  document.getElementById("resultado").innerHTML = "";
  document.getElementById("foto").value = "";
  // Não reiniciamos o select para não forçar o recarregamento do modelo sem necessidade
}

