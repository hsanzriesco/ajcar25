"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Calendar, 
  ClipboardList, 
  Settings, 
  LogOut, 
  AlertCircle,
  Wrench,
  CheckCircle2,
  User,
  FileText,
  Mail,
  Phone
} from "lucide-react";

// Interfaces para tipar los datos de tu DB
interface Mantenimiento {
  id: number;
  cliente_nombre: string;
  modelo: string;
  matricula: string;
  estado: string;
  tipo_mantenimiento: string;
}

interface PresupuestoPedido {
  id: number;
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

export default function EmpleadoPage() {
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"tareas" | "presupuestos">("tareas");
  
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [presupuestos, setPresupuestos] = useState<PresupuestoPedido[]>([]);
  const [seleccionado, setSeleccionado] = useState<any>(null);
  
  const router = useRouter();

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
      // LLAMADA CORREGIDA: Usamos /api/presupuestos que es tu ruta real
      const [resMant, resPres] = await Promise.all([
        fetch("/api/mantenimientos"),
        fetch("/api/presupuestos") 
      ]);

      // Verificamos si las respuestas son correctas antes de parsear JSON
      if (!resMant.ok || !resPres.ok) {
        throw new Error("Error en la respuesta del servidor");
      }

      const dataMant = await resMant.json();
      const dataPres = await resPres.json();
      
      setMantenimientos(Array.isArray(dataMant) ? dataMant : []);
      setPresupuestos(Array.isArray(dataPres) ? dataPres : []);
      
      // Selección inicial por defecto
      if (view === "tareas" && dataMant.length > 0) {
        setSeleccionado(dataMant[0]);
      } else if (view === "presupuestos" && dataPres.length > 0) {
        setSeleccionado(dataPres[0]);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
    setTimeout(() => window.location.reload(), 100);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f1218] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#0f1218] text-gray-300 font-sans">
      
      {/* SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-[#161b24] border-r border-white/5 flex-col sticky top-0 h-screen">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white italic shadow-lg shadow-blue-900/20">AJ</div>
            <span className="text-xl font-bold tracking-tight text-white italic">AJCAR 25</span>
          </div>

          <nav className="space-y-2">
            <button 
              onClick={() => { setView("tareas"); setSeleccionado(mantenimientos[0] || null); }} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'tareas' ? 'bg-white/5 text-white border border-white/10' : 'hover:bg-white/5 text-gray-400'}`}
            >
              <ClipboardList size={18} className={view === 'tareas' ? 'text-blue-400' : ''} /> Tareas
            </button>
            
            <button 
              onClick={() => { setView("presupuestos"); setSeleccionado(presupuestos[0] || null); }} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'presupuestos' ? 'bg-white/5 text-white border border-white/10' : 'hover:bg-white/5 text-gray-400'}`}
            >
              <FileText size={18} className={view === 'presupuestos' ? 'text-blue-400' : ''} /> Presupuestos
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition text-gray-400">
              <Settings size={18} /> Ajustes
            </button>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-white/5">
          <button onClick={handleLogout} className="flex items-center gap-3 text-gray-500 hover:text-red-400 transition-colors w-full group">
            <LogOut size={18} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-gray-400 uppercase text-[10px] tracking-[0.3em] font-black">Sistema de Gestión / {view}</h1>
            <p className="text-white text-3xl font-bold">Bienvenido, {nombreUsuario}</p>
          </div>
          <div className="bg-[#161b24] px-4 py-2 rounded-lg border border-white/10 text-xs text-blue-400 flex items-center gap-2 font-bold">
            <User size={14} /> MODO EMPLEADO
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* TABLA PRINCIPAL */}
          <div className="lg:col-span-2">
            <div className="bg-[#161b24] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                <h3 className="font-bold text-white flex items-center gap-2 uppercase text-xs tracking-widest">
                  {view === "tareas" ? <ClipboardList size={18} className="text-blue-400" /> : <FileText size={18} className="text-blue-400" />}
                  Listado de {view}
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/20 text-gray-500 uppercase text-[10px] tracking-widest font-bold">
                    <tr>
                      <th className="p-4">Cliente</th>
                      <th className="p-4">{view === "tareas" ? "Vehículo" : "Cita"}</th>
                      <th className="p-4">{view === "tareas" ? "Tipo" : "Vehículo"}</th>
                      <th className="p-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {view === "tareas" ? (
                      mantenimientos.map((m) => (
                        <tr key={m.id} onClick={() => setSeleccionado(m)} className={`hover:bg-white/[0.02] transition cursor-pointer ${seleccionado?.id === m.id ? 'bg-blue-500/5' : ''}`}>
                          <td className="p-4 text-white font-medium">{m.cliente_nombre}</td>
                          <td className="p-4 text-gray-400">{m.modelo}</td>
                          <td className="p-4 text-gray-400">{m.tipo_mantenimiento}</td>
                          <td className="p-4 text-xs">
                            <span className={`px-3 py-1 rounded-full border ${getEstadoColor(m.estado)}`}>{m.estado}</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      presupuestos.map((p) => (
                        <tr key={p.id} onClick={() => setSeleccionado(p)} className={`hover:bg-white/[0.02] transition cursor-pointer ${seleccionado?.id === p.id ? 'bg-blue-500/5' : ''}`}>
                          <td className="p-4 text-white font-medium">{p.nombre}</td>
                          <td className="p-4 text-gray-400">{p.fecha_cita} <span className="text-[10px] opacity-50">{p.hora_cita}</span></td>
                          <td className="p-4 text-gray-400">{p.vehiculo} ({p.anio})</td>
                          <td className="p-4 text-xs">
                            <span className={`px-3 py-1 rounded-full border ${getEstadoColor(p.estado)}`}>{p.estado}</span>
                          </td>
                        </tr>
                      ))
                    )}
                    {((view === "tareas" && mantenimientos.length === 0) || (view === "presupuestos" && presupuestos.length === 0)) && (
                      <tr>
                        <td colSpan={4} className="p-10 text-center text-gray-500 italic">No hay datos disponibles en esta sección</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* PANEL DE DETALLES (LADO DERECHO) */}
          <aside className="space-y-6">
            <div className="bg-[#1c222d] p-6 rounded-2xl border border-white/10 shadow-2xl">
              <h3 className="text-white font-bold mb-6 pb-4 border-b border-white/5 flex items-center gap-2 text-sm uppercase tracking-widest">
                 Información Detallada
              </h3>
              
              {seleccionado ? (
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest block mb-1">Cliente</label>
                    <p className="text-white text-lg font-bold">{view === "tareas" ? seleccionado.cliente_nombre : seleccionado.nombre}</p>
                    {view === "presupuestos" && (
                      <div className="flex flex-col gap-1 mt-2">
                        <span className="flex items-center gap-2 text-xs text-blue-400 font-medium"><Mail size={12}/> {seleccionado.email}</span>
                        <span className="flex items-center gap-2 text-xs text-blue-400 font-medium"><Phone size={12}/> {seleccionado.telefono}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest block mb-1">Vehículo Relacionado</label>
                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                      <p className="text-white font-medium">{view === "tareas" ? seleccionado.modelo : seleccionado.vehiculo}</p>
                      <p className="text-[10px] text-gray-500 font-mono uppercase tracking-tighter">
                        {view === "tareas" ? seleccionado.matricula : `Año: ${seleccionado.anio}`}
                      </p>
                    </div>
                  </div>

                  {view === "presupuestos" && (
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest block mb-1">Mensaje del Cliente</label>
                      <p className="text-xs text-gray-400 bg-black/30 p-3 rounded-lg border border-white/5 italic leading-relaxed">
                        "{seleccionado.mensaje || "Sin mensaje adicional"}"
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest block mb-1">Cambiar Estado</label>
                    <select 
                      defaultValue={seleccionado.estado}
                      className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="Pendiente" className="bg-[#1c222d]">Pendiente</option>
                      <option value="En Revisión" className="bg-[#1c222d]">En Revisión</option>
                      <option value="Finalizado" className="bg-[#1c222d]">Finalizado / Aceptado</option>
                    </select>
                  </div>

                  <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all uppercase text-[10px] tracking-[0.2em]">
                    Guardar Cambios
                  </button>
                </div>
              ) : (
                <div className="text-center py-20 text-gray-600 text-xs uppercase tracking-widest">
                  Selecciona un elemento para gestionar
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function getEstadoColor(estado: string) {
  const e = estado?.toLowerCase() || "";
  if (e.includes('finalizado') || e.includes('aceptado')) return 'bg-green-500/10 text-green-500 border-green-500/20';
  if (e.includes('revisión') || e.includes('reparación') || e.includes('proceso')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
}