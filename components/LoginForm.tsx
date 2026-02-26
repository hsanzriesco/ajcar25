"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login:", { email, password });
    // Aquí conectarás con backend próximamente
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* EMAIL */}
        <div>
          <label className="text-sm text-gray-300">Correo electrónico</label>
          <div className="flex items-center mt-1 bg-neutral-900 border border-white/10 rounded-lg px-3 focus-within:border-red-500 transition-colors">
            <Mail size={18} className="text-gray-400" />
            <input
              type="email"
              required
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent px-3 py-2 text-sm outline-none text-white"
            />
          </div>
        </div>

        {/* PASSWORD */}
        <div>
          <label className="text-sm text-gray-300">Contraseña</label>
          <div className="relative flex items-center mt-1 bg-neutral-900 border border-white/10 rounded-lg px-3 focus-within:border-red-500 transition-colors">
            <Lock size={18} className="text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent px-3 py-2 text-sm outline-none text-white pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-gray-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* BOTON LOGIN */}
        <button
          type="submit"
          className="w-full bg-red-600 text-white font-semibold py-2.5 rounded-lg hover:bg-red-700 transition shadow-lg shadow-red-600/20"
        >
          Iniciar Sesión
        </button>
      </form>

      {/* LINKS DE AYUDA / REGISTRO */}
      <div className="text-center mt-6 space-y-3">
        <p className="text-sm text-gray-400">
          ¿No tienes cuenta?{" "}
          <Link
            href="/registro"
            className="text-white hover:text-red-500 hover:underline transition-colors font-medium"
          >
            Regístrate
          </Link>
        </p>
        
        {/* ENLACE EN AZUL */}
        <p className="text-xs">
          <Link 
            href="/forgot-password" 
            className="text-blue-500 hover:text-blue-400 transition-colors font-medium hover:underline"
          >
            ¿Ha olvidado la contraseña?
          </Link>
        </p>
      </div>
    </div>
  );
}