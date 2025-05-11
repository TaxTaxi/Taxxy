"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState("");

  // 🔐 Handle email login or signup
  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (isNewUser) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  // 🔐 Handle Google sign-in
  async function handleGoogleLogin() {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    }
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
