// ================= FIREBASE DB GLOBAL =================

import { 
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

// 🔥 Usa o app já inicializado
const db = getFirestore();
const auth = getAuth();

// ================= SALVAR DIAGNÓSTICO =================
export async function salvarDiagnosticoFirestore({ cultura, doenca, confianca }) {

  const user = auth.currentUser;

  if (!user) {
    console.warn("Usuário não logado, não salvou no Firebase");
    return;
  }

  try {
    await addDoc(collection(db, "diagnosticos"), {
      uid: user.uid,
      email: user.email,

      cultura: cultura,
      doenca: doenca,
      confianca: confianca || null,

      dataTexto: new Date().toLocaleString(),
      criadoEm: serverTimestamp()
    });

    console.log("✅ Diagnóstico salvo no Firestore");
  } catch (err) {
    console.error("❌ Erro ao salvar:", err);
  }
}
