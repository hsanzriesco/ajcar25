"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Las contraseñas no coinciden." });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: "error", text: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "¡Contraseña actualizada! Redirigiendo al login..." });
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setMessage({ type: "error", text: data.message || "Error al actualizar." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error de conexión." });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto text-center p-8 bg-red-500/10 border border-red-500 rounded-xl text-red-500 backdrop-blur-md">
        Token inválido o ausente. Solicita un nuevo enlace.
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-8 bg-neutral-900/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-sm">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">Nueva Contraseña</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Lock className="absolute left-3 top-3.5 text-gray-500" size={18} />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 pl-10 text-white outline-none focus:border-red-600 transition-colors"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3.5 text-gray-500 hover:text-white"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-3.5 text-gray-500" size={18} />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 pl-10 text-white outline-none focus:border-red-600 transition-colors"
            required
          />
        </div>

        {message.text && (
          <div className={`p-3 rounded-lg text-sm text-center ${message.type === "error" ? "bg-red-500/10 text-red-500 border border-red-500" : "bg-green-500/10 text-green-500 border border-green-500"}`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : "Actualizar Contraseña"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main 
      className="min-h-screen w-full flex items-center justify-center px-4 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/imagenes/fondo_pagina.png')" }}
    >
      {/* Capa de oscurecimiento para mejorar la visibilidad del formulario */}
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      <div className="relative z-10 w-full">
        <Suspense fallback={<div className="text-white text-center">Cargando...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}