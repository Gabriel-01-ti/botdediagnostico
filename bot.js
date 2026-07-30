// ================= VARIÁVEIS DE ESTADO =================
let baseDados = null;
const inputSintomas = document.getElementById("sintomas");
const btnEnviar = document.getElementById("btn-diagnosticar");
const chatDiv = document.getElementById("chat-messages");

let etapa = 0;
let culturaSelecionada = "";
let modoDiagnostico = "";
let sintomasSelecionados = [];

// ================= CARREGAR BASE DE DADOS =================
fetch("base.json")
    .then(res => res.json())
    .then(data => {
        baseDados = data;
        inputSintomas.disabled = false;
        inputSintomas.placeholder = "Digite 'Oi' para começar...";
        abrirGuiaRapido(); // Carrega dinamicamente a lista de doenças no guia
    })
    .catch(err => {
        console.error("Erro ao carregar a base de dados:", err);
        addMsg("❌ Erro ao carregar a base de dados. Tente recarregar a página.", "bot");
    });

// ================= SPLASH SCREEN =================
window.addEventListener("load", function() {
    setTimeout(function() {
        const splash = document.getElementById("splash");
        if (splash) {
            splash.style.opacity = "0";
            splash.style.visibility = "hidden";
        }
    }, 2200);
});

function abrirGuiaRapido() {
    if (!baseDados) return;
    const listaDiv = document.getElementById("listaGuiaDoencas");
    if (!listaDiv) return;

    listaDiv.innerHTML = "";

    Object.keys(baseDados).forEach(cultura => {
        // Badge do Nome da Cultura
        const titulo = document.createElement("div");
        titulo.className = "titulo-cultura-guia";
        const nomeFormatado = cultura.charAt(0).toUpperCase() + cultura.slice(1);
        titulo.innerHTML = `🌱 ${nomeFormatado}`;
        listaDiv.appendChild(titulo);

        // Cards das Doenças
        Object.values(baseDados[cultura]).forEach(d => {
            const sintomaPrincipal = d?.sintomas?.praticos?.[0] || "Sintoma não informado";
            const item = document.createElement("div");
            item.className = "item-guia";
            item.innerHTML = `
                <strong>${d.nome}</strong>
                <span>👀 ${sintomaPrincipal}</span>
            `;
            listaDiv.appendChild(item);
        });
    });
}

function toggleGuiaMenu() {
    const guiaMenu = document.getElementById("guia-menu");
    if (guiaMenu) {
        guiaMenu.classList.toggle("hidden");
    }
}

// ================= FUNÇÕES UTILITÁRIAS =================
function normalizar(txt) {
    return txt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function addMsg(texto, tipo, rolar = true) {
    const div = document.createElement("div");

    if (tipo === "bot") {
        div.className = "msg-bot-wrapper";
        
        const avatar = document.createElement("img");
        avatar.src = "logo.jpg";
        avatar.className = "bot-avatar";
        avatar.alt = "AgroBot";

        const bubble = document.createElement("div");
        bubble.className = "bot-bubble";
        bubble.innerHTML = texto;

        div.appendChild(avatar);
        div.appendChild(bubble);
    } else {
        div.className = "usuario";
        div.innerHTML = texto;
    }

    chatDiv.appendChild(div);

    if (rolar) {
        setTimeout(() => {
            chatDiv.scrollTop = chatDiv.scrollHeight;
            window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: 'smooth'
            });
        }, 50);
    }
}

// ================= FLUXO DE CONVERSA =================
function iniciarBot() {
    addMsg(`
        🤖 <b>Olá! Seja bem-vindo ao AgroBot.</b><br><br>
        Estou aqui para ajudar você a identificar possíveis doenças na sua lavoura de forma rápida e prática 🌱<br><br>
        Você gostaria de ver a lista de culturas disponíveis para diagnóstico?
        <br><br>
        👉 Responda com <b>Sim</b> ou <b>Não</b>.
    `, "bot");
    etapa = -1;
}

