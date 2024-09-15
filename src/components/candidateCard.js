"use client";

import React, { useState, useEffect } from "react";
import { ref, get, child, runTransaction, update } from "firebase/database";
import { auth, database } from "@/services/configFirebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { FaCheck, FaPen } from "react-icons/fa";

const CandidateCard = ({ cardTitle, onNext, onPrevious }) => {
  const [candidates, setCandidates] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [rating, setRating] = useState(null);
  const [highlightedRating, setHighlightedRating] = useState(null);
  const [userType, setUserType] = useState(null);
  const [observation, setObservation] = useState("");
  const [notification, setNotification] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          // Verifica o tipo do usuário
          const userRef = ref(database, `users/${currentUser.uid}`);
          const userSnapshot = await get(userRef);

          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            setUserType(userData.type);

            if (userData.type === "recruiter") {
              fetchCandidatesData();
            } else {
              router.push("/"); // Redireciona para a página de login se não for recrutador
            }
          } else {
            console.error("Nenhum dado de usuário encontrado.");
            router.push("/"); // Redireciona para a página de login se não houver dados do usuário
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
          router.push("/"); // Redireciona para a página de login em caso de erro
        }
      } else {
        router.push("/"); // Redireciona para a página de login se não estiver autenticado
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchCandidatesData = async () => {
    try {
      const dbRef = ref(database);
      const snapshot = await get(child(dbRef, `candidates`));

      if (snapshot.exists()) {
        const candidatesData = snapshot.val();
        const candidateIds = Object.keys(candidatesData);

        if (candidateIds.length > 0) {
          setCandidates(
            candidateIds.map((id) => ({
              ...candidatesData[id],
              uid: id,
            }))
          );
          setCurrentIndex(0);
          setRating(candidatesData[candidateIds[0]].rating || null);
        } else {
          console.error("Nenhum candidato encontrado.");
        }
      } else {
        console.error("Nenhum dado disponível para candidatos.");
      }
    } catch (error) {
      console.error("Erro ao buscar dados do candidato:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < candidates.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setRating(candidates[nextIndex].rating || null);
    } else {
      router.push("/candidate-ranking");
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const previousIndex = currentIndex - 1;
      setCurrentIndex(previousIndex);
      setRating(candidates[previousIndex].rating || null);
    }
  };

  const handleRating = async (ratingValue) => {
    const candidate = candidates[currentIndex];
    if (candidate) {
      try {
        // Soma a nota no Firebase
        await runTransaction(
          ref(database, `candidates/${candidate.uid}/rating`),
          (currentRating) => {
            return (currentRating || 0) + ratingValue;
          }
        );

        // Atualiza o estado local com a nova nota somada
        setCandidates((prevCandidates) =>
          prevCandidates.map((c) =>
            c.uid === candidate.uid
              ? { ...c, rating: (c.rating || 0) + ratingValue }
              : c
          )
        );

        setRating((prevRating) => (prevRating || 0) + ratingValue);
        setHighlightedRating(ratingValue); // Destaque a avaliação atual
        setNotification("Avaliação salva!"); // Exibe notificação
        setTimeout(() => {
          setNotification("");
          setHighlightedRating(null); // Remove destaque após 2 segundos
        }, 2000);
      } catch (error) {
        console.error("Erro ao salvar avaliação:", error);
      }
    }
  };

  const handleSaveObservation = async () => {
    const candidate = candidates[currentIndex];
    if (candidate) {
      try {
        // Atualiza a observação no Firebase
        await update(ref(database, `candidates/${candidate.uid}`), {
          observation: observation,
        });

        // Atualiza o estado local com a nova observação
        setCandidates((prevCandidates) =>
          prevCandidates.map((c) =>
            c.uid === candidate.uid ? { ...c, observation: observation } : c
          )
        );

        setNotification("Observação salva!"); // Exibe notificação
        setTimeout(() => setNotification(""), 3000); // Limpa notificação após 3 segundos
      } catch (error) {
        console.error("Erro ao salvar observação:", error);
      }
    }
  };

  const openObservationDialog = () => {
    setObservation(candidates[currentIndex].observation || "");
    setIsDialogOpen(true);
  };

  const closeObservationDialog = () => {
    setIsDialogOpen(false);
  };

  const saveObservationAndCloseDialog = async () => {
    await handleSaveObservation();
    closeObservationDialog();
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

  const candidate = candidates[currentIndex];

  return (
    <div className="candidate-card">
      {notification && (
        <div className="notification">
          <FaCheck className="notification-icon" />
          {notification}
        </div>
      )}
      <h2 className="card-title">{cardTitle}</h2>
      <h1 className="candidate-name">{candidate.name}</h1>
      <div className="video-container">
        <video key={candidate.uid} width="100%" height="auto" controls>
          <source src={candidate.videoUrl} type="video/mp4" />
          Seu navegador não suporta a tag de vídeo.
        </video>
      </div>
      <p className="submission-date">
        Data de envio: {candidate.submissionDate}
      </p>
      <p className="availability">
        Disponibilidade imediata:{" "}
        {candidate.immediateAvailability ? "Sim" : "Não"}
      </p>

      <p className="phone-number">Cel.: {candidate.phone}</p>

      <div className="observation">
        <label>Obs:</label>
        <span>{candidate.observation || "Nenhuma observação"}</span>
        <FaPen
          className="edit-icon"
          onClick={openObservationDialog}
          title="Editar Observação"
        />
      </div>
      {isDialogOpen && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Editar Observação</h3>
            <textarea
              style={{ maxWidth: "95%" }}
              placeholder="Digite suas observações aqui..."
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              rows="4"
              cols="50"
            />
            <div className="dialog-buttons">
              <button
                className="save-button"
                onClick={saveObservationAndCloseDialog}
              >
                Salvar
              </button>
              <button
                className="cancel-button"
                onClick={closeObservationDialog}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rating-container">
        <p>Avaliação:</p>
        {[1, 2, 3, 4, 5].map((value) => (
          <span
            key={value}
            className={`rating ${
              highlightedRating === value ? "selected" : ""
            }`}
            onClick={() => handleRating(value)}
          >
            {value}
          </span>
        ))}
      </div>

      <div className="navigation">
        <a className="nav-link" onClick={handlePrevious}>
          Retornar
        </a>
        <a
          className={`nav-link ${
            currentIndex === candidates.length - 1 ? "conclude-button" : ""
          }`}
          onClick={handleNext}
        >
          {currentIndex === candidates.length - 1 ? "Concluir" : "Avançar"}
        </a>
      </div>

      <style jsx>{`
        .candidate-card {
          border: 1px solid #ddd;
          padding: 16px;
          border-radius: 8px;
          max-width: 100%;
          margin: 0 auto;
          text-align: center;
          box-sizing: border-box;
        }
        .card-title {
          font-size: 18px;
          margin-bottom: 8px;
          color: #555;
        }
        .candidate-name {
          font-size: 20px;
          margin-bottom: 16px;
        }
        .phone-number {
          font-size: 16px;
          margin-bottom: 16px;
        }
        .video-container {
          margin-bottom: 16px;
        }
        .submission-date,
        .availability {
          font-size: 16px;
          margin-bottom: 8px;
        }
        .rating-container {
          font-size: 16px;
          margin-bottom: 16px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
        }
        .rating {
          cursor: pointer;
          padding: 5px 10px;
          min-width: 10px;
          border-radius: 50%;
          border: 1px solid #ccc;
          transition: all 0.3s ease;
        }
        .rating.selected {
          background-color: #4caf50;
          color: white;
          border-color: #4caf50;
        }
        .navigation {
          display: flex;
          justify-content: space-between;
        }
        .nav-link {
          cursor: pointer;
          color: #2196f3;
          text-decoration: none;
        }
        .conclude-button {
          font-weight: bold;
          color: #4caf50;
        }
        .notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background-color: #4caf50;
          color: white;
          padding: 10px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 999;
        }
        .notification-icon {
          font-size: 18px;
        }
        .observation {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 16px;
          margin-bottom: 16px;
        }
        .edit-icon {
          cursor: pointer;
        }
        .dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dialog {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          background: #fff;
          padding: 15px 20px;
          border-radius: 8px;
          width: 80%;
          max-width: 500px;
        }
        .dialog-buttons {
          display: flex;
          justify-content: flex-end;
          margin-top: 10px;
        }
        .dialog-buttons button {
          padding: 10px 40px;
          margin: 0 10px;
          border: none;
          border-radius: 5px;
          font-size: 1rem;
          cursor: pointer;
        }
        .save-button {
          background-color: #4caf50;
          color: #fff;
          width: 46%;
        }
        .cancel-button {
          background-color: #f44336;
          color: #fff;
          width: 46%;
        }
        @media (width > 601px) {
          .video-container {
            width: 60%;
            margin: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default CandidateCard;
