import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, database } from "@/services/configFirebase";
import { ref, get } from "firebase/database";

const ProgressTimeline = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [interviewDate, setInterviewDate] = useState(null);
  const [status, setStatus] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCandidateProgress = async (id) => {
      try {
        const candidateRef = ref(database, `candidates/${id}`);
        const candidateSnapshot = await get(candidateRef);

        if (candidateSnapshot.exists()) {
          const candidateData = candidateSnapshot.val();
          setCurrentStep(candidateData.progressCurrent || 1);
          setInterviewDate(candidateData.interviewDate || "Não disponível");
          setStatus(candidateData.status || "Não avaliado");
        } else {
          console.error("Dados do candidato não encontrados:", id);
        }
      } catch (error) {
        console.error("Erro ao buscar dados do candidato:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchCandidateProgress(user.uid); // Busca o progresso do candidato usando o user.uid
      } else {
        console.log("Nenhum usuário autenticado");
        router.push("/"); // Redireciona para a página inicial se não estiver autenticado
      }
    });

    return () => unsubscribe(); // Limpeza do listener quando o componente desmonta
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <div className="timeline-wrapper">
      <h2 style={{ marginBottom: "50px" }}>Página de andamento</h2>
      <div className="timeline">
        <div className="timeline-steps">
          {[
            "Formulário",
            "Selecionado para entrevista",
            `Data da Entrevista: ${interviewDate}`,
            `Status: ${status}`,
          ].map((step, index) => (
            <React.Fragment key={index}>
              <div
                className={`timeline-step ${
                  currentStep >= index + 1 ? "completed" : ""
                }`}
              >
                <span className="step-number">{index + 1}</span>
              </div>
              {index < 3 && (
                <div
                  className={`timeline-connector ${
                    currentStep > index + 1 ? "completed" : ""
                  }`}
                ></div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="timeline-labels">
          {[
            "Formulário",
            "Selecionado para entrevista",
            `Data da Entrevista: ${interviewDate}`,
            `Status: ${status}`,
          ].map((step, index) => (
            <div
              key={index}
              className={`timeline-label ${
                currentStep > index + 1 ? "completed" : ""
              }`}
            >
              {step}
            </div>
          ))}
        </div>
      </div>
      <button onClick={handleLogout} className="logout-button">
        Sair
      </button>

      <style jsx>{`
        .timeline-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 90%;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }

        h2 {
          margin-bottom: 20px;
        }

        .timeline {
          display: flex;
          align-items: center;
          position: relative;
          width: 100%;
        }

        .timeline-steps {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .timeline-step {
          width: 30px;
          height: 30px;
          background-color: #f1f1f1;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          color: #555;
          position: relative;
        }

        .timeline-step.completed {
          background-color: #4caf50;
          color: white;
        }

        .timeline-connector {
          width: 2px;
          height: 40px;
          background-color: #ccc;
        }

        .timeline-connector.completed {
          background-color: #4caf50;
        }

        .timeline-labels {
          position: absolute;
          transform: translateX(20%);
          margin-left: 10px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 60%;
        }

        .timeline-label {
          font-size: 14px;
          text-align: left;
          margin: 27px 0;
        }

        .timeline-label.completed {
          color: #4caf50;
        }

        .logout-button {
          margin-top: 50px;
          padding: 10px 20px;
          width: 80%;
          max-width: 400px;
          border: none;
          border-radius: 4px;
          background-color: #f44336;
          color: white;
          font-size: 16px;
          cursor: pointer;
        }

        .logout-button:hover {
          background-color: #d32f2f;
        }

        /* Media Queries para Responsividade */
        @media (min-width: 601px) {
          .timeline {
            flex-direction: column;
            justify-content: center;
            margin: 120px 0;
          }

          .timeline-steps {
            flex-direction: row;
            align-items: center;
          }

          .timeline-labels {
            position: relative;
            transform: none;
            margin-top: 10px;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            width: 100%;
            text-align: center;
          }

          .timeline-label {
            margin-top: 0;
          }

          .timeline-label:last-child {
            margin-right: -8px;
          }

          .timeline-connector {
            width: 210px;
            height: 2px;
          }
        }
      `}</style>
    </div>
  );
};

export default ProgressTimeline;