function finalizarDiagnostico() {
    addMsg(`
        🌿 <b>Diagnóstico finalizado com sucesso!</b><br><br>
        Foi um prazer ajudar você a cuidar da sua lavoura 💚<br>
        Sempre que precisar, estarei por aqui 🌱<br><br>
        ✨ <i>O histórico foi limpo. Digite <b>Oi</b> para começar um novo diagnóstico.</i>
    `, "bot");

    setTimeout(() => {
        chatDiv.innerHTML = "";
        etapa = 0;
        culturaSelecionada = "";
        sintomasSelecionados = [];
    }, 5000);
}

function salvarDiagnostico(texto) {
    const user = localStorage.getItem("loggedUser");
    if (!user) return;

    let historico = JSON.parse(localStorage.getItem(user + "_diagnosticos")) || [];
    historico.push({
        resultado: texto,
        data: new Date().toLocaleString()
    });
    localStorage.setItem(user + "_diagnosticos", JSON.stringify(historico));
}

// ================= MODOS DE DIAGNÓSTICO =================
function escolherModo(modo) {
    modoDiagnostico = modo;
    if (modo === "texto") {
        addMsg("✍️ Você escolheu descrever os sintomas.<br>Escreva o que está observando na planta:", "bot");
        etapa = 3;
    } else {
        sintomasSelecionados = [];
        addMsg("📋 Você escolheu selecionar sintomas.<br>Clique nos sintomas observados abaixo:", "bot");
        mostrarBotoesSintomas();
        etapa = 4;
    }
}

function mostrarCulturasDisponiveis() {
    let html = "🌱 <b>Culturas disponíveis:</b><br><br>";
    for (let cultura in baseDados) {
        html += "• " + cultura.charAt(0).toUpperCase() + cultura.slice(1) + "<br>";
    }
    html += "<br>👉 Digite o nome da cultura para continuar.";
    addMsg(html, "bot");
}

