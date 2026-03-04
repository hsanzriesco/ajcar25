"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ClipboardList, Settings, LogOut, User, FileText, Mail, 
  Phone, Plus, Trash2, Send, Loader2 
} from "lucide-react";

// --- IMPORTACIONES PARA PDF ---
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- INTERFACES ---
interface Mantenimiento {
  id: string | number;
  cliente_nombre: string;
  modelo: string;
  matricula: string;
  estado: string;
  tipo_mantenimiento: string;
}

interface PresupuestoPedido {
  id: string; 
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
  const [view, setView] = useState<"tareas" | "presupuestos">("tareas");
  
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [presupuestos, setPresupuestos] = useState<PresupuestoPedido[]>([]);
  const [seleccionado, setSeleccionado] = useState<any>(null);

  const [codigoBusqueda, setCodigoBusqueda] = useState("");
  const [lineas, setLineas] = useState<LineaPresupuesto[]>([]);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (!role || (role.toLowerCase() !== "empleado" && role.toLowerCase() !== "jefe")) {
      router.push("/login");
    } else {
      setNombreUsuario(localStorage.getItem("user_name") || "Trabajador");
      cargarTodo();
    }
  }, [router, view]);

  const cargarTodo = async () => {
    try {
      const [resMant, resPres] = await Promise.all([
        fetch("/api/mantenimientos"),
        fetch("/api/presupuestos") 
      ]);
      if (!resMant.ok || !resPres.ok) throw new Error("Error en servidor al cargar datos");
      const dataMant = await resMant.json();
      const dataPres = await resPres.json();
      setMantenimientos(Array.isArray(dataMant) ? dataMant : []);
      setPresupuestos(Array.isArray(dataPres) ? dataPres : []);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const buscarYAñadirArticulo = async () => {
    if (!codigoBusqueda.trim()) return;
    try {
      const res = await fetch(`/api/articulos/${codigoBusqueda.toUpperCase().trim()}`);
      if (res.ok) {
        const articulo: Articulo = await res.json();
        setLineas(prev => {
          const existe = prev.find(item => item.codigo === articulo.codigo);
          if (existe) {
            return prev.map(item => item.codigo === articulo.codigo 
              ? { ...item, cantidad: item.cantidad + 1 } 
              : item
            );
          }
          return [...prev, { ...articulo, cantidad: 1 }];
        });
        setCodigoBusqueda("");
      } else {
        alert("El código no existe en la base de datos.");
      }
    } catch (error) {
      alert("Error al conectar con el inventario.");
    }
  };

  const totalPresupuesto = lineas.reduce((acc, item) => 
    acc + (Number(item.precio_unitario) * item.cantidad), 0
  );

  const enviarPresupuestoPDF = async () => {
    // 0. VERIFICACIÓN DE SEGURIDAD
    if (!seleccionado || !seleccionado.id) {
      console.error("Datos del seleccionado:", seleccionado);
      alert("Error: No se encuentra el ID del registro seleccionado.");
      return;
    }

    if (lineas.length === 0) {
      alert("Añade artículos antes de enviar.");
      return;
    }

    setEnviandoEmail(true);

    try {
      // 1. GENERAR PDF
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(30, 58, 138);
      doc.text("AJCAR 25 - PRESUPUESTO", 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 28);
      doc.setTextColor(0);
      doc.text(`Cliente: ${seleccionado.nombre || seleccionado.cliente_nombre}`, 14, 40);
      doc.text(`Vehículo: ${seleccionado.vehiculo || seleccionado.modelo}`, 14, 46);
      doc.text(`Email: ${seleccionado.email || 'Sin email'}`, 14, 52);

      autoTable(doc, {
        startY: 60,
        head: [['Código', 'Descripción', 'Cant.', 'P. Unit', 'Subtotal']],
        body: lineas.map(l => [
          l.codigo, 
          l.descripcion, 
          l.cantidad, 
          `${Number(l.precio_unitario).toFixed(2)}€`, 
          `${(l.cantidad * Number(l.precio_unitario)).toFixed(2)}€`
        ]),
        foot: [['', '', '', 'TOTAL (IVA Incl.)', `${totalPresupuesto.toFixed(2)}€`]],
        headStyles: { fillColor: [30, 58, 138] },
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
      });

      const pdfBase64 = doc.output('datauristring');

      // 2. ENVIAR EMAIL (IMPORTANTE: Se envía el ID explícitamente)
      console.log("Enviando presupuesto para ID:", seleccionado.id);

      const resEmail = await fetch("/api/enviar-presupuesto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: seleccionado.id, 
          email: seleccionado.email,
          nombre: seleccionado.nombre || seleccionado.cliente_nombre,
          vehiculo: seleccionado.vehiculo || seleccionado.modelo,
          total: totalPresupuesto.toFixed(2),
          pdfBase64
        })
      });

      if (!resEmail.ok) throw new Error("No se pudo enviar el email. Revisa la consola del servidor.");

      // 3. ACTUALIZAR ESTADO EN BD
      const idParaActualizar = seleccionado.id.toString().trim();
      const estadoFinal = "Presupuesto enviado";

      const resUpdate = await fetch(`/api/presupuestos/${idParaActualizar}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: estadoFinal })
      });

      if (!resUpdate.ok) {
        throw new Error("El email se envió pero no se pudo actualizar el estado en la base de datos.");
      }

      // Sincronizar UI
      setPresupuestos(prev => 
        prev.map(p => p.id === idParaActualizar ? { ...p, estado: estadoFinal } : p)
      );
      setSeleccionado((prev: any) => prev ? { ...prev, estado: estadoFinal } : null);
      
      alert("✅ Presupuesto enviado correctamente.");

    } catch (error: any) {
      console.error("ERROR EN PROCESO:", error);
      alert("❌ Error: " + error.message);
    } finally {
      setEnviandoEmail(false);
    }
  };

  const eliminarLinea = (index: number) => {
    setLineas(lineas.filter((_, i) => i !== index));
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
    setTimeout(() => window.location.reload(), 100);
  };

  function getEstadoColor(estado: string) {
    const e = estado?.toLowerCase() || "";
    if (e.includes('enviado') || e.includes('finalizado') || e.includes('aceptado')) 
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (e.includes('revisión') || e.includes('proceso') || e.includes('pendiente')) 
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0f1218] flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={48} />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#0f1218] text-gray-300 font-sans">
      <aside className="hidden md:flex w-64 bg-[#161b24] border-r border-white/5 flex-col sticky top-0 h-screen">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white italic">AJ</div>
            <span className="text-xl font-bold tracking-tight text-white italic">AJCAR 25</span>
          </div>
          <nav className="space-y-2">
            <button 
              onClick={() => { setView("tareas"); setSeleccionado(null); setLineas([]); }} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'tareas' ? 'bg-white/5 text-white border border-white/10' : 'hover:bg-white/5 text-gray-400'}`}
            >
              <ClipboardList size={18} /> Tareas
            </button>
            <button 
              onClick={() => { setView("presupuestos"); setSeleccionado(null); setLineas([]); }} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'presupuestos' ? 'bg-white/5 text-white border border-white/10' : 'hover:bg-white/5 text-gray-400'}`}
            >
              <FileText size={18} /> Presupuestos
            </button>
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-white/5">
          <button onClick={handleLogout} className="flex items-center gap-3 text-gray-500 hover:text-red-400 transition-colors w-full group">
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
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#161b24] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/20 text-gray-500 uppercase text-[10px] tracking-widest font-bold">
                  <tr>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">{view === "tareas" ? "Vehículo" : "Cita"}</th>
                    <th className="p-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {view === "tareas" ? (
                    mantenimientos.map((m) => (
                      <tr key={m.id} onClick={() => setSeleccionado(m)} className={`hover:bg-white/[0.02] transition cursor-pointer ${seleccionado?.id === m.id ? 'bg-blue-500/10' : ''}`}>
                        <td className="p-4 text-white font-medium">{m.cliente_nombre}</td>
                        <td className="p-4 text-gray-400">{m.modelo}</td>
                        <td className="p-4 text-xs">
                          <span className={`px-3 py-1 rounded-full border ${getEstadoColor(m.estado)}`}>{m.estado}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    presupuestos.map((p) => (
                      <tr key={p.id} onClick={() => { setSeleccionado(p); setLineas([]); }} className={`hover:bg-white/[0.02] transition cursor-pointer ${seleccionado?.id === p.id ? 'bg-blue-500/10' : ''}`}>
                        <td className="p-4 text-white font-medium">{p.nombre}</td>
                        <td className="p-4 text-gray-400">{p.fecha_cita}</td>
                        <td className="p-4 text-xs">
                          <span className={`px-3 py-1 rounded-full border ${getEstadoColor(p.estado)}`}>{p.estado}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-[#1c222d] p-6 rounded-2xl border border-white/10 shadow-2xl sticky top-8">
              {seleccionado ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-white font-bold mb-4 pb-2 border-b border-white/5 uppercase text-xs tracking-widest">Información</h3>
                    <p className="text-white text-lg font-bold">{view === "tareas" ? seleccionado.cliente_nombre : seleccionado.nombre}</p>
                    <div className="text-xs space-y-1 opacity-70 mt-2">
                      <p className="flex items-center gap-2"><Mail size={12}/> {seleccionado.email || 'Sin email'}</p>
                      {seleccionado.telefono && <p className="flex items-center gap-2"><Phone size={12}/> {seleccionado.telefono}</p>}
                    </div>
                  </div>

                  {view === "presupuestos" && (
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <h4 className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Añadir Artículos</h4>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={codigoBusqueda}
                          onChange={(e) => setCodigoBusqueda(e.target.value)}
                          placeholder="Código"
                          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
                        />
                        <button onClick={buscarYAñadirArticulo} className="bg-blue-600 hover:bg-blue-500 p-2 rounded-lg text-white">
                          <Plus size={16}/>
                        </button>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {lineas.map((item, idx) => (
                          <div key={idx} className="bg-black/20 border border-white/5 p-2 rounded-lg flex justify-between items-center group">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-blue-400 font-mono">{item.codigo}</span>
                              <span className="text-xs text-white truncate w-32">{item.descripcion}</span>
                              <span className="text-[10px] text-gray-500">{item.cantidad} x {Number(item.precio_unitario).toFixed(2)}€</span>
                            </div>
                            <button onClick={() => eliminarLinea(idx)} className="text-red-500/50 hover:text-red-500 transition-colors">
                              <Trash2 size={14}/>
                            </button>
                          </div>
                        ))}
                      </div>

                      {lineas.length > 0 && (
                        <div className="pt-4 border-t border-white/5">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-xs text-gray-400">Total IVA incl:</span>
                            <span className="text-xl font-black text-white">{totalPresupuesto.toFixed(2)}€</span>
                          </div>
                          <button 
                            onClick={enviarPresupuestoPDF}
                            disabled={enviandoEmail}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] tracking-widest uppercase disabled:opacity-50"
                          >
                            {enviandoEmail ? <Loader2 size={14} className="animate-spin"/> : <Send size={14} />}
                            {enviandoEmail ? "Enviando..." : "Enviar Presupuesto PDF"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-white/5">
                    <label className="text-[10px] text-gray-500 uppercase font-black block mb-2">Estado Actual</label>
                    <div className={`text-xs p-3 rounded-xl border ${getEstadoColor(seleccionado.estado)}`}>
                      {seleccionado.estado}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-gray-600 text-[10px] uppercase tracking-[0.2em]">
                  Selecciona una fila para gestionar
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}