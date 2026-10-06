console.log("JS carregado com sucesso");

// Importa a função do Firebase
import { salvarDiagnosticoFirestore } from "./firebase.db.js";

let model;
let modeloCarregando = false; // Trava para evitar cliques enquanto carrega

// Elementos do DOM
const selectCultura = document.getElementById("cultura");
const divResultado = document.getElementById("resultado");

// 1. Função dinâmica para carregar modelo
async function carregarModelo(cultura) {
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

window.addEventListener("load", function() {
    setTimeout(function() {
        const splash = document.getElementById("splash");
        if (splash) {
            splash.style.opacity = "0";
            splash.style.visibility = "hidden";
        }
    }, 2200);
});

// 2. Carregar o modelo inicial (padrão do select) ao abrir a página
window.addEventListener('DOMContentLoaded', () => {
  if (selectCultura && selectCultura.value) {
    const culturaInicial = selectCultura.value.toLowerCase().trim();
    carregarModelo(culturaInicial);
  }
});

// 3. Monitorar mudança no <select> para trocar o modelo
if (selectCultura) {
  selectCultura.addEventListener("change", (e) => {
    const novaCultura = e.target.value.toLowerCase().trim();
    carregarModelo(novaCultura);
  });
}

// 4. Upload de imagem: clicar OU arrastar e soltar
const inputFoto = document.getElementById('foto');
const dropzone = document.querySelector('.file-dropzone');
const fileNameElement = document.getElementById('file-name');

function carregarArquivo(file) {
  // Verifica se existe arquivo
  if (!file) return;

  // Verifica se é uma imagem
  if (!file.type.startsWith("image/")) {
    alert("❌ Por favor, envie apenas uma imagem.");
    return;
  }

  // Coloca o arquivo dentro do input #foto
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  inputFoto.files = dataTransfer.files;

  // Atualiza o nome mostrado na tela
  if (fileNameElement) {
    fileNameElement.innerText = file.name;
  }

  console.log("📸 Imagem carregada:", file.name);
}

// Selecionar normalmente pelo botão
if (inputFoto) {
  inputFoto.addEventListener('change', function() {
    carregarArquivo(this.files[0]);
  });
}

// Arrastar sobre a área
if (dropzone) {

  dropzone.addEventListener('dragover', function(e) {
    e.preventDefault();

    // Efeito visual enquanto arrasta
    dropzone.style.background = "#e8f5e9";
    dropzone.style.borderColor = "#1b5e20";
    dropzone.style.transform = "scale(1.01)";
  });

  // Quando sai da área
  dropzone.addEventListener('dragleave', function() {
    dropzone.style.background = "";
    dropzone.style.borderColor = "";
    dropzone.style.transform = "";
  });

  // Quando solta a imagem
  dropzone.addEventListener('drop', function(e) {
    e.preventDefault();

    dropzone.style.background = "";
    dropzone.style.borderColor = "";
    dropzone.style.transform = "";

    const file = e.dataTransfer.files[0];

    carregarArquivo(file);
  });
}

// 5. Função Analisar (Ajustada)
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
  const file = input ? input.files[0] : null;

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
  };
}

// 6. Função mostrarResultado (Mantida com toda a sua estrutura HTML original + Salvamento Firebase)
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
    const porcentagemConfianca = (prob * 100).toFixed(1);

    // Formata os sintomas exatamente no seu padrão
    const sintomasPraticosHTML = Array.isArray(d.sintomas?.praticos) 
      ? d.sintomas.praticos.map(s => `<li>${s}</li>`).join("")
      : (d.sintomas?.praticos || d.sintomas || "");

    const sintomasTecnicosHTML = Array.isArray(d.sintomas?.tecnicos) 
      ? d.sintomas.tecnicos.map(s => `<li>${s}</li>`).join("")
      : (d.sintomas?.tecnicos || "");

    // Renderiza o card completo com todos os seus dados originais
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
            <ul>${sintomasPraticosHTML}</ul>
        </div>

        <div class="secao-tecnica">
            <p><b>🔬 Sintomas Técnicos (Laboratório/Análise):</b></p>
            <ul>${sintomasTecnicosHTML}</ul>
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

    // 🚀 SALVA NO FIRESTORE COM OS DADOS REAIS EXTRAÍDOS
    // 🚀 SALVA NO FIRESTORE IDENTIFICANDO COMO IA POR IMAGEM
await salvarDiagnosticoFirestore({
  cultura: cultura,
  doenca: d.nome,
  tipo: "imagem",             // <--- Altera para "imagem"
  origem: "ia_imagem",        // <--- Altera para "ia_imagem"
  confianca: porcentagemConfianca, // <--- Garante o envio do número correto
  sintomas: d.sintomas?.praticos || []
});

  } catch (err) {
    console.error(err);
    res.innerHTML = "<p>Erro ao ler base de dados. Verifique o JSON.</p>";
  }
}

// 7. Limpar/Reiniciar
function reiniciar() {
  document.getElementById("resultado").innerHTML = "";
  document.getElementById("foto").value = "";
  const fileNameElement = document.getElementById('file-name');
  if (fileNameElement) fileNameElement.innerText = "Toque para selecionar a foto da folha";
}

// 8. Toggle do Menu
function toggleInfoMenu() {
  const menu = document.getElementById('info-menu');
  if (menu) {
    if (menu.classList.contains('hidden')) {
      menu.classList.remove('hidden');
    } else {
      menu.classList.add('hidden');
    }
  }
}

// Torna as funções visíveis globalmente para o HTML
window.analisar = analisar;
window.reiniciar = reiniciar;
window.toggleInfoMenu = toggleInfoMenu;
