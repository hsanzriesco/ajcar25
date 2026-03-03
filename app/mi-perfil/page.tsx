"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Clock, Car, CheckCircle, LogOut, Phone, Calendar } from "lucide-react";

export default function ClientePanel() {
  const [name, setName] = useState("");
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (role !== "Cliente") router.push("/");
    setName(localStorage.getItem("user_name") || "Usuario");
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
    window.location.reload();
  };

  return (
    <main className="min-h-screen bg-[#1a1f2b] bg-gradient-to-b from-[#1a1f2b] to-[#0f1218] text-gray-200 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header - Bienvenida */}
        <div className="flex justify-between items-start border-b border-white/5 pb-6">
          <div>
            <h1 className="text-2xl text-gray-400">Bienvenido, <span className="text-white font-bold text-3xl">{name}</span></h1>
          </div>
          <div className="bg-black/30 p-4 rounded-xl border border-white/10 text-xs space-y-1">
            <p className="flex items-center gap-2"><Car size={14} className="text-blue-400" /> 1234-BCD</p>
            <p className="flex items-center gap-2 text-gray-400 font-medium">Audi A3 Negro</p>
            <p className="flex items-center gap-2 pt-1 border-t border-white/5 mt-1"><Calendar size={14} /> JJun 2020 : 612 345 678</p>
          </div>
        </div>

        {/* Estado de la Reparación */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-white">Estado de la Reparación</h2>
          <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
            <div className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-500 opacity-50">
              <Clock size={18} /> Pendiente
            </div>
            <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-900/40 to-blue-600/40 text-blue-300 rounded-md border border-blue-500/30 shadow-lg shadow-blue-900/20">
              <Car size={18} /> En reparación
            </div>
            <div className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-500 opacity-50">
              <CheckCircle size={18} /> Finalizado
            </div>
          </div>
        </section>

        {/* Fotos del coche */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-white">Fotos de su coche</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['ANTES', 'EN PROGRESO', 'DESPUÉS'].map((label, idx) => (
              <div key={label} className="bg-black/20 border border-white/10 rounded-lg overflow-hidden group">
                <div className="text-[10px] text-center py-2 bg-black/40 text-gray-400 font-bold tracking-widest">{label}</div>
                <div className="relative h-48 w-full grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500">
                  <Image 
                    src={`/imagenes/coche_${idx + 1}.png`} // Asegúrate de tener estas imágenes
                    alt={label}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Historial */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-white">Historial</h2>
          <div className="space-y-1">
            {[
              { date: '10 Jun 2020', text: 'Mañana se iniciará la reparación. Peritaje completo.' },
              { date: '11 Jun 2020', text: 'Progreso de la pintura y secado de la misma.' },
              { date: '15 Jun 2020', text: 'Montaje de las piezas delanteras para el acabado final.' },
              { date: '19 Jun 2020', text: 'Reparación finalizada.', active: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-black/20 border-b border-white/5 hover:bg-white/5 transition">
                <span className="text-xs text-gray-500 whitespace-nowrap">{item.date}</span>
                <p className={`text-sm ${item.active ? 'text-blue-400 font-medium' : 'text-gray-400'}`}>{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Botón Cerrar Sesión */}
        <div className="flex justify-end pt-6">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-8 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-red-900/20 hover:text-red-400 hover:border-red-900/50 transition-all duration-300 group"
          >
            <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
            Cerrar sesión
          </button>
        </div>

        {/* Footer Marca */}
        <div className="text-center pt-12 border-t border-white/5">
            <span className="text-2xl font-bold opacity-20 italic">Ajcar 25</span>
        </div>

      </div>
    </main>
  );
}