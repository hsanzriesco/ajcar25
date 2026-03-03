"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        localStorage.clear();

        // Guardamos tal cual viene de la base de datos
        localStorage.setItem("user_role", data.role); 
        localStorage.setItem("user_name", data.nombre);
        localStorage.setItem("user_id", data.id);

        // --- LÓGICA DE REDIRECCIÓN ROBUSTA ---
        // Convertimos a minúsculas para comparar sin errores de escritura
        const normalizedRole = data.role.toLowerCase();
        let destination = "/";
        
        if (normalizedRole === "jefe" || normalizedRole === "admin") {
          destination = "/admin/dashboard";
        } else if (normalizedRole === "empleado") {
          destination = "/gestion/tareas";
        } else {
          // Cubre "cliente", "usuario", o cualquier otro
          destination = "/mi-perfil";
        }

        router.push(destination);

        // Recarga para refrescar estados globales
        setTimeout(() => {
          window.location.reload();
        }, 300);

      } else {
        setError(data.message || "Credenciales incorrectas");
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm mx-auto">
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded-lg text-sm text-center animate-pulse">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1 text-gray-300">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 rounded-lg bg-white/5 border border-white/10 focus:border-white/30 outline-none transition text-white placeholder:text-gray-600"
          placeholder="ejemplo@correo.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-gray-300">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded-lg bg-white/5 border border-white/10 focus:border-white/30 outline-none transition text-white placeholder:text-gray-600"
          placeholder="••••••••"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 active:scale-[0.98] transition-all disabled:opacity-50 mt-2 shadow-lg"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            Verificando...
          </span>
        ) : "Entrar"}
      </button>

      <div className="text-center mt-6 space-y-4 border-t border-white/10 pt-6">
        <p className="text-sm text-gray-400">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="text-white font-bold hover:text-red-500 transition-colors underline underline-offset-4">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </form>
  );
}