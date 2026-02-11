"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Login:", { email, password });

    // Aquí luego conectarás con backend
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-ajcar text-white px-6">

      {/* CONTENEDOR */}
      <div className="w-full max-w-md bg-black/60 backdrop-blur-lg border border-white/10 rounded-xl p-8 shadow-xl">

        {/* TITULO */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-wide">
            Iniciar Sesión
          </h1>

          <p className="text-gray-400 text-sm mt-2">
            Accede a tu cuenta AJCAR25
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* EMAIL */}
          <div>
            <label className="text-sm text-gray-300">
              Correo electrónico
            </label>

            <div className="flex items-center mt-1 bg-neutral-900 border border-white/10 rounded-lg px-3">
              <Mail size={18} className="text-gray-400" />

              <input
                type="email"
                required
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-sm text-gray-300">
              Contraseña
            </label>

            <div className="flex items-center mt-1 bg-neutral-900 border border-white/10 rounded-lg px-3">
              <Lock size={18} className="text-gray-400" />

              <input
                type="password"
                required
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          {/* BOTON LOGIN */}
          <button
            type="submit"
            className="w-full bg-gray-200 text-black font-semibold py-2.5 rounded-lg hover:bg-white transition"
          >
            Entrar
          </button>

        </form>

        {/* REGISTRO */}
        <div className="text-center mt-6 text-sm text-gray-400">
          ¿No tienes cuenta?{" "}
          <Link
            href="/registro"
            className="text-white hover:underline"
          >
            Regístrate
          </Link>
        </div>

      </div>

    </main>
  );
}