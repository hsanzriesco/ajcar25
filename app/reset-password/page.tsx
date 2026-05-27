"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";

// Formulario de restablecimiento de contraseña: lee el token de la URL y lo envía junto a la nueva clave
// Se separa en su propio componente para poder envolverlo en Suspense (useSearchParams lo requiere)
function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Token de recuperación extraído del parámetro ?token= de la URL
  const token = searchParams.get("token");

  // Valores del formulario y visibilidad compartida de ambos campos de contraseña
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Estado de la petición y mensaje de feedback (éxito o error)
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Valida que las contraseñas coincidan y tengan mínimo 6 caracteres antes de hacer el POST
  // Si la API responde OK, muestra éxito y redirige al login tras 3 segundos
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

  // Si no hay token en la URL, muestra un error en lugar del formulario
  if (!token) {
    return (
      <div className="max-w-md mx-auto text-center p-6 sm:p-8 bg-red-500/10 border border-red-500 rounded-xl text-red-500 backdrop-blur-md text-sm sm:text-base">
        Token inválido o ausente. Solicita un nuevo enlace.
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 sm:p-8 bg-neutral-900/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-sm">
      <div className="flex justify-center mb-5 sm:mb-6">
        <img
          src="/imagenes/logo_ajcar25.png"
          alt="AJCAR 25"
          className="w-12 h-12 rounded-2xl object-contain"
        />
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-white mb-5 sm:mb-6 text-center">
        Nueva Contraseña
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo de nueva contraseña con icono de candado y botón de visibilidad */}
        <div className="relative">
          <Lock className="absolute left-3 top-3.5 text-gray-500" size={16} />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 pl-10 pr-10 text-white text-sm outline-none focus:border-red-600 transition-colors"
            required
            autoComplete="new-password"
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3.5 text-gray-500 hover:text-white transition-colors">
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Campo de confirmación: comparte el estado showPassword con el campo anterior */}
        <div className="relative">
          <Lock className="absolute left-3 top-3.5 text-gray-500" size={16} />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 pl-10 text-white text-sm outline-none focus:border-red-600 transition-colors"
            required
            autoComplete="new-password"
          />
        </div>

        {/* Mensaje de feedback: fondo verde si es éxito, rojo si es error */}
        {message.text && (
          <div className={`p-3 rounded-xl text-sm text-center ${message.type === "error" ? "bg-red-500/10 text-red-500 border border-red-500" : "bg-green-500/10 text-green-500 border border-green-500"}`}>
            {message.text}
          </div>
        )}

        {/* Botón de envío: muestra spinner mientras la petición está en curso */}
        <button type="submit" disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base active:scale-[0.98]">
          {loading ? <Loader2 className="animate-spin" size={18} /> : "Actualizar Contraseña"}
        </button>
      </form>
    </div>
  );
}

// Página raíz: fondo con imagen y overlay oscuro; envuelve el formulario en Suspense
// porque useSearchParams requiere un límite de Suspense en el árbol de componentes
export default function ResetPasswordPage() {
  return (
    <main
      className="min-h-screen w-full flex items-center justify-center px-4 py-10 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/imagenes/fondo_pagina.png')" }}
    >
      <div className="absolute inset-0 bg-black/60 z-0" />
      <div className="relative z-10 w-full">
        <Suspense fallback={
          <div className="flex items-center justify-center gap-3 text-white">
            <Loader2 className="animate-spin" size={20} /> Cargando...
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
