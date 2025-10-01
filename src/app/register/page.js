"use client";
import { useState } from "react";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { app } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";

const auth = getAuth(app);

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/"); // Redirect ke halaman utama setelah berhasil
    } catch (error) {
      setError(error.message);
      console.error("Error registering:", error);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-center">Register</h1>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border rounded-md"
            />
          </div>
          <div>
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border rounded-md"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Register
          </button>
        </form>
        <p className="text-center">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-indigo-600 hover:underline">
            Login di sini
          </Link>
        </p>
      </div>
    </main>
  );
}
