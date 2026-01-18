let baseDados = null;

// ELEMENTOS
const inputSintomas = document.getElementById("sintomas");
const btnEnviar = document.getElementById("btn-diagnosticar");
const chatDiv = document.getElementById("chat");

// 1. CARREGAR BASE EXTERNA (JSON)
fetch("./base.json")
  .then(res => res.json())
  .then(data => {
    baseDados = data;
    inputSintomas.disabled = false;
    inputSintomas.placeholder = "Digite 'Oi' para começar...";
    // NÃO inicia o bot aqui. Espera o usuário falar.
  })
  .catch(err => {
    console.error("Erro ao carregar base.json:", err);
    addMsg("❌ Erro ao carregar a base de dados.", "bot");
  });

// VARIÁVEIS DE CONTROLE
let etapa = 0; // 0 = Standby | 1 = Esperando Cultura | 2 = Esperando Sintomas
let culturaSelecionada = "";

// NORMALIZAR TEXTO
function normalizar(txt) {
  return txt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// ADICIONAR MENSAGEM AO CHAT
function addMsg(texto, tipo) {
  const div = document.createElement("div");
  div.className = "msg " + tipo;
  div.innerHTML = texto;
  chatDiv.appendChild(div);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

// INICIAR INTERAÇÃO
function iniciarBot() {
  addMsg("🤖 Olá! Tudo bem? 🌱<br>Qual é a cultura que você deseja analisar? (Ex: Milho, Soja...)", "bot");
  etapa = 1;
}

// BOTÃO ENVIAR
btnEnviar.addEventListener("click", () => {
  const texto = inputSintomas.value.trim();
  if (!texto) return;

  // 1. Exibe msg do usuário
  addMsg("Você: " + texto, "usuario");
  inputSintomas.value = "";

  // 2. Se for a primeira interação (Etapa 0)
  if (etapa === 0) {
    iniciarBot();
    return;
  }

  // Se o usuário quiser reiniciar no meio
  const comando = normalizar(texto);
  if (['oi', 'ola', 'reiniciar', 'inicio'].includes(comando)) {
    iniciarBot();
    return;
  }

  // 3. Identificar Cultura
  if (etapa === 1) {
    const culturaNorm = normalizar(texto);
    
    // Verifica se carregou a base e se a cultura existe
    if (!baseDados) {
      addMsg("⚠️ A base de dados ainda não carregou. Aguarde um instante.", "bot");
      return;
    }

    if (!baseDados[culturaNorm]) {
      addMsg("⚠️ Cultura não encontrada na base (Tente: Milho, Soja, Feijão).", "bot");
      return;
    }
    
    culturaSelecionada = culturaNorm;
    addMsg(`Certo! Vamos analisar <b>${texto}</b>.<br>Descreva os sintomas que você está vendo.`, "bot");
    etapa = 2;
  } 
  
  // 4. Diagnosticar
  else if (etapa === 2) {
    addMsg("🔍 Analisando...", "bot");
    // Pequeno delay visual
    setTimeout(() => {
      diagnosticar(culturaSelecionada, texto);
    }, 500);
  }
});

// FUNÇÃO DIAGNOSTICAR COMPLETA
function diagnosticar(cultura, textoUsuario) {
  const textoNorm = normalizar(textoUsuario);
  const palavras = textoNorm.split(" ");
  let resultados = [];

  for (let id in baseDados[cultura]) {
    const d = baseDados[cultura][id];
    let pontos = 0;

    d.sintomas.praticos.forEach(s => {
      const sNorm = normalizar(s);
      palavras.forEach(p => {
        if (p.length > 3 && sNorm.includes(p)) pontos += 3;
      });
      if (sNorm.includes(textoNorm) || textoNorm.includes(sNorm)) pontos += 15;
    });

    if (pontos > 0) resultados.push({ ...d, pontos });
  }

  resultados.sort((a, b) => b.pontos - a.pontos);

  if (resultados.length === 0) {
    addMsg("❌ Não encontrei doença compatível com a descrição.", "bot");
  } else {
    // Exibe as doenças encontradas com TODOS os detalhes
    resultados.slice(0, 3).forEach(d => {
      const htmlCompleto = `
        <div style="background: #f9f9f9; padding: 10px; border-radius: 8px; margin-top: 10px; border: 1px solid #ddd;">
          <h3 style="margin: 0 0 10px 0; color: #2c3e50;">🦠 ${d.nome}</h3>
          
          <p><b>🔬 Nome Biológico:</b> <i>${d.nome_biologico}</i></p>
          <p><b>📝 Descrição:</b> ${d.descricao}</p>
          <p><b>🌡️ Condições Favoráveis:</b> ${d.condicoes_favoraveis}</p>
          
          <hr style="border: 0; border-top: 1px solid #ccc;">
          
          <p><b>👀 Sintomas Práticos:</b></p>
          <ul style="margin: 5px 0 10px 20px; padding: 0;">
            ${d.sintomas.praticos.map(s => `<li>${s}</li>`).join('')}
          </ul>

          <p><b>🧪 Sintomas Técnicos:</b></p>
          <ul style="margin: 5px 0 10px 20px; padding: 0;">
             ${d.sintomas.tecnicos.map(s => `<li>${s}</li>`).join('')}
          </ul>

          <hr style="border: 0; border-top: 1px solid #ccc;">

          <p><b>⚠️ Danos:</b> ${d.danos}</p>
          <p><b>🛡️ Manejo Preventivo:</b> ${d.manejo_preventivo}</p>
          <p><b>💊 Controle Químico:</b> ${d.controle}</p>
        </div>
      `;
      addMsg(htmlCompleto, "bot");
    });
  }

  // Prepara para o próximo ciclo
  setTimeout(() => {
    addMsg("<br>🏁 <b>Análise concluída.</b><br>Para analisar outra cultura, digite o nome dela abaixo (ou 'Oi' para reiniciar).", "bot");
    etapa = 1; 
  }, 2000);
}

// Enviar com Enter
inputSintomas.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    btnEnviar.click();
  }
});

