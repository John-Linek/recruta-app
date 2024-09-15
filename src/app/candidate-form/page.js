// src/pages/candidate-form.js
"use client";

import React from "react";
import useAuth from "@/hooks/useAuth";
import CandidateForm from "../../components/candidateForm";

const CandidateFormPage = () => {
  useAuth("/"); // Redireciona para a página de login se o usuário não estiver autenticado

  return <CandidateForm />;
};

export default CandidateFormPage;
