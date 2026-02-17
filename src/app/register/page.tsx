"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      return setError("Konfirmasi password tidak cocok!");
    }

    setIsLoading(true);
    try {
      // Proses buat akun di Firebase
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Pendaftaran berhasil! Selamat datang di LaundryFlow.");
      router.push("/dashboard"); // Langsung arahkan ke dasbor
    } catch (err: any) {
      setError(err.message || "Gagal mendaftar. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-display">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header / Logo */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
            <span className="material-icons-outlined text-white text-2xl">local_laundry_service</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daftar LaundryFlow</h1>
          <p className="text-sm text-slate-500 mt-1 text-center">Mulai digitalisasi bisnis laundry Anda hari ini.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium mb-6 text-center border border-red-100">
            {error}
          </div>
        )}

        {/* Form Register */}
        <form onSubmit={handleRegister} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alamat Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="email@laundryanda.com" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="Minimal 6 karakter" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Konfirmasi Password</label>
            <input type="password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="Ulangi password Anda" />
          </div>

          <button disabled={isLoading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-70 mt-4">
            {isLoading ? "Memproses..." : "Buat Akun Sekarang"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-700 underline">
              Masuk di sini
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}