"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Mail,
  Phone,
  Plus,
  Trash2,
  Send,
  Loader2,
  Car,
  Search,
  CheckCircle,
  Printer,
  MessageSquare,
  Wrench,
  X,
  FilePlus2,
  UserPlus
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- INTERFACES ---
interface Articulo {
  id: number;
  codigo: string;
  descripcion: string;
  precio_unitario: number;
  stock: number;
  stock_reservado: number;
}

interface LineaPresupuesto extends Articulo {
  cantidad: number;
}

interface PresupuestoPedido {
  id: string;
  nombre: string;
  apellidos: string; // AÑADIDO
  email: string;
  telefono: string;
  vehiculo: string;
  anio: number;
  fecha_cita: string;
  hora_cita: string;
  mensaje: string;
  estado: string;
  creado_en: string;
  articulos: LineaPresupuesto[];
}

export default function EmpleadoPage() {
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"mantenimientos" | "presupuestos" | "aceptados" | "stock" | "facturas">("presupuestos");

  const [presupuestos, setPresupuestos] = useState<PresupuestoPedido[]>([]);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [seleccionado, setSeleccionado] = useState<PresupuestoPedido | null>(null);

  const [codigoBusqueda, setCodigoBusqueda] = useState("");
  const [filtroStock, setFiltroStock] = useState("");
  const [lineas, setLineas] = useState<LineaPresupuesto[]>([]);
  const [enviandoEmail, setEnviandoEmail] = useState(false);

  const [facturando, setFacturando] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [facturas, setFacturas] = useState<any[]>([]);

  // --- ESTADOS PARA NUEVO PRESUPUESTO Y VERIFICACIÓN ---
  const [showNuevoPresupuesto, setShowNuevoPresupuesto] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    apellidos: "", // AÑADIDO
    email: "",
    telefono: "",
    vehiculo: "",
    anio: new Date().getFullYear(),
    mensaje: ""
  });

  const router = useRouter();

  const formatearFechaParaInput = (fechaRaw: string | null | undefined) => {
    if (!fechaRaw) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaRaw)) return fechaRaw;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaRaw)) {
      const [dia, mes, año] = fechaRaw.split('/');
      return `${año}-${mes}-${dia}`;
    }
    return "";
  };

  const cargarTodo = useCallback(async () => {
    setLoading(true);
    try {
      const [resPres, resArt, resFac] = await Promise.all([
        fetch("/api/presupuestos"),
        fetch("/api/articulos"),
        fetch("/api/facturas")
      ]);

      if (resPres.ok) setPresupuestos(await resPres.json());
      if (resArt.ok) setArticulos(await resArt.json());
      if (resFac.ok) setFacturas(await resFac.json());
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (!role) {
      router.push("/login");
    } else {
      setNombreUsuario(localStorage.getItem("user_name") || "Trabajador");
      cargarTodo();
    }
  }, [router, cargarTodo]);

  // --- LÓGICA DE VERIFICACIÓN Y CREACIÓN ---
  const manejarCreacionPresupuesto = async () => {
    if (!nuevoCliente.nombre || !nuevoCliente.apellidos || !nuevoCliente.vehiculo) {
      alert("Nombre, Apellidos y Vehículo son obligatorios.");
      return;
    }

    setVerificando(true);

    try {
      // 1. Verificar si el usuario existe
      const res = await fetch(`/api/usuarios/verificar?nombre=${nuevoCliente.nombre}&apellidos=${nuevoCliente.apellidos}`);
      const data = await res.json();

      if (!data.existe) {
        const confirmar = confirm(`El usuario "${nuevoCliente.nombre} ${nuevoCliente.apellidos}" no existe en la base de datos. ¿Desearía crear el usuario?`);
        if (!confirmar) {
          setVerificando(false);
          return;
        }
        // Aquí podrías añadir una llamada opcional para registrar al usuario en tu DB de clientes
      }

      // 2. Crear el presupuesto (Mockup/Local)
      const mockup: PresupuestoPedido = {
        id: "MANUAL-" + Date.now(),
        ...nuevoCliente,
        fecha_cita: new Date().toISOString().split('T')[0],
        hora_cita: "10:00",
        estado: "Pendiente",
        creado_en: new Date().toISOString(),
        articulos: []
      };

      setPresupuestos([mockup, ...presupuestos]);
      setSeleccionado(mockup);
      setLineas([]);
      setShowNuevoPresupuesto(false);
      setView("presupuestos");

    } catch (error) {
      alert("Error al verificar el usuario.");
    } finally {
      setVerificando(false);
    }
  };

  const cambiarEstado = async (id: string, nuevoEstado: string) => {
    setCambiandoEstado(true);
    try {
      const res = await fetch(`/api/presupuestos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (res.ok) {
        await cargarTodo();
        setSeleccionado(null);
      }
    } catch (e) {
      alert("Error al actualizar el estado");
    } finally {
      setCambiandoEstado(false);
    }
  };

  const buscarYAñadirArticulo = async () => {
    const cod = codigoBusqueda.toUpperCase().trim();
    if (!cod) return;
    try {
      const res = await fetch(`/api/articulos/${cod}`);
      if (res.ok) {
        const art: Articulo = await res.json();
        setLineas(prev => {
          const existe = prev.find(item => item.codigo === art.codigo);
          if (existe) {
            return prev.map(item => item.codigo === art.codigo ? { ...item, cantidad: item.cantidad + 1 } : item);
          }
          return [...prev, { ...art, cantidad: 1 }];
        });
        setCodigoBusqueda("");
      } else {
        alert("Artículo no encontrado");
      }
    } catch (e) { console.error(e); }
  };

  const totalPresupuesto = lineas.reduce((acc, item) => acc + (Number(item.precio_unitario) * item.cantidad), 0);

  const enviarPresupuestoPDF = async () => {
    if (!seleccionado || lineas.length === 0) return;
    setEnviandoEmail(true);
    try {
      const doc = new jsPDF();
      doc.text("AJCAR 25 - PRESUPUESTO", 14, 20);
      autoTable(doc, {
        startY: 45,
        head: [['Ref', 'Descripción', 'Cant', 'Precio', 'Total']],
        body: lineas.map(l => [l.codigo, l.descripcion, l.cantidad, `${Number(l.precio_unitario).toFixed(2)}€`, `${(l.cantidad * Number(l.precio_unitario)).toFixed(2)}€`]),
      });
      const pdfBase64 = doc.output('datauristring');
      const res = await fetch("/api/enviar-presupuesto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            id: seleccionado.id, 
            email: seleccionado.email, 
            nombre: `${seleccionado.nombre} ${seleccionado.apellidos}`, 
            vehiculo: seleccionado.vehiculo, 
            total: totalPresupuesto.toFixed(2), 
            pdfBase64, 
            articulos: lineas 
        })
      });
      if (res.ok) {
        alert("Enviado con éxito.");
        await cargarTodo();
        setSeleccionado(null);
      }
    } catch (e) { alert("Error al enviar"); } finally { setEnviandoEmail(false); }
  };

  const procesarFactura = async () => {
    const articulosAFacturar = (view === "mantenimientos" || view === "aceptados") ? seleccionado?.articulos : lineas;
    if (!seleccionado || !articulosAFacturar) return;
    setFacturando(true);
    try {
      const res = await fetch("/api/facturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            presupuesto_id: seleccionado.id, 
            cliente_nombre: `${seleccionado.nombre} ${seleccionado.apellidos}`, 
            email: seleccionado.email, 
            vehiculo: seleccionado.vehiculo, 
            total: totalPresupuesto, 
            articulos: articulosAFacturar 
        })
      });
      if (res.ok) { alert("Factura generada"); await cargarTodo(); setSeleccionado(null); }
    } catch (e) { console.error(e); } finally { setFacturando(false); }
  };

  const verPDFFactura = (f: any) => {
    const doc = new jsPDF();
    doc.text(`FACTURA ${f.numero_factura}`, 14, 20);
    const blob = doc.output('blob');
    window.open(URL.createObjectURL(blob), '_blank');
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
        setSeleccionado({ ...seleccionado, fecha_cita: nuevaFecha, hora_cita: nuevaHora });
      }
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => { localStorage.clear(); router.push("/"); };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-gray-400 font-sans selection:bg-blue-500/30">
      <main className="w-full flex flex-col min-h-screen">
        <div className="p-8 lg:p-16 max-w-7xl w-full mx-auto">
          
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic shadow-lg shadow-blue-900/20">AJ</div>
                 <div>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-none mb-1">{nombreUsuario}</p>
                    <p className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter">Panel de Gestión</p>
                 </div>
              </div>
              <h1 className="text-white text-5xl lg:text-7xl font-black italic tracking-tighter uppercase leading-none">
                {view === 'presupuestos' && "Presupuestos"}
                {view === 'aceptados' && "Aceptados"}
                {view === 'mantenimientos' && "Taller"}
                {view === 'stock' && "Almacén"}
                {view === 'facturas' && "Facturas"}
              </h1>
            </div>

            <nav className="flex items-center gap-1 bg-white/[0.03] p-1.5 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-md">
                {[
                  { id: 'presupuestos', label: 'Nuevos' },
                  { id: 'aceptados', label: 'Aceptados' },
                  { id: 'mantenimientos', label: 'Taller' },
                  { id: 'stock', label: 'Stock' },
                  { id: 'facturas', label: 'Facturas' }
                ].map((v) => (
                    <button 
                        key={v.id}
                        onClick={() => { setView(v.id as any); setSeleccionado(null); }}
                        className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${view === v.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        {v.label}
                    </button>
                ))}
                
                <button 
                  onClick={() => setShowNuevoPresupuesto(true)}
                  className="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-blue-400 hover:bg-blue-600/10 transition-all flex items-center gap-2 border border-blue-500/20 ml-1"
                >
                  <FilePlus2 size={14} />
                  Crear
                </button>

                <div className="w-px h-4 bg-white/10 mx-2" />
                
                <button onClick={handleLogout} className="p-2.5 text-red-500/80 hover:text-red-400 hover:bg-red-500/5 rounded-2xl transition-all">
                    <LogOut size={18} />
                </button>
            </nav>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-7 space-y-6">
              {loading ? (
                <div className="h-[400px] flex flex-col items-center justify-center space-y-6 bg-[#0f0f12] rounded-[40px] border border-white/5">
                  <Loader2 className="animate-spin text-blue-600" size={48} />
                </div>
              ) : view === "stock" ? (
                <div className="bg-[#0f0f12] rounded-[40px] border border-white/5 overflow-hidden">
                    <div className="p-8 border-b border-white/5 flex gap-4">
                        <div className="flex-1 bg-white/5 rounded-2xl flex items-center px-6 border border-white/5">
                            <Search size={16} className="text-gray-600 mr-4" />
                            <input type="text" value={filtroStock} onChange={(e) => setFiltroStock(e.target.value)} placeholder="Filtrar stock..." className="bg-transparent border-none focus:ring-0 text-xs text-white w-full py-4" />
                        </div>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-black/20 text-[10px] font-black uppercase tracking-widest text-gray-500">
                            <tr><th className="p-8">Referencia</th><th className="p-8">Descripción</th><th className="p-8 text-center">Stock</th></tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {articulos.filter(a => a.codigo.includes(filtroStock.toUpperCase())).map(art => (
                                <tr key={art.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-8 font-mono text-blue-400">{art.codigo}</td>
                                    <td className="p-8 text-gray-300 uppercase text-xs">{art.descripcion}</td>
                                    <td className="p-8 text-center font-black text-white">{art.stock}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              ) : view === "facturas" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {facturas.map(f => (
                    <div key={f.id} className="bg-[#0f0f12] border border-white/5 p-8 rounded-[32px] hover:border-white/10 transition-all">
                      <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl"><CheckCircle size={20} /></div>
                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{f.numero_factura}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-black uppercase mb-1">{f.vehiculo}</p>
                      <h3 className="text-white font-black italic uppercase text-lg mb-4">{f.cliente_nombre}</h3>
                      <div className="flex justify-between items-center pt-6 border-t border-white/5">
                        <span className="text-2xl font-black text-green-500 italic">{f.total}€</span>
                        <button onClick={() => verPDFFactura(f)} className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all">
                          <Printer size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {presupuestos
                    .filter(p => {
                      if (view === "presupuestos") return p.estado === "Pendiente" || p.estado === "Enviado";
                      if (view === "aceptados") return p.estado === "Aceptado por el cliente";
                      if (view === "mantenimientos") return p.estado === "En Taller";
                      return true;
                    })
                    .map(p => (
                      <div
                        key={p.id}
                        onClick={() => { setSeleccionado(p); setLineas(p.articulos || []); }}
                        className={`group p-8 rounded-[40px] border transition-all duration-500 cursor-pointer ${seleccionado?.id === p.id ? 'bg-blue-600 border-blue-500 shadow-2xl shadow-blue-900/40 translate-y-[-4px]' : 'bg-[#0f0f12] border-white/5 hover:border-white/10'}`}
                      >
                         <div className="flex flex-col h-full justify-between gap-10">
                          <div className="flex justify-between items-start">
                            <div className={`p-4 rounded-[20px] ${seleccionado?.id === p.id ? 'bg-white/10 text-white' : 'bg-blue-500/10 text-blue-500'}`}><Car size={24} /></div>
                            <div className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full ${seleccionado?.id === p.id ? 'bg-black/20 text-white' : 'bg-white/5 text-gray-500'}`}>{p.estado}</div>
                          </div>
                          <div>
                            <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${seleccionado?.id === p.id ? 'text-blue-100/60' : 'text-gray-500'}`}>{p.vehiculo} • {p.anio}</p>
                            <h3 className={`text-2xl font-black italic tracking-tighter uppercase leading-none ${seleccionado?.id === p.id ? 'text-white' : 'text-gray-200'}`}>{p.nombre} {p.apellidos}</h3>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <aside className="lg:col-span-5 sticky top-8">
              <div className="bg-[#0f0f12] rounded-[48px] border border-white/5 overflow-hidden shadow-2xl min-h-[500px]">
                {seleccionado ? (
                  <div className="flex flex-col p-10 space-y-8 animate-in fade-in slide-in-from-right-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Expediente Seleccionado</span>
                      <button onClick={() => setSeleccionado(null)} className="text-gray-600 hover:text-white transition-colors"><X size={20} /></button>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-3xl font-black italic uppercase text-white leading-none">{seleccionado.nombre} {seleccionado.apellidos}</h3>
                      <div className="flex flex-wrap gap-4">
                        <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1"><Mail size={12}/>{seleccionado.email}</span>
                        <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1"><Phone size={12}/>{seleccionado.telefono}</span>
                      </div>
                    </div>

                    <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-[32px] relative">
                      <MessageSquare className="absolute top-4 right-4 text-amber-500/20" size={24} />
                      <p className="text-[9px] font-black uppercase text-amber-500/60 mb-2 tracking-widest">Avería / Notas:</p>
                      <p className="text-sm text-amber-200/90 italic font-medium leading-relaxed">"{seleccionado.mensaje || "Sin descripción"}"</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[9px] font-black uppercase text-gray-500 mb-1">Cita</p>
                        <input type="date" value={formatearFechaParaInput(seleccionado.fecha_cita)} onChange={(e) => actualizarCita(e.target.value, seleccionado.hora_cita)} className="bg-transparent border-none p-0 text-white text-xs font-bold w-full outline-none" />
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[9px] font-black uppercase text-gray-500 mb-1">Hora</p>
                        <input type="time" value={seleccionado.hora_cita} onChange={(e) => actualizarCita(seleccionado.fecha_cita, e.target.value)} className="bg-transparent border-none p-0 text-white text-xs font-bold w-full outline-none" />
                      </div>
                    </div>

                    {view === "presupuestos" && (
                      <div className="space-y-6">
                        <div className="flex gap-2">
                          <input value={codigoBusqueda} onChange={(e) => setCodigoBusqueda(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && buscarYAñadirArticulo()} placeholder="Ref. Pieza..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-xs text-white uppercase outline-none focus:border-blue-500" />
                          <button onClick={buscarYAñadirArticulo} className="bg-blue-600 p-3 rounded-xl text-white hover:bg-blue-500 transition-colors"><Plus size={20}/></button>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                          {lineas.map((l, i) => (
                            <div key={i} className="flex justify-between items-center bg-white/[0.02] p-3 rounded-xl border border-white/5">
                              <span className="text-[10px] text-gray-300 font-bold uppercase">{l.descripcion} x{l.cantidad}</span>
                              <button onClick={() => setLineas(lineas.filter((_, idx) => idx !== i))} className="text-gray-600 hover:text-red-500"><Trash2 size={14}/></button>
                            </div>
                          ))}
                        </div>
                        <div className="p-6 bg-blue-600 rounded-[32px] flex justify-between items-center shadow-xl shadow-blue-900/40">
                          <div className="flex flex-col"><span className="text-[9px] font-black text-blue-200 uppercase">Total</span><span className="text-3xl font-black italic text-white leading-none">{totalPresupuesto.toFixed(2)}€</span></div>
                          <button onClick={enviarPresupuestoPDF} disabled={enviandoEmail || lineas.length === 0} className="bg-white text-blue-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-100 disabled:opacity-50 transition-all">
                            {enviandoEmail ? <Loader2 className="animate-spin" size={14}/> : <Send size={14}/>} Enviar PDF
                          </button>
                        </div>
                      </div>
                    )}

                    {view === "aceptados" && (
                      <button onClick={() => cambiarEstado(seleccionado.id, "En Taller")} disabled={cambiandoEstado} className="w-full bg-green-600 text-white py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-green-500 transition-all">
                        {cambiandoEstado ? <Loader2 className="animate-spin" size={16}/> : <Wrench size={16}/>} El coche ha entrado
                      </button>
                    )}

                    {(view === "mantenimientos" || (view === "aceptados" && seleccionado.estado === "En Taller")) && (
                      <button onClick={procesarFactura} disabled={facturando} className="w-full bg-white text-black py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-gray-200 transition-all">
                        {facturando ? <Loader2 className="animate-spin" size={16}/> : <Printer size={16}/>} Cerrar y Facturar
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-40 text-center opacity-20">
                    <Search size={48} className="mb-6" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Selecciona un cliente</p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* MODAL CREAR PRESUPUESTO ACTUALIZADO */}
      {showNuevoPresupuesto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-6">
          <div className="bg-[#0f0f12] border border-white/10 w-full max-w-xl rounded-[50px] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-blue-600/10 to-transparent">
              <div>
                <h2 className="text-white text-2xl font-black italic uppercase tracking-tighter leading-none">Nuevo Presupuesto</h2>
                <p className="text-[10px] text-blue-500 font-bold uppercase tracking-[0.2em] mt-2">Verificación de Cliente</p>
              </div>
              <button onClick={() => setShowNuevoPresupuesto(false)} className="bg-white/5 p-4 rounded-full text-gray-500 hover:text-white transition-all hover:rotate-90"><X size={20} /></button>
            </div>
            
            <div className="p-10 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                   <p className="text-[9px] font-black text-gray-600 uppercase ml-2 tracking-widest">Nombre</p>
                   <input placeholder="EJ: JUAN" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white uppercase outline-none focus:border-blue-500 transition-all" onChange={(e) => setNuevoCliente({...nuevoCliente, nombre: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <p className="text-[9px] font-black text-gray-600 uppercase ml-2 tracking-widest">Apellidos</p>
                   <input placeholder="EJ: GARCÍA PÉREZ" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white uppercase outline-none focus:border-blue-500 transition-all" onChange={(e) => setNuevoCliente({...nuevoCliente, apellidos: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <input placeholder="TELÉFONO" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white outline-none focus:border-blue-500 transition-all" onChange={(e) => setNuevoCliente({...nuevoCliente, telefono: e.target.value})} />
                <input placeholder="EMAIL" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white outline-none focus:border-blue-500 transition-all" onChange={(e) => setNuevoCliente({...nuevoCliente, email: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <input placeholder="VEHÍCULO (MARCA/MOD)" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white uppercase outline-none focus:border-blue-500 transition-all" onChange={(e) => setNuevoCliente({...nuevoCliente, vehiculo: e.target.value})} />
                <input type="number" placeholder="AÑO" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white outline-none focus:border-blue-500 transition-all" onChange={(e) => setNuevoCliente({...nuevoCliente, anio: parseInt(e.target.value) || 2024})} />
              </div>

              <textarea placeholder="DESCRIPCIÓN DE LA AVERÍA..." className="w-full bg-white/5 border border-white/10 rounded-[32px] p-6 text-xs text-white outline-none focus:border-blue-500 h-28 resize-none transition-all" onChange={(e) => setNuevoCliente({...nuevoCliente, mensaje: e.target.value})} />
              
              <button 
                onClick={manejarCreacionPresupuesto} 
                disabled={verificando}
                className="w-full bg-blue-600 text-white font-black py-5 rounded-[28px] uppercase text-[10px] tracking-[0.3em] hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3"
              >
                {verificando ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />}
                Verificar y Empezar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}