"use client";

import React, { useState, useEffect } from "react";
import { ref, get, child, update } from "firebase/database";
import { database, auth } from "@/services/configFirebase";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";

// Função para buscar o tipo de usuário
const fetchUserType = async (uid) => {
  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const userData = snapshot.val();
      return userData.type;
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar tipo de usuário:", error);
    return null;
  }
};

const CandidateRanking = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [status, setStatus] = useState("");
  const router = useRouter();

  useEffect(() => {
    const checkUserType = async () => {
      const user = auth.currentUser;
      if (user) {
        const userType = await fetchUserType(user.uid);
        if (userType !== "recruiter") {
          await signOut(auth);
          router.push("/"); // Redireciona para a página de login
        } else {
          fetchCandidatesData(); // Se for recrutador, busca os dados dos candidatos
        }
      } else {
        router.push("/"); // Redireciona se não estiver autenticado
      }
    };

    checkUserType();
  }, [router]);

  // Função para buscar os dados dos candidatos
  const fetchCandidatesData = async () => {
    try {
      const dbRef = ref(database);
      const snapshot = await get(child(dbRef, `candidates`));

      if (snapshot.exists()) {
        const candidatesData = snapshot.val();
        const candidateIds = Object.keys(candidatesData);

        if (candidateIds.length > 0) {
          const candidatesList = candidateIds.map((id) => ({
            ...candidatesData[id],
            uid: id, // Identificador único de cada candidato
          }));

          // Ordena candidatos pela soma das notas atribuídas
          candidatesList.sort((a, b) => {
            const scoreA = a.rating || 0; // Considera a nota atribuída
            const scoreB = b.rating || 0;
            return scoreB - scoreA; // Ordem decrescente
          });

          setCandidates(candidatesList);
        } else {
          console.error("Nenhum candidato encontrado.");
        }
      } else {
        console.error("Nenhum dado disponível para candidatos.");
      }
    } catch (error) {
      console.error("Erro ao buscar dados dos candidatos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.push("/candidate-cards"); // Redireciona para a página de cards
  };

  const handleFinalize = async () => {
    try {
      await signOut(auth); // Desloga o usuário
      router.push("/"); // Redireciona para a página de login
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    }
  };

  const handleCandidateClick = (candidate) => {
    setSelectedCandidate(candidate);
    setShowOptions(true);
  };

  const handleAdvanceStage = async (candidateId) => {
    try {
      const candidateRef = ref(database, `candidates/${candidateId}`);
      const candidateSnapshot = await get(candidateRef);

      if (candidateSnapshot.exists()) {
        const candidateData = candidateSnapshot.val();
        const currentStep = candidateData.progressCurrent || 1; // Fase inicial é 1

        // Verifica se a etapa atual é menor que 4 antes de avançar
        if (currentStep < 4) {
          // Atualiza a etapa do candidato incrementando em 1
          const updates = { progressCurrent: currentStep + 1 };
          if (currentStep === 2 && interviewDate) {
            updates.interviewDate = interviewDate;
          }
          if (currentStep === 3 && status) {
            updates.status = status;
          }
          await update(candidateRef, updates);

          // Atualiza a lista de candidatos após a mudança
          await fetchCandidatesData();
        } else {
          console.error("O candidato já está na etapa máxima.");
          // Mostrar mensagem de erro ou feedback para o usuário
        }
      } else {
        console.error("Dados do candidato não encontrados:", candidateId);
        // Mostrar mensagem de erro ou feedback para o usuário
      }
    } catch (error) {
      console.error("Erro ao avançar etapa do candidato:", error);
      // Mostrar mensagem de erro ou feedback para o usuário
    } finally {
      setShowOptions(false);
      setSelectedCandidate(null);
      setInterviewDate("");
      setStatus("");
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <style jsx>{`
          .loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background-color: #f9f9f9;
          }
          .spinner {
            border: 8px solid #f3f3f3;
            border-top: 8px solid #2196f3;
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
  }

  if (candidates.length === 0) {
    return <p>Nenhum candidato encontrado.</p>;
  }

  return (
    <div className="ranking">
      <h2>Ranking dos Candidatos</h2>
      <ul>
        {candidates.map((candidate) => (
          <li
            key={candidate.uid}
            className="candidate-item"
            onClick={() => handleCandidateClick(candidate)}
          >
            <span className="name">{candidate.name}</span>
            <div>
              <span className="rating">
                Nota: {candidate.rating || 0} pontos
              </span>
              <span
                style={{ marginLeft: "8px" }}
                className={`current-step step-${
                  candidate.progressCurrent || 1
                }`}
              >
                Etapa: {candidate.progressCurrent || 1}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className="actions">
        <button className="back-button" onClick={handleGoBack}>
          Voltar
        </button>
        <button className="finalize-button" onClick={handleFinalize}>
          Finalizar
        </button>
      </div>

      {showOptions && selectedCandidate && (
        <div className="options-box">
          <p className="options-title">Avançar para a próxima etapa?</p>
          {selectedCandidate.progressCurrent === 2 && (
            <div className="interview-date">
              <label htmlFor="interview-date">Data da Entrevista:</label>
              <input
                id="interview-date"
                type="date"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
              />
            </div>
          )}
          {selectedCandidate.progressCurrent === 3 && (
            <div className="status-selection">
              <label htmlFor="status">Status:</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="" disabled>
                  Selecione o status
                </option>
                <option value="aprovado">Aprovado</option>
                <option value="reprovado">Reprovado</option>
              </select>
            </div>
          )}
          <div className="options-buttons">
            <button
              className="confirm-button"
              onClick={() => handleAdvanceStage(selectedCandidate.uid)}
            >
              Sim
            </button>
            <button
              className="cancel-button"
              onClick={() => setShowOptions(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .ranking {
          border: 1px solid #ddd;
          padding: 16px;
          border-radius: 8px;
          max-width: 600px;
          margin: 0 auto;
          text-align: left;
          box-sizing: border-box;
        }
        .ranking h2 {
          font-size: 24px;
          margin-bottom: 16px;
          color: #555;
          text-align: center;
        }
        ul {
          list-style-type: none;
          padding: 0;
        }
        .candidate-item {
          padding: 12px;
          border-bottom: 1px solid #ddd;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        .candidate-item:hover {
          background-color: #f1f1f1;
        }
        .candidate-item:last-child {
          border-bottom: none;
        }
        .name {
          font-size: 18px;
          font-weight: bold;
          color: #333;
        }
        .rating {
          color: #666;
        }
        .current-step {
          color: #888;
        }
        .options-box {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          padding: 20px;
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          z-index: 1000;
          width: 300px;
        }
        .options-title {
          font-size: 18px;
          margin-bottom: 30px;
          color: #333;
          text-align: center;
        }
        .interview-date,
        .status-selection {
          margin-bottom
        }
        label {
          display: block;
          margin-bottom: 4px;
          color: #555;
        }
        input[type="date"],
        select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .options-buttons {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
        }
        .confirm-button {
          background-color: #2196f3;
          color: #fff;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          width: 46%;
          cursor: pointer;
        }
        .confirm-button:hover {
          background-color: #1976d2;
        }
        .cancel-button {
          background-color: #f44336;
          color: #fff;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          width: 46%;
          cursor: pointer;
        }
        .cancel-button:hover {
          background-color: #d32f2f;
        }
        .actions {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
        }
        .back-button,
        .finalize-button {
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
          width: 120px;
        }
        .back-button {
          background-color: #4caf50;;
          color: #fff;
        }
        .back-button:hover {
          background-color: #e0e0e0;
        }
        .finalize-button {
          background-color: #2196f3;
          color: #fff;
        }
        .finalize-button:hover {
          background-color: #1976d2;
        }

        .candidate-item .current-step {
    font-size: 16px;
    font-weight: bold;
  }
  .step-1 {
    color: #999; /* Cor para a Etapa 1 */
  }
  .step-2 {
    color: #4caf50; /* Cor para a Etapa 2 */
  }
  .step-3 {
    color: #ff9800; /* Cor para a Etapa 3 */
  }
  .step-4 {
    color: #f44336; /* Cor para a Etapa 4 */
  }
      `}</style>
    </div>
  );
};

export default CandidateRanking;
