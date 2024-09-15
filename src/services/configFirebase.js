// src/services/configFirebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Importar Firestore se necessário
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
//SUA CHAVE AQUI
};

// Inicialize o Firebase
const app = initializeApp(firebaseConfig);

// Obtenha as instâncias do Auth e Firestore
export const auth = getAuth(app);
export const firestore = getFirestore(app); // Exporte o Firestore se necessário
export const database = getDatabase(app);
export const storage = getStorage(app);
