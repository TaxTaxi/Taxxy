// src/components/LoginButton.tsx
"use client";

import { supabase } from "@/lib/supabase";

export default function LoginButton() {
  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
    });

    if (error) console.error("Login error:", error);
  };

  return (
    <button onClick={handleLogin} className="bg-blue-600 text-white px-4 py-2 rounded">
      Sign in with GitHub
    </button>
  );
}
