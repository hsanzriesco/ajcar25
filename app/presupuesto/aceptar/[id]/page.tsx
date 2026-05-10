"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, Loader2, XCircle, X, AlertTriangle, Check } from "lucide-react";

const ModalConfirmar = ({ onConfirmar, onCerrar }: { onConfirmar: () => void; onCerrar: () => void }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-[#161b24] border border-white/10 rounded-[30px] p-6 sm:p-10 w-full max-w-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-yellow-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={20} className="text-yellow-400" />
        </div>
        <h3 className="text-lg font-black text-white">Rechazar Presupuesto</h3>
      </div>
      <p className="text-gray-300 text-sm mb-1">¿Seguro que desea rechazar el presupuesto?</p>
      <p className="text-gray-500 text-xs mb-7">Nos pondremos en contacto si fuera necesario.</p>
      <div className="flex gap-3">
        <button onClick={onCerrar} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 py-3 rounded-xl font-bold transition-all text-sm">
          Cancelar
        </button>
        <button onClick={onConfirmar} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm">
          <Check size={15} /> Confirmar
        </button>
      </div>
    </div>
  </div>
);

export default function PaginaAceptarPresupuesto() {
  const params = useParams();
  const id = params?.id;
  const [status, setStatus] = useState<"loading" | "success" | "error" | "rejected" | "view">("loading");
  const [verificando, setVerificando] = useState(false);
  const [confirmRechazar, setConfirmRechazar] = useState(false);

  useEffect(() => {
    if (id) setStatus("view");
  }, [id]);

  const procesarAccion = async (nuevoEstado: "Aceptado por el cliente" | "Rechazado") => {
    if (!id) return;
    setVerificando(true);
    try {
      const resDatos = await fetch(`/api/presupuestos/${id}`);
      if (!resDatos.ok) throw new Error("No se pudo obtener el presupuesto");
      const presupuestoActual = await resDatos.json();
      const res = await fetch(`/api/presupuestos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: nuevoEstado,
          articulos: nuevoEstado === "Aceptado por el cliente" ? presupuestoActual.articulos : []
        }),
      });
      if (res.ok) setStatus(nuevoEstado === "Rechazado" ? "rejected" : "success");
      else setStatus("error");
    } catch (error) {
      console.error("Error:", error);
      setStatus("error");
    } finally {
      setVerificando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1218] flex items-center justify-center p-4 font-sans text-white">
      <div className="max-w-md w-full bg-[#161b24] p-6 sm:p-10 rounded-[28px] sm:rounded-3xl border border-white/10 shadow-2xl text-center">

        {/* Logo */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <img src="/imagenes/logo_ajcar25.png" alt="AJCAR 25"
            className="w-12 h-12 rounded-2xl object-contain"
            onError={(e) => {
              const t = e.currentTarget;
              t.style.display = "none";
              const fallback = document.createElement("div");
              fallback.className = "w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white italic shadow-lg shadow-blue-500/20 text-sm";
              fallback.textContent = "AJ";
              t.parentNode?.appendChild(fallback);
            }}
          />
        </div>

        {/* VISTA INICIAL */}
        {status === "view" && (
          <div className="space-y-5 sm:space-y-6">
            <h1 className="text-lg sm:text-xl font-bold uppercase tracking-widest">Revisión de Presupuesto</h1>
            <p className="text-gray-400 text-sm mb-6 sm:mb-8 leading-relaxed">
              Por favor, seleccione una opción para continuar con su servicio en AJCAR 25.
            </p>
            <div className="flex flex-col gap-3 sm:gap-4">
              <button
                onClick={() => procesarAccion("Aceptado por el cliente")}
                disabled={verificando}
                className="w-full bg-emerald-600 text-white font-black py-5 sm:py-6 rounded-[20px] sm:rounded-[24px] uppercase text-[10px] sm:text-[11px] tracking-[0.2em] hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/20 disabled:opacity-60"
              >
                {verificando ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                Aceptar Presupuesto
              </button>
              <button
                onClick={() => setConfirmRechazar(true)}
                disabled={verificando}
                className="w-full bg-transparent border border-red-500/30 text-red-500 font-bold py-3.5 sm:py-4 rounded-[20px] sm:rounded-[24px] uppercase text-[9px] sm:text-[10px] tracking-[0.15em] hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <X size={15} /> Rechazar Presupuesto
              </button>
            </div>
          </div>
        )}

        {/* ÉXITO */}
        {status === "success" && (
          <div className="space-y-4 animate-in fade-in zoom-in">
            <CheckCircle className="text-green-500 mx-auto" size={56} />
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight">¡Presupuesto Aceptado!</h1>
            <p className="text-gray-400 text-sm leading-relaxed">El material ha sido reservado. Le avisaremos cuando su vehículo esté listo.</p>
          </div>
        )}

        {/* RECHAZADO */}
        {status === "rejected" && (
          <div className="space-y-4 animate-in fade-in zoom-in">
            <XCircle className="text-red-500 mx-auto" size={56} />
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight">Presupuesto Rechazado</h1>
            <p className="text-gray-400 text-sm leading-relaxed">Ha marcado el presupuesto como rechazado. Nos pondremos en contacto si es necesario.</p>
          </div>
        )}

        {/* ERROR */}
        {status === "error" && (
          <div className="space-y-4">
            <XCircle className="text-red-500 mx-auto" size={56} />
            <h1 className="text-xl sm:text-2xl font-black">Error</h1>
            <p className="text-gray-400 text-sm">Hubo un problema procesando su solicitud.</p>
          </div>
        )}

        <footer className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-white/5">
          <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">AJCAR 25 - Taller Mecánico</p>
        </footer>
      </div>

      {/* Modal confirmar rechazo */}
      {confirmRechazar && (
        <ModalConfirmar
          onConfirmar={() => { setConfirmRechazar(false); procesarAccion("Rechazado"); }}
          onCerrar={() => setConfirmRechazar(false)}
        />
      )}
    </div>
  );
}
