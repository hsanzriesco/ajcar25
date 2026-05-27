"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  // Estado del formulario: email introducido, si ya se envió, carga en curso y mensaje de error
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Envía el email a la API de recuperación; si el correo no existe muestra el error devuelto
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Ese correo no lo tenemos registrado.");
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-ajcar text-white px-6">
      <div className="w-full max-w-md bg-black/60 backdrop-blur-lg border border-white/10 rounded-xl p-8 shadow-xl">

        {/* Enlace de vuelta al login con animación de deslizamiento en el icono */}
        <Link
          href="/login"
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Atrás
        </Link>

        {/* Título: cambia según si el formulario ya fue enviado o no */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-wide">
            {isSubmitted ? "¡Todo listo!" : "¿Te has olvidado?"}
          </h1>
        </div>

        {!isSubmitted ? (
          // FORMULARIO: campo de email con borde rojo si hay error, y botón de envío
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm text-gray-300">Tu correo</label>
              {/* El borde cambia a rojo con sombra suave cuando hay un error de validación */}
              <div className={`flex items-center mt-1 bg-neutral-900 border rounded-lg px-3 transition-colors ${error ? 'border-red-600 shadow-[0_0_10px_rgba(220,38,38,0.2)]' : 'border-white/10 focus-within:border-red-500'}`}>
                <Mail size={18} className={error ? "text-red-500" : "text-gray-400"} />
                <input
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent px-3 py-2 text-sm outline-none text-white"
                />
              </div>

              {/* Mensaje de error inline con icono, visible solo si la API devuelve un fallo */}
              {error && (
                <div className="flex items-center gap-2 mt-2 text-red-500 text-[12px] font-medium">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white font-semibold py-2.5 rounded-lg hover:bg-red-700 transition shadow-lg shadow-red-600/20 disabled:opacity-50"
            >
              Enviar enlace de recuperación
            </button>
          </form>
        ) : (
          // PANTALLA DE CONFIRMACIÓN: muestra el email enviado y un enlace de vuelta al login
          <div className="text-center py-6">
            <p className="text-gray-300 text-sm mb-8 leading-relaxed">
              El correo <span className="text-white font-medium">{email}</span> está bien.
              Ahora echa un ojo a tu bandeja de entrada porque te hemos mandado un enlace para que cambies la clave.
            </p>

            <Link
              href="/login"
              className="inline-block bg-neutral-800 text-white px-8 py-2.5 rounded-lg text-sm font-medium hover:bg-neutral-700 transition"
            >
              Volver al inicio
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
