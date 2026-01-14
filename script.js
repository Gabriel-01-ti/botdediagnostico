console.log("JS carregado com sucesso");

// 🔗 LINK DO MODELO (Teachable Machine)
const MODEL_URL = "./my-models/";

let model;


// carregar modelo
async function carregarModelo() {
  model = await tmImage.load(
    MODEL_URL + "model.json",
    MODEL_URL + "metadata.json"
  );
  console.log("Modelo carregado");
}

carregarModelo();

async function analisar() {
  const resultado = document.getElementById("resultado");

resultado.innerHTML = `
  <p class="analisando">⏳ Analisando a imagem… aguarde</p>
`;

  console.log("Botão analisar clicado");
  const cultura = document.getElementById("cultura").value
    .toLowerCase()
    .trim();

  const input = document.getElementById("foto");
  const file = input.files[0];

  if (!file) {
    alert("Envie uma foto da lavoura");
    return;
  }

  const img = document.createElement("img");
  img.src = URL.createObjectURL(file);

  img.onload = async () => {
    const predictions = await model.predict(img);

    // pega a melhor predição
    const melhor = predictions.reduce((a, b) =>
      a.probability > b.probability ? a : b
    );

    const classeOriginal = melhor.className;
    const prob = melhor.probability;

    // padroniza nome da classe (Mancha Branca → mancha_branca)
    const classe = classeOriginal
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_");

    console.log("Classe detectada:", classe);
    console.log("Probabilidade:", prob);

    mostrarResultado(cultura, classe, prob);
  };
}

async function mostrarResultado(cultura, classe, prob) {
  const res = document.getElementById("resultado");

  const base = await fetch("base.json").then(r => r.json());

  if (!base[cultura] || !base[cultura][classe]) {
    res.innerHTML = `
      <p>⚠️ Não foi possível identificar a doença com segurança.</p>
      <p>Tente outra imagem ou verifique se a cultura está correta.</p>
    `;
    return;
  }

  const d = base[cultura][classe];

  res.innerHTML = `
    <h3>${d.nome}</h3>

    <p><b>Probabilidade:</b> ${(prob * 100).toFixed(1)}%</p>

    <p><b>Nome biológico:</b> ${d.nome_biologico}</p>

    <p><b>Descrição:</b> ${d.descricao}</p>

    <p><b>Condições favoráveis:</b> ${d.condicoes_favoraveis}</p>

    <p><b>Sintomas:</b> ${d.sintomas}</p>

    <p><b>Danos:</b> ${d.danos}</p>

    <p><b>Manejo preventivo:</b> ${d.manejo_preventivo}</p>

    <p><b>Controle:</b> ${d.controle}</p>

    <small>
      ⚠️ Diagnóstico por imagem é um apoio técnico e não substitui a avaliação de um engenheiro agrônomo.
    </small>
  `;
}
function reiniciar() {
  // limpa resultado
  document.getElementById("resultado").innerHTML = "";

  // limpa input da foto
  document.getElementById("foto").value = "";

  // opcional: limpa seleção da cultura
  document.getElementById("cultura").selectedIndex = 0;
}
