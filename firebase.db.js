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

let usuarioLogado = null;

// Escuta a sessão do usuário logado em tempo real
onAuthStateChanged(auth, (user) => {
  usuarioLogado = user;
});

/**
 * Função para salvar o diagnóstico na conta do usuário no Firestore
 */
export async function salvarDiagnosticoFirestore(dados) {
  if (!usuarioLogado) {
    console.warn("⚠️ Nenhum usuário logado no momento. O diagnóstico não foi salvo no banco.");
    return;
  }

  try {
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    await addDoc(collection(db, "diagnosticos"), {
      uid: usuarioLogado.uid,
      email: usuarioLogado.email,
      cultura: dados.cultura,
      resultado: `${dados.doenca} (${dados.confianca}%)`,
      confianca: dados.confianca,
      data: dataAtual,
      criadoEm: serverTimestamp()
    });

    console.log("✅ Diagnóstico salvo no Firestore com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao salvar o diagnóstico no Firestore:", error);
  }
}
