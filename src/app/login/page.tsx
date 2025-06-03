// app/login/page.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState("");

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const { error } = isNewUser
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    } else {
      router.push("/"); // ✅ redirect to home or dashboard
    }
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) setError(error.message);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-md rounded-xl w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-black text-center">
          Sign in to Taxxy
        </h1>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-2 border border-gray-300 rounded text-black"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-2 border border-gray-300 rounded text-black"
          />
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition"
          >
            {isNewUser ? "Create Account" : "Log In"}
          </button>
        </form>

        <div className="my-4 text-center text-sm text-black">
          {isNewUser ? "Already have an account?" : "New here?"}{" "}
          <button
            type="button"
            onClick={() => setIsNewUser(!isNewUser)}
            className="text-blue-600 hover:underline"
          >
            {isNewUser ? "Log In" : "Create One"}
          </button>
        </div>

        <hr className="my-6" />

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white border border-gray-400 text-black py-2 rounded hover:bg-gray-100 transition"
        >
          Continue with Google
        </button>

        {error && (
          <p className="text-red-500 text-sm mt-4 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
