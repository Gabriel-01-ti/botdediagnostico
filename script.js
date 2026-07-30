console.log("JS carregado com sucesso");

let model;
let modeloCarregando = false; // Trava para evitar cliques enquanto carrega

// Elementos do DOM
const selectCultura = document.getElementById("cultura");
const divResultado = document.getElementById("resultado");

// 1. Função dinâmica para carregar modelo
async function carregarModelo(cultura) {
  // --- CORREÇÃO AQUI ---
  // Se a cultura for vazia ou "selecione", não faz nada e sai da função.
  if (!cultura || cultura === "selecione") {
      console.log("Aguardando seleção de cultura...");
      return;
  }

  modeloCarregando = true;
  divResultado.innerHTML = `<p class="info">🔄 Carregando modelo de <b>${cultura}</b>...</p>`;
  console.log(`Iniciando carregamento do modelo: ${cultura}`);

  try {
    const modelURL = `./modelos/${cultura}/`;

    model = await tmImage.load(
      modelURL + "model.json",
      modelURL + "metadata.json"
    );

    console.log(`Modelo de ${cultura} carregado com sucesso!`);
    divResultado.innerHTML = `<p class="sucesso">✅ Modelo de ${cultura} pronto.</p>`;
  } catch (error) {
    console.error("Erro ao carregar modelo:", error);
    divResultado.innerHTML = `<p class="erro">❌ Erro ao carregar o modelo da pasta <b>${cultura}</b>.</p>`;
    model = null;
  } finally {
    modeloCarregando = false;
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

document.getElementById('foto').addEventListener('change', function() {
    const fileName = this.files[0] ? this.files[0].name : "Toque para selecionar a foto da folha";
    document.getElementById('file-name').innerText = fileName;
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

// REGRA DE CONFIANÇA
if (prob < 0.80) {
  divResultado.innerHTML = `
    <div class="erro-box">
      <p>❌ Não foi possível identificar a doença com segurança.</p>
      <p>Confiança da IA: ${(prob * 100).toFixed(1)}%</p>
      <p>Tente enviar outra foto da folha.</p>
    </div>
  `;
  return; // PARA AQUI, não chama mostrarResultado
}


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
    await salvarDiagnosticoFirestore({
  cultura: cultura,
  doenca: d.nome,
  confianca: null
});
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
       <div class="doenca-card destaque">
        <h3>🦠 ${d.nome}</h3>
        <p class="subtitulo"><i>Nome Biológico: ${d.nome_biologico}</i></p>
        
        <p><b>📝 Descrição:</b><br>${d.descricao}</p>
        
        <div class="info-box">
           <p><b>🌡️ Condições Favoráveis:</b><br>${d.condicoes_favoraveis}</p>
        </div>

        <div class="secao-sintomas">
            <p><b>👀 Sintomas Práticos (Campo):</b></p>
            <ul>${d.sintomas.praticos.join(", ")}</ul>
        </div>

        <div class="secao-tecnica">
            <p><b>🔬 Sintomas Técnicos (Laboratório/Análise):</b></p>
            <ul>${d.sintomas.tecnicos.join(", ")}</ul>
        </div>

        <p><b>⚠️ Danos:</b><br>${d.danos}</p>

        <div class="secao-prevencao">
           <p><b>🛡️ Manejo Preventivo:</b><br>${d.manejo_preventivo}</p>
        </div>
        
        <div class="secao-controle">
            <p><b>💊 Controle Recomendado:</b><br>${d.controle}</p>
        </div>
      
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


// Depois de identificar a doença
const resultado = `Cultura: ${cultura}, Doença: ${classe}, Confiança: ${(prob*100).toFixed(1)}%`;

// Chama a função para salvar
salvarDiagnostico(resultado);


function salvarDiagnostico(texto) {
  // Pega o usuário logado
  const user = localStorage.getItem("loggedUser");
  if (!user) return; // Não faz nada se não tiver login

  // Pega histórico atual ou cria vazio
  let historico = JSON.parse(localStorage.getItem(user + "_diagnosticos")) || [];

  // Adiciona novo diagnóstico com data/hora
  historico.push({
    resultado: texto,
    data: new Date().toLocaleString()
  });

  // Salva de volta no localStorage
  localStorage.setItem(user + "_diagnosticos", JSON.stringify(historico));
}

function reiniciar() {
  document.getElementById("resultado").innerHTML = "";
  document.getElementById("foto").value = "";
  // Não reiniciamos o select para não forçar o recarregamento do modelo sem necessidade
}


function toggleInfoMenu() {
    const menu = document.getElementById('info-menu');
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
    } else {
        menu.classList.add('hidden');
    }
}




