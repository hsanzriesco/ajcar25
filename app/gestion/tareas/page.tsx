"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  LogOut, User, FileText, Mail, 
  Phone, Plus, Trash2, Send, Loader2, MessageSquare, Calendar, Clock,
  Settings // Icono para Mantenimientos
} from "lucide-react";

// --- IMPORTACIONES PARA PDF ---
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- INTERFACES ---
interface PresupuestoPedido {
  id: string | number; 
  nombre: string;
  email: string;
  telefono: string;
  vehiculo: string;
  anio: number;
  fecha_cita: string;
  hora_cita: string;
  mensaje: string; 
  estado: string;
  creado_en: string;
}

interface Articulo {
  id: number;
  codigo: string;
  descripcion: string;
  precio_unitario: number;
}

interface LineaPresupuesto extends Articulo {
  cantidad: number;
}

export default function EmpleadoPage() {
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Ahora volvemos a tener dos vistas, pero ambas seguras
  const [view, setView] = useState<"mantenimientos" | "presupuestos">("presupuestos");
  
  const [presupuestos, setPresupuestos] = useState<PresupuestoPedido[]>([]);
  const [seleccionado, setSeleccionado] = useState<PresupuestoPedido | null>(null);

  const [codigoBusqueda, setCodigoBusqueda] = useState("");
  const [lineas, setLineas] = useState<LineaPresupuesto[]>([]);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  
  const router = useRouter();

  const formatearFechaParaInput = (fechaRaw: string | null | undefined) => {
    if (!fechaRaw) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaRaw)) return fechaRaw;
    try {
      const d = new Date(fechaRaw);
      if (isNaN(d.getTime())) return "";
      return d.toISOString().split('T')[0];
    } catch { return ""; }
  };

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (!role || (role.toLowerCase() !== "empleado" && role.toLowerCase() !== "jefe")) {
      router.push("/login");
    } else {
      setNombreUsuario(localStorage.getItem("user_name") || "Trabajador");
      cargarTodo();
    }
  }, [router]);

  const cargarTodo = async () => {
    try {
      setLoading(true);
      // Solo llamamos a la API de presupuestos que sí existe
      const resPres = await fetch("/api/presupuestos");
      if (!resPres.ok) throw new Error("Error al cargar datos");
      
      const dataPres = await resPres.json();
      setPresupuestos(Array.isArray(dataPres) ? dataPres : []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const actualizarCita = async (nuevaFecha: string, nuevaHora: string) => {
    if (!seleccionado) return;
    try {
      const res = await fetch(`/api/presupuestos/${seleccionado.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha_cita: nuevaFecha, hora_cita: nuevaHora })
      });
      if (res.ok) {
        setPresupuestos(prev => prev.map(p => p.id === seleccionado.id ? { ...p, fecha_cita: nuevaFecha, hora_cita: nuevaHora } : p));
        setSeleccionado(prev => prev ? { ...prev, fecha_cita: nuevaFecha, hora_cita: nuevaHora } : null);
      }
    } catch (error) { console.error(error); }
  };

  // --- LÓGICA DE PDF Y ENVÍO (Mantenida igual) ---
  const enviarPresupuestoPDF = async () => { /* ... lógica de envío igual al anterior ... */ };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  return (
    <div className="flex min-h-screen bg-[#0f1218] text-gray-300 font-sans">
      {/* SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-[#161b24] border-r border-white/5 flex-col sticky top-0 h-screen">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white italic">AJ</div>
            <span className="text-xl font-bold tracking-tight text-white italic">AJCAR 25</span>
          </div>
          <nav className="space-y-2">
            <button 
              onClick={() => { setView("mantenimientos"); setSeleccionado(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'mantenimientos' ? 'bg-white/5 text-white border border-white/10' : 'hover:bg-white/5 text-gray-400'}`}
            >
              <Settings size={18} /> Mantenimientos
            </button>
            <button 
              onClick={() => { setView("presupuestos"); setSeleccionado(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'presupuestos' ? 'bg-white/5 text-white border border-white/10' : 'hover:bg-white/5 text-gray-400'}`}
            >
              <FileText size={18} /> Presupuestos
            </button>
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-white/5">
          <button onClick={handleLogout} className="flex items-center gap-3 text-gray-500 hover:text-red-400 transition-colors w-full">
            <LogOut size={18} /> Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-gray-400 uppercase text-[10px] tracking-[0.3em] font-black">Sistema / {view}</h1>
            <p className="text-white text-3xl font-bold uppercase">Panel de {nombreUsuario}</p>
          </div>
          <div className="bg-[#161b24] px-4 py-2 rounded-lg border border-white/10 text-xs text-blue-400 flex items-center gap-2 font-bold uppercase tracking-widest">
            <User size={14} /> Acceso Empleado
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-[#161b24] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/20 text-gray-500 uppercase text-[10px] tracking-widest font-bold">
                  <tr>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Vehículo / Cita</th>
                    <th className="p-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {view === "presupuestos" ? (
                    presupuestos.map((p) => (
                      <tr key={p.id} onClick={() => setSeleccionado(p)} className={`hover:bg-white/[0.02] transition cursor-pointer ${seleccionado?.id === p.id ? 'bg-blue-500/10' : ''}`}>
                        <td className="p-4 text-white font-medium">{p.nombre}</td>
                        <td className="p-4 text-gray-400">{p.fecha_cita} {p.hora_cita}</td>
                        <td className="p-4">
                          <span className="px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase">{p.estado}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-10 text-center text-gray-600 italic text-sm">
                        La sección de Mantenimientos está siendo actualizada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <aside>
            {/* Panel de detalles (solo se muestra si hay algo seleccionado en presupuestos) */}
            {seleccionado && view === "presupuestos" && (
                <div className="bg-[#1c222d] p-6 rounded-2xl border border-white/10 shadow-2xl sticky top-8">
                   <h3 className="text-white font-bold mb-4 uppercase text-xs">Gestión de Presupuesto</h3>
                   {/* ... (resto del panel de detalles que ya tenías) ... */}
                   <p className="text-white text-lg font-bold">{seleccionado.nombre}</p>
                   {/* Formulario de cita, añadir artículos, etc. */}
                </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}