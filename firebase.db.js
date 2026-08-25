import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// Suas credenciais do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBbvAOfk3EXyQivxcc4ylHrtuWkKyXkuDw",
  authDomain: "sitebot-2c952.firebaseapp.com",
  projectId: "sitebot-2c952",
  storageBucket: "sitebot-2c952.firebasestorage.app",
  messagingSenderId: "410409250226",
  appId: "1:410409250226:web:6a89bc59b81011317348ab",
  measurementId: "G-RRR7DPL1CM"
};

// Inicialização do Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/**
 * Função auxiliar que garante a busca do usuário atual mesmo que o Firebase demore a inicializar
 */
function obterUsuarioAtual() {
  return new Promise((resolve) => {
    // 1. Tenta pegar diretamente se já estiver disponível
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }
    // 2. Se ainda não carregou a sessão, aguarda o listener avisar
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe(); // Desconecta o ouvinte após receber a resposta
      resolve(user);
    });
  });
}

/**
 * Função para salvar o diagnóstico na conta do usuário no Firestore
 */
export async function salvarDiagnosticoFirestore(dados) {
  try {
    // Busca e aguarda a confirmação do usuário logado
    const user = await obterUsuarioAtual();

    if (!user) {
      console.warn("⚠️ Sessão não encontrada. O usuário não está autenticado.");
      return;
    }

    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const confiancaValor = dados.confianca || 100;

 await addDoc(collection(db, "diagnosticos"), {
  uid: user.uid,
  email: user.email,

  // Dados do diagnóstico
  cultura: dados.cultura,
  doenca: dados.doenca,
  sintomas: dados.sintomas || [],

  // Identificação da origem
  tipo: dados.tipo || "desconhecido",
  origem: dados.origem || "desconhecida",

  resultado: `${dados.doenca} (${confiancaValor}%)`,
  dataHoraLocal = agora.toLocaleString('pt-BR'),
  confianca: confiancaValor,
  criadoEm: serverTimestamp()
});

    console.log("✅ Diagnóstico salvo no Firestore com sucesso para o usuário:", user.email);
  } catch (error) {
    console.error("❌ Erro ao salvar o diagnóstico no Firestore:", error);
  }
}