// ================= BOTÕES DE SINTOMAS (CHIPS) =================
function mostrarBotoesSintomas() {
    const dados = baseDados[culturaSelecionada];
    let sintomasSet = new Set();
    
    Object.values(dados).forEach(d => {
        if (d.sintomas && d.sintomas.praticos) {
            d.sintomas.praticos.forEach(s => sintomasSet.add(s));
        }
    });

    let html = `<div class="sintomas-container">`;
    html += `<div class="sintomas-botoes">`;
    
    sintomasSet.forEach(s => {
        const sintomaEscapado = s.replace(/'/g, "\\'");
        html += `<button class="btn-sintoma" onclick="toggleSintoma(this, '${sintomaEscapado}')">${s}</button>`;
    });
    
    html += `</div>`;
    html += `<button class="btn-diagnosticar-acao" onclick="finalizarSelecao()">🔍 Realizar Diagnóstico</button>`;
    html += `</div>`;

    addMsg(html, "bot");
}

function toggleSintoma(btn, sintoma) {
    btn.classList.toggle("ativo");
    
    if (sintomasSelecionados.includes(sintoma)) {
        sintomasSelecionados = sintomasSelecionados.filter(s => s !== sintoma);
    } else {
        sintomasSelecionados.push(sintoma);
    }
}

function finalizarSelecao() {
    if (sintomasSelecionados.length === 0) {
        addMsg("⚠️ Selecione pelo menos um sintoma para continuar.", "bot");
        return;
    }
    addMsg("Sintomas selecionados: " + sintomasSelecionados.join(", "), "usuario");
    diagnosticar(culturaSelecionada, sintomasSelecionados.join(" "));
}

// ================= EVENTO DE ENVIO =================
btnEnviar.addEventListener("click", () => {
    const texto = inputSintomas.value.trim();
    if (!texto) return;

    addMsg(texto, "usuario");
    inputSintomas.value = "";
    
    const comando = normalizar(texto);

    if (["oi", "ola", "reiniciar", "inicio", "comecar"].includes(comando)) {
        iniciarBot();
        return;
    }

    if (['finalizar', 'encerrar', 'parar', 'sair', 'cancelar', 'obrigado', 'muito obrigado'].includes(comando)) {
        finalizarDiagnostico();
        return;
    }

    if (etapa === 0) {
        iniciarBot();
    } else if (etapa === -1) {
        const resposta = normalizar(texto);
        if (["sim", "s", "quero", "claro"].includes(resposta)) {
            mostrarCulturasDisponiveis();
            etapa = 1;
        } else if (["nao", "não", "n"].includes(resposta)) {
            addMsg("Sem problema 😊<br>Digite o nome da cultura desejada (Ex: Milho, Soja, Feijão).", "bot");
            etapa = 1;
        } else {
            addMsg("👉 Por favor, responda com <b>Sim</b> ou <b>Não</b>.", "bot");
        }
    } else if (etapa === 1) {
        const culturaNorm = normalizar(texto);
        if (!baseDados[culturaNorm]) {
            addMsg("⚠️ Cultura não encontrada. As disponíveis no momento são: <b>Milho, Soja ou Feijão</b>.", "bot");
            return;
        }
        culturaSelecionada = culturaNorm;
        addMsg(`Excelente! Vamos analisar a cultura do(a) <b>${texto}</b>. 🌱`, "bot");
        addMsg(`
            Como prefere informar os sintomas?<br><br>
            <div class="sintomas-container">
                <button class="btn-diagnosticar-acao" onclick="escolherModo('texto')">✍️ Descrever por texto</button>
                <button class="btn-diagnosticar-acao" style="background: linear-gradient(135deg, #1565c0, #0d47a1);" onclick="escolherModo('lista')">📋 Escolher de uma lista</button>
            </div>
        `, "bot");
        etapa = 2;
    } else if (etapa === 3) {
        diagnosticar(culturaSelecionada, texto);
    }
});

inputSintomas.addEventListener("keypress", e => {
    if (e.key === "Enter") btnEnviar.click();
});

// ================= MOTOR DE DIAGNÓSTICO =================
function diagnosticar(cultura, textoUsuario) {
    const textoNorm = normalizar(textoUsuario).replace(/s\b/g, "");
    const palavras = textoNorm.split(" ");
    let resultados = [];

    for (let id in baseDados[cultura]) {
        const d = baseDados[cultura][id];
        let pontos = 0;
        const nomeDoencaNorm = normalizar(d.nome).replace(/s\b/g, "");
        
        if (textoNorm.includes(nomeDoencaNorm) || nomeDoencaNorm.includes(textoNorm)) {
            pontos += 500;
        }

        d.sintomas.praticos.forEach(s => {
            const sNorm = normalizar(s).replace(/s\b/g, "");
            if (textoNorm.includes(sNorm)) pontos += 50;
            palavras.forEach(p => {
                if (p.length > 3 && sNorm.includes(p)) pontos += 5;
            });
        });

        if (pontos > 0) {
            resultados.push({ ...d, pontos });
        }
    }

    resultados.sort((a, b) => b.pontos - a.pontos);

    if (resultados.length === 0) {
        addMsg("❌ Não consegui identificar a doença com base nos sintomas fornecidos. Tente detalhar melhor ou consulte o Guia de Informações 📖", "bot");
    } else {
        const d = resultados[0];
        const htmlCompleto = `
            <div class="doenca-card">
                <div class="card-header-agro">
                    <h2>🦠 ${d.nome}</h2>
                    <small><i>${d.nome_biologico || ""}</i></small>
                </div>

                ${d.imagem ? `<img src="${d.imagem}" class="imagem-doenca-agro" alt="${d.nome}">` : ""}

                <div class="card-content-agro">
                    <section class="info-item">
                        <strong>📝 Descrição:</strong>
                        <p>${d.descricao}</p>
                    </section>

                    <section class="info-item">
                        <strong>🌡️ Condições Favoráveis:</strong>
                        <p>${d.condicoes_favoraveis}</p>
                    </section>

                    <div class="duas-colunas">
                        <div class="col">
                            <strong>👀 Sintomas Práticos:</strong>
                            <ul>${d.sintomas.praticos.map(s => `<li>${s}</li>`).join("")}</ul>
                        </div>
                        <div class="col">
                            <strong>🔬 Sintomas Técnicos:</strong>
                            <ul>${d.sintomas.tecnicos.map(s => `<li>${s}</li>`).join("")}</ul>
                        </div>
                    </div>

                    <section class="info-item">
                        <strong>⚠️ Danos Produzidos:</strong>
                        <p>${d.danos}</p>
                    </section>

                    <section class="info-item">
                        <strong>🛡️ Manejo Preventivo:</strong>
                        <p>${d.manejo_preventivo}</p>
                    </section>

                    <section class="info-item">
                        <strong>💊 Controle Recomendado:</strong>
                        <p>${d.controle}</p>
                    </section>
                    
                    <div class="aviso-responsabilidade">
                        <p>🚨 <b>AVISO IMPORTANTE:</b> Diagnóstico gerado por IA. Para prescrições técnicas e aplicação de defensivos, consulte um <b>Engenheiro Agrônomo</b>.</p>
                    </div>
                </div>
            </div>
        `;
        addMsg(htmlCompleto, "bot", false);
        salvarDiagnostico(`Cultura: ${cultura}, Doença: ${d.nome}`);

        setTimeout(() => {
            addMsg("🏁 Diagnóstico concluído! Deseja analisar outra cultura ou encerrar?", "bot", false);
            etapa = 1;
        }, 3000);
    }
}

// ================= BOTÃO FLUTUANTE ARRASTÁVEL (DRAG & DROP) =================
const btnGuia = document.getElementById("floating-guia-btn");
let arrastando = false;
let offsetX = 0;
let offsetY = 0;
let moveu = false;

if (btnGuia) {
    const pos = JSON.parse(localStorage.getItem("posGuiaBtn"));
    if (pos) {
        btnGuia.style.left = pos.x + "px";
        btnGuia.style.top = pos.y + "px";
        btnGuia.style.right = "auto";
        btnGuia.style.bottom = "auto";
    }

    // Eventos de Mouse
    btnGuia.addEventListener("mousedown", e => {
        arrastando = true;
        moveu = false;
        offsetX = e.clientX - btnGuia.offsetLeft;
        offsetY = e.clientY - btnGuia.offsetTop;
    });

    document.addEventListener("mousemove", e => {
        if (!arrastando) return;
        moveu = true;
        btnGuia.style.left = (e.clientX - offsetX) + "px";
        btnGuia.style.top = (e.clientY - offsetY) + "px";
        btnGuia.style.right = "auto";
        btnGuia.style.bottom = "auto";
    });

    document.addEventListener("mouseup", () => {
        if (!arrastando) return;
        arrastando = false;
        localStorage.setItem("posGuiaBtn", JSON.stringify({
            x: btnGuia.offsetLeft,
            y: btnGuia.offsetTop
        }));
    });

    // Eventos Touch (Mobile)
    btnGuia.addEventListener("touchstart", e => {
        const t = e.touches[0];
        arrastando = true;
        moveu = false;
        offsetX = t.clientX - btnGuia.offsetLeft;
        offsetY = t.clientY - btnGuia.offsetTop;
    }, { passive: true });

    document.addEventListener("touchmove", e => {
        if (!arrastando) return;
        const t = e.touches[0];
        moveu = true;
        btnGuia.style.left = (t.clientX - offsetX) + "px";
        btnGuia.style.top = (t.clientY - offsetY) + "px";
        btnGuia.style.right = "auto";
        btnGuia.style.bottom = "auto";
    }, { passive: true });

    document.addEventListener("touchend", () => {
        if (!arrastando) return;
        arrastando = false;
        localStorage.setItem("posGuiaBtn", JSON.stringify({
            x: btnGuia.offsetLeft,
            y: btnGuia.offsetTop
        }));
    });

    btnGuia.addEventListener("click", e => {
        if (moveu) {
            e.stopImmediatePropagation();
            e.preventDefault();
            moveu = false;
        }
    });
}
