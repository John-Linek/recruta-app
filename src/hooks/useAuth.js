// src/hooks/useAuth.js
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/services/configFirebase";

const useAuth = (redirectTo = "/") => {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push(redirectTo);
      }
    });

    return () => unsubscribe();
  }, [router, redirectTo]);
};

export default useAuth;
