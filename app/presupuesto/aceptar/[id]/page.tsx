"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, Loader2, XCircle, Wrench } from "lucide-react";

export default function PaginaAceptarPresupuesto() {
  const params = useParams();
  const id = params?.id;
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!id) return;

    const actualizarEstado = async () => {
      try {
        // Llamamos a tu API de presupuestos que ya arreglamos antes
        const res = await fetch(`/api/presupuestos/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: "Aceptado por el cliente" }),
        });

        if (res.ok) {
          setStatus("success");
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("Error al aceptar:", error);
        setStatus("error");
      }
    };

    actualizarEstado();
  }, [id]);

  return (
    <div className="min-h-screen bg-[#0f1218] flex items-center justify-center p-4 font-sans text-white">
      <div className="max-w-md w-full bg-[#161b24] p-10 rounded-3xl border border-white/10 shadow-2xl text-center">
        
        {/* LOGO O ICONO DEL TALLER */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white italic shadow-lg shadow-blue-500/20">
            AJ
          </div>
        </div>

        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="animate-spin text-blue-500 mx-auto" size={48} />
            <h1 className="text-xl font-bold uppercase tracking-widest">Procesando...</h1>
            <p className="text-gray-400 text-sm">Estamos registrando su aprobación en nuestro sistema.</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 animate-in fade-in zoom-in duration-500">
            <CheckCircle className="text-green-500 mx-auto" size={64} />
            <h1 className="text-2xl font-black uppercase tracking-tight">¡Presupuesto Aceptado!</h1>
            <p className="text-gray-400 leading-relaxed">
              Gracias por confiar en <span className="text-white font-bold">AJCAR 25</span>. 
              Hemos recibido su confirmación y comenzaremos con los trabajos programados.
            </p>
            <div className="pt-6">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-green-500 text-xs flex items-center gap-3">
                <Wrench size={16} />
                <span>Le avisaremos cuando su vehículo esté listo.</span>
              </div>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <XCircle className="text-red-500 mx-auto" size={64} />
            <h1 className="text-2xl font-black uppercase tracking-tight">Hubo un problema</h1>
            <p className="text-gray-400">
              No hemos podido procesar la aceptación automáticamente. 
              Por favor, contacte con el taller por teléfono o responda al correo.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 text-blue-400 text-sm underline underline-offset-4"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        <footer className="mt-10 pt-6 border-t border-white/5">
          <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">AJCAR 25 - Taller Mecánico</p>
        </footer>
      </div>
    </div>
  );
}