// src/pages/candidate-cards.js
"use client";

import React from "react";
import useAuth from "@/hooks/useAuth";
import CandidateCard from "../../components/candidateCard";

const CandidateCardsPage = () => {
  useAuth("/");

  return <CandidateCard />;
};

export default CandidateCardsPage;
