"use client";

import { useState } from "react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log({
      email,
      password,
    });

    // Aquí conectarás con backend
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 w-full max-w-md"
    >
      <div>
        <label className="block text-sm mb-1">Correo electrónico</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 rounded bg-neutral-800 border border-white/10 focus:border-red-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Contraseña</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded bg-neutral-800 border border-white/10 focus:border-red-500 outline-none"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-red-600 hover:bg-red-700 transition p-3 rounded font-semibold"
      >
        Iniciar Sesión
      </button>
    </form>
  );
}