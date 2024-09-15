"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/services/configFirebase";
import { addUserToDatabase, getUserType } from "@/services/databaseService";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("candidate");
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    try {
      if (isRegistering) {
        // Cadastro de novos usuários
        if (userType === "candidate") {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );
          const user = userCredential.user;

          await addUserToDatabase(user.uid, userType);

          router.push("/candidate-form");
        } else {
          setError(
            "Cadastro para recrutador não é permitido através deste formulário."
          );
        }
      } else {
        // Login de usuários existentes
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        const userType = await getUserType(user.uid);

        if (userType === "recruiter") {
          router.push("/candidate-cards");
        } else if (userType === "candidate") {
          router.push("/candidate-form");
        } else {
          setError("Tipo de usuário não reconhecido.");
        }
      }
    } catch (err) {
      console.error("Erro ao processar a solicitação: ", err); // Adicionado log para depuração
      setError(
        "Nome de usuário ou senha incorretos ou senha com menos de 5 dígitos."
      );
    }
  };

  return (
    <div className="login-form">
      <h1>{isRegistering ? "Cadastrar" : "Login"}</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Seu email"
          />
        </div>
        <div>
          <label>Senha:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
          />
        </div>
        {isRegistering && (
          <div>
            <label>Tipo:</label>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              disabled
            >
              <option value="candidate">Candidato</option>
            </select>
          </div>
        )}
        <button type="submit">
          {isRegistering ? "Cadastrar-se" : "Entrar"}
        </button>
        {error && <p className="error">{error}</p>}
        {!isRegistering && (
          <div
            style={{ cursor: "pointer", color: "#2196F3" }}
            className="toggle-register"
            onClick={() => setIsRegistering(true)}
          >
            Ainda não tem uma conta? Cadastre-se
          </div>
        )}
      </form>
      <style jsx>{`
        .login-form {
          border: 1px solid #ddd;
          padding: 16px;
          border-radius: 8px;
          width: 35%;
          margin: 50px auto;
          text-align: center;
          box-sizing: border-box;
        }
        h1 {
          font-size: 24px;
          margin-bottom: 16px;
        }
        form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        div {
          margin-bottom: 15px;
        }
        label {
          display: block;
          font-size: 14px;
          margin-bottom: 5px;
        }
        input,
        select {
          width: 93%;
          padding: 10px;
          font-size: 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        button {
          padding: 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          background-color: #007bff;
          color: white;
        }
        button:hover {
          background-color: #0056b3;
        }
        .error {
          color: red;
          margin-top: 10px;
        }
        .toggle-register {
          cursor: pointer;
          color: #2196f3;
        }
        @media (width < 601px) {
          .login-form {
            width: 95%;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginForm;
