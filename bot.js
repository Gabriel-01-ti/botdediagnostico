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
    
    // ==========================================================
    // 1. REGRA DE OURO: O usuário digitou o NOME da doença?
    // ==========================================================
    const nomeDoencaNorm = normalizar(d.nome); // ex: "mancha branca do milho"
    
    // Se o usuário digitou "mancha branca", e o nome contém isso:
    if (nomeDoencaNorm.includes(textoNorm)) {
      pontos += 1000; // Pontuação "Game Over" para as outras
    }

    // ==========================================================
    // 2. REGRA DOS SINTOMAS
    // ==========================================================
    d.sintomas.praticos.forEach(s => {
      const sNorm = normalizar(s);
      
      // A. Frase Exata nos sintomas (Ex: "manchas claras")
      // Vale muito, mas menos que o nome da doença
      if (sNorm.includes(textoNorm) && textoUsuario.length > 4) {
        pontos += 50; 
      }

      // B. Palavras soltas (Ex: "mancha")
      // Vale POUCO. Assim, "mancha" sozinha não define o jogo.
      palavras.forEach(p => {
        if (p.length > 3 && sNorm.includes(p)) {
            pontos += 5; 
        }
      });
    });

    if (pontos > 0) resultados.push({ ...d, pontos });
  }

  // Ordena pelo maior placar
  resultados.sort((a, b) => b.pontos - a.pontos);

  // FILTRO DE SEGURANÇA:
  // Se o primeiro colocado tem mais de 500 pontos (match de nome),
  // ignore todo o resto e mostre só ele. É certeza absoluta.
  if (resultados.length > 0 && resultados[0].pontos >= 500) {
     resultados = [resultados[0]];
  } 
  // Caso contrário, usa a regra dos 50% de relevância
  else if (resultados.length > 0) {
     const maiorPontuacao = resultados[0].pontos;
     resultados = resultados.filter(r => r.pontos >= maiorPontuacao * 0.5);
  }

  // --- EXIBIÇÃO ---
  if (resultados.length === 0) {
    addMsg("❌ Não encontrei doença compatível.", "bot");
  } else {
    resultados.slice(0, 3).forEach(d => {
      const htmlCompleto = `
        <div class="doenca-card">
          <h3>🦠 ${d.nome}</h3>
          <p><b>📝 Descrição:</b> ${d.descricao}</p>
          <hr>
          <p><b>👀 Sintomas Práticos:</b> ${d.sintomas.praticos.join(", ")}</p>
          <p><b>🧪 Sintomas Técnicos:</b> ${d.sintomas.tecnicos.join(", ")}</p>
          <p><b>⚠️ Danos:</b> ${d.danos}</p>
          <p><b>💊 Controle:</b> ${d.controle}</p>
        </div>
      `;
      addMsg(htmlCompleto, "bot");
    });
  }

  // Reiniciar
  setTimeout(() => {
    addMsg("<br>🏁 <b>Análise concluída.</b><br>Digite a próxima cultura ou 'Oi' para reiniciar.", "bot");
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


