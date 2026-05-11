"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        sessionStorage.clear();
        sessionStorage.setItem("user_role", data.role);
        sessionStorage.setItem("user_name", data.nombre || "");
        sessionStorage.setItem("user_id", data.id);

        const role = (data.role || "").toLowerCase().trim();

        let destination = "/";
        if (role === "cliente") destination = "/cliente";
        else if (role === "empleado") destination = "/gestion/tareas";
        else if (role === "jefe") destination = "/jefe";
        else if (role === "admin") destination = "/admin/dashboard";
        else destination = "/mi-perfil";

        window.location.href = destination;
      } else {
        setError(data.message || "Credenciales incorrectas");
      }
    } catch (err) {
      console.error("Error en login:", err);
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded-xl text-sm text-center">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-300">
          Email o Matrícula
        </label>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 sm:p-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-white/30 outline-none transition text-white placeholder:text-gray-600 text-sm sm:text-base"
          placeholder="ejemplo@correo.com"
          required
          autoComplete="username"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-300">
          Contraseña
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 sm:p-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-white/30 outline-none transition text-white placeholder:text-gray-600 pr-12 text-sm sm:text-base"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-white text-black font-bold py-3 sm:py-3.5 rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all disabled:opacity-50 mt-2 shadow-lg text-sm sm:text-base"
      >
        {loading ? "Verificando..." : "Entrar"}
      </button>

      <div className="text-center mt-5 sm:mt-6 border-t border-white/10 pt-5 sm:pt-6 space-y-3">
        <p className="text-sm text-gray-400">
          ¿No tienes cuenta?{" "}
          <Link
            href="/registro"
            className="text-white font-bold hover:text-red-500 transition-colors underline underline-offset-4"
          >
            Regístrate aquí
          </Link>
        </p>
        <p className="text-sm text-gray-500">
          ¿Olvidaste tu contraseña?{" "}
          <Link
            href="/forgot-password"
            className="text-gray-300 hover:text-white transition-colors underline underline-offset-4"
          >
            Restablécela aquí
          </Link>
        </p>
      </div>
    </form>
  );
}
