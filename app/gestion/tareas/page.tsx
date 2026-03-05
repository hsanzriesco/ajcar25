"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  LogOut, User, FileText, Mail, 
  Phone, Plus, Trash2, Send, Loader2, MessageSquare, Calendar, Clock 
} from "lucide-react";

// --- IMPORTACIONES PARA PDF ---

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
  const [presupuestos, setPresupuestos] = useState<PresupuestoPedido[]>([]);
  const [seleccionado, setSeleccionado] = useState<PresupuestoPedido | null>(null);

  const [codigoBusqueda, setCodigoBusqueda] = useState("");
  const [lineas, setLineas] = useState<LineaPresupuesto[]>([]);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  
  const router = useRouter();

  // --- FORMATEO DE FECHA ---
  const formatearFechaParaInput = (fechaRaw: string | null | undefined) => {
    if (!fechaRaw) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaRaw)) return fechaRaw;

    try {
      const d = new Date(fechaRaw);
      if (isNaN(d.getTime())) return "";
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return "";
    }
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
      const resPres = await fetch("/api/presupuestos");
      
      if (!resPres.ok) throw new Error("Error al cargar presupuestos");
      
      const dataPres = await resPres.json();
      setPresupuestos(Array.isArray(dataPres) ? dataPres : []);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const actualizarCita = async (nuevaFecha: string, nuevaHora: string) => {
    if (!seleccionado || !seleccionado.id) return;

    try {
      const res = await fetch(`/api/presupuestos/${seleccionado.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          fecha_cita: nuevaFecha,
          hora_cita: nuevaHora 
        })
      });

      if (!res.ok) throw new Error("No se pudo actualizar la cita");

      const idStr = seleccionado.id.toString();
      setPresupuestos(prev => prev.map(p => 
        p.id.toString() === idStr ? { ...p, fecha_cita: nuevaFecha, hora_cita: nuevaHora } : p
      ));
      setSeleccionado(prev => prev ? { ...prev, fecha_cita: nuevaFecha, hora_cita: nuevaHora } : null);

    } catch (error) {
      console.error("Error al actualizar cita:", error);
      alert("Error al guardar el cambio de cita");
    }
  };

  const buscarYAñadirArticulo = async () => {
    const codigoLimpio = codigoBusqueda.toUpperCase().trim();
    if (!codigoLimpio) return;
    
    try {
      const res = await fetch(`/api/articulos/${codigoLimpio}`);
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
        alert("El código no existe en el inventario.");
      }
    } catch (error) {
      alert("Error al conectar con el inventario.");
    }
  };

  const totalPresupuesto = lineas.reduce((acc, item) => 
    acc + (Number(item.precio_unitario) * item.cantidad), 0
  );

  const enviarPresupuestoPDF = async () => {
    if (!seleccionado) return;
    setEnviandoEmail(true);

    try {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(30, 58, 138);
      doc.text("AJCAR 25 - PRESUPUESTO", 14, 20);
      doc.setFontSize(10);
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 28);
      doc.text(`Cliente: ${seleccionado.nombre}`, 14, 40);
      doc.text(`Vehículo: ${seleccionado.vehiculo}`, 14, 46);

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
      });

      const pdfBase64 = doc.output('datauristring');

      const resEmail = await fetch("/api/enviar-presupuesto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: seleccionado.id, 
          email: seleccionado.email,
          nombre: seleccionado.nombre,
          vehiculo: seleccionado.vehiculo,
          total: totalPresupuesto.toFixed(2),
          pdfBase64
        })
      });

      if (!resEmail.ok) throw new Error("Error al enviar el correo.");

      const estadoFinal = "Presupuesto enviado";
      await fetch(`/api/presupuestos/${seleccionado.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: estadoFinal })
      });

      setPresupuestos(prev => prev.map(p => p.id === seleccionado.id ? { ...p, estado: estadoFinal } : p));
      setSeleccionado(prev => prev ? { ...prev, estado: estadoFinal } : null);
      alert("✅ Presupuesto enviado con éxito.");
      setLineas([]);
    } catch (error: any) {
      alert("❌ " + error.message);
    } finally {
      setEnviandoEmail(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  function getEstadoColor(estado: string) {
    const e = estado?.toLowerCase() || "";
    if (e.includes('enviado') || e.includes('aceptado')) return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (e.includes('pendiente')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0f1218] flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={48} />
    </div>
  );

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
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 text-white border border-white/10">
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
            <h1 className="text-gray-400 uppercase text-[10px] tracking-[0.3em] font-black">Sistema / Gestión</h1>
            <p className="text-white text-3xl font-bold uppercase">Panel de {nombreUsuario}</p>
          </div>
          <div className="bg-[#161b24] px-4 py-2 rounded-lg border border-white/10 text-xs text-blue-400 flex items-center gap-2 font-bold uppercase tracking-widest">
            <User size={14} /> Acceso Empleado
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* TABLA DE PRESUPUESTOS */}
          <div className="lg:col-span-2">
            <div className="bg-[#161b24] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/20 text-gray-500 uppercase text-[10px] tracking-widest font-bold">
                  <tr>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Cita Programada</th>
                    <th className="p-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {presupuestos.map((p) => (
                    <tr key={p.id} onClick={() => { setSeleccionado(p); setLineas([]); }} className={`hover:bg-white/[0.02] transition cursor-pointer ${seleccionado?.id === p.id ? 'bg-blue-500/10' : ''}`}>
                      <td className="p-4 text-white font-medium">{p.nombre}</td>
                      <td className="p-4 text-gray-400">{p.fecha_cita || 'Pendiente'} {p.hora_cita}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full border text-[10px] uppercase font-bold ${getEstadoColor(p.estado)}`}>{p.estado}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {presupuestos.length === 0 && <div className="p-10 text-center text-gray-600 italic text-sm">No hay presupuestos pendientes.</div>}
            </div>
          </div>

          {/* PANEL DE GESTIÓN */}
          <aside>
            <div className="bg-[#1c222d] p-6 rounded-2xl border border-white/10 shadow-2xl sticky top-8">
              {seleccionado ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-white font-bold mb-4 pb-2 border-b border-white/5 uppercase text-xs tracking-widest">Detalles del Pedido</h3>
                    <p className="text-white text-lg font-bold">{seleccionado.nombre}</p>
                    <div className="text-xs space-y-1 opacity-70 mt-2">
                      <p className="flex items-center gap-2"><Mail size={12}/> {seleccionado.email}</p>
                      <p className="flex items-center gap-2"><Phone size={12}/> {seleccionado.telefono}</p>
                    </div>
                  </div>

                  {seleccionado.mensaje && (
                    <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl">
                      <h4 className="text-[10px] text-blue-400 font-black uppercase mb-2 flex items-center gap-2"><MessageSquare size={12} /> Nota</h4>
                      <p className="text-xs text-gray-300 italic">"{seleccionado.mensaje}"</p>
                    </div>
                  ) || (
                    <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl">
                      <h4 className="text-[10px] text-blue-400 font-black uppercase mb-2 flex items-center gap-2"><MessageSquare size={12} /> Vehículo</h4>
                      <p className="text-xs text-gray-300 italic">{seleccionado.vehiculo}</p>
                    </div>
                  )}

                  <div className="space-y-3 pt-4 border-t border-white/5">
                    <h4 className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Programar Cita</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" value={formatearFechaParaInput(seleccionado.fecha_cita)} onChange={(e) => actualizarCita(e.target.value, seleccionado.hora_cita)} className="bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white" />
                      <input type="time" value={seleccionado.hora_cita || ""} onChange={(e) => actualizarCita(seleccionado.fecha_cita, e.target.value)} className="bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white" />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <h4 className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Artículos del Presupuesto</h4>
                    <div className="flex gap-2">
                      <input type="text" value={codigoBusqueda} onChange={(e) => setCodigoBusqueda(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && buscarYAñadirArticulo()} placeholder="Código de artículo" className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs" />
                      <button onClick={buscarYAñadirArticulo} className="bg-blue-600 p-2 rounded-lg text-white"><Plus size={16}/></button>
                    </div>
                    
                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                      {lineas.map((item, idx) => (
                        <div key={idx} className="bg-black/20 p-2 rounded-lg flex justify-between items-center">
                          <div className="flex flex-col text-[10px]">
                            <span className="text-blue-400 font-mono">{item.codigo}</span>
                            <span className="text-white">{item.descripcion}</span>
                          </div>
                          <button onClick={() => setLineas(lineas.filter((_, i) => i !== idx))} className="text-red-500/50 hover:text-red-500"><Trash2 size={14}/></button>
                        </div>
                      ))}
                    </div>

                    {lineas.length > 0 && (
                      <button onClick={enviarPresupuestoPDF} disabled={enviandoEmail} className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase">
                        {enviandoEmail ? <Loader2 size={14} className="animate-spin"/> : <Send size={14} />} Enviar PDF al Cliente
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-gray-600 text-[10px] uppercase tracking-[0.2em]">Selecciona un presupuesto</div>
              )}
            </div>
          </aside>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.5); border-radius: 10px; }
      `}</style>
    </div>
  );
}