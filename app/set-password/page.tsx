"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { KeyRound, CheckCircle2, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function SetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setErrorMsg(data.error || "Ocurrió un error");
        setStatus("error");
      }
    } catch (err) {
      setErrorMsg("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6 text-center">
        <div className="bg-[#0f0f12] p-10 rounded-[40px] border border-white/5 max-w-md">
          <p className="text-red-500 font-black uppercase tracking-widest text-xs">Acceso Denegado</p>
          <h1 className="text-white text-2xl font-black italic mt-4 uppercase">Token no encontrado</h1>
          <p className="text-gray-500 text-sm mt-4">Usa el enlace que recibiste por correo electrónico.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6 selection:bg-blue-500/30">
      <div className="w-full max-w-md">
        <div className="bg-[#0f0f12] rounded-[50px] border border-white/10 p-10 shadow-2xl relative overflow-hidden">
          
          {/* Decoración de fondo */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl"></div>

          {status === "success" ? (
            <div className="text-center py-10 animate-in fade-in zoom-in">
              <div className="bg-green-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="text-green-500" size={40} />
              </div>
              <h2 className="text-white text-3xl font-black italic uppercase leading-none mb-4">¡Listo!</h2>
              <p className="text-gray-400 text-xs uppercase tracking-widest font-bold">Contraseña configurada con éxito. Redirigiendo al login...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic">AJ</div>
                <div>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-none">AJCAR 25</p>
                  <p className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter">Activación de Cuenta</p>
                </div>
              </div>

              <h2 className="text-white text-4xl font-black italic uppercase tracking-tighter mb-2">Seguridad</h2>
              <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-10">Establece tu nueva contraseña</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-gray-600 uppercase ml-4 tracking-widest">Nueva Contraseña</p>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-xs text-white outline-none focus:border-blue-500 transition-all pr-12"
                      placeholder="••••••••"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-blue-500 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[9px] font-black text-gray-600 uppercase ml-4 tracking-widest">Confirmar Contraseña</p>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-xs text-white outline-none focus:border-blue-500 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>

                {errorMsg && (
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-bounce">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white font-black py-6 rounded-[32px] uppercase text-[10px] tracking-[0.4em] hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 mt-4"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                  Guardar y Acceder
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}