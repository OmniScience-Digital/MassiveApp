"use client";

import { useState } from "react";
import { SignInCard } from "./sign-in-card";
import { SignUpCard } from "./sign-up-card";
import { SignInFlow } from "@/types/schema";
import { ForgotPasswordCard } from "./ForgotPasswordCard";
import { ResetPasswordCard } from "./ResetPasswordCard";

export const AuthScreen = () => {
  const [currentFlow, setCurrentFlow] = useState<SignInFlow>("signIn");
  const [resetEmail, setResetEmail] = useState("");
  return (
    <div className="h-full flex items-center justify-center bg-gray-700">
      <div className="md:h-auto md:w-[420px]">
        {currentFlow === "signIn" && <SignInCard setState={setCurrentFlow} />}
        {currentFlow === "signUp" && <SignUpCard setState={setCurrentFlow} />}

        {currentFlow === "forgotPassword" && (
          <ForgotPasswordCard
            setState={setCurrentFlow}
            setResetEmail={setResetEmail}
          />
        )}

        {currentFlow === "resetPassword" && (
          <ResetPasswordCard email={resetEmail} setState={setCurrentFlow} />
        )}
      </div>
    </div>
  );
};
