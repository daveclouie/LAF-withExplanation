// signup.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  setDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { firebaseConfig } from './firebase.js';

// Initialize Firebase app, authentication, and Firestore database
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Handle signup form submission
document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get form input values
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const contact = document.getElementById("contact").value;
  const location = document.getElementById("location").value;

  try {
    // Create new user account with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user's display name in Firebase Auth profile
    await updateProfile(user, {
      displayName: name
    });

    // Create user document in Firestore with profile information
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: name,
      contact: contact,
      location: location,
      photoURL: "", // Will be set later from Profile tab
      createdAt: Date.now()
    });

    // Redirect to home page after successful signup
    window.location.href = "home.html";
  } catch (error) {
    alert("Error: " + error.message);
  }
});

// Toggle password visibility for main password field
document.getElementById("toggle-password").addEventListener("click", function () {
  const passwordInput = document.getElementById("password");
  const icon = this;
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    passwordInput.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
});

// Toggle password visibility for confirm password field
document.getElementById("toggle-confirm-password").addEventListener("click", function () {
  const confirmInput = document.getElementById("confirm-password");
  const icon = this;
  if (confirmInput.type === "password") {
    confirmInput.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    confirmInput.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
});
