const FIREBASE_URL = "https://SEU_FIREBASE.firebaseio.com";

function registrarDiagnostico(cultura, doenca){
  fetch(`${FIREBASE_URL}/diagnosticos.json`,{
    method:"POST",
    body:JSON.stringify({
      cultura:cultura,
      doenca:doenca,
      data:new Date().toISOString()
    })
  });
}
