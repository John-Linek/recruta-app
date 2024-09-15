"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, storage, database } from "@/services/configFirebase";
import { ref, set } from "firebase/database";
import {
  uploadBytes,
  getDownloadURL,
  ref as storageRef,
} from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

const CandidateForm = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [video, setVideo] = useState(null);
  const [submissionDate, setSubmissionDate] = useState(""); // Data de envio
  const [immediateAvailability, setImmediateAvailability] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [videoUploaded, setVideoUploaded] = useState(false); // Estado para rastrear se o vídeo foi enviado
  const router = useRouter();

  useEffect(() => {
    // Define a data de envio como a data atual no formato YYYY-MM-DD
    const today = new Date().toISOString().split("T")[0];
    setSubmissionDate(today);
  }, []);

  useEffect(() => {
    // Verificar se o usuário está autenticado e se é recrutador
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe(); // Limpar a assinatura
  }, []);

  const handleVideoChange = (e) => {
    setVideo(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !phone || !video) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    if (!user) {
      setError("Você precisa estar logado para enviar o formulário.");
      return;
    }

    if (videoUploaded) {
      setError("O vídeo já foi enviado.");
      return;
    }

    setLoading(true); // Mostrar carregando

    try {
      // Upload do vídeo para o Firebase Storage
      const videoRef = storageRef(storage, `videos/${name}-${Date.now()}`);
      await uploadBytes(videoRef, video);
      const videoUrl = await getDownloadURL(videoRef);

      // Armazenar os dados do candidato no Firebase Realtime Database
      const candidateData = {
        name,
        phone,
        videoUrl,
        submissionDate,
        immediateAvailability,
        uid: user.uid,
        // Fase e avaliação são definidos inicialmente para 0 e 1
        progressCurrent: 1,
        rating: 0,
      };

      await set(ref(database, `candidates/${user.uid}`), candidateData);

      setSuccess("Candidato registrado com sucesso!");
      setImmediateAvailability(false);
      setVideoUploaded(true); // Marca o vídeo como enviado
    } catch (err) {
      setError("Erro ao enviar dados. Por favor, tente novamente.");
      console.error("Erro ao enviar dados: ", err);
    } finally {
      setLoading(false); // Ocultar carregando
    }
  };

  const handleFinish = () => {
    router.push("/candidate-progress");
  };

  return (
    <div className="candidate-form">
      <h2>Cadastro de Candidato</h2>
      <form onSubmit={handleSubmit}>
        {!success && (
          <>
            <div className="form-group">
              <label htmlFor="name">Nome:</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Número de Celular:</label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="video">Carregar vídeo:</label>
              <input
                type="file"
                id="video"
                accept="video/*"
                onChange={handleVideoChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="submissionDate">Data de envio:</label>
              <input
                type="date"
                id="submissionDate"
                value={submissionDate}
                readOnly // Campo somente leitura
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={immediateAvailability}
                  onChange={() =>
                    setImmediateAvailability(!immediateAvailability)
                  }
                />
                Disponibilidade imediata
              </label>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar"}
            </button>
          </>
        )}
        {error && <p className="error">{error}</p>}
        {success && (
          <>
            <p className="success">{success}</p>
            <button onClick={handleFinish} className="finish-button">
              Finalizar
            </button>
          </>
        )}
      </form>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Carregando...</p>
        </div>
      )}

      <style jsx>{`
        .candidate-form {
          max-width: 600px;
          margin: 0 auto;
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        h2 {
          text-align: center;
          margin-bottom: 16px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        label {
          display: block;
          margin-bottom: 8px;
          font-weight: bold;
        }

        input[type="text"],
        input[type="tel"],  /* Novo campo de input para telefone */
        input[type="date"],
        input[type="file"] {
          width: 95%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        button {
          display: block;
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 4px;
          background-color: #4caf50;
          color: white;
          font-size: 16px;
          cursor: pointer;
        }

        button.finish-button {
          background-color: #007bff;
          margin-top: 16px;
        }

        button:disabled {
          background-color: #9e9e9e;
          cursor: not-allowed;
        }

        button:hover:not(:disabled) {
          opacity: 0.8;
        }

        .error {
          color: red;
          margin-top: 10px;
        }

        .success {
          color: green;
          margin-top: 10px;
          text-align: center;
        }

        .loading {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          text-align: center;
        }

        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-left: 4px solid white;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default CandidateForm;
