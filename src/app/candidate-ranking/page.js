// src/pages/candidate-ranking.js
"use client";

import React from "react";
import useAuth from "@/hooks/useAuth";
import CandidateRanking from "../../components/candidateRanking";

const CandidateRankingPage = () => {
  useAuth("/"); // Redireciona para a página de login se o usuário não estiver autenticado

  return <CandidateRanking />;
};

export default CandidateRankingPage;
