// src/page.js
"use client";

import React from "react";
import LoginForm from "@/components/loginForm";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/services/configFirebase";
import { getUserType, hasSubmittedForm } from "@/services/databaseService";

const LoginPage = () => {
  const router = useRouter();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userType = await getUserType(user.uid);

          if (userType === "recruiter") {
            router.push("/candidate-cards");
          } else if (userType === "candidate") {
            const formSubmitted = await hasSubmittedForm(user.uid);
            if (formSubmitted) {
              router.push("/candidate-progress");
            } else {
              router.push("/candidate-form");
            }
          } else {
            console.error("Tipo de usuário não reconhecido.");
          }
        } catch (error) {
          console.error("Erro ao obter tipo de usuário:", error);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  return <LoginForm />;
};

export default LoginPage;
