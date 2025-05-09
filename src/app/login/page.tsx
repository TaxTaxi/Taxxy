// src/app/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/dashboard");
      }
    });
    return () => unsub();
  }, [router]);

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, form.email, form.password);
      } else {
        await createUserWithEmailAndPassword(auth, form.email, form.password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow max-w-md w-full space-y-6">
        <h1 className="text-2xl font-bold text-center">
          {mode === "login" ? "Log in to Taxxy" : "Create your Taxxy account"}
        </h1>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <input
            className="w-full p-2 rounded border border-gray-300 text-black"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            className="w-full p-2 rounded border border-gray-300 text-black"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white w-full py-2 rounded hover:bg-gray-800 transition"
          >
            {loading ? "Loading..." : mode === "login" ? "Log In" : "Sign Up"}
          </button>
        </form>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white border border-gray-400 text-black py-2 rounded hover:bg-gray-100"
        >
          Continue with Google
        </button>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <p className="text-center text-sm">
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-blue-500 hover:underline"
          >
            {mode === "login" ? "Create one" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
