"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, Loader2, XCircle, Wrench, X } from "lucide-react";

export default function PaginaAceptarPresupuesto() {
  const params = useParams();
  const id = params?.id;
  // Añadimos el estado "rejected"
  const [status, setStatus] = useState<"loading" | "success" | "error" | "rejected" | "view">("loading");
  const [verificando, setVerificando] = useState(false);

  // 1. Efecto inicial para cargar los datos (Opcional, para mostrar botones)
  useEffect(() => {
    if (id) setStatus("view");
  }, [id]);

  // 2. FUNCIÓN PARA ACEPTAR
  const procesarAccion = async (nuevoEstado: "Aceptado por el cliente" | "Rechazado") => {
    if (!id) return;
    setVerificando(true);

    try {
      // Obtener datos para el stock si es aceptación
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

      if (res.ok) {
        setStatus(nuevoEstado === "Rechazado" ? "rejected" : "success");
      } else {
        setStatus("error");
      }
    } catch (error) {
      console.error("Error:", error);
      setStatus("error");
    } finally {
      setVerificando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1218] flex items-center justify-center p-4 font-sans text-white">
      <div className="max-w-md w-full bg-[#161b24] p-10 rounded-3xl border border-white/10 shadow-2xl text-center">
        
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white italic shadow-lg shadow-blue-500/20">
            AJ
          </div>
        </div>

        {/* ESTADO: VISTA INICIAL (BOTONES) */}
        {status === "view" && (
          <div className="space-y-6">
            <h1 className="text-xl font-bold uppercase tracking-widest">Revisión de Presupuesto</h1>
            <p className="text-gray-400 text-sm mb-8">Por favor, seleccione una opción para continuar con su servicio en AJCAR 25.</p>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => procesarAccion("Aceptado por el cliente")}
                disabled={verificando}
                className="w-full bg-emerald-600 text-white font-black py-6 rounded-[24px] uppercase text-[11px] tracking-[0.2em] hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/20"
              >
                {verificando ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                Aceptar Presupuesto
              </button>

              <button 
                onClick={() => {
                  if(confirm("¿Seguro que desea rechazar el presupuesto?")) procesarAccion("Rechazado")
                }}
                disabled={verificando}
                className="w-full bg-transparent border border-red-500/30 text-red-500 font-bold py-4 rounded-[24px] uppercase text-[10px] tracking-[0.15em] hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
              >
                <X size={16} />
                Rechazar Presupuesto
              </button>
            </div>
          </div>
        )}

        {/* ESTADO: ÉXITO ACEPTADO */}
        {status === "success" && (
          <div className="space-y-4 animate-in fade-in zoom-in">
            <CheckCircle className="text-green-500 mx-auto" size={64} />
            <h1 className="text-2xl font-black uppercase tracking-tight">¡Presupuesto Aceptado!</h1>
            <p className="text-gray-400 text-sm">El material ha sido reservado. Le avisaremos cuando su vehículo esté listo.</p>
          </div>
        )}

        {/* ESTADO: RECHAZADO */}
        {status === "rejected" && (
          <div className="space-y-4 animate-in fade-in zoom-in">
            <XCircle className="text-red-500 mx-auto" size={64} />
            <h1 className="text-2xl font-black uppercase tracking-tight">Presupuesto Rechazado</h1>
            <p className="text-gray-400 text-sm">Ha marcado el presupuesto como rechazado. Nos pondremos en contacto si es necesario.</p>
          </div>
        )}

        {/* ESTADO: ERROR */}
        {status === "error" && (
          <div className="space-y-4">
            <XCircle className="text-red-500 mx-auto" size={64} />
            <h1 className="text-2xl font-black">Error</h1>
            <p className="text-gray-400">Hubo un problema procesando su solicitud.</p>
          </div>
        )}

        <footer className="mt-10 pt-6 border-t border-white/5">
          <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">AJCAR 25 - Taller Mecánico</p>
        </footer>
      </div>
    </div>
  );
}