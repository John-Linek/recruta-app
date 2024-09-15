// src/services/databaseService.js
import { ref, set, get } from "firebase/database";
import { database } from "./configFirebase";

/**
 * Adiciona um usuário ao Realtime Database.
 * @param {string} uid - O ID do usuário.
 * @param {string} userType - O tipo do usuário ('candidate' ou 'recruiter').
 */
export const addUserToDatabase = async (uid, userType) => {
  try {
    await set(ref(database, "users/" + uid), {
      type: userType,
    });
    console.log("Usuário adicionado com sucesso!");
  } catch (error) {
    console.error("Erro ao adicionar usuário ao Realtime Database:", error);
  }
};

/**
 * Recupera o tipo de usuário do Realtime Database.
 * @param {string} uid - O ID do usuário.
 * @returns {Promise<string>} - O tipo do usuário.
 */
export const getUserType = async (uid) => {
  try {
    const userRef = ref(database, "users/" + uid);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      return snapshot.val().type;
    } else {
      throw new Error("Usuário não encontrado");
    }
  } catch (error) {
    console.error(
      "Erro ao recuperar tipo de usuário do Realtime Database:",
      error
    );
  }
};

/**
 * Verifica se o candidato já enviou o formulário.
 * @param {string} uid - O ID do usuário.
 * @returns {Promise<boolean>} - Retorna true se o formulário foi enviado, caso contrário, false.
 */
export const hasSubmittedForm = async (uid) => {
  try {
    // Supondo que a estrutura dos dados seja algo como "formSubmissions/[userId]"
    const formSubmissionRef = ref(database, `candidates/${uid}`);
    const snapshot = await get(formSubmissionRef);
    return snapshot.exists(); // Retorna true se o formulário foi enviado
  } catch (error) {
    console.error("Erro ao verificar envio do formulário:", error);
    return false; // Retorna false em caso de erro
  }
};
