// Import Firebase modules for app initialization and authentication
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { firebaseConfig } from './firebase.js';

// Initialize Firebase app and authentication
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Function to display status messages to the user
function showStatusMessage(message, isError = false) {
  const statusElement = document.getElementById('status-message');
  statusElement.textContent = message;
  statusElement.className = 'status-message ' + (isError ? 'error' : 'success');
  statusElement.style.display = 'block';
  setTimeout(() => statusElement.style.display = 'none', 3000);
}

// Handle email and password sign in
document.getElementById('signin-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  // Validate input fields
  if (!email || !password) {
    return showStatusMessage("Please enter both email and password", true);
  }

  try {
    // Attempt to sign in with Firebase
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    window.location.href = "home.html";
  } catch (err) {
    showStatusMessage(err.message, true);
  }
});

// Handle Google sign in
document.getElementById('google-signin-btn').addEventListener('click', async () => {
  try {
    // Attempt to sign in with Google
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    window.location.href = "home.html";
  } catch (error) {
    showStatusMessage(error.message, true);
  }
});

// Navigate to sign up page
document.getElementById('signup-btn').addEventListener('click', () => {
  window.location.href = "signup.html";
});

// Handle password reset request
document.getElementById('forgot-password').addEventListener('click', () => {
  const email = document.getElementById('email').value;
  if (!email) return showStatusMessage("Please enter your email first", true);

  // Send password reset email
  sendPasswordResetEmail(auth, email)
    .then(() => showStatusMessage("Password reset email sent!"))
    .catch(error => showStatusMessage(error.message, true));
});

// Initialize page functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Set up password visibility toggle
  const togglePassword = document.getElementById('toggle-password');
  const passwordField = document.getElementById('password');

  if (togglePassword && passwordField) {
    togglePassword.addEventListener('click', () => {
      const isPassword = passwordField.type === 'password';
      passwordField.type = isPassword ? 'text' : 'password';
      togglePassword.classList.toggle('fa-eye', !isPassword);
      togglePassword.classList.toggle('fa-eye-slash', isPassword);
    });
  }

  // Show success message if user just registered
  if (window.location.search.includes('registered=true')) {
    showStatusMessage('Account created successfully. Please log in.');
  }

  // Check if user is already logged in
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("User already logged in:", user.email);
    }
  });
});
