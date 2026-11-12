import { auth } from "./firebase.db.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

if (!document.body.classList.contains("home-page")) {
  const profile = document.getElementById("userProfile");
  const photo = document.getElementById("userPhoto");
  const name = document.getElementById("userName");
  const loginButton = document.getElementById("navLoginBtn");

  onAuthStateChanged(auth, user => {
    const isSignedIn = Boolean(user && user.emailVerified);

    if (profile) profile.style.display = isSignedIn ? "block" : "none";
    if (loginButton) loginButton.style.display = isSignedIn ? "none" : "block";

    if (isSignedIn) {
      if (photo) photo.src = user.photoURL || "logo.jpg";
      if (name) name.textContent = user.displayName || user.email?.split("@")[0] || "Produtor";
    }
  });
}
