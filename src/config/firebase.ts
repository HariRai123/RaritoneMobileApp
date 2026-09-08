import { initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCUmv5gpaPaQHMVnUGVX--uF7uZitnt3oI",
  authDomain: "raritone-18f95.firebaseapp.com",
  projectId: "raritone-18f95",
  storageBucket: "raritone-18f95.firebasestorage.app",
  messagingSenderId: "8520433775",
  appId: "1:8520433775:web:e9d64ac14e1f315ef64d9a",
};

const app = initializeApp(firebaseConfig);

const auth: Auth = getAuth(app);

export { app, auth };r

