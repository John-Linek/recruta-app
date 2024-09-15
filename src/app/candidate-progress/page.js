// src/pages/candidate-progress.js
"use client";

import React from "react";
import useAuth from "@/hooks/useAuth";
import CandidateProgress from "../../components/ProgressTimeline";

const CandidateProgressPage = () => {
  useAuth("/"); // Redireciona para a página de login se o usuário não estiver autenticado

  return <CandidateProgress />;
};

export default CandidateProgressPage;
