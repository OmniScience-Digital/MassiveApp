"use client";

import { AuthScreen } from "@/components/auth/auth_screen";


export default function App() {

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
    <AuthScreen/>
    </div>
  );
}


